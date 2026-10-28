// Usage: node generate-transliteration-table.mjs
//
// Regenerates data/siddur/appendix/transliteration.json -- the tables on
// the siddur's Appendix > Pronunciation & Transliteration page -- with the
// "Write" column of every table pulled directly from the live
// sephardicSchema (schema.mjs), resolved through the same SBL
// default-merging that transliterate() itself uses internally (see
// transliterate.js: `new SBL(schema ?? {})`). The symbols are never
// hand-typed: if schema.mjs ever changes, re-running this script is enough
// to bring the reference page back in sync. Letter names, sound
// descriptions, and notes are hand-curated prose, kept here rather than
// hand-edited into the JSON so they survive regeneration.
//
// Run from the siddur-build directory: `node generate-transliteration-table.mjs`

import { writeFileSync } from "node:fs";
import { SBL } from "hebrew-transliteration";
import { sephardicSchema } from "./schema.mjs";

const resolved = new SBL(sephardicSchema);

// Schema keys -> displayed symbol; two keys = dagesh / rafe pair.
const write = (keys) => keys.map((k) => resolved[k] ?? "").join(" / ");

// Letter names are the traditional (Baghdadi school) names -- see the
// "About the Letter Names" note below. Final-form names follow Shabbath 104a.
// [hebrew, name, schema keys, say it like]
const ALPHABET = [
  ["א", "ʾAlef", ["ALEF"], "the catch in your throat in “uh-oh”"],
  ["ב", "Be", ["BET_DAGESH", "BET"], "“b” in <em>boy</em> / “v” in <em>victory</em>"],
  ["ג", "Gimal", ["GIMEL_DAGESH", "GIMEL"], "“g” in <em>go</em> / Arabic غ (ghayn), a voiced gargle from the back of the throat"],
  ["ד", "Dal", ["DALET_DAGESH", "DALET"], "“d” in <em>day</em> / “th” in <em>this</em>"],
  ["ה", "He", ["HE"], "“h” in <em>house</em>"],
  ["ו", "Waw", ["VAV"], "“w” in <em>water</em>"],
  ["ז", "Zan", ["ZAYIN"], "“z” in <em>zoo</em>"],
  ["ח", "Ḥeth", ["HET"], "Arabic ح (ḥāʾ): the breath you use to fog up glasses"],
  ["ט", "Ṭeth", ["TET"], "Arabic ط (ṭāʾ): a “t” with the tongue tensed and pulled back"],
  ["י", "Yod", ["YOD"], "“y” in <em>yes</em>"],
  ["כ", "Kaf", ["KAF_DAGESH", "KAF"], "“k” in <em>kite</em> / Arabic خ (khāʾ), like “ch” in German <em>Bach</em>"],
  ["ך", "Kaf pĕshuṭa", ["FINAL_KAF"], "final form"],
  ["ל", "Lamad", ["LAMED"], "“l” in <em>lamp</em>"],
  ["מ", "Mim pĕthuḥa", ["MEM"], "“m” in <em>mother</em>"],
  ["ם", "Mim sĕthuma", ["FINAL_MEM"], "final form"],
  ["נ", "Nun kĕfufa", ["NUN"], "“n” in <em>nice</em>"],
  ["ן", "Nun pĕshuṭa", ["FINAL_NUN"], "final form"],
  ["ס", "Sĕmmakh", ["SAMEKH"], "“s” in <em>sun</em>"],
  ["ע", "'An", ["AYIN"], "Arabic ع (ʿayn): a voiced tightening deep in the throat"],
  ["פ", "Pe kĕfufa", ["PE_DAGESH", "PE"], "“p” in <em>pot</em> / “f” in <em>fun</em>"],
  ["ף", "Pe pĕshuṭa", ["FINAL_PE"], "final form"],
  ["צ", "Ṣad kĕfufa", ["TSADI"], "Arabic ص (ṣād): a tensed “s”, tongue pulled back"],
  ["ץ", "Ṣad pĕshuṭa", ["FINAL_TSADI"], "final form"],
  ["ק", "Qof", ["QOF"], "Arabic ق (qāf): a “k” made further back in the throat"],
  ["ר", "Rosh", ["RESH"], "a tongue-tip r, tapped or trilled, as in Spanish <em>pero</em> / <em>perro</em>"],
  ["שׁ", "Shin", ["SHIN"], "“sh” in <em>shoe</em>"],
  ["שׂ", "Sin", ["SIN"], "“s” in <em>sun</em>"],
  ["ת", "Ta", ["TAV_DAGESH", "TAV"], "“t” in <em>top</em> / “th” in <em>think</em>"],
];

