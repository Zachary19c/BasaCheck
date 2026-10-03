# BasaCheck — Product Requirements Document

**Version:** 1.1 · 3 October 2026  
**Status:** Final 12-hour MVP specification + preserved roadmap  
**Supported MVP languages:** Filipino (default) and English

## Document authority

The finalized contract below replaces the earlier MVP scope. Read `01-mvp-prd.md` for the build, `02-workflow.md` for states, `03-demo.md` for the pitch, `04-tech-stack.md` for schema/API contracts, and `05-team-split.md` for ownership. If the archived reference conflicts with those files, the finalized contract wins.

# Finalized build contract

**Status:** Frozen development contract · 3 October 2026  
**Team:** 4 people · 12 hours  
**Authority:** This guide and `02`–`05` define the build. The full PRD is a future reference; its broader features are not additional MVP requirements.

## Product

BasaCheck helps a teacher identify which observed area of reading may need support—passage reading accuracy, reading rate, or comprehension—and track change after an intervention. The teacher decides; the app does not diagnose or establish the cause of a difficulty.

Primary user: an early-grade teacher using a mobile-friendly browser. Use only fictional learner **Ana, Grade 2** for the hackathon.

## Locked scope

- No login. The app opens directly on Ana's dashboard.
- Filipino (default) and English selection inside the Assessment screen.
- Four seeded, team-created passages: two per language, with three reviewed multiple-choice questions each.
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
| Dashboard | Ana, latest result, start assessment, progress link |
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

Seed four approved-for-demo original passage/question sets. Grade/difficulty labels are provisional content labels, not validated national standards. No passage-management UI.

Primary Filipino demo passage, **Si Ana at ang Ina**:

> Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.

Questions: whom did Ana help (her mother), where did she go after eating (school), and who accompanied her (her friend). Supply three choices and one reviewed correct answer per question.

The passage contains **19 whitespace-separated tokens**, not 17. Use the agreed normalizer to derive counts. A fixture replacing only `upang` with `para` gives 18/19 matches (about 94.74%). At a fixture duration of 20 seconds, 19 verified spoken tokens produce 57 WPM. Seed initial comprehension 1/3 and follow-up 3/3; derive follow-up reading metrics from its transcript and duration rather than hardcoding mismatched counts.

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


---

# Archived expanded reference — future planning only

The following original Version 1.0 is preserved for context, not as a development checklist. Its Filipino-only restrictions, direct transcription-to-scoring flow, fluency/disfluency analysis, optional LLM, broader screens/tables, old demo scores, five-question seeds, public demo flag, Vercel hosting, and original acceptance criteria are superseded for this hackathon. Future adoption requires a separate scope decision. The updated build has four passages, three questions per passage, teacher transcript confirmation, offline tap, no WPM-based classification, local hosting, and a server-only `DEMO_MODE` setting. The archived offline/PWA sketch below is not the implemented tap mode.

# BasaCheck --- Product Requirements Document (PRD)

**Version:** 1.0\
**Status:** Hackathon MVP\
**Project Type:** Educational Technology / Teacher Support /
Foundational Literacy\
**Primary Users:** Teachers handling early-grade learners who struggle
with reading\
**Secondary Users:** Learners, school administrators\
**Primary Platform:** Mobile-friendly web application\
**Primary Language for MVP:** Filipino/Tagalog\
**Core Principle:** AI assists teachers; it does not replace teacher
judgment.

------------------------------------------------------------------------

# 1. Executive Summary

## 1.1 Product Name

**BasaCheck**

## 1.2 One-Line Description

> BasaCheck helps teachers identify the specific reading barriers behind
> a learner's difficulty, provide targeted intervention, and measure
> whether the intervention actually works.

## 1.3 Problem

A learner may be identified as a struggling reader, but a simple reading
score does not explain **why** the learner is struggling.

For example:

-   A learner may read slowly but understand what they read.
-   A learner may read quickly but make many word substitutions.
-   A learner may decode words accurately but perform poorly on
    comprehension.
-   A learner may repeatedly hesitate or repeat words while reading
    aloud.
-   A teacher may observe these behaviors manually but may not have
    enough time to consistently measure and track them.

BasaCheck turns a short reading activity into a structured assessment
that gives the teacher actionable evidence.

## 1.4 Core Product Loop

``` text
ASSESS
  ↓
READ ALOUD + COMPREHENSION
  ↓
ANALYZE
  ↓
IDENTIFY OBSERVED AREAS FOR SUPPORT
  ↓
INTERVENE
  ↓
REASSESS
  ↓
MEASURE PROGRESS
```

## 1.5 What BasaCheck Is NOT

BasaCheck is **not**:

-   A medical diagnostic tool.
-   A dyslexia diagnostic tool.
-   A speech-disorder diagnostic tool.
-   A replacement for a teacher.
-   A system that automatically labels a child.
-   A system that makes high-stakes educational decisions without
    teacher review.
-   A generic chatbot for students.
-   A generic AI tutoring application.
-   A system that claims a child has a disorder based only on an audio
    recording.

The application must use language such as:

-   "Observed area for support"
-   "Possible disfluency detected"
-   "Reading accuracy"
-   "Reading fluency"
-   "Comprehension"
-   "Teacher review recommended"

It must NOT use language such as:

-   "The learner has dyslexia."
-   "The learner has a speech disorder."
-   "The learner is clinically diagnosed."
-   "The AI determined the child's condition."

------------------------------------------------------------------------

# 2. Hackathon Design Principles

BasaCheck must directly follow these five builder questions.

## 2.1 WHO?

The primary user is:

> A teacher working with early-grade learners who may be struggling with
> foundational reading.

The learner is the person being assessed, but the **teacher is the
primary decision-maker and system user**.

Do not design the MVP around an anonymous consumer/student account as
the main experience.

## 2.2 BARRIER?

The specific barrier being addressed is:

> Teachers need a fast, consistent, evidence-based way to identify what
> aspect of reading a learner needs support with and determine whether
> an intervention helped.

## 2.3 REALITY?

The product must consider Philippine school conditions:

-   Mobile phones may be more available than desktop computers.
-   Internet connections may be inconsistent.
-   Teachers may have many learners.
-   Shared devices may be used.
-   Filipino/Tagalog reading content is required for the MVP.
-   The interface must be simple enough for non-technical users.
-   Audio processing may be computationally expensive.
-   The system should not require expensive cloud AI services for the
    core assessment.

