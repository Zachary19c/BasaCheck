-- Short, teacher-facing learner codes. UUIDs remain stable internal keys so
-- existing assessments and links do not need to be rewritten.
create sequence if not exists public.learner_code_seq start with 4;

alter table public.learners
  add column if not exists learner_code text;

alter table public.learners
  alter column learner_code set default 'L' || nextval('public.learner_code_seq')::text;

update public.learners
set learner_code = case id
  when '22222222-2222-4222-8222-222222222222'::uuid then 'L1'
  when '33333333-3333-4333-8333-333333333333'::uuid then 'L2'
  when '44444444-4444-4444-8444-444444444444'::uuid then 'L3'
end
where id in (
  '22222222-2222-4222-8222-222222222222'::uuid,
  '33333333-3333-4333-8333-333333333333'::uuid,
  '44444444-4444-4444-8444-444444444444'::uuid
);

update public.learners
set learner_code = 'L' || nextval('public.learner_code_seq')::text
where learner_code is null;

alter table public.learners
  alter column learner_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'learners_learner_code_unique'
      and conrelid = 'public.learners'::regclass
  ) then
    alter table public.learners
      add constraint learners_learner_code_unique unique (learner_code);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'learners_learner_code_format'
      and conrelid = 'public.learners'::regclass
  ) then
    alter table public.learners
      add constraint learners_learner_code_format check (learner_code ~ '^L[1-9][0-9]*$');
  end if;
end
$$;

alter sequence public.learner_code_seq owned by public.learners.learner_code;
revoke all on sequence public.learner_code_seq from public, anon, authenticated;
grant usage on sequence public.learner_code_seq to service_role;

comment on column public.learners.learner_code is
  'Short teacher-facing code; the UUID id remains the internal relationship key.';
