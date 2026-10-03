# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Teacher** (primary): runs a one-on-one reading check with a learner, on a phone-width browser in a classroom. Picks the language and passage, records the learner (or marks missed words offline), confirms the transcript, asks three comprehension questions, then chooses a follow-up activity.
- **Hackathon judges** (landing page audience): need to understand in seconds what BasaCheck does, why its numbers can be trusted, and how to open the working demo.

## Product Purpose

BasaCheck turns a short oral reading into transparent measurements a teacher can act on: Passage Reading Accuracy, Reading Rate and Comprehension, plus the word differences behind them. Success is a teacher finishing a check in a few minutes and choosing an activity with clear, honest information.

## Positioning

Every number comes from deterministic scoring code over a transcript the teacher has confirmed. Speech recognition only drafts the transcript; it never scores. An optional AI explanation can describe results but cannot change them.

## Operating Context

- Four-screen loop: dashboard → reading check (choose, read aloud or offline tap, check words, questions) → results → progress.
- Passages are original texts written in the Phil-IRI form, in Filipino and English, for Grades 2, 4 and 6. They are not the national test.
- Fictional learners: Ana (Grade 2), Luis (Grade 4), Elena (Grade 6).
- Hackathon project with four members, each owning parts of the code (docs/05-team-split.md).

## Capabilities and Constraints

- Phone-width layout is required. Recording needs localhost or HTTPS.
- Provenance labels must stay visible on results and progress: **Offline tap**, **Demo Mode**, **Seeded demo assessment**.
- Support suggestions are "Demo rules, not validated educational benchmarks." There is no WPM threshold, Reading Rate never triggers a suggestion, and the app assigns no reading level.
- No diagnosis language. Word differences are "differences", not errors.
- Comparisons only between explicitly linked checks of the same learner, language and passage.

## Brand Commitments

- Name: BasaCheck ("basa" = read in Filipino).
- Visual references chosen by the user (2026-10-04): a light hero with monospace type, a chunky pixel headline and a 3D object drawn in moving horizontal scan lines (for BasaCheck: a book); and a dashboard card with a segmented tick-ring gauge for percentages. App screens follow the light hero look.

## Evidence on Hand

Real, working demo with seeded data (supabase/seed.sql) and 111 passing tests. No real schools, teachers, users, testimonials or effectiveness data. Never claim any.

## Product Principles

1. The teacher decides; the software measures and explains.
2. Show provenance next to every number.
3. Measurements, not judgments: no benchmarks, levels or diagnoses.
4. Fast enough to finish a check during class.

## Accessibility & Inclusion

Bilingual Filipino/English content with correct `lang` attributes. Large touch targets (at least 48px) for phone use. Passage text must stay highly legible for young readers.