## 2.4 DATA?

BasaCheck should collect the minimum information necessary.

Potential data:

-   Learner identifier/name or teacher-created alias.
-   Assessment date.
-   Expected reading passage.
-   Spoken transcript.
-   Reading metrics.
-   Comprehension answers and score.
-   Intervention assigned.
-   Reassessment results.

Raw audio should **not automatically be retained permanently**.

Recommended behavior:

1.  Record audio.
2.  Process audio.
3.  Extract required metrics.
4.  Store only necessary assessment information.
5.  Delete raw audio unless explicit retention is required and
    consent/permission exists.

## 2.5 FAILURE?

If the AI gets something wrong:

> The teacher remains the final decision-maker.

The UI must clearly communicate that AI-generated observations are not
definitive diagnoses.

------------------------------------------------------------------------

# 3. Product Goals

## 3.1 Primary Goals

BasaCheck must:

1.  Allow a teacher to create/select a learner.
2.  Allow a teacher to start a reading assessment.
3.  Present a Filipino reading passage.
4.  Record the learner reading the passage aloud.
5.  Convert speech to text.
6.  Compare the expected passage against the spoken transcript.
7.  Identify word-level reading differences.
8.  Calculate reading accuracy.
9.  Estimate reading fluency.
10. Detect pauses/repetitions that may indicate possible disfluency.
11. Present comprehension questions.
12. Calculate comprehension performance.
13. Produce an understandable learner profile.
14. Identify observed areas for support.
15. Allow the teacher to assign an intervention.
16. Allow reassessment after intervention.
17. Show progress between assessments.
18. Keep the teacher in control of final decisions.
19. Work without requiring a paid AI API for the core assessment engine.

## 3.2 Secondary Goals

If time permits:

-   Offline/PWA assessment capture.
-   Filipino/Tagalog content library.
-   Teacher notes.
-   Class-level overview.
-   Exportable assessment report.
-   Intervention recommendation assistance.
-   Multiple passages by difficulty level.

## 3.3 Non-Goals for MVP

Do NOT implement:

-   Full school management system.
-   Student social network.
-   Chatbot tutoring.
-   Medical diagnosis.
-   Speech pathology diagnosis.
-   Automatic grading of arbitrary free-form reading content.
-   Facial recognition.
-   Emotion recognition.
-   Predictive dropout modeling.
-   Nationwide education analytics.
-   Complex parent portal.
-   Payment system.

------------------------------------------------------------------------

# 4. Target Users

## 4.1 Primary Persona --- Teacher

**Example:**

A Grade 1--3 teacher has many learners. Some learners are clearly
struggling with reading, but the teacher needs a quick way to determine
whether the issue is mainly:

-   accuracy,
-   fluency,
-   comprehension,
-   or observable reading/disfluency behavior.

The teacher wants evidence that can guide the next activity.

### Teacher needs

-   Fast assessment.
-   Simple workflow.
-   Understandable results.
-   Word-level evidence.
-   Intervention suggestions.
-   Progress tracking.
-   Ability to override or correct system observations.

## 4.2 Secondary Persona --- Learner

The learner:

-   reads a short passage aloud,
-   answers comprehension questions,
-   receives supportive/non-stigmatizing feedback.

The learner should NOT see potentially harmful labels.

Instead of:

> "You are a poor reader."

Use:

> "Let's practice reading this type of text."

## 4.3 Administrator

Optional for MVP.

Can view aggregated information but should not automatically receive raw
child audio.

------------------------------------------------------------------------

# 5. Core User Journey

``` text
Teacher Login
     ↓
Dashboard
     ↓
Select Learner
     ↓
Start Assessment
     ↓
Select Reading Passage
     ↓
Learner Reads Aloud
     ↓
Audio Processing
     ↓
Reading Analysis
     ↓
Comprehension Questions
     ↓
Assessment Results
     ↓
Teacher Reviews Observations
     ↓
Teacher Selects Intervention
     ↓
Learner Practices
     ↓
Reassessment
     ↓
Progress Comparison
```

------------------------------------------------------------------------

# 6. Demo Sequence

The hackathon demo should follow one complete learner story.

## Demo Scenario

Use a fictional learner:

**Name:** Ana\
**Grade:** Grade 2\
**Assessment:** Initial Reading Check

Do not use real child information during the demo.

------------------------------------------------------------------------

## Demo Step 1 --- Teacher Dashboard

Show:

-   BasaCheck logo/name.
-   Number of learners.
-   Learners needing review.
-   Recent assessments.
-   Start Assessment button.

Narration:

> "Teachers often know that a learner is struggling, but the harder
> question is understanding what is causing the difficulty. BasaCheck
> helps turn a short reading activity into actionable evidence."

------------------------------------------------------------------------

## Demo Step 2 --- Select Learner

Select:

**Ana --- Grade 2**

Show:

-   Previous assessments if available.
-   Current support status.
-   Start New Assessment.

Click:

**Start Assessment**

------------------------------------------------------------------------

## Demo Step 3 --- Reading Assessment

Display a short Filipino passage.

Example:

> "Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos
> kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan."

The exact demo passage may be changed, but it must be short enough to
read within approximately 30--60 seconds.

Display instructions:

> "Basahin nang malakas ang kuwento. Kapag handa ka na, pindutin ang
> Start Recording."

Buttons:

-   Start Recording
-   Stop Recording

------------------------------------------------------------------------

## Demo Step 4 --- Learner Reads

The learner reads the passage.

For the demo, intentionally create a realistic example containing a few
errors.

Example expected:

> "Maagang gumising si Ana upang tulungan ang kanyang ina."

Spoken:

> "Maagang gumising si Ana para tulungan ang kanyang ina."

The system should identify that the spoken word differs from the
expected word.

Important:

The system must not claim that the learner is wrong simply because the
word is a synonym.

For the MVP, the deterministic comparison should identify it as a
textual difference and allow teacher review.

------------------------------------------------------------------------

## Demo Step 5 --- AI Processing

Show a processing screen.

Example:

``` text
Analyzing reading...

✓ Speech recognized
✓ Passage compared
✓ Reading timing calculated
✓ Possible reading events analyzed
✓ Assessment ready
```

