# BasaCheck — Final 12-Hour MVP PRD

**Status:** Frozen development contract · 3 October 2026  
**Team:** 4 people · 12 hours  
**Authority:** This guide and `02`–`05` define the build. The full PRD is a future reference; its broader features are not additional MVP requirements.

## Product

BasaCheck helps a teacher identify which observed area of reading may need support—passage reading accuracy, reading rate, or comprehension—and track change after an intervention. The teacher decides; the app does not diagnose or establish the cause of a difficulty.

Primary user: an early-grade teacher using a mobile-friendly browser. Use only fictional learner **Ana, Grade 2** for the hackathon.

## Locked scope

- Seeded teacher login and Ana's dashboard.
- Filipino (default) and English selection inside the Assessment screen.
- Four seeded, team-created passages: two per language, with three reviewed multiple-choice questions each.
- One language and one selected passage per assessment. The teacher controls passage selection; changing language or passage after recording requires a new assessment.
- Browser recording, local faster-whisper integration, and an explicitly labeled fixture fallback.
- Teacher transcript confirmation/correction before reading scoring.
- Deterministic token alignment, passage reading accuracy, reading rate, and comprehension scoring.
- Transparent demo support suggestions, three static intervention cards, and teacher selection.
- Progress comparison with one seeded illustrative follow-up.

## Five screens

| Screen | Job |
| --- | --- |
| Login | Seeded teacher account |
| Dashboard | Ana, latest result, start assessment, progress link |
| Assessment | Language + passage selection, record/stop, teacher transcript review, three questions |
| Results | Measurements, word differences, demo suggestion, teacher intervention choice |
| Progress | First check and follow-up with provenance labels |

## Assessment loop

Choose learner → choose language/passage → record → transcribe → teacher verifies transcript → score reading → answer three questions → score comprehension → review results → select intervention → compare follow-up.

Transcript review includes the expected passage, original transcript, editable spoken transcript, and **Confirm transcript**. Correct recognition mistakes to what the learner actually said; do not rewrite the transcript to match the passage. Confirmation is required even in Demo Mode. Audio is released after transcription; replay is outside this MVP. If the teacher cannot verify the wording, record again rather than invent a score.

## Measurements and suggestions

- **Passage Reading Accuracy** = aligned matches / expected passage token count × 100. Insertions are shown as differences but do not reduce this match-based percentage. It is not a complete reading-ability measure.
- **Reading Rate** = verified spoken token count × 60 / recording duration in seconds. This includes pauses and recording lead/trail time; it is not a fluency diagnosis.
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

Seed four approved-for-demo original passage/question sets. Grade/difficulty labels are provisional content labels, not validated national standards. No passage-management UI.

Primary Filipino demo passage, **Si Ana at ang Ina**:

> Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.

Questions: whom did Ana help (her mother), where did she go after eating (school), and who accompanied her (her friend). Supply three choices and one reviewed correct answer per question.

The passage contains **19 whitespace-separated tokens**, not 17. Use the agreed normalizer to derive counts. A fixture replacing only `upang` with `para` gives 18/19 matches (about 94.74%). At a fixture duration of 20 seconds, 19 verified spoken tokens produce 57 WPM. Seed initial comprehension 1/3 and follow-up 3/3; derive follow-up reading metrics from its transcript and duration rather than hardcoding mismatched counts.

Other content: one additional Filipino passage and two English passages, each with three reviewed questions. Fixtures must be keyed by **passage ID**, not just language, so every selectable passage has matching text and duration.

The seeded follow-up is illustrative data, visibly labeled **Seeded demo assessment**. Compare only explicitly linked checks with the same learner, language, and passage. The same-passage demo can show practice effects; it does not prove intervention effectiveness. Never describe the seeded check as an actual reassessment.

## Privacy and failure floor

- Supabase Auth and ownership RLS protect learner/assessment data; server routes verify the signed-in teacher owns the assessment.
- Question answer keys stay server-side, including during question fetch.
- Audio is processed temporarily in memory or temporary files and is not retained in the database after transcription. Clean temporary files on success and failure; no public audio URL.
- Failed speech processing leaves an error with no fabricated scores. Offer retry or an explicit Demo Mode choice using matching fixtures.
- Fixture results and seeded follow-ups remain visibly labeled on results and progress.
- Secrets stay in server environment variables; use fictional data only.

## Acceptance criteria

The five-screen loop works at phone width for both languages; language filters passages/questions correctly; no reading scoring runs before transcript confirmation; a corrected transcript recomputes measurements; WPM never triggers a support suggestion; intervention choice persists; a failed transcription shows retry/demo choices; mismatched passage fixtures cannot be scored; seeded follow-up survives new recordings; ownership is enforced on reads and writes.

## Out of scope

WhisperX, phoneme/pronunciation analysis, pause/disfluency detection, Gemini or generated lesson plans, AI passage generation, teacher passage-authoring UI, automatic reading-level classification, learner management, admin/parent portals, class analytics, export, offline/PWA, educational benchmarks, and additional passage libraries. Live speech integration is part of development; use a disclosed fixture for judging if it is unstable.
