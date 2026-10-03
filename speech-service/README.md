# Speech service

Local FastAPI + faster-whisper service for BasaCheck. Bound to localhost. Tested with Python 3.13 on Windows.

Offline tap does not call this service. The teacher marks missed words in the app, and `POST /api/assessments/[id]/tap` stores that transcript.

```powershell
cd speech-service
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Calling `.venv\Scripts\python` directly avoids `Activate.ps1`, which fails when PowerShell script execution is disabled.

The first start downloads the model from Hugging Face (`small` is about 0.5 GB). Do this early, not during judging. Later starts load it from the cache.

Check: http://127.0.0.1:8000/health returns `{"status":"ok","model":"small"}`.

## Model

`WHISPER_MODEL` picks the model. Default `small`; use `base` on a slow laptop. It must be multilingual: `.en` models are refused at startup because they cannot transcribe Filipino.

```powershell
$env:WHISPER_MODEL = "base"
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Runs on CPU with int8. One transcription runs at a time.

## API

`POST /transcribe`, multipart form:

| Field | Value |
| --- | --- |
| `audio` | The recording (WebM/Opus, MP4, Ogg or WAV) |
| `language` | `tl` or `en`. The Next.js audio route maps the app's `fil` to `tl`. |

Success: `{ "transcript": string, "durationSeconds": number }`. The duration is the decoded recording length, including pauses and lead/trail time.

Errors return `{ "detail": { "code", "message" } }`:

| Status | Code | When |
| --- | --- | --- |
| 400 | `unsupported_language` | Language is not `tl` or `en` |
| 413 | `audio_too_large` | Upload over 10 MB |
| 422 | `invalid_audio` | Empty or undecodable file |
| 422 | `invalid_duration` | No audio samples |
| 422 | `audio_too_long` | Over 3 minutes |
| 422 | `empty_transcript` | No speech recognized |
| 503 | `speech_unavailable` | Model not loaded |

Quick test with any recording:

```powershell
curl.exe -F "audio=@recording.webm" -F "language=en" http://127.0.0.1:8000/transcribe
```

## Privacy

Audio is decoded in memory and released when the request ends. Nothing is written to disk or kept. Transcripts are not logged.

## Dependencies

`requirements.txt` pins `av==18.1.0`. PyAV 19 removed an argument that faster-whisper 1.2.1 still passes, which makes every recording fail with `invalid_audio`.
