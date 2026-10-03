# BasaCheck — Final MVP Workflow

Five screens, one fictional learner, one selected passage per assessment. `01-mvp-prd.md` defines the locked scope.

## Teacher path

1. **Login:** sign in with the seeded teacher account; show a clear credential error on failure.
2. **Dashboard:** show Ana, Grade 2, latest completed check, Start assessment, and View progress. Mark seeded/demo data.
3. **Assessment setup:** choose Filipino (default) or English, then one of the two active passages in that language. Show grade, provisional difficulty, word count, and preview. Teacher selects the material; lock language/passage when recording begins.
4. **Record:** request microphone permission on Start; display timer and Stop. Upload audio and selected language through the authenticated Next.js route. Show learner instructions in the passage language. Use HTTPS or localhost for microphone access; an ordinary HTTP phone-on-Wi-Fi connection may block the mic.
5. **Process:** show actual states, not invented progress percentages. A successful response enters transcript review. Speech failure shows retry or explicitly labeled Demo Mode with a passage-specific fixture.
6. **Teacher review:** show expected text and original transcript, editable spoken transcript, and Confirm. The teacher corrects recognition errors, preserving the learner's actual spoken differences. If verification is impossible, record again. Confirmation stores the verified transcript and reading measurements.
7. **Comprehension:** show the selected passage's three questions. Submit all chosen indexes; the server checks the answer key. Unanswered or invalid choices cannot complete the assessment.
8. **Results:** display Passage Reading Accuracy, Reading Rate (WPM), Comprehension; then aligned word differences; then a clearly labeled demo support suggestion; then three intervention cards. Teacher can choose any card. No suggestion means no card is preselected.
9. **Progress:** show the explicitly selected baseline and linked follow-up with language/passage/provenance labels. Copy: “Observed change after intervention.” Seeded data is illustrative, not evidence of a real intervention.

## System sequence

Create owned assessment (`recording`) → audio route (`processing`) → faster-whisper or disclosed fixture → save original transcript (`review`) → teacher confirmation → deterministic reading scoring → three answers → comprehension + support rule → `complete` → teacher optionally saves intervention → progress.

The audio route never calls reading scoring. The confirm route does. The answers route requires a confirmed transcript and existing reading metrics. Saving an intervention does not determine whether an assessment is complete.

## Status and writes

| Step | Status | Stored fields |
| --- | --- | --- |
| Create | `recording` | learner_id, passage_id, language |
| Stop/upload | `processing` | duration_seconds |
| Transcript available | `review` | transcript, demo_transcript |
| Teacher confirms | `review` | verified_transcript, transcript_verified_at, accuracy_percent, wpm, word_events |
| Answers accepted | `complete` | answer_indexes, comprehension_percent, support_area |
| Save intervention | `complete` | intervention_id |
| Processing/validation failure | `error` | error_code; no fabricated reading metrics |

Keep every new run as a new row. Never overwrite the seeded follow-up. Transcript edits before completion invalidate reading metrics; score again on confirmation. Editing a completed assessment is outside MVP.

## Failures and fallback

| Failure | Behavior |
| --- | --- |
| Mic denied/unavailable | Explain permission/secure-context issue; retry recording |
| Speech service down/empty transcript | Retry or explicitly use matching demo fixture; no silent fake result |
| Teacher cannot verify transcript | Record again; no final reading score |
| Invalid duration/empty verified text | Validation error; confirmation rejected |
| No matching fixture | Demo Mode unavailable for that passage |
| Answers/save fails | Keep existing data; offer retry |
| Incomparable follow-up | Explain language/passage mismatch; no direct delta |

`DEMO_MODE=true` selects fixture processing from the start and visibly announces it. With live mode, failure never silently switches: the teacher must choose Demo Mode. Carry `demo_transcript` and `seeded_demo` labels onto results and progress. Fixture duration belongs to the fixture; do not combine fixture words with an unrelated live recording duration.

Audio may exist in browser memory, HTTP processing, and temporary decoder files. Release it after transcription and clean temporary files even on failure. MVP transcript review has no audio replay; uncertain recordings must be repeated.
