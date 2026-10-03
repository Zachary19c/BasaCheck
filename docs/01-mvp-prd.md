# BasaCheck — Final 12-Hour MVP PRD

**Status:** Frozen development contract · 3 October 2026  
**Team:** 4 people · 12 hours  
**Authority:** This guide and `02`–`05` define the build. The full PRD is a future reference; its broader features are not additional MVP requirements.

## Product

BasaCheck helps a teacher identify which observed area of reading may need support—passage reading accuracy, reading rate, or comprehension—and track change after an intervention. The teacher decides; the app does not diagnose or establish the cause of a difficulty.

Primary user: a teacher using a mobile-friendly browser. Fictional learners: **Ana, Grade 2**, **Luis, Grade 4**, and **Elena, Grade 6**.

## Locked scope

- No login. The app opens on a dashboard that lists Ana, Luis, and Elena.
- Filipino (default) and English selection inside the Assessment screen. Passages are limited to that learner's grade.
- Twelve original passages: two per language for Grades 2, 4, and 6, with three reviewed multiple-choice questions each. Grade 2 and 4 are narratives. Grade 6 is expository: Filipino social studies and English science, following Phil-IRI.
- One language and one selected passage per assessment. The teacher controls passage selection; changing language or passage after the check starts requires a new assessment.
- Browser recording, local faster-whisper integration, and an explicitly labeled fixture fallback.
- Offline tap: the teacher marks missed words on the passage instead of recording. No microphone and no speech service. The same scoring engine runs after the teacher confirms the marked text. Results stay labeled **Offline tap**, not Demo Mode. Saving the check still needs the app server.
- Teacher transcript confirmation/correction before reading scoring.
- Deterministic token alignment, passage reading accuracy, reading rate, and comprehension scoring.
- Transparent demo support suggestions, three static intervention cards, and teacher selection.
- Progress comparison with one seeded illustrative follow-up.

## Four screens

| Screen | Job |
| --- | --- |
| Dashboard | Ana, Luis, and Elena, each with the latest result, start assessment, and progress link |
| Assessment | Language + passage selection, record/stop or offline tap, teacher transcript review, three questions |
| Results | Measurements, word differences, demo suggestion, teacher intervention choice |
| Progress | First check and follow-up with provenance labels |

## Assessment loop

Choose learner → choose language/passage → record and transcribe, or mark words offline → teacher verifies transcript → score reading → answer three questions → score comprehension → review results → select intervention → compare follow-up.

Transcript review includes the expected passage, the original transcript, an editable spoken transcript, and **Confirm transcript**. Correct mistakes so the text matches what the learner actually said; do not rewrite it to match the passage. Confirmation is required for a recording, a prepared fixture, and an offline tap. Audio is released after transcription; replay is outside this MVP. If the teacher cannot verify a recording, record again. If a tap does not match what was said, mark the words again.

### Offline tap

After a passage is chosen, **Mark words offline** starts a check with `input_mode = tap`.

1. The passage is shown as the normalizer's words.
2. **Start reading** starts a timer. That elapsed time is the duration used for reading rate.
3. Tap a missed word. Type what the learner said instead, or leave the box blank if the word was skipped. Untapped words count as read.
4. **Done reading** builds the spoken transcript with `transcriptFromTaps` and saves it through `POST /api/assessments/[id]/tap`. That route does not score.
5. The teacher checks the marked text, confirms, and continues to the three questions.

An offline tap is not Demo Mode, even when `DEMO_MODE=true`. It stores no audio. It is not a phone-only queue: the save still goes to the app server. A full offline PWA remains out of scope.

## Measurements and suggestions

- **Passage Reading Accuracy** = aligned matches / expected passage token count × 100. Insertions are shown as differences but do not reduce this match-based percentage. It is not a complete reading-ability measure.
- **Reading Rate** = verified spoken token count × 60 / duration in seconds. A recording uses the decoded audio length, including pauses and lead/trail time. An offline tap uses the on-screen timer. It is not a fluency diagnosis.
- **Comprehension** = correct answers / 3 × 100; use the server-side answer key.
- Require nonempty expected/verified text and positive finite duration; otherwise show an error with no reading percentage.
- Round only for display; retain unrounded values for rules.

`supportArea(accuracyPercent, comprehensionPercent)`:

