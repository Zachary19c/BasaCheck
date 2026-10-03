-- No login. Ana is seeded directly; there is no teacher account.
-- Passage IDs are stable so speech fixtures can key off them.
--   fil  Si Ana at ang Ina   10000000-0000-4000-8000-000000000001
--   fil  Si Ben at ang Aso   10000000-0000-4000-8000-000000000002
--   en   Maya and the Seed   10000000-0000-4000-8000-000000000003
--   en   Leo's Red Ball      10000000-0000-4000-8000-000000000004
--   fil  Grade 4 Ang Payong ni Rosa            ...000005
--   fil  Grade 4 Ang Aklat sa Silid-Aklatan    ...000006
--   en   Grade 4 Liza and the Morning Bell     ...000007
--   en   Grade 4 The Class Garden              ...000008
--   fil  Grade 6 Ang Gampanin ng Barangay      ...000009
--   fil  Grade 6 Ang Kagubatan ng Bayan        ...000010
--   en   Grade 6 How Rain Returns              ...000011
--   en   Grade 6 Why the Moon Changes Shape    ...000012

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
      'Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.',
      'fil',
      2,
      'narrative'
    ),
    (
      '10000000-0000-4000-8000-000000000002'::uuid,
      'Si Ben at ang Aso',
      'Si Ben ay may maliit na aso. Tuwing hapon, naglalaro sila sa bakuran. Tumakbo ang aso at hinabol ang bola. Tumawa si Ben habang tumatakbo. Pagkatapos maglaro, binigyan ni Ben ang aso ng malinis na tubig. Natulog ang aso sa tabi ni Ben. Mahal na mahal ni Ben ang kanyang aso.',
      'fil',
      2,
      'narrative'
    ),
    (
      '10000000-0000-4000-8000-000000000003'::uuid,
      'Maya and the Seed',
      'Maya planted a seed in a small pot. She put the pot by the window. She gave it water every morning. Soon a green leaf appeared. Maya smiled at her little plant.',
      'en',
      2,
      'narrative'
    ),
    (
      '10000000-0000-4000-8000-000000000004'::uuid,
      'Leo''s Red Ball',
      'Leo found a red ball under his chair. He looked around the room. His sister had no toy. Leo shared the ball with his sister. They played in the yard.',
      'en',
      2,
      'narrative'
    ),
    (
      '10000000-0000-4000-8000-000000000005'::uuid,
      'Ang Payong ni Rosa',
      'Umuulan nang lumabas si Rosa ng bahay. Nakalimutan niya ang kanyang payong. Sa kanto, nakita niya si Ben na basang-basa. May dala siyang maliit na bag at walang saplot sa ulan. Inabot ni Rosa ang kanyang dyaket. "Hati tayo," sabi niya. Sabay silang naglakad patungo sa paaralan. Nang dumating sila, basa ang sapatos nila, ngunit pareho silang ngumiti. Pinuri sila ng guro dahil nagtulungan sila. Naintindihan ni Rosa na ang maliit na tulong ay malaking bagay sa isang kaibigan.',
      'fil',
      4,
      'narrative'
    ),
    (
      '10000000-0000-4000-8000-000000000006'::uuid,
      'Ang Aklat sa Silid-Aklatan',
      'Tuwing Huwebes, pumupunta si Marco sa silid-aklatan. May isang makapal na aklat tungkol sa mga hayop na gusto niyang hiramin. Isang araw, nakita niyang hawak ito ng isang batang babae. Naisip niyang maghintay. Pagkatapos, ibinalik ng bata ang aklat. "Gusto mo rin ba ito?" tanong niya. Tumango si Marco. Umupo sila sa isang mesa at nagbasa nang magkasama. Ipinakita ng bata ang larawan ng agila. Masaya si Marco dahil nagkaroon siya ng kasama sa pagbabasa.',
      'fil',
      4,
      'narrative'
    ),
    (
      '10000000-0000-4000-8000-000000000007'::uuid,
      'Liza and the Morning Bell',
      'Liza woke up late on Monday. She washed her face and put on her uniform. Her father waited at the gate with her lunch. "The jeep is almost full," he said. They rode through the busy street. At school, the bell was already ringing. Liza hurried to her classroom. Her teacher smiled and pointed to a chair. Liza sat down and opened her notebook. She was late, but she was ready to learn.',
      'en',
      4,
      'narrative'
    ),
    (
      '10000000-0000-4000-8000-000000000008'::uuid,
      'The Class Garden',
      'The class planted pechay in a wooden box. Every morning, Paolo checked the soil. If it felt dry, he poured water from a small can. After two weeks, green leaves pushed out of the ground. One hot day, the leaves began to droop. Paolo moved the box under a tree. The next morning, the plants stood up again. The class learned that plants need water, light, and care. On Friday, they shared the first leaves with the canteen.',
      'en',
      4,
      'narrative'
    ),
    (
      '10000000-0000-4000-8000-000000000009'::uuid,
      'Ang Gampanin ng Barangay',
      'Ang barangay ang pinakamaliit na yunit ng pamahalaan sa Pilipinas. Dito unang naririnig ang mga hinaing ng mga mamamayan. Ang punong barangay at ang mga kagawad ang nangunguna sa pagpapanatili ng kaayusan, sa pagtulong kapag may sakuna, at sa pag-aayos ng maliliit na alitan. May tungkulin din ang barangay na magbantay sa kalinisan ng mga daan at estero. Hindi lamang ang mga pinuno ang may gawain. Ang mga residente ay maaaring sumali sa pulong, mag-ulat ng panganib, at tumulong sa paglilinis. Kapag aktibo ang mga tao, mas mabilis na nalulutas ang suliranin sa kanilang lugar. Kaya ang barangay ay hindi lamang isang opisina. Ito ay isang pamayanan na nagkakaisa. Sa pulong ng barangay, maaaring magmungkahi ang kabataan ng proyektong pangkalinisan. Ang boses nila ay bahagi ng desisyon ng pamayanan.',
      'fil',
      6,
      'expository'
    ),
    (
      '10000000-0000-4000-8000-000000000010'::uuid,
      'Ang Kagubatan ng Bayan',
      'Ang kagubatan ay yaman ng bayan. Pinipigilan nito ang mabilis na pagbaha dahil hinahawakan ng mga ugat ang lupa. Nagbibigay din ito ng tahanan sa mga hayop at ng kabuhayan sa mga taong nangangalap ng bunga nang may pahintulot. Kapag pinuputol ang mga puno nang walang planong pagtatanim, naninipis ang lupa at natutuyot ang mga batis. Naaapektuhan ang mga magsasaka sa ibaba ng bundok at ang mga lungsod na umaasa sa tubig mula sa kabundukan. Ang pag-iingat ng kagubatan ay tungkulin ng pamahalaan at ng mga mamamayan. Ang pagtatanim ng puno, ang pag-iwas sa kaingin, at ang paggalang sa batas ay paraan upang manatiling buhay ang likas na yaman para sa susunod na henerasyon. Maaari ring magtanim ang mga paaralan sa bakanteng lote at turuan ang mga bata na huwag sunugin ang burol.',
      'fil',
      6,
      'expository'
    ),
    (
      '10000000-0000-4000-8000-000000000011'::uuid,
      'How Rain Returns',
      'Rain does not appear from nothing. The sun heats water in rivers, lakes, and the sea. Some of that water becomes vapor, which is water in the form of a gas. The vapor rises and cools high in the air. Tiny drops then gather into clouds. When the drops become heavy, they fall as rain. The rain flows back to streams and the sea, and the cycle begins again. This movement is called the water cycle. It matters because plants, animals, and people all need fresh water. If people throw waste into a river, that waste can travel with the water. Keeping rivers clean helps the water we drink and the rain that falls on our fields. Cities also store rain in dams so homes have water during a dry month.',
      'en',
      6,
      'expository'
    ),
    (
      '10000000-0000-4000-8000-000000000012'::uuid,
      'Why the Moon Changes Shape',
      'The moon does not make its own light. We see it because sunlight bounces off its surface. As the moon travels around Earth, we see different parts of its lit side. That is why the moon can look like a thin curve, a half circle, or a full bright disk. These views are called phases. A full moon is not larger than a crescent moon. We simply see more of the side that the sun is lighting. The moon''s shape in the sky is a clue to where it is on its path around Earth. Scientists use that path to predict the tides and to plan night observations. You can draw the moon each night for a month. The drawings show a pattern that repeats about every twenty-nine days.',
      'en',
      6,
      'expository'
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
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  language = excluded.language,
  grade_level = excluded.grade_level,
  difficulty = excluded.difficulty,
  word_count = excluded.word_count,
  is_active = excluded.is_active;

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
    'Ano ang ipinapakita ng paghuhugas ni Ana ng mga plato?',
    '["Ayaw niya sa bahay","Gutom na gutom siya","Tumutulong siya sa kanyang ina"]'::jsonb,
    2
  ),
  (
    '41000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    3,
    'Kung ikaw si Ana, ano ang mabuting gawin pagkatapos kumain?',
    '["Tulungan ang ina sa bahay","Iwan ang maruruming plato","Umalis nang walang paalam"]'::jsonb,
    0
  ),
  (
    '41000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000002',
    1,
    'Ano ang alaga ni Ben?',
    '["Pusa","Aso","Ibon"]'::jsonb,
    1
  ),
  (
    '41000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    2,
    'Ano ang ipinapakita ng pagbibigay ni Ben ng tubig?',
    '["Galit siya sa aso","Gusto niyang itaboy ito","Inaalagaan niya ang aso"]'::jsonb,
    2
  ),
  (
    '41000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000002',
    3,
    'Ano ang dapat gawin pagkatapos maglaro ang alaga?',
    '["Bigyan ito ng tubig","Iwan ito sa daan","Huwag itong pansinin"]'::jsonb,
    0
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
    'Why did a green leaf appear?',
    '["She gave the seed water","She hid the pot","She forgot the seed"]'::jsonb,
    0
  ),
  (
    '41000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000003',
    3,
    'What should Maya keep doing for the plant?',
    '["Give it water and light","Hide the pot in a box","Stop looking at it"]'::jsonb,
    0
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
    'Why did Leo share the ball?',
    '["His sister had no toy","The ball was broken","He did not like red"]'::jsonb,
    0
  ),
  (
    '41000000-0000-4000-8000-000000000012',
    '10000000-0000-4000-8000-000000000004',
    3,
    'What is a kind thing to do with a toy?',
    '["Hide it from others","Share it and play together","Throw it away"]'::jsonb,
    1
  )
