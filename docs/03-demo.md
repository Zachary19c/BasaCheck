# BasaCheck — Final 4-Minute Demo

One story: fictional Ana, Grade 2. Show Filipino as the main example while briefly revealing English support. Demo data illustrates the workflow; it is not an actual child study.

## Setup

- Seeded teacher, Ana, four passages, twelve reviewed questions, linked illustrative follow-up.
- Phone-width browser on localhost or HTTPS; verify microphone access before judging.
- Know whether live speech or Demo Mode is active; never hide the banner.
- Keep labeled progress view open in a backup tab. Preserve the follow-up row.

## Script

### 0:00–0:20 — Problem

“Teachers need evidence to choose what to practice next: recognizing words, reading pace, or understanding the story.”

### 0:20–0:40 — Dashboard

“BasaCheck supports teacher-led reading checks in Filipino and English. Today we will use Filipino with our fictional learner Ana.”

### 0:40–1:50 — Assess and verify

Show both language options, select Filipino and **Si Ana at ang Ina**, then record. Deliberately say `para` instead of `upang`. With a fixture, announce Demo Mode before presenting results.

“Speech recognition proposes a transcript. The teacher confirms what the learner actually said before our code scores it.”

Show the review field. Preserve the intended spoken difference; correct only recognition mistakes. Confirm. Answer questions wrong, wrong, right for 1/3 comprehension. A live transcript may differ from the fixture; describe actual computed results rather than promising a specific percentage.

### 1:50–2:40 — Understand

Point to Passage Reading Accuracy, Reading Rate, word differences, and Comprehension.

“Most words matched the passage, while only one of three comprehension answers was correct. That suggests comprehension practice under our demo rules. The teacher still interprets the evidence.”

Rate is a number, not a good/bad fluency label. For the prepared primary fixture only: 18/19 matches ≈94.74%; 19 words in 20 seconds =57 WPM.

### 2:40–3:20 — Intervene

Select **Finding the main idea** and save. Explain: read a paragraph, say what it is mostly about, choose the main idea, explain and repeat.

“The app suggests a static activity; the teacher chooses. The thresholds are demonstration rules, not validated reading benchmarks.”

### 3:20–3:50 — Compare

“This labeled seeded follow-up illustrates the comparison screen: comprehension changes from one of three to three of three. In real use, the teacher would conduct another assessment. An observed change alone does not prove the activity caused it.”

Compare the same learner, language and passage. Same-passage practice can affect results. Do not imply an activity happened during judging or that the seeded follow-up is a live reassessment.

### 3:50–4:00 — Close

“Assess, understand, intervene, reassess. The teacher keeps the decision.”

## Backup

If speech fails, show the error and explicitly choose Demo Mode. Say: “We are using a prepared transcript matched to this passage; the same scoring engine runs after teacher confirmation.” If recording cannot start, use the labeled stored demo baseline and linked seeded follow-up. Do not claim live model processing.

Avoid diagnosis claims, WPM good/bad labels, claims of proven intervention effectiveness, invented scores, or claims that audio is never handled. Say: “Audio is processed temporarily and is not retained in the database after transcription.”
