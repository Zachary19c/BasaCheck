-- Demo login: teacher@basacheck.local / basacheck-demo
-- Passage IDs are stable so speech fixtures can key off them.
--   fil  Si Ana at ang Ina   10000000-0000-4000-8000-000000000001
--   fil  Si Ben at ang Aso   10000000-0000-4000-8000-000000000002
--   en   Maya and the Seed   10000000-0000-4000-8000-000000000003
--   en   Leo's Red Ball      10000000-0000-4000-8000-000000000004

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'teacher@basacheck.local',
  extensions.crypt('basacheck-demo', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  jsonb_build_object(
    'sub', '11111111-1111-4111-8111-111111111111',
    'email', 'teacher@basacheck.local'
  ),
  'email',
  now(),
  now(),
  now()
)
on conflict (id) do nothing;

with source (
  id,
  title,
  content,
  language,
  grade_level,
  difficulty
) as (
  values
    (
      '10000000-0000-4000-8000-000000000001'::uuid,
      'Si Ana at ang Ina',
      'Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.',
      'fil',
      2,
      'beginner'
    ),
    (
      '10000000-0000-4000-8000-000000000002'::uuid,
      'Si Ben at ang Aso',
      'Si Ben ay may maliit na aso. Tuwing hapon, naglalaro sila sa bakuran. Pagkatapos, binibigyan niya ito ng tubig.',
      'fil',
      2,
      'beginner'
    ),
    (
      '10000000-0000-4000-8000-000000000003'::uuid,
      'Maya and the Seed',
      'Maya planted a seed in a small pot. She gave it water every morning. Soon a green leaf appeared.',
      'en',
      2,
      'beginner'
    ),
    (
      '10000000-0000-4000-8000-000000000004'::uuid,
      'Leo''s Red Ball',
      'Leo found a red ball under his chair. He shared the ball with his sister.',
      'en',
      2,
      'beginner'
    )
)
insert into public.passages (
  id,
  title,
  content,
  language,
  grade_level,
  difficulty,
  word_count,
  is_active
)
select
  id,
  title,
  content,
  language,
  grade_level,
  difficulty,
  (
    select count(*)::integer
    from unnest(
      regexp_split_to_array(
        lower(regexp_replace(content, '[[:punct:]]', '', 'g')),
        '\s+'
      )
    ) as token
    where token <> ''
  ),
  true
from source
on conflict (id) do nothing;

insert into public.questions (id, passage_id, position, prompt, choices, correct_index)
values
  (
    '41000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    1,
    'Sino ang tinulungan ni Ana?',
    '["Ang kanyang guro","Ang kanyang ina","Ang kanyang kaibigan"]'::jsonb,
    1
  ),
  (
    '41000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    2,
    'Saan nagpunta si Ana pagkatapos kumain?',
    '["Sa tindahan","Sa bahay","Sa paaralan"]'::jsonb,
    2
  ),
  (
    '41000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    3,
    'Sino ang kasama ni Ana papuntang paaralan?',
    '["Ang kanyang kaibigan","Ang kanyang ina","Ang kanyang guro"]'::jsonb,
    0
  ),
  (
    '41000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    1,
    'Ano ang alaga ni Ben?',
    '["Isda","Aso","Pusa"]'::jsonb,
    1
  ),
  (
    '41000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    2,
    'Kailan naglalaro si Ben at ang aso?',
    '["Tuwing umaga","Tuwing hapon","Tuwing gabi"]'::jsonb,
    1
  ),
  (
    '41000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    3,
    'Ano ang ibinibigay ni Ben pagkatapos maglaro?',
    '["Pagkain","Laruan","Tubig"]'::jsonb,
    2
  ),
  (
    '41000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000003',
    1,
    'What did Maya plant?',
    '["A tree","A seed","A flower"]'::jsonb,
    1
  ),
  (
    '41000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000003',
    2,
    'When did Maya water it?',
    '["Every morning","Every night","Once a week"]'::jsonb,
    0
  ),
  (
    '41000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000003',
    3,
    'What appeared after she watered it?',
    '["A red fruit","A green leaf","A yellow flower"]'::jsonb,
    1
  ),
  (
    '41000000-0000-4000-8000-000000000010',
    '10000000-0000-4000-8000-000000000004',
    1,
    'What did Leo find?',
    '["A red ball","A blue book","A green hat"]'::jsonb,
    0
  ),
  (
    '41000000-0000-4000-8000-000000000011',
    '10000000-0000-4000-8000-000000000004',
    2,
    'Where did Leo find it?',
    '["In the yard","Under his chair","On the table"]'::jsonb,
    1
  ),
  (
    '41000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000004',
    3,
    'Who did Leo share it with?',
    '["His teacher","His friend","His sister"]'::jsonb,
    2
  )
