-- Phil-IRI graded passages run through Grade 6. The first schema only
-- allowed Grades 1–3 because the hackathon started with Ana.

alter table public.learners drop constraint learners_grade_level_range;
alter table public.learners
  add constraint learners_grade_level_range check (grade_level between 1 and 6);

alter table public.passages drop constraint passages_grade_level_range;
alter table public.passages
  add constraint passages_grade_level_range check (grade_level between 1 and 6);
