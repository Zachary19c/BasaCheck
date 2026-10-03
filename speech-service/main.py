"""BasaCheck local speech service.

POST /transcribe takes one recording plus a faster-whisper language code
("tl" or "en") and returns {"transcript", "durationSeconds"}. The Next.js
audio route maps the app's "fil" to "tl" before calling this service.

Audio is decoded in memory and released when the request ends. Nothing is
written to disk or kept after transcription.
"""

import io
import math
import os
import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

# Multilingual model only: an English-only ".en" model cannot transcribe Filipino.
MODEL_NAME = os.environ.get("WHISPER_MODEL", "small")
LANGUAGES = {"tl", "en"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_AUDIO_SECONDS = 180
SAMPLE_RATE = 16_000
# Multipart boundaries and the language field on top of the audio itself.
FORM_OVERHEAD_BYTES = 64 * 1024

model: WhisperModel | None = None
# One transcription at a time keeps CPU use predictable on a laptop.
model_lock = threading.Lock()


def load_model() -> WhisperModel:
    if MODEL_NAME.endswith(".en"):
        raise RuntimeError(
            f"WHISPER_MODEL={MODEL_NAME} is English-only. Use a multilingual model such as small or base."
        )
    loaded = WhisperModel(MODEL_NAME, device="cpu", compute_type="int8")
    if not loaded.model.is_multilingual:
        raise RuntimeError(f"WHISPER_MODEL={MODEL_NAME} is not multilingual.")
    return loaded


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global model
    model = load_model()
    yield


app = FastAPI(title="BasaCheck speech service", lifespan=lifespan)


def fail(status: int, code: str, message: str) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code, "message": message})


@app.middleware("http")
async def reject_large_uploads(request: Request, call_next):
    # Refuse oversized bodies before they are parsed.
    length = request.headers.get("content-length", "")
    if (
        request.url.path == "/transcribe"
        and length.isdigit()
        and int(length) > MAX_UPLOAD_BYTES + FORM_OVERHEAD_BYTES
    ):
        return JSONResponse(
            status_code=413,
            content={
                "detail": {
                    "code": "audio_too_large",
                    "message": "The recording is larger than 10 MB.",
                }
            },
        )
    return await call_next(request)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "model": MODEL_NAME}


@app.post("/transcribe")
def transcribe(
    audio: UploadFile = File(...),
    language: str = Form(...),
) -> dict[str, str | float]:
    try:
        if model is None:
            raise fail(503, "speech_unavailable", "The speech model is not loaded.")
        if language not in LANGUAGES:
            raise fail(400, "unsupported_language", "Language must be tl or en.")

        data = audio.file.read(MAX_UPLOAD_BYTES + 1)
        if not data:
            raise fail(422, "invalid_audio", "The recording is empty.")
        if len(data) > MAX_UPLOAD_BYTES:
            raise fail(413, "audio_too_large", "The recording is larger than 10 MB.")

        try:
            samples = decode_audio(io.BytesIO(data), sampling_rate=SAMPLE_RATE)
        except Exception as error:
            raise fail(422, "invalid_audio", "The recording could not be decoded.") from error

        # The decoded recording length, including pauses and lead/trail time.
        duration = samples.shape[0] / SAMPLE_RATE
        if not math.isfinite(duration) or duration <= 0:
            raise fail(422, "invalid_duration", "The recording has no audio.")
        if duration > MAX_AUDIO_SECONDS:
            raise fail(422, "audio_too_long", "The recording is longer than 3 minutes.")

        with model_lock:
            segments, _info = model.transcribe(
                samples,
                language=language,
                beam_size=5,
                # Skip silence so lead/trail time is not transcribed as words.
                vad_filter=True,
                condition_on_previous_text=False,
            )
            text = " ".join(segment.text.strip() for segment in segments)

        transcript = " ".join(text.split())
        if not transcript:
            raise fail(422, "empty_transcript", "No speech was recognized in the recording.")

        return {"transcript": transcript, "durationSeconds": duration}
    finally:
        audio.file.close()
