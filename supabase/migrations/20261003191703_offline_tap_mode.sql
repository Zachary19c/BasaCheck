-- Teacher-marked reading checks. No recording is stored.
-- Existing rows stay speech checks, including seeded demo transcripts.

alter table public.assessments
  add column input_mode text not null default 'speech';

alter table public.assessments
  add constraint assessments_input_mode_check
  check (input_mode in ('speech', 'tap'));

comment on column public.assessments.input_mode is
  'speech: microphone or prepared fixture. tap: the teacher marked missed words, with no recording.';