Do not expose technical model names to the teacher during the normal
workflow.

Optional technical demo panel may show:

``` text
Speech Recognition
       ↓
Word Timestamps
       ↓
Passage Alignment
       ↓
Reading Metrics
```

------------------------------------------------------------------------

## Demo Step 6 --- Reading Analysis

Display:

### Reading Accuracy

Example:

**91%**

### Fluency

Example:

**82 WPM**

### Word-Level Differences

``` text
Expected       Spoken
-------------------------
upang          para
```

Label:

> Text difference detected --- teacher review recommended.

### Possible Disfluency

Example:

> 2 possible disfluency events detected.

Do NOT display:

> "The learner stutters."

Instead:

> "Possible disfluency detected. Teacher review required."

------------------------------------------------------------------------

## Demo Step 7 --- Comprehension

Show 3--5 questions.

Example:

**1. Sino ang tinulungan ni Ana?**

A. Kanyang guro\
B. Kanyang ina\
C. Kanyang kaibigan\
D. Kanyang kapatid

The learner answers.

Show:

**Comprehension: 42%**

------------------------------------------------------------------------

## Demo Step 8 --- Learner Profile

Show a visual profile:

``` text
ANA — GRADE 2

Reading Accuracy     91%
Fluency              82 WPM
Comprehension        42%

Observed Areas for Support
───────────────────────────
✓ Accuracy: generally strong
⚠ Fluency: monitor
⚠ Comprehension: needs support
```

Important:

This is a profile, not one opaque "AI score."

------------------------------------------------------------------------

## Demo Step 9 --- Teacher Decision

Show:

> "Suggested area for support: Reading Comprehension"

Then show suggested intervention:

> **Finding the Main Idea**

Example activity:

1.  Read a short paragraph.
2.  Ask the learner what the paragraph is mostly about.
3.  Ask the learner to choose the best main idea.
4.  Repeat with another paragraph.

Teacher can:

-   Accept
-   Edit
-   Choose another intervention
-   Add notes

The teacher remains responsible for the decision.

------------------------------------------------------------------------

## Demo Step 10 --- Reassessment

After intervention, click:

**Reassess Ana**

Use another comparable passage.

Example:

``` text
BEFORE                 AFTER

Accuracy   91%         Accuracy   94%
Fluency    82 WPM      Fluency    86 WPM
Comp.      42%         Comp.      80%
```

Display:

> "Comprehension improved from 42% to 80%."

Narration:

> "BasaCheck does not stop at identifying a problem. It helps teachers
> test whether the intervention actually helped."

------------------------------------------------------------------------

## Demo Step 11 --- Closing

Final screen:

> **Assess → Understand → Intervene → Reassess**

Closing statement:

> "BasaCheck is not here to replace the teacher. It gives the teacher
> evidence faster, so more time can be spent helping the learner."

------------------------------------------------------------------------

# 7. Functional Requirements

## FR-001 Authentication

The application must provide teacher authentication.

Minimum:

-   Login.
-   Logout.
-   Protected teacher dashboard.

For hackathon demo, a seeded demo account may be provided.

Do not build complex role management unless required.

------------------------------------------------------------------------

## FR-002 Learner Management

Teacher can:

-   Create learner.
-   View learner.
-   Edit learner.
-   Archive learner.
-   Start assessment.

Minimum learner fields:

``` text
id
display_name
grade_level
created_at
updated_at
```

Avoid collecting unnecessary personally identifiable information.

------------------------------------------------------------------------

## FR-003 Reading Passage Management

Each passage must contain:

``` text
id
title
content
language
grade_level
difficulty
estimated_duration
created_at
```

Example:

``` json
{
  "title": "Ana sa Paaralan",
  "language": "fil",
  "grade_level": 2,
  "difficulty": "beginner"
}
```

------------------------------------------------------------------------

## FR-004 Assessment Creation

Teacher selects:

-   Learner.
-   Passage.

System creates an assessment with status:

``` text
created
recording
processing
completed
reviewed
```

------------------------------------------------------------------------

## FR-005 Audio Recording

Requirements:

-   Browser microphone access.
-   Start recording.
-   Stop recording.
-   Playback optional.
-   Upload/process recording.

The UI must clearly request microphone permission.

If microphone access fails:

> "Microphone access is required for reading assessment. Check your
> browser permissions and try again."

------------------------------------------------------------------------

# 8. Speech Processing Pipeline

## 8.1 Required Pipeline

``` text
Audio
  ↓
Preprocessing
  ↓
Speech-to-Text
  ↓
Timestamp Extraction
  ↓
Expected vs Spoken Comparison
  ↓
Reading Metrics
```

## 8.2 Recommended Open-Source Components

### Speech-to-Text

Use:

**faster-whisper / Whisper**

Purpose:

-   Convert learner speech into text.

The core system must not depend on a paid speech API.

### Word Timing

Preferred:

**WhisperX**

Purpose:

-   Word-level timestamps.
-   Forced alignment where a compatible model exists.

### Voice Activity Detection

Preferred:

**Silero VAD**

Purpose:

-   Identify speech and non-speech intervals.
-   Help estimate pauses.

### Important Technical Constraint

Do not assume that every language has a reliable phoneme alignment
model.

Filipino/Tagalog support must be tested before depending on
phoneme-level pronunciation analysis.

------------------------------------------------------------------------

# 9. Reading Analysis Engine

The reading analysis engine must be deterministic where possible.

AI should NOT directly decide the final reading score.

## 9.1 Text Normalization

Before comparison:

-   lowercase text,
-   normalize whitespace,
-   normalize punctuation,
-   remove irrelevant punctuation,
-   preserve meaningful word boundaries.

Example:

``` text
"Maagang gumising si Ana!"
```

becomes:

``` text
["maagang", "gumising", "si", "ana"]
```

------------------------------------------------------------------------

## 9.2 Word Alignment

Compare:

``` text
EXPECTED:
maagang gumising si ana upang tulungan ang kanyang ina

SPOKEN:
maagang gumising si ana para tulungan ang kanyang ina
```

Use sequence alignment / edit distance.

Possible operations:

-   MATCH
-   SUBSTITUTION
-   DELETION / OMISSION
-   INSERTION
-   REPETITION

Example:

