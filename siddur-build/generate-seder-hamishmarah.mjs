// Usage: node generate-seder-hamishmarah.mjs
//
// Regenerates data/siddur/appendix/seder-hamishmarah.json from
// seder-hamishmarah-source.json (the weekly Torah portion / Nevi'im /
// Ketuvim / Mishnah table transcribed from Wikipedia's "Seder ha-Mishmarah"
// article, English book names and verse ranges kept as-is). The two Hebrew
// proper-noun columns -- parashah names and Mishnah tractate names -- are
// vocalized here and run through the actual sephardicSchema transliterator
// (the same one generate.mjs uses for liturgy), so this table matches the
// site's house style instead of Wikipedia's own (SBL-academic) romanization.
// Hebrew consonantal spelling for both comes from Sefaria's index API
// (heTitle fields); niqqud is added by hand below since Sefaria's index
// titles are unvocalized.

import { readFileSync, writeFileSync } from "node:fs";
import { transliterate } from "hebrew-transliteration";
import { sephardicSchema } from "./schema.mjs";

function translit(hebrew) {
  return transliterate(hebrew, sephardicSchema);
}

// Capitalizes the first Latin letter of each word (leaving any leading
// ʾ/' consonant mark alone), matching how proper names are capitalized
// elsewhere on the page (e.g. the English book names in adjacent columns) --
// transliterate() itself always returns lowercase, since liturgy translit
// is running prose, not a table of proper nouns.
function titleCase(text) {
  return text
    .split(" ")
    .map((word) => word.replace(/\p{L}/u, (c) => c.toUpperCase()))
    .join(" ");
}

// Vocalized parashah names, keyed by the English title used in
// seder-hamishmarah-source.json (which matches Sefaria's `Parasha` alt
// structure titles). Consonants confirmed against Sefaria; niqqud added
// by hand for transliteration purposes only -- this Hebrew is never
// displayed, only fed through translit().
const PARASHAH_HEBREW = {
  "Bereshit": "בְּרֵאשִׁית",
  "Noach": "נֹחַ",
  "Lech Lecha": "לֶךְ לְךָ",
  "Vayera": "וַיֵּרָא",
  "Chayei Sara": "חַיֵּי שָׂרָה",
  "Toldot": "תּוֹלְדֹת",
  "Vayetzei": "וַיֵּצֵא",
  "Vayishlach": "וַיִּשְׁלַח",
  "Vayeshev": "וַיֵּשֶׁב",
  "Miketz": "מִקֵּץ",
  "Vayigash": "וַיִּגַּשׁ",
  "Vayechi": "וַיְחִי",
  "Shemot": "שְׁמוֹת",
  "Vaera": "וָאֵרָא",
  "Bo": "בֹּא",
  "Beshalach": "בְּשַׁלַּח",
  "Yitro": "יִתְרוֹ",
  "Mishpatim": "מִשְׁפָּטִים",
  "Terumah": "תְּרוּמָה",
  "Tetzaveh": "תְּצַוֶּה",
  "Ki Tisa": "כִּי תִשָּׂא",
  "Vayakhel": "וַיַּקְהֵל",
  "Pekudei": "פְקוּדֵי",
  "Vayikra": "וַיִּקְרָא",
  "Tzav": "צַו",
  "Shmini": "שְׁמִינִי",
  "Tazria": "תַזְרִיעַ",
  "Metzora": "מְצֹרָע",
  "Achrei Mot": "אַחֲרֵי מוֹת",
  "Kedoshim": "קְדֹשִׁים",
  "Emor": "אֱמֹר",
  "Behar": "בְּהַר",
  "Bechukotai": "בְּחֻקֹּתַי",
  "Bamidbar": "בְּמִדְבַּר",
  "Nasso": "נָשֹׂא",
  "Beha'alotcha": "בְּהַעֲלוֹתְךָ",
  "Sh'lach": "שְׁלַח",
  "Korach": "קֹרַח",
  "Chukat": "חֻקַּת",
  "Balak": "בָּלָק",
  "Pinchas": "פִּינְחָס",
  "Matot": "מַטּוֹת",
  "Masei": "מַסְעֵי",
  "Devarim": "דְּבָרִים",
  "Vaetchanan": "וָאֶתְחַנַּן",
  "Eikev": "עֵקֶב",
  "Re'eh": "רְאֵה",
  "Shoftim": "שׁוֹפְטִים",
  "Ki Teitzei": "כִּי תֵצֵא",
  "Ki Tavo": "כִּי תָבוֹא",
  "Nitzavim": "נִצָּבִים",
  "Vayeilech": "וַיֵּלֶךְ",
  "Ha'Azinu": "הַאֲזִינוּ",
  "V'Zot HaBerachah": "וְזֹאת הַבְּרָכָה",
};

