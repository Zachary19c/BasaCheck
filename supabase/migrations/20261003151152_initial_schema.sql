-- BasaCheck 12-hour MVP schema.
-- Teachers own learners and assessments. Passages are seeded and read-only.
-- correct_index is not granted to browser roles.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

create table public.learners (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  grade_level smallint not null,
  created_at timestamptz not null default now(),
  constraint learners_display_name_present check (char_length(btrim(display_name)) > 0),
  constraint learners_grade_level_range check (grade_level between 1 and 3)
);

create table public.passages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  language text not null,
  grade_level smallint not null,
  difficulty text not null,
  word_count integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint passages_language_check check (language in ('fil', 'en')),
  constraint passages_grade_level_range check (grade_level between 1 and 3),
  constraint passages_title_present check (char_length(btrim(title)) > 0),
  constraint passages_content_present check (char_length(btrim(content)) > 0),
  constraint passages_difficulty_present check (char_length(btrim(difficulty)) > 0),
  constraint passages_word_count_positive check (word_count > 0)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references public.passages (id) on delete cascade,
  position smallint not null,
  prompt text not null,
  choices jsonb not null,
  correct_index smallint not null,
  constraint questions_position_range check (position between 1 and 3),
  constraint questions_passage_position_unique unique (passage_id, position),
  constraint questions_prompt_present check (char_length(btrim(prompt)) > 0),
  constraint questions_correct_index_range check (correct_index between 0 and 2),
  constraint questions_choices_shape check (
    jsonb_typeof(choices) = 'array'
    and jsonb_array_length(choices) = 3
    and jsonb_typeof(choices -> 0) = 'string'
    and jsonb_typeof(choices -> 1) = 'string'
    and jsonb_typeof(choices -> 2) = 'string'
  )
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners (id) on delete cascade,
  passage_id uuid not null references public.passages (id),
  language text not null,
  status text not null default 'recording',
  duration_seconds numeric,
  transcript text,
  verified_transcript text,
  transcript_verified_at timestamptz,
  demo_transcript boolean not null default false,
  seeded_demo boolean not null default false,
  answer_indexes jsonb,
  accuracy_percent numeric,
  wpm numeric,
  comprehension_percent numeric,
  word_events jsonb not null default '[]'::jsonb,
  support_area text,
  intervention_id text,
  baseline_assessment_id uuid references public.assessments (id),
  error_code text,
  created_at timestamptz not null default now(),
  constraint assessments_language_check check (language in ('fil', 'en')),
  constraint assessments_status_check check (
    status in ('recording', 'processing', 'review', 'complete', 'error')
  ),
  constraint assessments_support_area_check check (
    support_area is null or support_area in ('accuracy', 'comprehension')
  ),
  constraint assessments_intervention_check check (
    intervention_id is null
    or intervention_id in ('main-idea', 'word-practice', 'repeated-reading')
  ),
  constraint assessments_duration_positive check (
    duration_seconds is null or duration_seconds > 0
  ),
  constraint assessments_accuracy_range check (
    accuracy_percent is null or (accuracy_percent >= 0 and accuracy_percent <= 100)
  ),
  constraint assessments_wpm_nonnegative check (wpm is null or wpm >= 0),
  constraint assessments_comprehension_range check (
    comprehension_percent is null
    or (comprehension_percent >= 0 and comprehension_percent <= 100)
  ),
  constraint assessments_word_events_array check (jsonb_typeof(word_events) = 'array'),
  constraint assessments_answer_indexes_shape check (
    answer_indexes is null
    or (
      jsonb_typeof(answer_indexes) = 'array'
      and jsonb_array_length(answer_indexes) = 3
      and (answer_indexes ->> 0) ~ '^[0-2]$'
      and (answer_indexes ->> 1) ~ '^[0-2]$'
      and (answer_indexes ->> 2) ~ '^[0-2]$'
    )
  ),
  constraint assessments_baseline_not_self check (
    baseline_assessment_id is null or baseline_assessment_id <> id
  ),
  constraint assessments_reading_fields_together check (
    (
      verified_transcript is null
      and transcript_verified_at is null
      and accuracy_percent is null
      and wpm is null
      and word_events = '[]'::jsonb
    )
    or (
      verified_transcript is not null
      and transcript_verified_at is not null
      and accuracy_percent is not null
      and wpm is not null
    )
  ),
  constraint assessments_error_has_no_scores check (
    status <> 'error'
    or (
      accuracy_percent is null
      and wpm is null
      and comprehension_percent is null
      and support_area is null
    )
  ),
  constraint assessments_complete_has_scores check (
    status <> 'complete'
    or (
      verified_transcript is not null
      and accuracy_percent is not null
      and wpm is not null
      and comprehension_percent is not null
      and answer_indexes is not null
    )
  ),
  constraint assessments_answers_only_when_complete check (
    answer_indexes is null or status = 'complete'
  ),
  constraint assessments_comprehension_only_when_complete check (
    comprehension_percent is null or status = 'complete'
  ),
  constraint assessments_support_only_when_complete check (
    support_area is null or status = 'complete'
  ),
  constraint assessments_intervention_only_when_complete check (
    intervention_id is null or status = 'complete'
  )
);