``` text
MATCH         maagang
MATCH         gumising
MATCH         si
MATCH         ana
SUBSTITUTION  upang -> para
MATCH         tulungan
MATCH         ang
MATCH         kanyang
MATCH         ina
```

------------------------------------------------------------------------

# 10. Reading Accuracy

Formula:

``` text
accuracy =
correctly_matched_words / expected_words * 100
```

Example:

Expected words:

``` text
47
```

Correct:

``` text
43
```

Accuracy:

``` text
43 / 47 × 100 = 91.5%
```

Display rounded value:

**92%**

Do not let an LLM calculate this.

The application code must calculate it.

------------------------------------------------------------------------

# 11. Fluency / Words Per Minute

Basic formula:

``` text
WPM = words_read / minutes
```

Example:

``` text
47 words
35 seconds

35 / 60 = 0.583 minutes

47 / 0.583 = 80.7 WPM
```

Display:

**81 WPM**

The exact interpretation of whether a WPM value is "good" or "poor" must
not be hard-coded as a universal rule unless a validated educational
benchmark is explicitly supplied.

For MVP:

> Report the measured value and allow teacher interpretation.

------------------------------------------------------------------------

# 12. Pause Analysis

Use timestamps to calculate gaps between spoken words.

Example:

``` text
word A ends at 2.4s
word B starts at 3.8s

gap = 1.4s
```

Flag configurable pause thresholds.

Example MVP threshold:

``` text
possible_long_pause >= 1.5 seconds
```

This is an **engineering heuristic**, not a clinical threshold.

The threshold must be configurable.

------------------------------------------------------------------------

# 13. Possible Disfluency Detection

The system may flag observable patterns such as:

-   repeated words,
-   repeated short phrases,
-   unusually long pauses,
-   repeated recognized tokens.

Example:

``` text
Spoken:
"Ang ang bata ay naglalaro."
```

Potential event:

``` text
Possible repetition:
"ang" repeated
```

The system should display:

> Possible disfluency event detected.

It must NOT display:

> Stuttering detected.

### Critical limitation

Speech recognition can normalize repetitions.

Example:

``` text
Audio:
"ba-ba-bata"

Transcript:
"bata"
```

Therefore:

> Transcript-only analysis cannot reliably detect every disfluency.

Audio timing and acoustic analysis should be used where possible.

------------------------------------------------------------------------

# 14. Pronunciation / Mispronunciation

True pronunciation assessment is **not required for the first MVP**.

Reason:

Speech-to-text models may understand what the child intended to say even
if pronunciation was imperfect.

Example:

``` text
Child pronunciation:
incorrect phoneme

ASR:
correct target word
```

The system may incorrectly consider the word correct.

Therefore:

-   Do not claim accurate pronunciation scoring.
-   Do not use ASR text alone to diagnose articulation.
-   If phoneme-level analysis is added later, it must be separately
    validated for Filipino/Tagalog.

------------------------------------------------------------------------

# 15. Comprehension Assessment

Comprehension is separate from speech analysis.

Each passage should have:

-   3--5 questions for MVP.
-   Multiple-choice answers.
-   Correct answer stored server-side.

Example:

``` json
{
  "question": "Sino ang tinulungan ni Ana?",
  "choices": [
    "Ang kanyang guro",
    "Ang kanyang ina",
    "Ang kanyang kapatid",
    "Ang kanyang kaibigan"
  ],
  "correct_answer": 1
}
```

Score:

``` text
correct_answers / total_questions × 100
```

The score must be calculated by application code.

------------------------------------------------------------------------

# 16. Learner Profile

The learner profile must contain separate measurements.

Minimum:

``` text
Reading Accuracy
Fluency / WPM
Possible Disfluency Events
Comprehension
```

Example:

``` text
┌──────────────────────────────┐
│ ANA — GRADE 2                │
├──────────────────────────────┤
│ Accuracy       91%           │
│ Fluency        81 WPM        │
│ Comprehension  42%           │
│                              │
│ Observations                 │
│ • Text differences detected  │
│ • 2 possible pause events    │
│ • Comprehension needs review │
└──────────────────────────────┘
```

------------------------------------------------------------------------

# 17. Support Area Logic

The MVP should use transparent rules rather than an opaque AI
classifier.

Example:

``` text
IF comprehension_score < configurable_threshold
THEN flag "Comprehension"

IF accuracy < configurable_threshold
THEN flag "Reading Accuracy"

IF fluency is below a configured benchmark
THEN flag "Reading Fluency"

IF repeated tokens / long pauses detected
THEN flag "Possible Disfluency — Teacher Review"
```

Important:

Thresholds must be configurable.

Do not invent developmental norms.

If educational benchmark data is later added, store the source and
population for every benchmark.

------------------------------------------------------------------------

# 18. Intervention System

Interventions should be structured.

Example categories:

## Comprehension

-   Main idea.
-   Sequencing.
-   Identifying details.
-   Cause and effect.
-   Vocabulary in context.

## Accuracy

-   Word recognition.
-   High-frequency word practice.
-   Guided repeated reading.

## Fluency

-   Repeated reading.
-   Timed supported reading.
-   Phrase reading.

## Possible Disfluency

-   Teacher observation.
-   Calm reading environment.
-   Repeat assessment under normal conditions.
-   Refer to appropriate school/professional support if concerns
    persist.

BasaCheck must not automatically recommend a medical diagnosis or
treatment.

------------------------------------------------------------------------

# 19. AI Recommendation Layer

AI recommendations are optional.

The LLM should receive structured assessment data rather than raw audio
whenever possible.

Example input:

``` json
{
  "accuracy": 91,
  "wpm": 81,
  "comprehension": 42,
  "possible_disfluency_events": 2,
  "word_differences": 3
}
```

The AI can produce:

-   Suggested intervention.
-   Short explanation.
-   Suggested teacher activity.
-   Suggested reassessment focus.

The AI must NOT:

-   Diagnose.
-   Invent measurements.
-   Change assessment scores.
-   Override deterministic calculations.
-   Claim certainty.
-   Generate medical conclusions.

------------------------------------------------------------------------

# 20. Teacher Review

Every AI-generated observation must be reviewable.

Example:

``` text
Possible area for support:
Comprehension

Why:
Comprehension score was 42%.

Teacher decision:
[Accept]
[Edit]
[Dismiss]
```

Teacher notes:

``` text
Optional teacher note:
____________________________
```