// Ibn Ezra on Shemoth 3:15 (also Sefer Yeṣira): the five places of articulation.
// [letters, group, schema keys, where]
const GROUPS = [
  ["אחה״ע", "Throat <span lang=\"he\">(אותיות הגרון)</span>", ["ALEF", "HET", "HE", "AYIN"], "the throat"],
  ["גיכ״ק", "Palate <span lang=\"he\">(אותיות החיך)</span>", ["GIMEL_DAGESH", "GIMEL", "YOD", "KAF_DAGESH", "KAF", "QOF"], "back of the tongue against the palate"],
  ["דטלנ״ת", "Tongue <span lang=\"he\">(אותיות הלשון)</span>", ["DALET_DAGESH", "DALET", "TET", "LAMED", "NUN", "TAV_DAGESH", "TAV"], "the tongue tip"],
  ["זסשר״ץ", "Teeth <span lang=\"he\">(אותיות השיניים)</span>", ["ZAYIN", "SAMEKH", "SHIN", "RESH", "TSADI"], "the teeth, with a hissing or whistling sound"],
  ["בומ״ף", "Lips <span lang=\"he\">(אותיות השפה)</span>", ["BET_DAGESH", "BET", "VAV", "MEM", "PE_DAGESH", "PE"], "the lips"],
];

const A = "“a” in <em>father</em>";
const E = "“e” in <em>bed</em>";
const I = "“ee” in <em>see</em>";
const O = "“o” in <em>more</em>";
const U = "“oo” in <em>food</em>";

// [hebrew, name, schema key, say it like]
const VOWELS = [
  ["ַ", "Pataḥ", "PATAH", A],
  ["ָ", "Qamaṣ", "QAMATS", A],
  ["ָה", "Qamaṣ + He (word-final)", "QAMATS_HE", A],
  ["ֵ", "Ṣere", "TSERE", E],
  ["ֵי", "Ṣere + Yod", "TSERE_YOD", E],
  ["ֶ", "Segol", "SEGOL", E],
  ["ֶי", "Segol + Yod", "SEGOL_YOD", E],
  ["ִ", "Ḥireq", "HIRIQ", I],
  ["ִי", "Ḥireq + Yod", "HIRIQ_YOD", I],
  ["ֹ", "Ḥolam", "HOLAM", O],
  ["וֹ", "Ḥolam + Waw", "HOLAM_VAV", O],
  ["ָ", "Qamaṣ qaṭan", "QAMATS_QATAN", O],
  ["ֻ", "Qibbuṣ", "QUBUTS", U],
  ["וּ", "Shureq", "SHUREQ", U],
  ["ְ", "Shĕwa (vocal)", "VOCAL_SHEVA", "a very short “e”"],
  ["ֱ", "Ḥaṭaf Segol", "HATAF_SEGOL", "a very short “e”"],
  ["ֲ", "Ḥaṭaf Pataḥ", "HATAF_PATAH", "a very short “a”"],
  ["ֳ", "Ḥaṭaf Qamaṣ", "HATAF_QAMATS", "a very short “o”"],
  ["ָיו", "Qamaṣ + Yod + Waw (“his”)", "MS_SUFX", "“ow” in <em>how</em>"],
];