create index learners_teacher_id_idx on public.learners (teacher_id);

create index passages_language_active_idx
  on public.passages (language)
  where is_active;

create index questions_passage_id_idx on public.questions (passage_id);

create index assessments_learner_created_idx
  on public.assessments (learner_id, created_at desc);

create index assessments_baseline_idx
  on public.assessments (baseline_assessment_id);

comment on table public.questions is
  'Answer keys stay in correct_index. Browser roles can read the other columns only.';

comment on column public.questions.correct_index is
  'Server-only. Not granted to anon or authenticated.';

comment on column public.assessments.baseline_assessment_id is
  'Explicit follow-up link. Null on a first check. Must match learner, language, and passage.';

comment on column public.assessments.seeded_demo is
  'True for illustrative seed rows. The app labels these as seeded demo assessments.';

-- Same learner, language, and passage for an explicit follow-up link.
create or replace function private.enforce_assessment_consistency()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  passage_language text;
  passage_active boolean;
begin
  select p.language, p.is_active
    into passage_language, passage_active
  from public.passages as p
  where p.id = new.passage_id;

  if passage_language is null then
    raise exception 'passage not found or not visible';
  end if;

  if not passage_active then
    raise exception 'passage is not active';
  end if;

  if new.language is distinct from passage_language then
    raise exception 'assessment language must match the passage language';
  end if;

  if new.baseline_assessment_id is not null then
    if not exists (
      select 1
      from public.assessments as baseline
      where baseline.id = new.baseline_assessment_id
        and baseline.id <> new.id
        and baseline.learner_id = new.learner_id
        and baseline.language = new.language
        and baseline.passage_id = new.passage_id
        and baseline.baseline_assessment_id is null
    ) then
      raise exception 'follow-up must use the same learner, language, and passage as its baseline';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_assessment_consistency() from public;
grant execute on function private.enforce_assessment_consistency() to authenticated, service_role;

create trigger assessments_enforce_consistency
  before insert or update on public.assessments
  for each row
  execute function private.enforce_assessment_consistency();

create view public.passage_questions
with (security_invoker = true) as
select
  id,
  passage_id,
  position,
  prompt,
  choices
from public.questions;

comment on view public.passage_questions is
  'Client read model for comprehension prompts. Excludes correct_index.';

alter table public.learners enable row level security;
alter table public.passages enable row level security;
alter table public.questions enable row level security;
alter table public.assessments enable row level security;

alter table public.learners force row level security;
alter table public.passages force row level security;
alter table public.questions force row level security;
alter table public.assessments force row level security;

create policy learners_select_own
  on public.learners
  for select
  to authenticated
  using (teacher_id = (select auth.uid()));

create policy learners_insert_own
  on public.learners
  for insert
  to authenticated
  with check (teacher_id = (select auth.uid()));

create policy learners_update_own
  on public.learners
  for update
  to authenticated
  using (teacher_id = (select auth.uid()))
  with check (teacher_id = (select auth.uid()));

create policy learners_delete_own
  on public.learners
  for delete
  to authenticated
  using (teacher_id = (select auth.uid()));

create policy passages_select_active
  on public.passages
  for select
  to authenticated
  using (is_active and (select auth.uid()) is not null);

create policy questions_select_active
  on public.questions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.passages
      where passages.id = questions.passage_id
        and passages.is_active
    )
  );

create policy assessments_select_own
  on public.assessments
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.learners
      where learners.id = assessments.learner_id
        and learners.teacher_id = (select auth.uid())
    )
  );

create policy assessments_insert_own
  on public.assessments
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.learners
      where learners.id = assessments.learner_id
        and learners.teacher_id = (select auth.uid())
    )
  );

create policy assessments_update_own
  on public.assessments
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.learners
      where learners.id = assessments.learner_id
        and learners.teacher_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.learners
      where learners.id = assessments.learner_id
        and learners.teacher_id = (select auth.uid())
    )
  );

create policy assessments_delete_own
  on public.assessments
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.learners
      where learners.id = assessments.learner_id
        and learners.teacher_id = (select auth.uid())
    )
  );

revoke all on table public.learners from anon, authenticated;
revoke all on table public.passages from anon, authenticated;
revoke all on table public.questions from anon, authenticated;
revoke all on table public.assessments from anon, authenticated;
revoke all on table public.passage_questions from anon, authenticated;

grant select, insert, update, delete on table public.learners to authenticated;
grant select on table public.passages to authenticated;
grant select (id, passage_id, position, prompt, choices) on table public.questions to authenticated;
grant select, insert, update, delete on table public.assessments to authenticated;
grant select on table public.passage_questions to authenticated;

grant all on table public.learners to service_role;
grant all on table public.passages to service_role;
grant all on table public.questions to service_role;
grant all on table public.assessments to service_role;
grant select on table public.passage_questions to service_role;
