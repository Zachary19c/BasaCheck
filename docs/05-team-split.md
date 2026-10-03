# BasaCheck — Final 4-Person Development Split

Freeze shared contracts in the first 30 minutes. Integrate by hour 8. `01-mvp-prd.md` defines scope; `04-tech-stack.md` defines schema/API behavior.

| Member | Ownership | Done when |
| --- | --- | --- |
| 1 | Teacher shell + seeded content | Learner dashboard, schema/RLS lockdown, passages and questions for Grades 2, 4, and 6 |
| 2 | Assessment + speech + transcript review | Language/passage selectors, recording, offline tap, speech integration, confirmation gate and error states |
| 3 | Reading engine + fixtures | Deterministic alignment/metrics/support functions, tap transcript builder, matching fixtures, meaningful scoring tests |
| 4 | Questions + results + progress | Passage-specific questions, server scoring, intervention save, labeled linked comparison including Offline tap |

## Member 1 — Teacher shell and content

Own `app/dashboard`, the app layout, the server-only Supabase client, migration and seed. No login screen. Own progress route shell; Member 4 owns its content. Seed Ana, two Filipino/two English original passages, three reviewed questions each, and one illustrative follow-up. Compute word counts through Member 3's normalizer; do not reuse the old 17-word count. Keep RLS on with no browser grants and keep answer keys inaccessible to browser clients. Coordinate bilingual question/card review with Member 4.

Hour 1 exit: usable dashboard; publish content IDs and schema contract. Apply completed content seed by hour 2. No passage-authoring interface.

## Member 2 — Assessment, recorder and verification

Own assessment page, Recorder, TapPassage, and TranscriptReview components, create/audio/tap/confirm routes, and Python speech service. Select language then filter active passages. Lock selection when the check starts. Pass stored language to speech (`fil → tl`, `en → en`). Audio route saves a speech transcript and enters review. Tap route saves a teacher-marked transcript and timer duration, sets `input_mode = tap`, and does not call the speech service. **Only confirm route calls scoreReading** using teacher-verified text. Handle invalid duration, empty text, microphone permissions, request failure, and cleanup. Do not silently substitute fixtures on live failure, and do not label a tap as Demo Mode.

Member 4 supplies the question component mounted on this page after confirmation; avoid two people editing its layout simultaneously. Member 3 supplies scoreReading and fixtures.

Hour 1 exit: capture test audio; return live or explicitly labeled fixture response. Live model integration remains a development task; disclosed Demo Mode protects the presentation.

## Member 3 — Engine and fixtures

Own `lib/reading/{normalize,align,metrics,support,taps}.ts`, `fixture-fil.ts`, `fixture-en.ts`, and scoring tests. Agree deterministic alignment tie-breaks. Export `scoreReading({expectedText, transcript, durationSeconds})`, `transcriptFromTaps`, and `supportArea(accuracyPercent, comprehensionPercent)` returning accuracy/comprehension/null. Never use WPM to classify support. `transcriptFromTaps` keeps unmarked words, omits a blank mark, and normalizes a typed replacement.

Fixtures are keyed by passage ID, with their own duration and language, for every seeded passage. Seed scripts and fixture generation use the same token counting. Help Member 4 render word differences after the engine is stable.

Meaningful checks before integration:

- Identical passage yields 100%; substitution/omission/insertion produce the expected events.
- Primary full passage is 60 tokens; only upang → para yields 59/60 accuracy.
- 60 spoken words in 60 seconds yields 60 WPM.
- Comprehension 1/3 takes priority; comprehension ≥60 and accuracy <90 suggests accuracy; otherwise null, regardless of WPM.
- Empty input/nonpositive duration is rejected; both language fixtures match their passage.

Hour 1 exit: importable function signatures and a working primary fixture.

## Member 4 — Questions, results and follow-up

Own QuestionBlock, results page, progress content, answers/intervention routes, and bilingual static card copy. Fetch questions for selected passage without answer keys. Server validates three answers and transcript confirmation, calculates comprehension/support, then completes the row. Render **Passage Reading Accuracy**, **Reading Rate**, **Comprehension**. Suggestions are demo rules and nullable; teacher chooses any card, including repeated reading.

Show Demo Mode, Seeded demo, and Offline tap provenance on results and progress. Use explicit baseline/follow-up IDs with matching learner/language/passage; do not automatically pair the newest live run with an unrelated follow-up. Saving an intervention does not create a follow-up or fabricate results.

Hour 1 exit: results/progress render from agreed mock contract; switch to real seed when Member 1 supplies it.

## Shared types

```ts
type SupportedLanguage = "fil" | "en"
type SupportArea = "accuracy" | "comprehension"
type WordEvent = {
  type: "match" | "substitution" | "omission" | "insertion"
  expected?: string
  spoken?: string
}
type AssessmentRow = {
  id: string
  learnerId: string
  passageId: string
  language: SupportedLanguage
  status: "recording" | "processing" | "review" | "complete" | "error"
  transcript: string | null
  verifiedTranscript: string | null
  transcriptVerifiedAt: string | null
  demoTranscript: boolean
  seededDemo: boolean
  inputMode: "speech" | "tap"
  durationSeconds: number | null
  accuracyPercent: number | null
  wpm: number | null
  comprehensionPercent: number | null
  answerIndexes: number[] | null
  wordEvents: WordEvent[]
  supportArea: SupportArea | null
  interventionId: "main-idea" | "word-practice" | "repeated-reading" | null
  baselineAssessmentId: string | null
  errorCode: string | null
  createdAt: string
}
```

Member 1 supplies snake_case database ↔ camelCase mapping. Member 2 owns create/audio/tap/confirm; Member 4 owns answers/intervention. Each route uses the server-only Supabase client and validates IDs and status transitions. Apply `20261003191703_offline_tap_mode.sql` so `input_mode` exists.

## Twelve-hour clock

| Hours | Deliverable |
| --- | --- |
| 0–0.5 | Freeze contracts, content IDs, file ownership, env and presenter |
| 0.5–2 | Schema/content seed; model download; fixture engine and page mocks |
| 2–6 | Build owned slices; transcript review, bilingual content, engine tests |
| 6–8 | Connect audio or offline tap → review → confirm → engine → answers → complete |
| 8–10 | End-to-end both languages, intervention/progress, failures and input validation |
| 10–11 | Phone layout, provenance labels, seeded follow-up preservation |
| 11–12 | Rehearse four-minute demo twice; freeze features |

No new screens/features after hour 10. Member 2 rehearses live transcription; use disclosed Demo Mode if unstable. One presenter speaks; others operate the laptop/backup. Member 1 supports problem/dashboard, Member 2 capture/review, Member 3 measurements, Member 4 intervention/progress.
