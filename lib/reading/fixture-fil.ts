import { PASSAGE_IDS } from "@/lib/content";
import type { ReadingFixture } from "@/lib/types";

// Owner: Member 3. Disclosed Demo Mode transcripts for the Filipino passages,
// keyed by Member 1's published passage IDs (lib/content.ts, supabase/seed.sql).
//
// A fixture stands in for the speech service only. It still goes through
// teacher transcript confirmation, then the same scoreReading() engine. Its
// duration belongs to the fixture; never pair fixture words with a live
// recording's duration. Results must stay labeled as Demo Mode.

export const FIL_PRIMARY_PASSAGE_ID = PASSAGE_IDS.siAnaAtAngIna;
export const FIL_SECOND_PASSAGE_ID = PASSAGE_IDS.siBenAtAngAso;

export const FIL_FIXTURES: Readonly<Record<string, ReadingFixture>> = {
  // Si Ana at ang Ina. Only "upang" is read as "para":
  // 33 tokens, 32/33 matches, 33 tokens in 33 s = 60 WPM.
  [FIL_PRIMARY_PASSAGE_ID]: {
    passageId: FIL_PRIMARY_PASSAGE_ID,
    language: "fil",
    transcript:
      "Maagang gumising si Ana para tulungan ang kanyang ina. Nagluto sila ng almusal. Pagkatapos kumain, naghugas si Ana ng mga plato at pinunasan ang mesa. Niyakap niya ang ina bago pumasok sa paaralan.",
    durationSeconds: 33,
  },
  // Si Ben at ang Aso. Read as written. 35 tokens in 35 s = 60 WPM.
  [FIL_SECOND_PASSAGE_ID]: {
    passageId: FIL_SECOND_PASSAGE_ID,
    language: "fil",
    transcript:
      "May maliit na aso si Ben. Tuwing hapon, naglalaro sila ng bola sa bakuran. Pagkatapos maglaro, binibigyan ni Ben ng malinis na tubig ang aso. Natutulog ito sa tabi niya. Mahal ni Ben ang aso.",
    durationSeconds: 35,
  },
  [PASSAGE_IDS.angPayongNiRosa]: {
    passageId: PASSAGE_IDS.angPayongNiRosa,
    language: "fil",
    transcript:
      "Umuulan nang lumabas si Rosa ng bahay. Nakalimutan niya ang kanyang payong. Sa kanto, nakita niya si Ben na basang-basa. May dala siyang maliit na bag at walang saplot sa ulan. Inabot ni Rosa ang kanyang dyaket. \"Hati tayo,\" sabi niya. Sabay silang naglakad patungo sa paaralan. Nang dumating sila, basa ang sapatos nila, ngunit pareho silang ngumiti. Pinuri sila ng guro dahil nagtulungan sila. Naintindihan ni Rosa na ang maliit na tulong ay malaking bagay sa isang kaibigan.",
    durationSeconds: 79,
  },
  [PASSAGE_IDS.angAklatSaSilidAklatan]: {
    passageId: PASSAGE_IDS.angAklatSaSilidAklatan,
    language: "fil",
    transcript:
      "Tuwing Huwebes, pumupunta si Marco sa silid-aklatan. May isang makapal na aklat tungkol sa mga hayop na gusto niyang hiramin. Isang araw, nakita niyang hawak ito ng isang batang babae. Naisip niyang maghintay. Pagkatapos, ibinalik ng bata ang aklat. \"Gusto mo rin ba ito?\" tanong niya. Tumango si Marco. Umupo sila sa isang mesa at nagbasa nang magkasama. Ipinakita ng bata ang larawan ng agila. Masaya si Marco dahil nagkaroon siya ng kasama sa pagbabasa.",
    durationSeconds: 75,
  },
  [PASSAGE_IDS.angGampaninNgBarangay]: {
    passageId: PASSAGE_IDS.angGampaninNgBarangay,
    language: "fil",
    transcript:
      "Ang barangay ang pinakamaliit na yunit ng pamahalaan sa Pilipinas. Dito unang naririnig ang mga hinaing ng mga mamamayan. Ang punong barangay at ang mga kagawad ang nangunguna sa pagpapanatili ng kaayusan, sa pagtulong kapag may sakuna, at sa pag-aayos ng maliliit na alitan. May tungkulin din ang barangay na magbantay sa kalinisan ng mga daan at estero. Hindi lamang ang mga pinuno ang may gawain. Ang mga residente ay maaaring sumali sa pulong, mag-ulat ng panganib, at tumulong sa paglilinis. Kapag aktibo ang mga tao, mas mabilis na nalulutas ang suliranin sa kanilang lugar. Kaya ang barangay ay hindi lamang isang opisina. Ito ay isang pamayanan na nagkakaisa. Sa pulong ng barangay, maaaring magmungkahi ang kabataan ng proyektong pangkalinisan. Ang boses nila ay bahagi ng desisyon ng pamayanan. Bawat isa ay may pananagutan.",
    durationSeconds: 134,
  },
  [PASSAGE_IDS.angKagubatanNgBayan]: {
    passageId: PASSAGE_IDS.angKagubatanNgBayan,
    language: "fil",
    transcript:
      "Ang kagubatan ay yaman ng bayan. Pinipigilan nito ang mabilis na pagbaha dahil hinahawakan ng mga ugat ang lupa. Nagbibigay din ito ng tahanan sa mga hayop at ng kabuhayan sa mga taong nangangalap ng bunga nang may pahintulot. Kapag pinuputol ang mga puno nang walang planong pagtatanim, naninipis ang lupa at natutuyot ang mga batis. Naaapektuhan ang mga magsasaka sa ibaba ng bundok at ang mga lungsod na umaasa sa tubig mula sa kabundukan. Ang pag-iingat ng kagubatan ay tungkulin ng pamahalaan at ng mga mamamayan. Ang pagtatanim ng puno, ang pag-iwas sa kaingin, at ang paggalang sa batas ay paraan upang manatiling buhay ang likas na yaman para sa susunod na henerasyon. Maaari ring magtanim ang mga paaralan sa bakanteng lote at turuan ang mga bata na huwag sunugin ang burol.",
    durationSeconds: 133,
  },
};