const data = {
  title: "Pronunciation & Transliteration",
  tables: [
    {
      id: "alphabet",
      title: "The Alphabet",
      intro:
        "Where a letter has two values, the first is with a dagesh and the second without (rafe). " +
        "Following the Talmud (Shabbath 104a), the ordinary forms of נ פ צ are <em>kĕfufa</em> (bent) and their final forms " +
        "<em>pĕshuṭa</em> (straight); ך follows the same pattern. Open מ is <em>pĕthuḥa</em> and closed ם is <em>sĕthuma</em>.",
      headers: ["Letter", "Name", "Write", "Say it like"],
      hebrewColumn: true,
      rows: ALPHABET.map(([hebrew, name, keys, say]) => [hebrew, name, write(keys), say]),
    },
    {
      id: "groups",
      title: "The Five Groups",
      intro:
        "Tradition sorts the letters by where in the mouth they are made: אחה״ע גיכ״ק דטלנ״ת זסשר״ץ בומ״ף " +
        "(Ibn Ezra on Shemoth 3:15). It is the traditional classification, not modern phonetics, " +
        "but it explains why ח and ע stay throat sounds and why ו belongs with the lips.",
      headers: ["Letters", "Group", "Write", "Where"],
      hebrewColumn: true,
      rows: GROUPS.map(([letters, group, keys, where]) => [letters, group, [...new Set(keys.map((k) => resolved[k]))].join(" "), where]),
    },
    {
      id: "vowels",
      title: "Vowels",
      headers: ["Sign", "Name", "Write", "Say it like"],
      hebrewColumn: true,
      // The library's syllabifier sometimes marks a ḥireq long and writes ī,
      // independent of schema.mjs -- see the "Long i" note below.
      rows: VOWELS.map(([hebrew, name, key, say]) => [hebrew, name, key === "HIRIQ" ? `${resolved[key]} / ī` : resolved[key] ?? "", say]),
    },
  ],
  notes: [
    {
      id: "special-cases",
      title: "Special Cases",
      items: [
        "<strong>Divine Name.</strong> The Divine Name (י״י / יְיָ) always renders as “Adhonay”, whatever its vocalization in the source text.",
        `<strong>Qamaṣ qaṭan</strong> is written ${resolved.QAMATS_QATAN}: כָּל is <em>kol</em>, חָכְמָה is <em>ḥokhma</em>.`,
        "<strong>Doubled letters.</strong> A dagesh that doubles a letter is written as a doubled letter: שַׁבָּת is <em>shabbath</em>.",
        "<strong>Mappiq.</strong> A word-final ה with a mappiq is pronounced and written <em>h</em>: אַרְצָהּ is <em>ʾarṣah</em>. Otherwise final ה is silent.",
        "<strong>Long i.</strong> A ḥireq without a yod is sometimes written <em>ī</em>, where the syllable division treats it as long: שָׁמַיִם is <em>shamayīm</em>, דָּוִד is <em>dawīdh</em>. Say it the same as <em>i</em>.",
        "<strong>Silent shĕwa</strong> is not written: מַלְכּוּת is <em>malkuth</em>.",
      ],
    },
    {
      id: "letter-names",
      title: "About the Letter Names",
      items: [
        "The names follow the list Baghdadi teachers used when teaching children the alphabet, as recorded by Jacob Mansour (<em>The Jewish Baghdadi Dialect</em>, 1991). Where a name looks shorter than the school form (Be, Dal, Zan, 'An, Ṣad, Ta), that is the traditional form; the same shortened pattern is described for Yemenite tradition.",
        "Modern equivalents: ʾAlef = Alef, Be = Bet, Gimal = Gimel, Dal = Dalet, Zan = Zayin, Ḥeth = Het, Ṭeth = Tet, Lamad = Lamed, Mim = Mem, Sĕmmakh = Samekh, 'An = Ayin, Ṣad = Tsadi, Rosh = Resh, Ta = Tav.",
      ],
    },
    {
      id: "pronunciation-notes",
      title: "Notes on Pronunciation",
      items: [
        "<strong>w and th/dh are kept.</strong> Iraqi tradition keeps the classical w for waw and the interdental sounds for rafe dal and rafe ta, which most other communities have lost.",
        "<strong>Throat letters and emphatics.</strong> ḥ and ' are true throat sounds, and ṭ and ṣ are emphatic, as in Arabic. Ibn Ezra already remarks that ח and ע are “very heavy”, and that someone who did not grow up saying them cannot pronounce them as Arabic speakers do.",
        "<strong>Qof.</strong> q is a deep stop at the back of the throat, distinct from k.",
        "<strong>Rosh.</strong> r is made with the tip of the tongue, tapped or trilled, never the French- or Israeli-style r in the back of the throat. That keeps it with the other tongue-and-teeth letters of its group, and apart from gh (rafe gimal), which is the back-of-the-throat sound.",
      ],
    },
  ],
};

const path = "../data/siddur/appendix/transliteration.json";
writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote transliteration table to ${path}`);
