# BasaCheck — Final MVP Tech Stack

Locked for four people and 12 hours. `01-mvp-prd.md` is the scope authority.

## Stack

| Layer | Choice |
| --- | --- |
| App/API | Next.js, React, TypeScript |
| Styling | Tailwind CSS, phone-width layout |
| Database | Supabase PostgreSQL (RLS on, server-only access; no Auth/login) |
| Recording | Browser MediaRecorder, or offline tap with no audio |
| Speech | Local Python service, faster-whisper multilingual `base` or `small`. Not used by offline tap. |
| Measurements | Deterministic TypeScript in `lib/reading` |
| Demo hosting | Local Next.js + local speech process |

No Gemini, WhisperX, phoneme models, or generated intervention content. Confirm microphone availability on localhost/HTTPS; phone access via plain LAN HTTP is not a reliable recording setup.

## Speech contract

Server route `POST /api/assessments/[id]/audio` forwards multipart audio and assessment language to local `POST /transcribe`.

Application language codes: `fil | en`. Map `fil → tl`, `en → en` for faster-whisper. Use a multilingual model, not an English-only `.en` model. Read the language from the stored passage/assessment; reject inconsistent client parameters.

Response: `{ transcript: string, durationSeconds: number }`. Duration is the decoded recording length; demo responses use the fixture's duration. Validate nonempty transcript and positive finite duration. Set a bounded request timeout and size limit; clean temporary decoder files in `finally`.

Next.js stores the original transcript and sets `review`; it does not score it yet. `POST /api/assessments/[id]/tap` does the same for a teacher-marked transcript and the on-screen timer, and it refuses a speech assessment. The audio route refuses a tap assessment. `POST /api/assessments/[id]/confirm` accepts the teacher's verified transcript, records confirmation, and calls `scoreReading()`. `POST /api/assessments/[id]/answers` validates three indexes against the server-only passage answer key, scores comprehension, applies the support rule, and sets `complete`. `POST /api/assessments/[id]/intervention` saves the teacher's choice only on a completed assessment.

## Engine contract

```ts
type SupportedLanguage = "fil" | "en"
type SupportArea = "accuracy" | "comprehension"
type WordEvent = {
  type: "match" | "substitution" | "omission" | "insertion"
  expected?: string
  spoken?: string
}

// Pure functions: no auth/database/model imports.
normalize(text: string): string[]
align(expected: string[], spoken: string[]): WordEvent[]
scoreReading(input: {
  expectedText: string
  transcript: string // confirmed spoken text only
  durationSeconds: number
}): { accuracyPercent: number; wpm: number; events: WordEvent[] }
transcriptFromTaps(expectedText: string, marks: { index: number; spoken: string | null }[]): string
comprehension(correct: number, total: number): number
supportArea(accuracyPercent: number, comprehensionPercent: number): SupportArea | null
```

The declarations describe the contract, not a complete source file. Normalize with lowercase, punctuation removal, and whitespace tokenization; agree one implementation and use it for seeds, scoring, and tap words. Align via token edit distance with a fixed tie-break order (match, substitution, omission, insertion). A synonym remains a text substitution, not a diagnosis. Accuracy is matches / expected count; insertions are displayed separately. Rate uses verified spoken count × 60 / duration seconds. For a tap, duration is the timer and `transcriptFromTaps` builds the spoken text: an unmarked word is kept, a blank mark is omitted, and a typed mark is normalized into the transcript. Reject empty input and invalid duration. Store unrounded measurements.

Support: comprehension < 60 → comprehension; else accuracy < 90 → accuracy; else null. Display **Demo rules, not validated educational benchmarks**. WPM is not an input.

## Database contract

```text
learners
  id, display_name, grade_level

passages
  id, title, content, language, grade_level, difficulty,
  word_count, is_active, created_at

questions
  id, passage_id, position, prompt, choices (json), correct_index

assessments
  id, learner_id, passage_id, language, status,
  duration_seconds, transcript, verified_transcript,
  transcript_verified_at, demo_transcript, seeded_demo, input_mode,
  answer_indexes (json), accuracy_percent, wpm, comprehension_percent,
  word_events (json), support_area, intervention_id,
  baseline_assessment_id (nullable FK), error_code, created_at
```

Constrain language to fil/en, status to recording/processing/review/complete/error, and `input_mode` to speech/tap. Existing rows default to speech. Support area is nullable accuracy/comprehension. Intervention IDs: main-idea, word-practice, repeated-reading; bilingual card copy lives in code. Passage IDs/languages must agree; enforce in server validation. Follow-up links must match learner, language, and passage. No raw-audio column or bucket. Apply `supabase/migrations/20261003191703_offline_tap_mode.sql` before using tap checks.

No login. RLS is enabled on every table with no policies and no grants to `anon` or `authenticated`, so the browser cannot touch the database. All reads and writes go through Next.js server routes using `lib/supabase/server.ts`, which uses the service-role key. That key bypasses RLS, so it must never reach the browser and routes must validate every input (IDs, status transitions, passage/language match). Question fetch uses the `passage_questions` projection that excludes correct_index; never return answer keys to the client. Anyone who can reach the app can use it: run locally with fictional data only.

## Fixtures and seeds

`lib/reading/fixture-fil.ts` and `fixture-en.ts` export fixtures keyed by passage ID with transcript, language, and duration. All four passages need a fixture; check passage identity before scoring. Fixture mode still requires teacher confirmation.

Seed Ana, four original passages (two per language), twelve reviewed questions, and one completed illustrative follow-up for the primary Filipino passage. Follow-up has a confirmed transcript and metrics derived by the same engine, `seeded_demo=true`, and comprehension 3/3. Link it explicitly to the demo baseline for progress; never infer a pair merely from creation times. Preserve it when adding live runs. The primary passage has 19 normalized tokens; one substitution gives 18/19 accuracy, and 20 seconds gives 57 WPM.

`DEMO_MODE=true`: use matching fixture and label a speech assessment immediately. An offline tap stays `input_mode = tap` and `demo_transcript = false`. In live mode, speech failure returns an error; only explicit teacher selection starts a disclosed fixture assessment. No silent fallback.

## Environment and layout

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SPEECH_SERVICE_URL=http://127.0.0.1:8000
DEMO_MODE=true
```

Commit only `.env.example`. Keep service-role key and speech calls server-side; no `NEXT_PUBLIC_` Supabase variables are needed because the browser never talks to Supabase. Bind the speech service to localhost for the local demo.

```text
app/dashboard/
app/assess/[learnerId]/
app/results/[assessmentId]/
app/progress/[learnerId]/
app/api/assessments/   # create, audio, tap, confirm, answers, intervention
components/assessment/   # includes TapPassage.tsx
lib/types.ts
lib/interventions.ts
lib/supabase/
lib/reading/
speech-service/main.py
supabase/migrations/
supabase/seed.sql
```

Run Next.js with `npm run dev`. Member 2 documents the actual Python service launch command and dependencies in its README. Model downloads/installations happen early; rehearse both Filipino and English before judging. Audio is processed temporarily and not retained after transcription.
