-- Update existing passages to the grade 2 and 6 word ranges.
-- Grade 4 passages already meet the 67-88 word range.
with revised (id, content) as (
  values
  ('10000000-0000-4000-8000-000000000011'::uuid, 'Rain does not appear from nothing. The sun heats water in rivers, lakes, and the sea. Some of that water becomes vapor, which is water in the form of a gas. The vapor rises and cools high in the air. Tiny drops then gather into clouds. When the drops become heavy, they fall as rain. The rain flows back to streams and the sea, and the cycle begins again. This movement is called the water cycle. It matters because plants, animals, and people all need fresh water. If people throw waste into a river, that waste can travel with the water. Keeping rivers clean helps the water we drink and the rain that falls on our fields. Cities also store rain in dams so homes have water during a dry month. Everyone benefits from this cycle.'),
  ('10000000-0000-4000-8000-000000000012'::uuid, 'The moon does not make its own light. We see it because sunlight bounces off its surface. As the moon travels around Earth, we see different parts of its lit side. That is why the moon can look like a thin curve, a half circle, or a full bright disk. These views are called phases. A full moon is not larger than a crescent moon. We simply see more of the side that the sun is lighting. The moon''s shape in the sky is a clue to where it is on its path around Earth. Scientists use that path to predict the tides and to plan night observations. You can draw the moon each night for a month. The drawings show a pattern that repeats about every twenty-nine days. Record the date beside each drawing.'),
  ('10000000-0000-4000-8000-000000000001'::uuid, 'Maagang gumising si Ana upang tulungan ang kanyang ina. Nagluto sila ng almusal. Pagkatapos kumain, naghugas si Ana ng mga plato at pinunasan ang mesa. Niyakap niya ang ina bago pumasok sa paaralan.'),
  ('10000000-0000-4000-8000-000000000002'::uuid, 'May maliit na aso si Ben. Tuwing hapon, naglalaro sila ng bola sa bakuran. Pagkatapos maglaro, binibigyan ni Ben ng malinis na tubig ang aso. Natutulog ito sa tabi niya. Mahal ni Ben ang aso.'),
  ('10000000-0000-4000-8000-000000000004'::uuid, 'Leo found a red ball under his chair. He looked around the room. His sister had no toy. Leo shared the ball with his sister. They played with it in the sunny yard.'),
  ('10000000-0000-4000-8000-000000000009'::uuid, 'Ang barangay ang pinakamaliit na yunit ng pamahalaan sa Pilipinas. Dito unang naririnig ang mga hinaing ng mga mamamayan. Ang punong barangay at ang mga kagawad ang nangunguna sa pagpapanatili ng kaayusan, sa pagtulong kapag may sakuna, at sa pag-aayos ng maliliit na alitan. May tungkulin din ang barangay na magbantay sa kalinisan ng mga daan at estero. Hindi lamang ang mga pinuno ang may gawain. Ang mga residente ay maaaring sumali sa pulong, mag-ulat ng panganib, at tumulong sa paglilinis. Kapag aktibo ang mga tao, mas mabilis na nalulutas ang suliranin sa kanilang lugar. Kaya ang barangay ay hindi lamang isang opisina. Ito ay isang pamayanan na nagkakaisa. Sa pulong ng barangay, maaaring magmungkahi ang kabataan ng proyektong pangkalinisan. Ang boses nila ay bahagi ng desisyon ng pamayanan. Bawat isa ay may pananagutan.')
)
update public.passages as passage
set content = revised.content,
    word_count = (
      select count(*)::integer
      from unnest(
        regexp_split_to_array(
          lower(regexp_replace(revised.content, '[[:punct:]]', '', 'g')),
          '\s+'
        )
      ) as token
      where token <> ''
    )
from revised
where passage.id = revised.id;
