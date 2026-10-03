# BasaCheck — Final MVP Workflow

Four screens, three fictional learners, one selected passage per assessment. No login: the app opens directly on the dashboard. `01-mvp-prd.md` defines the locked scope.

## Teacher path

1. **Dashboard:** the app opens here. Show Ana (Grade 2), Luis (Grade 4), and Elena (Grade 6). Each card has the latest completed check, Start assessment, and View progress. Mark seeded, demo, or offline-tap data. A new learner may have no completed check yet.
2. **Assessment setup:** choose Filipino (default) or English, then one of the two active passages in that language. Show grade, provisional difficulty, word count, and preview. Teacher selects the material; lock language/passage when the check starts.
3. **Capture, one of two ways:**
   - **Record:** request microphone permission on Start; display timer and Stop. Upload audio and selected language through the server-side Next.js route. Show learner instructions in the passage language. Use HTTPS or localhost for microphone access; an ordinary HTTP phone-on-Wi-Fi connection may block the mic.
   - **Offline tap:** **Mark words offline**. Show the passage as tappable words. **Start reading** runs a timer. Tap a missed word, type a replacement or leave it blank for a skip, then **Done reading**. No microphone and no speech service.
4. **Process:** show actual states, not invented progress percentages. After Stop recording, transcribe the learner's audio and open recording transcript review automatically. A tap enters review as soon as the marked text is saved. Speech failure shows retry or explicitly labeled Demo Mode with a passage-specific sample. Offline tap stays its own labeled path.
5. **Teacher review:** show the expected passage, replay controls for a live recording, the recognized transcript, an editable spoken transcript, and Confirm. The teacher listens and corrects speech-recognition mistakes so the text matches what the learner said. If a recording cannot be verified, record again. A Demo Mode sample is clearly labeled and has no learner audio. If a tap is wrong, mark the words again. Confirmation stores the verified transcript and reading measurements.
6. **Comprehension:** show the selected passage's three questions. Submit all chosen indexes; the server checks the answer key. Unanswered or invalid choices cannot complete the assessment.
7. **Results:** display Passage Reading Accuracy, Reading Rate (WPM), Comprehension; then aligned word differences; then a clearly labeled demo support suggestion; then three intervention cards. Teacher can choose any card. After saving, show that card's practice focus, steps, and what to look for on the results page. Do not redirect to progress or change scores. No suggestion means no card is preselected. Show Demo Mode, Seeded demo, or Offline tap when that is how the check was captured.
8. **Progress:** show the explicitly selected baseline and linked follow-up with language/passage/provenance labels. For seeded demo checks, label the comparison as sample data that does not measure the teacher's selected activity. For real linked checks, describe observed change between readings without claiming the activity caused it.

## System sequence

Recording: create assessment (`recording`, `input_mode = speech`) → audio route (`processing`) → faster-whisper or disclosed fixture → save original transcript (`review`) → teacher confirmation → deterministic reading scoring → three answers → comprehension + support rule → `complete` → teacher optionally saves intervention → show that activity's practice plan; progress is a separate view for linked checks.

Offline tap: create assessment (`recording`, `input_mode = tap`) → teacher marks words → tap route saves the marked transcript and timer duration (`review`) → teacher confirmation → the same scoring, questions, intervention, and progress path.

The audio route and the tap route never call reading scoring. The confirm route does. The answers route requires a confirmed transcript and existing reading metrics. Saving an intervention does not determine whether an assessment is complete. A tap assessment rejects an audio upload. A speech assessment rejects a tap upload.

## Status and writes

| Step | Status | Stored fields |
| --- | --- | --- |
| Create | `recording` | learner_id, passage_id, language, input_mode (`speech` or `tap`) |
| Stop/upload | `processing` | duration_seconds. Speech checks only. A tap skips this status. |
| Transcript available | `review` | transcript, demo_transcript. A tap also stores the timer as duration_seconds and keeps demo_transcript false. |
| Teacher confirms | `review` | verified_transcript, transcript_verified_at, accuracy_percent, wpm, word_events |
| Answers accepted | `complete` | answer_indexes, comprehension_percent, support_area |
| Save intervention | `complete` | intervention_id |
| Processing/validation failure | `error` | error_code; no fabricated reading metrics |

Keep every new run as a new row. Never overwrite the seeded follow-up. Transcript edits before completion invalidate reading metrics; score again on confirmation. Editing a completed assessment is outside MVP.

## Failures and fallback

| Failure | Behavior |
| --- | --- |
| Mic denied/unavailable | Explain permission/secure-context issue; retry recording, or mark words offline |
| Speech service down/empty transcript | Retry or explicitly use matching demo fixture; no silent fake result |
| Teacher cannot verify transcript | Record again, or mark the words again; no final reading score |
| Tap timer never started, or every word marked as skipped | Validation error; the tap is not saved |
| Invalid duration/empty verified text | Validation error; confirmation rejected |
| No matching fixture | Demo Mode unavailable for that passage |
| Answers/save fails | Keep existing data; offer retry |
| Incomparable follow-up | Explain language/passage mismatch; no direct delta |

`DEMO_MODE=true` shows a separate, collapsed Demo Mode choice for a sample transcript. Only the teacher's explicit sample choice uses a fixture and sets `demo_transcript`. It does not relabel an offline tap. If live transcription fails, the teacher may explicitly choose Demo Mode; the app never switches automatically. Carry `demo_transcript`, `seeded_demo`, and `input_mode = tap` labels onto results and progress. Fixture duration belongs to the fixture; do not combine fixture words with an unrelated live recording duration. Tap duration is the on-screen timer.

Audio may exist in browser memory, HTTP processing, and temporary decoder files. Keep a browser-only copy for replay during transcript review, then release it when the assessment screen closes. Clean temporary decoder files even on failure. An offline tap never creates audio files; uncertain recordings must be repeated.