Teacher review status:

``` text
pending
accepted
edited
dismissed
```

------------------------------------------------------------------------

# 21. Reassessment

Teacher can create a follow-up assessment.

The system must store each assessment independently.

Example:

``` text
Assessment 1
2026-10-01

Assessment 2
2026-10-15
```

Progress calculation:

``` text
change = latest_score - previous_score
```

Example:

``` text
Comprehension
42% → 80%
+38 percentage points
```

Use "percentage points", not "38% improvement".

------------------------------------------------------------------------

# 22. Progress Dashboard

Display:

-   Previous assessment.
-   Latest assessment.
-   Change.
-   Intervention used.
-   Teacher notes.

Example:

``` text
ANA'S PROGRESS

              BEFORE     AFTER
Accuracy        91%       94%
Fluency         81 WPM    86 WPM
Comprehension   42%       80%

Intervention:
Finding the Main Idea

Teacher note:
"Improved after guided practice."
```

Do not claim the intervention caused the improvement based on a single
reassessment.

Use:

> "Observed change after intervention."

------------------------------------------------------------------------

# 23. Data Model

Recommended Supabase PostgreSQL schema.

## users

``` text
id
email
role
created_at
```

## learners

``` text
id
teacher_id
display_name
grade_level
created_at
updated_at
archived_at
```

## passages

``` text
id
title
content
language
grade_level
difficulty
estimated_duration_seconds
created_at
```

## comprehension_questions

``` text
id
passage_id
question
choices
correct_answer
created_at
```

## assessments

``` text
id
learner_id
passage_id
status
started_at
completed_at
created_at
```

## assessment_audio

``` text
id
assessment_id
storage_path
duration_seconds
retention_status
created_at
deleted_at
```

Prefer deleting raw audio after processing unless retention is
explicitly required.

## transcripts

``` text
id
assessment_id
text
language
model_name
created_at
```

## word_events

``` text
id
assessment_id
expected_word
spoken_word
event_type
start_time
end_time
confidence
sequence_index
```

Event types:

``` text
match
substitution
omission
insertion
repetition
```

## reading_metrics

``` text
id
assessment_id
accuracy_percent
wpm
total_expected_words
matched_words
substitutions
omissions
insertions
possible_disfluency_events
long_pause_events
created_at
```

## comprehension_results

``` text
id
assessment_id
score_percent
correct_count
total_questions
created_at
```

## interventions

``` text
id
assessment_id
category
title
description
source
created_at
```

## teacher_reviews

``` text
id
assessment_id
support_area
status
teacher_note
created_at
updated_at
```

------------------------------------------------------------------------

# 24. Storage Architecture

Recommended:

``` text
Frontend
Next.js
   │
   ├── Supabase Auth
   ├── Supabase PostgreSQL
   └── Supabase Storage
            │
            └── temporary audio
                    ↓
              Speech processor
                    ↓
              metrics/results
                    ↓
              raw audio deletion
```

------------------------------------------------------------------------

# 25. Technology Stack

## Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS

## Backend

-   Next.js server/API routes where appropriate.
-   Supabase.

## Database

-   PostgreSQL via Supabase.

## Authentication

-   Supabase Auth.

## Audio

-   Browser MediaRecorder API.

## Speech Recognition

Preferred:

-   faster-whisper

## Timestamp Alignment

Preferred:

-   WhisperX

## Voice Activity Detection

Preferred:

-   Silero VAD

## Optional LLM

-   Gemini or another approved LLM provider.

The LLM is optional and must never be required for core scoring.

## Deployment

Frontend:

-   Vercel

Speech-processing service:

-   Separate Python service/container if required.

Do not assume Vercel serverless functions can run a large speech model
reliably.

------------------------------------------------------------------------

# 26. Recommended System Architecture

``` text
                    ┌─────────────────────┐
                    │      TEACHER        │
                    │  Mobile / Desktop   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Next.js Frontend  │
                    │  Teacher Dashboard   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │       Supabase      │
                    │ Auth / DB / Storage  │
                    └──────────┬──────────┘
                               │
                         Temporary Audio
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Python Speech       │
                    │ Processing Service   │
                    ├─────────────────────┤
                    │ faster-whisper      │
                    │ WhisperX             │
                    │ Silero VAD           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ BasaCheck Engine     │
                    ├─────────────────────┤
                    │ Alignment            │
                    │ Accuracy             │
                    │ WPM                  │
                    │ Pause analysis       │
                    │ Event detection      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Teacher Review       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Optional LLM        │
                    │ Intervention Help    │
                    └─────────────────────┘
```

------------------------------------------------------------------------

# 27. API Requirements

## POST /api/assessments

Creates an assessment.

Request:

``` json
{
  "learnerId": "uuid",
  "passageId": "uuid"
}
```

Response:

``` json
{
  "assessmentId": "uuid",
  "status": "created"
}
```

## POST /api/assessments/:id/audio

Uploads audio.

Response:

``` json
{
  "assessmentId": "uuid",
  "status": "processing"
}
```

## GET /api/assessments/:id

Returns assessment.

## GET /api/assessments/:id/results

Returns:

``` json
{
  "accuracy": 91,
  "wpm": 81,
  "comprehension": 42,
  "wordEvents": [],
  "possibleDisfluencyEvents": []
}
```

## POST /api/assessments/:id/review

Request:

``` json
{
  "supportArea": "comprehension",
  "status": "accepted",
  "teacherNote": "Needs more main-idea practice."
}
```

------------------------------------------------------------------------

# 28. UI Requirements

## Dashboard

Must show:

-   BasaCheck branding.
-   Learner count.
-   Assessments requiring review.
-   Recent assessments.
-   Start assessment button.

## Learner Page

Must show:

-   Learner name/alias.
-   Grade.
-   Assessment history.
-   Latest metrics.
-   Start assessment.

## Assessment Page

Must show:

-   Passage.
-   Recording state.
-   Timer.
-   Microphone state.
-   Start/Stop controls.

## Processing Page

Must show:

-   Processing status.
-   No fake progress percentages.
-   Clear error state.

Do not display "87% complete" unless actual progress is known.

## Results Page

Must show:

-   Accuracy.
-   WPM.
-   Comprehension.
-   Word differences.
-   Possible disfluency events.
-   Teacher review.
-   Intervention.