1. Comprehension < 60% → `comprehension`.
2. Otherwise accuracy < 90% → `accuracy`.
3. Otherwise → `null`: “No automatic suggestion. Teacher review recommended.”

The UI labels these as **Demo rules, not validated educational benchmarks**. No WPM threshold or automatic reading-level classification. The teacher may choose any intervention; nothing is pre-saved.

| Card | Teacher activity |
| --- | --- |
| Finding the main idea | Read a short paragraph; ask what it is mostly about; select the main idea; explain and repeat |
| High-frequency word practice | Choose familiar words; model each; practice in a phrase; reread the passage |
| Repeated reading | Model a short passage; read together; let the learner reread; discuss the meaning |

Repeated reading remains available for teacher selection without an automatic rate-based recommendation. Cards and instructions match the assessment language; no LLM is required.

## Content and demo data

Seed four original Grade 2 narratives written to the published Phil-IRI design: Grades 2–4 are narratives, Filipino oral passages are about 65 words, and English Grade 2 oral passages are about 30–40 words. These stories are not copies of the Phil-IRI test. Each passage has three questions in Phil-IRI order, which also matches the three PISA reading processes at Grade 2: literal/locate, interpretive/understand, and applied/evaluate and reflect. PISA passages themselves are for 15-year-olds and are not used. No passage-management UI. The app does not assign an official reading level.

Primary Filipino demo passage, **Si Ana at ang Ina** (60 words):

> Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.

Questions: whom Ana helped (her mother; literal), what washing the plates shows (she is helping her mother; interpretive), and what a learner should do after eating (help at home; applied). Supply three choices and one reviewed correct answer per question.

The passage contains **60 whitespace-separated tokens**. Use the agreed normalizer to derive counts. A fixture replacing only `upang` with `para` gives 59/60 matches (about 98.33%). At a fixture duration of 60 seconds, 60 verified spoken tokens produce 60 WPM. The seeded follow-up is the same passage read as written in 50 seconds, which is 72 WPM. Seed initial comprehension 1/3 and follow-up 3/3; derive follow-up reading metrics from its transcript and duration rather than hardcoding mismatched counts.

Other content: one additional Filipino passage and two English passages, each with three reviewed questions. Fixtures must be keyed by **passage ID**, not just language, so every selectable passage has matching text and duration.

The seeded follow-up is illustrative data, visibly labeled **Seeded demo assessment**. Compare only explicitly linked checks with the same learner, language, and passage. The same-passage demo can show practice effects; it does not prove intervention effectiveness. Never describe the seeded check as an actual reassessment.

## Privacy and failure floor

- No login. All database reads and writes go through Next.js server routes using the server-only service-role key. RLS stays enabled with no browser grants, so the public anon key cannot read or write any table. Anyone who can reach the app can use it, so run it locally with fictional data only.
- Question answer keys stay server-side, including during question fetch.
- Audio is processed temporarily in memory or temporary files and is not retained in the database after transcription. Clean temporary files on success and failure; no public audio URL. An offline tap never creates audio.
- Failed speech processing leaves an error with no fabricated scores. Offer retry or an explicit Demo Mode choice using matching fixtures. Offline tap stays available as its own choice and is labeled separately.
- Fixture results, seeded follow-ups, and offline taps remain visibly labeled on results and progress.
- Secrets stay in server environment variables; use fictional data only.

## Acceptance criteria

The four-screen loop works at phone width for both languages; language filters passages/questions correctly; no reading scoring runs before transcript confirmation; a corrected transcript recomputes measurements; WPM never triggers a support suggestion; intervention choice persists; a failed transcription shows retry/demo choices; mismatched passage fixtures cannot be scored; seeded follow-up survives new recordings; the browser anon key cannot read or write any table. An offline tap of one missed word is scored by the same engine, labeled Offline tap, and not labeled Demo Mode.

## Out of scope

WhisperX, phoneme/pronunciation analysis, pause/disfluency detection, Gemini or generated lesson plans, AI passage generation, teacher passage-authoring UI, automatic reading-level classification, learner management, admin/parent portals, class analytics, export, a full offline PWA or queued sync, educational benchmarks, and additional passage libraries. Offline tap is in scope; it still saves through the server. Live speech integration is part of development; use a disclosed fixture for judging if it is unstable.