on conflict (id) do update set
  passage_id = excluded.passage_id,
  position = excluded.position,
  prompt = excluded.prompt,
  choices = excluded.choices,
  correct_index = excluded.correct_index;

-- Grade 4 narratives and Grade 6 expositions. Same three Phil-IRI / PISA processes.
insert into public.questions (id, passage_id, position, prompt, choices, correct_index)
values
  ('41000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000005', 1, 'Sino ang nakita ni Rosa na basang-basa?', '["Ang guro","Si Ben","Ang tatay"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000005', 2, 'Ano ang ipinapakita ng pag-abot ni Rosa ng dyaket?', '["Ayaw niyang pumasok","Takot siya sa ulan","Tumutulong siya sa kapwa"]'::jsonb, 2),
  ('41000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000005', 3, 'Ano ang mabuting gawin kapag naulan at may kasamang walang saplot?', '["Hatiin ang panakip sa ulan","Tumakbo nang mag-isa","Itago ang dyaket"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000006', 1, 'Saan pumupunta si Marco tuwing Huwebes?', '["Sa palengke","Sa silid-aklatan","Sa bakuran"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-000000000006', 2, 'Bakit masaya si Marco sa huli?', '["Nagkaroon siya ng kasama sa pagbabasa","Nabili niya ang aklat","Umalis ang batang babae"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000006', 3, 'Ano ang dapat gawin kung ginagamit ng iba ang aklat na gusto mo?', '["Agawin ito","Maghintay at magbasa nang magkasama","Itago ito"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000007', 1, 'Who waited for Liza at the gate?', '["Her teacher","Her father","The jeepney driver"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000007', 2, 'Why did Liza hurry at school?', '["The bell was already ringing","She forgot her notebook","The class was outside"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000007', 3, 'What should a learner do after arriving late?', '["Sit down and get ready to learn","Go back home","Hide from the teacher"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000022', '10000000-0000-4000-8000-000000000008', 1, 'What did the class plant?', '["Rice","Pechay","Corn"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000023', '10000000-0000-4000-8000-000000000008', 2, 'Why did Paolo move the box under a tree?', '["The leaves were drooping in the heat","The canteen asked for leaves","The soil was too wet"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000024', '10000000-0000-4000-8000-000000000008', 3, 'What should the class keep doing for the plants?', '["Give them water, light, and care","Leave them in the hot sun","Stop checking the soil"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000025', '10000000-0000-4000-8000-000000000009', 1, 'Ano ang pinakamaliit na yunit ng pamahalaan sa Pilipinas?', '["Ang lalawigan","Ang barangay","Ang bansa"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000026', '10000000-0000-4000-8000-000000000009', 2, 'Bakit mas mabilis na nalulutas ang suliranin kapag aktibo ang mga tao?', '["Dahil tumutulong sila sa pulong at paglilinis","Dahil wala nang pinuno","Dahil sarado ang opisina"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000027', '10000000-0000-4000-8000-000000000009', 3, 'Ano ang maaaring gawin ng kabataan sa barangay?', '["Manahimik lamang","Magmungkahi ng proyektong pangkalinisan","Umalis sa pulong"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000028', '10000000-0000-4000-8000-000000000010', 1, 'Ano ang hinahawakan ng mga ugat ng puno?', '["Ang lupa","Ang ulap","Ang dagat"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000029', '10000000-0000-4000-8000-000000000010', 2, 'Ano ang maaaring mangyari kung putol nang putol ang puno nang walang tanim?', '["Lalago ang batis","Maninipis ang lupa at matutuyo ang batis","Lalaki ang lungsod"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000030', '10000000-0000-4000-8000-000000000010', 3, 'Ano ang dapat gawin upang manatili ang kagubatan?', '["Magkaingin","Magtanim at huwag sunugin ang burol","Putulin ang lahat ng puno"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000031', '10000000-0000-4000-8000-000000000011', 1, 'What heats the water in rivers, lakes, and the sea?', '["The moon","The wind","The sun"]'::jsonb, 2),
  ('41000000-0000-4000-8000-000000000032', '10000000-0000-4000-8000-000000000011', 2, 'Why do the drops fall as rain?', '["They become heavy","The sun turns off","The river stops"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000033', '10000000-0000-4000-8000-000000000011', 3, 'What should people do to protect the water we drink?', '["Throw waste into the river","Keep rivers clean","Store waste in the sea"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000034', '10000000-0000-4000-8000-000000000012', 1, 'Where does the light we see on the moon come from?', '["The moon makes it","Sunlight bounces off it","Earth shines on it"]'::jsonb, 1),
  ('41000000-0000-4000-8000-000000000035', '10000000-0000-4000-8000-000000000012', 2, 'Why can the moon look like a thin curve or a full disk?', '["We see different parts of its lit side","The moon grows and shrinks","Clouds cut the moon"]'::jsonb, 0),
  ('41000000-0000-4000-8000-000000000036', '10000000-0000-4000-8000-000000000012', 3, 'What is a useful way to study the moon''s pattern?', '["Draw its shape each night","Look only once a year","Cover the window"]'::jsonb, 0)