## Progress Page

Must show:

-   Before/after.
-   Intervention.
-   Teacher notes.
-   Timeline.

------------------------------------------------------------------------

# 29. Accessibility Requirements

-   Large buttons.
-   High contrast.
-   Clear typography.
-   Mobile responsive.
-   No information communicated by color alone.
-   Screen-reader-friendly labels.
-   Clear error messages.
-   Minimal text during learner recording.
-   Avoid technical terminology in learner-facing UI.

------------------------------------------------------------------------

# 30. Filipino Language Requirements

MVP reading content should be Filipino/Tagalog.

The system must not assume English pronunciation or English-only
alignment.

Store language:

``` text
language = "fil"
```

The speech-processing system must record which model and language
configuration were used.

If Filipino speech recognition performs poorly in testing, the system
must surface the limitation rather than silently producing
confident-looking results.

------------------------------------------------------------------------

# 31. Offline / Low-Bandwidth Strategy

Archived sketch only. The hackathon build uses offline tap instead: the
teacher marks missed words, the same engine scores the marked transcript,
and the save still uses the app server. There is no PWA and no upload queue.

The MVP should be designed so the interface remains usable on unstable
connections.

Possible approach:

``` text
PWA
 ↓
IndexedDB
 ↓
Temporarily store assessment data/audio
 ↓
Upload when connection returns
```

Offline support is a stretch goal unless the hackathon timeline allows
it.

Do not pretend the app is offline-capable unless it has actually been
implemented and tested.

------------------------------------------------------------------------

# 32. Privacy and Security Requirements

Because learners may be children, privacy is a core requirement.

## Required

-   Authentication.
-   Authorization.
-   Teacher can only access their permitted learners.
-   HTTPS in deployment.
-   Supabase Row Level Security.
-   No public learner data.
-   No public audio URLs.
-   Avoid unnecessary PII.
-   Temporary audio retention by default.
-   Secure API endpoints.
-   Server-side validation.
-   Input validation.
-   Environment variables for secrets.

Never place:

-   API keys,
-   service-role keys,
-   database passwords

inside client-side code.

------------------------------------------------------------------------

# 33. Data Retention

Default policy:

``` text
Raw audio:
Temporary

Transcript:
Retain only if needed for teacher review

Metrics:
Retain for progress tracking

Learner identity:
Minimum required information
```

A production deployment must define an actual retention policy with the
school/institution.

For the hackathon:

> Demonstrate deletion of raw audio after processing.

------------------------------------------------------------------------

# 34. Security Rules

Supabase RLS must ensure:

``` text
Teacher A
   ↓
Can access only Teacher A's learners and assessments.

Teacher B
   ↓
Cannot access Teacher A's learner records.
```

Never rely only on frontend filtering.

Authorization must be enforced server-side/database-side.

------------------------------------------------------------------------

# 35. Error Handling

## Microphone Error

Show:

> "We could not access the microphone. Please check browser
> permissions."

## Speech Processing Error

Show:

> "We couldn't process this recording. You can retry the recording or
> review it manually."

Do not generate fake results.

## Low Confidence Transcription

Show:

> "The recording may be difficult to analyze accurately. Teacher review
> is recommended."

## Unsupported Language

Show:

> "This assessment currently supports Filipino reading content."

## AI Recommendation Failure

The assessment must still work.

Show:

> "Intervention suggestions are temporarily unavailable. You can select
> an intervention manually."

This is important:

**LLM failure must never break the core assessment.**

------------------------------------------------------------------------

# 36. AI Reliability Rules

The system must follow these rules:

### Rule 1

Deterministic calculations are performed by application code.

### Rule 2

LLMs cannot modify raw assessment measurements.

### Rule 3

LLMs cannot invent learner data.

### Rule 4

LLMs cannot diagnose medical or learning disorders.

### Rule 5

AI observations must be presented as observations, not facts beyond the
measured data.

### Rule 6

Teacher review is required for ambiguous events.

### Rule 7

If confidence is low, say so.

------------------------------------------------------------------------

# 37. Confidence and Uncertainty

Speech recognition may be wrong.

Therefore, the result model should support:

``` text
confidence
```

for recognized words/events where available.

Example:

``` text
Word:
"upang"

Confidence:
0.61

Status:
Review recommended
```

Do not use an arbitrary confidence threshold as a clinical or
educational truth.

Thresholds should be configurable and documented.

------------------------------------------------------------------------

# 38. Deterministic vs AI Responsibilities

## Application Code

Must handle:

-   Word tokenization.
-   Text normalization.
-   Sequence alignment.
-   Accuracy.
-   WPM.
-   Comprehension scoring.
-   Progress calculations.
-   Database operations.
-   Authentication.
-   Authorization.

## Speech AI

Handles:

-   Speech recognition.
-   Word timestamps.
-   Speech activity.

## Optional LLM

Handles:

-   Intervention explanation.
-   Teacher-friendly summaries.
-   Suggested activities.

## Teacher

Handles:

-   Final interpretation.
-   Intervention selection.
-   Follow-up.
-   Escalation/referral where appropriate.

------------------------------------------------------------------------

# 39. Anti-Hallucination Engineering Rules

The coding agent must follow these rules strictly.

## Rule A --- Do Not Invent Dependencies

Before adding a library:

1.  Check whether it is already installed.
2.  Check package compatibility.
3.  Add it only when required.
4.  Explain why it is needed.

## Rule B --- Do Not Replace the Architecture

Do not switch:

-   Supabase → Firebase
-   Next.js → another framework
-   Python speech service → paid API
-   PostgreSQL → MongoDB

unless explicitly instructed.

## Rule C --- Do Not Add Unrequested Features

Do not add:

-   chatbots,
-   payments,
-   social features,
-   admin systems,
-   complex analytics,
-   medical diagnosis,
-   unrelated AI features.

## Rule D --- Do Not Fake AI

If a model is not actually running, do not create a UI that pretends it
is.

For demo-only mock mode, label it clearly:

``` text
DEMO MODE
```

## Rule E --- No Fake Metrics

Never hard-code:

``` text
91% accuracy
82 WPM
```

into production logic.

Those values may only exist in a dedicated seeded demo fixture.

## Rule F --- No Fake Progress

Do not show fabricated processing progress.

## Rule G --- No Silent Fallbacks

