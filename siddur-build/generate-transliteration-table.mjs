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
    "The Divine Name (י״י / יְיָ) is a special case handled outside this schema -- it always renders as “Adonay”, regardless of its vocalization in the source text. See normalize-divine-name.mjs.",
};

const path = "../data/siddur/appendix/transliteration.json";
writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote transliteration table to ${path}`);
