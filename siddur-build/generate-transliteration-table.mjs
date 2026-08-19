// Usage: node generate-transliteration-table.mjs
//
// Regenerates data/siddur/appendix/transliteration.json -- the reference
// table on the siddur's Appendix > Transliteration page -- directly from
// the live sephardicSchema (schema.mjs), resolved through the same SBL
// default-merging that transliterate() itself uses internally (see
// transliterate.js: `new SBL(schema ?? {})`). Nothing here is hand-typed:
// if schema.mjs ever changes, re-running this script is enough to bring
// the reference page back in sync -- there is no second copy of the
// mapping to remember to update.
//
// Run from the siddur-build directory: `node generate-transliteration-table.mjs`

import { writeFileSync } from "node:fs";
import { SBL } from "hebrew-transliteration";
import { sephardicSchema } from "./schema.mjs";

const resolved = new SBL(sephardicSchema);

// [hebrew, name, hard-form key, soft/rafe-form key]
const BEGEDKEFET = [
  ["ב", "Bet", "BET_DAGESH", "BET"],
  ["ג", "Gimel", "GIMEL_DAGESH", "GIMEL"],
  ["ד", "Dalet", "DALET_DAGESH", "DALET"],
  ["כ", "Kaf", "KAF_DAGESH", "KAF"],
  ["פ", "Pe", "PE_DAGESH", "PE"],
  ["ת", "Tav", "TAV_DAGESH", "TAV"],
];

// [hebrew, name, key]
const OTHER_CONSONANTS = [
  ["א", "Alef", "ALEF"],
  ["ה", "He", "HE"],
  ["ו", "Vav", "VAV"],
  ["ז", "Zayin", "ZAYIN"],
  ["ח", "Het", "HET"],
  ["ט", "Tet", "TET"],
  ["י", "Yod", "YOD"],
  ["ל", "Lamed", "LAMED"],
  ["מ", "Mem", "MEM"],
  ["נ", "Nun", "NUN"],
  ["ס", "Samekh", "SAMEKH"],
  ["ע", "Ayin", "AYIN"],
  ["צ", "Tsadi", "TSADI"],
  ["ק", "Qof", "QOF"],
  ["ר", "Resh", "RESH"],
  ["שׁ", "Shin", "SHIN"],
  ["שׂ", "Sin", "SIN"],
];

const FINAL_FORMS = [
  ["ך", "Final Kaf", "FINAL_KAF"],
  ["ם", "Final Mem", "FINAL_MEM"],
  ["ן", "Final Nun", "FINAL_NUN"],
  ["ף", "Final Pe", "FINAL_PE"],
  ["ץ", "Final Tsadi", "FINAL_TSADI"],
];

const VOWELS = [
  ["ְ", "Sheva (vocal)", "VOCAL_SHEVA"],
  ["ֱ", "Hataf Segol", "HATAF_SEGOL"],
  ["ֲ", "Hataf Patah", "HATAF_PATAH"],
  ["ֳ", "Hataf Qamats", "HATAF_QAMATS"],
  ["ִ", "Hiriq", "HIRIQ"],
  ["ִי", "Hiriq + Yod", "HIRIQ_YOD"],
  ["ֵ", "Tsere", "TSERE"],
  ["ֵי", "Tsere + Yod", "TSERE_YOD"],
  ["ֶ", "Segol", "SEGOL"],
  ["ֶי", "Segol + Yod", "SEGOL_YOD"],
  ["ַ", "Patah", "PATAH"],
  ["ָ", "Qamats", "QAMATS"],
  ["ָה", "Qamats + He (word-final)", "QAMATS_HE"],
  ["ֹ", "Holam", "HOLAM"],
  ["ֹ", "Holam Haser (no vav)", "HOLAM_HASER"],
  ["וֹ", "Holam + Vav", "HOLAM_VAV"],
  ["ֻ", "Qubuts", "QUBUTS"],
  ["וּ", "Shureq", "SHUREQ"],
  ["ָיו", "Qamats + Yod + Vav (3ms suffix)", "MS_SUFX"],
];

// Hand-curated notes on the "unusual" consonant sounds -- the ones that
// aren't obvious to an English speaker from the transliteration symbol
// alone. Not derived from schema.mjs (these are phonetic descriptions, not
// character mappings), but kept here rather than hand-edited into the JSON
// so they survive regeneration. Ordered alef-bet.
// [hebrew, name, symbol, description]
const PRONUNCIATION = [
  ["א", "Alef", "ʾ", "A glottal stop — the light catch in the throat before “uh-oh,” often barely audible mid-word."],
  ["ג", "Gimel (rafe)", "gh", "Arabic غ (ghayn) — no English equivalent, a voiced gargle from the back of the throat."],
  ["ד", "Dalet (rafe)", "dh", "The “th” in this (voiced)."],
  ["ו", "Vav", "w", "The “w” in water."],
  ["ח", "Het", "ḥ", "Arabic ح (ḥa) — the sound of fogging up your glasses."],
  ["ט", "Tet", "ṭ", "Arabic ط (ṭa) — a “t” with the tongue tensed and pulled back."],
  ["כ", "Kaf (rafe)", "kh", "Arabic خ (kha) — like the German “Bach.”"],
  ["ע", "Ayin", "ʿ", "Arabic ع (ʿayn) — the voiced counterpart to ḥ, a tightening in the throat."],
  ["צ", "Tsadi", "ṣ", "Arabic ص (ṣad) — a tensed “s,” tongue pulled back."],
  ["ק", "Qof", "q", "Arabic ق (qaf) — a voiceless uvular stop, like a deep [k] made further back in the throat."],
  ["ר", "Resh", "r", "trilled r; similar to Spanish."],
  ["ת", "Tav (rafe)", "th", "The “th” in think (voiceless)."],
];

const data = {
  title: "Transliteration",
  tables: [
    {
      id: "begedkefet",
      title: "Begedkefet Letters (dagesh vs. rafe)",
      headers: ["Letter", "Name", "With Dagesh", "Without Dagesh (Rafe)"],
      hebrewColumn: true,
      rows: BEGEDKEFET.map(([hebrew, name, hardKey, softKey]) => [
        hebrew,
        name,
        resolved[hardKey] ?? "",
        resolved[softKey] ?? "",
      ]),
    },
    {
      id: "other-consonants",
      title: "Other Consonants",
      headers: ["Letter", "Name", "Transliteration"],
      hebrewColumn: true,
      rows: OTHER_CONSONANTS.map(([hebrew, name, key]) => [hebrew, name, resolved[key] ?? ""]),
    },
    {
      id: "finals",
      title: "Final Letter Forms",
      headers: ["Letter", "Name", "Transliteration"],
      hebrewColumn: true,
      rows: FINAL_FORMS.map(([hebrew, name, key]) => [hebrew, name, resolved[key] ?? ""]),
    },
    {
      id: "vowels",
      title: "Vowels",
      headers: ["Niqqud", "Name", "Transliteration"],
      hebrewColumn: true,
      rows: VOWELS.map(([hebrew, name, key]) => [hebrew, name, resolved[key] ?? ""]),
    },
  ],
  note:
    "The Divine Name (י״י / יְיָ) is a special case handled outside this schema -- it always renders as “Adhonay”, regardless of its vocalization in the source text. See normalize-divine-name.mjs.",
  pronunciation: PRONUNCIATION.map(([hebrew, name, symbol, description]) => ({
    hebrew,
    name,
    symbol,
    description,
  })),
};

const path = "../data/siddur/appendix/transliteration.json";
writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote transliteration table to ${path}`);