If speech processing fails, surface the error.

Do not silently replace the result with random/demo data.

## Rule H --- Preserve Data Integrity

Do not allow an LLM to write directly to assessment metrics.

------------------------------------------------------------------------

# 40. Demo Mode

The application should support a controlled demo mode.

Environment variable:

``` text
NEXT_PUBLIC_DEMO_MODE=true
```

Demo mode may provide:

-   seeded learner "Ana";
-   seeded Filipino passage;
-   deterministic sample assessment;
-   precomputed expected results;
-   simulated processing.

However, the UI must visibly indicate:

> Demo Mode

The production path must use the actual speech-processing pipeline.

------------------------------------------------------------------------

# 41. Seeded Demo Data

Create one fictional learner:

``` text
Name: Ana
Grade: 2
```

Create one passage.

Create 5 comprehension questions.

Create one assessment result:

``` text
Accuracy: 91%
WPM: 81
Comprehension: 42%
Possible disfluency events: 2
```

Create intervention:

``` text
Finding the Main Idea
```

Create reassessment:

``` text
Accuracy: 94%
WPM: 86
Comprehension: 80%
```

These are demonstration values only.

------------------------------------------------------------------------

# 42. Suggested Project Structure

``` text
basacheck/
├── app/
│   ├── dashboard/
│   ├── learners/
│   ├── assessments/
│   ├── results/
│   └── progress/
│
├── components/
│   ├── dashboard/
│   ├── learners/
│   ├── assessment/
│   ├── results/
│   └── ui/
│
├── lib/
│   ├── supabase/
│   ├── assessment/
│   ├── alignment/
│   ├── metrics/
│   └── validation/
│
├── speech-service/
│   ├── whisper/
│   ├── whisperx/
│   ├── vad/
│   └── api/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── types/
│
├── docs/
│
├── .env.example
├── README.md
└── package.json
```

------------------------------------------------------------------------

# 43. Environment Variables

Example:

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

SPEECH_SERVICE_URL=

GEMINI_API_KEY=
```

Never commit actual secret values.

`.env.local` must be ignored by Git.

------------------------------------------------------------------------

# 44. Development Phases

## Phase 1 --- Foundation

Implement:

-   Next.js.
-   TypeScript.
-   Tailwind.
-   Supabase.
-   Authentication.
-   Database schema.
-   RLS.

## Phase 2 --- Learners

Implement:

-   Learner creation.
-   Learner list.
-   Learner profile.

## Phase 3 --- Passages

Implement:

-   Passage database.
-   Passage selection.
-   Filipino sample passage.

## Phase 4 --- Recording

Implement:

-   Microphone permission.
-   MediaRecorder.
-   Audio upload.
-   Processing state.

## Phase 5 --- Speech Processing

Implement:

-   faster-whisper.
-   transcription.
-   word timestamps.
-   WhisperX where compatible.
-   VAD.

## Phase 6 --- Assessment Engine

Implement:

-   normalization.
-   alignment.
-   substitutions.
-   omissions.
-   insertions.
-   accuracy.
-   WPM.
-   pause events.
-   possible repetition/disfluency events.

## Phase 7 --- Comprehension

Implement:

-   questions.
-   answers.
-   scoring.

## Phase 8 --- Results

Implement:

-   learner profile.
-   teacher review.
-   intervention selection.

## Phase 9 --- Reassessment

Implement:

-   follow-up assessment.
-   progress comparison.

## Phase 10 --- Demo Polish

Implement:

-   responsive UI.
-   loading states.
-   errors.
-   seeded demo.
-   demo sequence.
-   presentation-ready results.

------------------------------------------------------------------------

# 45. Testing Requirements

## Unit Tests

Test:

-   Text normalization.
-   Word alignment.
-   Accuracy.
-   WPM.
-   Comprehension scoring.
-   Progress calculations.

Example:

``` text
Expected:
a b c d

Spoken:
a b x d