on conflict (id) do update set
  passage_id = excluded.passage_id,
  position = excluded.position,
  prompt = excluded.prompt,
  choices = excluded.choices,
  correct_index = excluded.correct_index;

insert into public.learners (id, display_name, grade_level)
values
  (
    '22222222-2222-4222-8222-222222222222',
    'Ana',
    2
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Luis',
    4
  ),
  (
    '44444444-4444-4444-8444-444444444444',
    'Elena',
    6
  )
on conflict (id) do update set
  display_name = excluded.display_name,
  grade_level = excluded.grade_level;

-- Baseline: upang spoken as para. One same-position substitution, 60 seconds (60 WPM).
-- Follow-up: the passage read as written, 50 seconds (72 WPM), comprehension 3/3.
with tokens as (
  select
    'baseline'::text as which,
    token,
    ordinality
  from unnest(
    regexp_split_to_array(
      lower(regexp_replace(
        'Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.',
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
  baseline_assessment_id,
  created_at
)
select
  '30000000-0000-4000-8000-000000000001',
  '22222222-2222-4222-8222-222222222222',
  '10000000-0000-4000-8000-000000000001',
  'fil',
  'complete',
  60,
  'Maagang gumising si Ana para tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.',
  'Maagang gumising si Ana para tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.',
  now(),
  true,
  true,
  '[0,0,0]'::jsonb,
  accuracy_percent,
    spoken_count * 60.0 / 60,
  100.0 / 3,
  word_events,
  case
    when (100.0 / 3) < 60 then 'comprehension'
    when accuracy_percent < 90 then 'accuracy'
    else null
  end,
  'main-idea',
  null,
  now() - interval '1 minute'
from scored
on conflict (id) do update set
  duration_seconds = excluded.duration_seconds,
  transcript = excluded.transcript,
  verified_transcript = excluded.verified_transcript,
  accuracy_percent = excluded.accuracy_percent,
  wpm = excluded.wpm,
  word_events = excluded.word_events,
  support_area = excluded.support_area;

with tokens as (
  select token, ordinality
  from unnest(
    regexp_split_to_array(
      lower(regexp_replace(
        'Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.',
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
  baseline_assessment_id,
  created_at
)
select
  '30000000-0000-4000-8000-000000000002',
  '22222222-2222-4222-8222-222222222222',
  '10000000-0000-4000-8000-000000000001',
  'fil',
  'complete',
  50,
  'Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.',
  'Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng kanin at itlog. Pagkatapos kumain, naghugas si Ana ng mga plato. Ipinahid din niya ang mesa. Bago umalis, niyakap niya ang ina. Tapos, nagpunta siya sa paaralan kasama ang kanyang kaibigan. Masaya si Ana dahil nakatulong siya sa bahay. At ngumiti pa si Ana nang maluwag sa ina.',
  now(),
  true,
  true,
  '[1,2,0]'::jsonb,
  accuracy_percent,
    spoken_count * 60.0 / 50,
  100,
  word_events,
  case
    when 100 < 60 then 'comprehension'
    when accuracy_percent < 90 then 'accuracy'
    else null
  end,
  null,
  '30000000-0000-4000-8000-000000000001',
  now()
from scored
on conflict (id) do update set
  duration_seconds = excluded.duration_seconds,
  transcript = excluded.transcript,
  verified_transcript = excluded.verified_transcript,
  accuracy_percent = excluded.accuracy_percent,
  wpm = excluded.wpm,
  word_events = excluded.word_events,
  support_area = excluded.support_area;