// Vocalized Mishnah tractate names, keyed by the English name as it
// appears (comma/"and"-joined) in seder-hamishmarah-source.json's
// `mishnah` field. Consonants from Sefaria's Mishnah index (heTitle);
// niqqud added by hand.
const TRACTATE_HEBREW = {
  "Arakhin": "עֲרָכִין",
  "Avodah Zarah": "עֲבוֹדָה זָרָה",
  "Bava Batra": "בָּבָא בַּתְרָא",
  "Bava Kamma": "בָּבָא קַמָּא",
  "Bava Metzia": "בָּבָא מְצִיעָא",
  "Bekhorot": "בְּכוֹרוֹת",
  "Berakhot": "בְּרָכוֹת",
  "Betzah": "בֵּיצָה",
  "Biqqurim": "בִּכּוּרִים",
  "Demai": "דְּמַאי",
  "Eduyot": "עֵדֻיּוֹת",
  "Eruvin": "עֵירוּבִין",
  "Gittin": "גִּטִּין",
  "Horayot": "הוֹרָיוֹת",
  "Kelim": "כֵּלִים",
  "Keritot": "כְּרִיתוֹת",
  "Ketubot": "כְּתוּבּוֹת",
  "Kiddushin": "קִדּוּשִׁין",
  "Kil'ayim": "כִּלְאַיִם",
  "Kinnim": "קִנִּים",
  "Ma'aser Sheni": "מַעֲשֵׂר שֵׁנִי",
  "Ma'aserot": "מַעַשְׂרוֹת",
  "Makhshirin": "מַכְשִׁירִין",
  "Makkot": "מַכּוֹת",
  "Me'ilah": "מְעִילָה",
  "Megillah": "מְגִלָּה",
  "Menaḥot": "מְנָחוֹת",
  "Middot": "מִדּוֹת",
  "Mikva'ot": "מִקְוָאוֹת",
  "Mo'ed Katan": "מוֹעֵד קָטָן",
  "Nazir": "נָזִיר",
  "Nedarim": "נְדָרִים",
  "Nega'im": "נְגָעִים",
  "Niddah": "נִדָּה",
  "Oholot": "אֹהָלוֹת",
  "Orlah": "עׇרְלָה",
  "Parah": "פָּרָה",
  "Pe'ah": "פֵּאָה",
  "Pesaḥim": "פְּסָחִים",
  "Pirke Avot": "פִּרְקֵי אָבוֹת",
  "Rosh Hashanah": "רֹאשׁ הַשָּׁנָה",
  "Sanhedrin": "סַנְהֶדְרִין",
  "Shabbat": "שַׁבָּת",
  "Sheqalim": "שְׁקָלִים",
  "Shevi'it": "שְׁבִיעִית",
  "Shevu'ot": "שְׁבוּעוֹת",
  "Sotah": "סוֹטָה",
  "Sukkah": "סֻכָּה",
  "Ta'anit": "תַּעֲנִית",
  "Tamid": "תָּמִיד",
  "Temurah": "תְּמוּרָה",
  "Terumot": "תְּרוּמוֹת",
  "Tevul Yom": "טְבוּל יוֹם",
  "Tohorot": "טָהֳרוֹת",
  "Yadayim": "יָדַיִם",
  "Yevamot": "יְבָמוֹת",
  "Yoma": "יוֹמָא",
  "Zavim": "זָבִים",
  "Zevaḥim": "זְבָחִים",
  "ʿUqṣim": "עֻקְצִין",
  "Ḥagigah": "חֲגִיגָה",
  "Ḥallah": "חַלָּה",
  "Ḥullin": "חֻלִּין",
};

function translitParashah(name) {
  const hebrew = PARASHAH_HEBREW[name];
  if (!hebrew) throw new Error(`No Hebrew vocalization for parashah "${name}"`);
  return titleCase(translit(hebrew));
}

// Splits a "X, Y and Z" / "X and Y" / "X" list of tractate names, transliterates
// each individually, and rejoins with the same connectors.
function translitMishnah(field) {
  return field
    .split(/(, | and )/)
    .map((token) => {
      if (token === ", " || token === " and ") return token;
      const hebrew = TRACTATE_HEBREW[token];
      if (!hebrew) throw new Error(`No Hebrew vocalization for tractate "${token}"`);
      return titleCase(translit(hebrew));
    })
    .join("");
}

const source = JSON.parse(readFileSync("./seder-hamishmarah-source.json", "utf8"));

const rows = source.map((row) => [
  `<strong>${translitParashah(row.parashahName)}</strong><br><span class="siddur-table-subtext">${row.range}</span>`,
  row.nevim,
  row.ketuvim,
  translitMishnah(row.mishnah),
]);

const data = {
  title: "Seder ha-Mishmarah",
  tables: [
    {
      id: "seder-hamishmarah",
      title: "Weekly Cycle",
      headers: ["Weekly Torah Portion", "Nevi'im", "Ketuvim", "Mishnah"],
      rows,
    },
  ],
};

const path = "../data/siddur/appendix/seder-hamishmarah.json";
writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
console.log(`Wrote ${rows.length} rows to ${path}`);