on conflict (id) do nothing;

insert into public.learners (id, teacher_id, display_name, grade_level)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Ana',
  2
)
on conflict (id) do nothing;

-- Baseline: upang spoken as para. One same-position substitution, 20 seconds.
-- Follow-up: the passage read as written, 18 seconds, comprehension 3/3.
with tokens as (
  select
    'baseline'::text as which,
    token,
    ordinality
  from unnest(
    regexp_split_to_array(
      lower(regexp_replace(
        'Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.',
        '[[:punct:]]',
        '',
        'g'
      )),
      '\s+'
    )
  ) with ordinality as expected (token, ordinality)
  where token <> ''
),
aligned as (
  select
    which,
    ordinality,
    token as expected_token,
    case when token = 'upang' then 'para' else token end as spoken_token
  from tokens
),
scored as (
  select
    100.0 * count(*) filter (where expected_token = spoken_token)
      / count(*) as accuracy_percent,
    count(*) filter (where spoken_token is not null) as spoken_count,
    jsonb_agg(
      jsonb_build_object(
        'type', case
          when expected_token = spoken_token then 'match'
          else 'substitution'
        end,
        'expected', expected_token,
        'spoken', spoken_token
      )
      order by ordinality
    ) as word_events
  from aligned
  group by which
)
insert into public.assessments (
  id,
  learner_id,
  passage_id,
  language,
  status,
  duration_seconds,
  transcript,
  verified_transcript,
  transcript_verified_at,
  demo_transcript,
  seeded_demo,
  answer_indexes,
  accuracy_percent,
  wpm,
  comprehension_percent,
  word_events,
  support_area,
  intervention_id,
  baseline_assessment_id
)
select
  '30000000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222',
  '10000000-0000-4000-8000-000000000001',
  'fil',
  'complete',
  20,
  'Maagang gumising si Ana para tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.',
  'Maagang gumising si Ana para tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.',
  now(),
  true,
  true,
  '[0,0,0]'::jsonb,
  accuracy_percent,
  spoken_count * 60.0 / 20,
  100.0 / 3,
  word_events,
  case
    when (100.0 / 3) < 60 then 'comprehension'
    when accuracy_percent < 90 then 'accuracy'
    else null
  end,
  'main-idea',
  null
from scored
on conflict (id) do nothing;

with tokens as (
  select token, ordinality
  from unnest(
    regexp_split_to_array(
      lower(regexp_replace(
        'Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.',
        '[[:punct:]]',
        '',
        'g'
      )),
      '\s+'
    )
  ) with ordinality as expected (token, ordinality)
  where token <> ''
),
scored as (
  select
    100.0 as accuracy_percent,
    count(*) as spoken_count,
    jsonb_agg(
      jsonb_build_object(
        'type', 'match',
        'expected', token,
        'spoken', token
      )
      order by ordinality
    ) as word_events
  from tokens
)
insert into public.assessments (
  id,
  learner_id,
  passage_id,
  language,
  status,
  duration_seconds,
  transcript,
  verified_transcript,
  transcript_verified_at,
  demo_transcript,
  seeded_demo,
  answer_indexes,
  accuracy_percent,
  wpm,
  comprehension_percent,
  word_events,
  support_area,
  intervention_id,
  baseline_assessment_id
)
select
  '30000000-0000-4000-8000-000000000002',
  '22222222-2222-4222-8222-222222222222',
  '10000000-0000-4000-8000-000000000001',
  'fil',
  'complete',
  18,
  'Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.',
  'Maagang gumising si Ana upang tulungan ang kanyang ina. Pagkatapos kumain, nagpunta siya sa paaralan kasama ang kanyang kaibigan.',
  now(),
  true,
  true,
  '[1,2,0]'::jsonb,
  accuracy_percent,
  spoken_count * 60.0 / 18,
  100,
  word_events,
  case
    when 100 < 60 then 'comprehension'
    when accuracy_percent < 90 then 'accuracy'
    else null
  end,
  null,
  '30000000-0000-4000-8000-000000000001'
from scored
on conflict (id) do nothing;