Expected:
75% accuracy
```

## Integration Tests

Test:

``` text
Create learner
→ create assessment
→ upload audio
→ process
→ store results
→ display results
```

## Security Tests

Test:

-   Teacher A cannot access Teacher B's learner.
-   Unauthenticated user cannot access dashboard.
-   Service role key is never sent to browser.

## Audio Tests

Test:

-   clear speech,
-   background noise,
-   silence,
-   short recording,
-   long recording,
-   Filipino speech,
-   repeated words.

------------------------------------------------------------------------

# 46. Acceptance Criteria

The MVP is complete when:

### Learner Management

-   [ ] Teacher can create learner.
-   [ ] Teacher can view learner.
-   [ ] Teacher can start assessment.

### Reading Assessment

-   [ ] Passage is displayed.
-   [ ] Microphone recording works.
-   [ ] Audio is uploaded.
-   [ ] Speech is transcribed.
-   [ ] Expected and spoken text are compared.
-   [ ] Word differences are displayed.
-   [ ] Accuracy is calculated by code.
-   [ ] WPM is calculated by code.

### Comprehension

-   [ ] Questions are displayed.
-   [ ] Answers are captured.
-   [ ] Score is calculated.

### Teacher Review

-   [ ] Observed areas are displayed.
-   [ ] Teacher can accept/edit/dismiss.
-   [ ] Teacher can add notes.

### Intervention

-   [ ] Teacher can select intervention.
-   [ ] Intervention is saved.

### Reassessment

-   [ ] Teacher can reassess.
-   [ ] Before/after metrics are shown.

### Privacy

-   [ ] Authentication works.
-   [ ] RLS works.
-   [ ] Audio is not public.
-   [ ] Secrets are not client-side.
-   [ ] Demo uses fictional data.

### Reliability

-   [ ] Speech processing failure has an error state.
-   [ ] LLM failure does not break assessment.
-   [ ] No fake metrics in production mode.

------------------------------------------------------------------------

# 47. Definition of Done

A feature is not considered complete merely because the UI exists.

A feature is complete when:

1.  UI exists.
2.  Backend exists.
3.  Database integration works.
4.  Validation exists.
5.  Error handling exists.
6.  Security rules exist.
7.  The happy path has been tested.
8.  Failure states have been tested.
9.  No fake data is used outside demo mode.
10. README/documentation is updated.

------------------------------------------------------------------------

# 48. Agentic Coding Instructions

The coding agent must operate in this order.

## Step 1

Inspect the existing repository.

Do not immediately rewrite files.

## Step 2

Identify:

-   framework,
-   package manager,
-   existing dependencies,
-   environment variables,
-   database setup,
-   routes,
-   components.

## Step 3

Create a written implementation plan before large changes.

## Step 4

Implement one phase at a time.

## Step 5

After each phase:

-   run lint,
-   run tests,
-   build the project,
-   fix errors.

## Step 6

Never remove working functionality without explicit permission.

## Step 7

Never invent credentials.

## Step 8

Never expose secrets.

## Step 9

Never replace real processing with fake AI output.

## Step 10

When uncertain, choose the smallest implementation that satisfies this
PRD.

------------------------------------------------------------------------

# 49. Important Technical Decisions

These decisions are fixed for the MVP unless explicitly changed.

  Decision                MVP Choice
  ----------------------- --------------------------------------------
  Frontend                Next.js + TypeScript
  Styling                 Tailwind CSS
  Database                Supabase PostgreSQL
  Auth                    Supabase Auth
  Storage                 Supabase Storage
  Speech-to-text          faster-whisper
  Word timing/alignment   WhisperX where compatible
  VAD                     Silero VAD
  Core scoring            Custom deterministic code
  Optional AI             Gemini/approved LLM
  Hosting frontend        Vercel
  Speech processing       Separate Python service
  Primary language        Filipino/Tagalog
  Primary user            Teacher
  Core loop               Assess → Understand → Intervene → Reassess

------------------------------------------------------------------------

# 50. What the Agent Must Never Assume

The coding agent must not assume:

1.  Filipino speech recognition is perfect.
2.  Child speech is equivalent to adult speech.
3.  Whisper can diagnose pronunciation.
4.  Transcript text contains every stutter/repetition.
5.  A long pause means a speech disorder.
6.  A text substitution means the learner does not understand the word.
7.  One assessment proves a learning disorder.
8.  AI output is always correct.
9.  A free AI API has unlimited usage.
10. Vercel can reliably run a large speech model.
11. Every WhisperX language alignment model supports Filipino.
12. Demo values represent real learner results.

------------------------------------------------------------------------

# 51. Future Roadmap

## Version 1.1

-   More Filipino passages.
-   Passage difficulty levels.
-   Teacher notes.
-   Better progress visualization.
-   More intervention templates.

## Version 1.2

-   Offline/PWA assessment.
-   Improved Filipino speech processing.
-   More robust audio analysis.
-   Better word-level confidence.

## Version 2

-   Support for additional Philippine languages where models/data
    permit.
-   School-level analytics.
-   Teacher collaboration.
-   Evidence-based benchmark integration.
-   Carefully validated pronunciation analysis.

Any future benchmark must document:

-   source,
-   age/grade population,
-   language,
-   sample size,
-   assessment conditions,
-   date,
-   limitations.

------------------------------------------------------------------------

# 52. Product Success Metrics

For the hackathon MVP, success should be measured by whether the
prototype demonstrates the complete loop.

Primary:

1.  Teacher can complete an assessment.
2.  System produces understandable evidence.
3.  Teacher can identify a support area.
4.  Teacher can assign an intervention.
5.  Teacher can reassess.
6.  System shows measured change.

Secondary:

-   Assessment completion time.
-   Speech-processing success rate.
-   Teacher correction rate.
-   Percentage of assessments requiring manual review.
-   Audio processing time.

Do not use a single "AI accuracy" number without a defined test dataset
and evaluation methodology.

------------------------------------------------------------------------

# 53. Demo Storyboard

The presentation should be approximately:

## 0:00--0:30 --- Problem

> "A teacher can know that a child struggles to read. But knowing that a
> child struggles is different from knowing what to do next."

## 0:30--1:00 --- Introduce BasaCheck

> "BasaCheck turns a short reading activity into evidence about
> accuracy, fluency, comprehension, and observable reading behavior."

## 1:00--2:00 --- Assess Ana

-   Select Ana.
-   Show passage.
-   Record reading.
-   Process audio.

## 2:00--2:45 --- Understand

Show:

-   Accuracy.
-   WPM.
-   Word differences.
-   Possible disfluency.
-   Comprehension.

Say:

> "Instead of one AI score, the teacher sees the components behind the
> reading performance."

## 2:45--3:30 --- Intervene

Show:

> "Finding the Main Idea"

Teacher accepts recommendation.

## 3:30--4:00 --- Reassess

Show:

``` text
42% comprehension
       ↓
80% comprehension
```

Say:

> "The system measures what changed after intervention."

## 4:00--4:30 --- Responsible AI

Show the five principles:

``` text
WHO?
Teacher + learner

BARRIER?
Identifying the reading support needed

REALITY?
Low-bandwidth, Filipino, teacher-centered

DATA?
Minimum necessary learner data

FAILURE?
Teacher remains accountable
```

## 4:30--5:00 --- Closing

> "AI does the hard speech processing. Our assessment engine calculates
> the evidence. The teacher makes the decision."

Final screen:

> **BasaCheck**\
> **Assess. Understand. Intervene. Reassess.**

------------------------------------------------------------------------

# 54. Final Product Principle

BasaCheck should never be built around the question:

> "How can we put more AI into education?"

It should be built around:

> "What information does a teacher need to help one struggling learner?"

The technology exists to answer that question.

The product succeeds when it helps a teacher move from:

``` text
"I know this learner is struggling."
```

to:

``` text
"I have evidence of where the learner needs support,
I know what intervention I am trying,
and I can check whether it helped."
```

------------------------------------------------------------------------

# 55. Final Instruction to the Coding Agent

Build **only** what is defined in this PRD.

Prioritize:

1.  Correctness.
2.  Simplicity.
3.  Teacher usability.
4.  Data privacy.
5.  Transparent assessment logic.
6.  Reliable error handling.
7.  Real working speech processing.
8.  Demo readiness.

Do not optimize for the number of AI features.

The core product is:

``` text
          BASACHECK

      ONE LEARNER
           │
           ▼
       ASSESS
           │
           ▼
      UNDERSTAND
           │
           ▼
      INTERVENE
           │
           ▼
       REASSESS
           │
           ▼
     MEASURE CHANGE
```

**AI is a component of BasaCheck. It is not the product itself.**
