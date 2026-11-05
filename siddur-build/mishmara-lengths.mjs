// Word counts for Appendix > Study Cycles > Sedher HaMishmara.
// Reads each row's Torah / Nĕviʾim / Kĕthuvim / Mishna cell, fetches the text
// from Sefaria, and writes `lengths` ([[t, n, k, m], ...], one per row) and
// `stats` into the table, in place. Words are split on spaces and maqaf, the
// same convention as the Tanakh by Parasha / Even Tanakh Year data.
//
//   node mishmara-lengths.mjs        (needs network; ~100 Sefaria requests)
import fs from 'node:fs';

const FILE = new URL('../data/siddur/appendix/study-cycles/seder-hamishmarah.json', import.meta.url);

const TORAH = { 'Gen.': 'Genesis', 'Ex.': 'Exodus', 'Lev.': 'Leviticus', 'Num.': 'Numbers', 'Deut.': 'Deuteronomy' };
// Site spelling -> Sefaria title, for Mishna tractates.
const MISHNA = {
  'Ḥăghigha': 'Chagigah', 'Qinnim': 'Kinnim', "Ma'asroth": 'Maasrot', "Ma'ăser Sheni": 'Maaser Sheni', 'Peʾa': 'Peah',
  'Qiddushin': 'Kiddushin', 'Bĕrakhoth': 'Berakhot', 'Kĕthubboth': 'Ketubot', "Mo'edh Qaṭan": 'Moed Katan',
  'Horayoth': 'Horayot', 'Yĕvamoth': 'Yevamot', 'Miqwaʾoth': 'Mikvaot', 'Kelim': 'Kelim', 'Bĕkhoroth': 'Bekhorot',
  "Ta'ănith": 'Taanit', 'Mĕghilla': 'Megillah', 'Makkoth': 'Makkot', "Nĕgha'im": 'Negaim', "'Eruvin": 'Eruvin',
  'Pirqe ʾAvoth': 'Pirkei Avot', "'Ăvodha Zara": 'Avodah Zarah', 'Bavaʾ Qammaʾ': 'Bava Kamma', 'Middoth': 'Middot',
  'Ṭĕvul Yom': 'Tevul Yom', 'Shĕqalim': 'Shekalim', 'Shabbath': 'Shabbat', 'Ṭohŏroth': 'Tahorot',
  'Yadhayīm': 'Yadayim', 'Zĕvaḥim': 'Zevachim', 'Mĕnaḥoth': 'Menachot', 'Ḥullin': 'Chullin', 'Nidda': 'Niddah',
  'Zavim': 'Zavim', 'Kĕrithoth': 'Keritot', "'Orla": 'Orlah', 'Beṣa': 'Beitzah', 'Yomaʾ': 'Yoma',
  "Shĕvi'ith": 'Sheviit', "'Ărakhin": 'Arakhin', 'Makhshirin': 'Makhshirin', 'Nazir': 'Nazir', 'Soṭa': 'Sotah',
  'Tamidh': 'Tamid', 'Ḥalla': 'Challah', 'Tĕrumoth': 'Terumot', 'Para': 'Parah', 'ʾOhaloth': 'Oholot',
  'Bavaʾ Bathraʾ': 'Bava Batra', 'Nĕdharim': 'Nedarim', "'Edhuyyoth": 'Eduyot', "Bavaʾ Mĕṣi'aʾ": 'Bava Metzia',
  "Shĕvu'oth": 'Shevuot', 'Kilʾayīm': 'Kilayim', 'Pĕsaḥim': 'Pesachim', 'Roʾsh Hashshana': 'Rosh Hashanah',
  'Sukka': 'Sukkah', 'Sanhedhrin': 'Sanhedrin', 'Giṭṭin': 'Gittin', 'Bikkurim': 'Bikkurim', "Mĕ'ila": 'Meilah',
  'Dĕmaʾy': 'Demai', "'Uqṣin": 'Oktzin', 'Tĕmura': 'Temurah',
};

// Pinned edition: Sefaria's default Hebrew Mishna version is partial for
// some tractates (Bikkurim's has only chapter 4). Tanakh uses the default (MAM).
const MISHNA_VERSION = 'Torat Emet 357';

const cache = new Map();
async function book(title, version) {
  if (!cache.has(title)) {
    const v = version ? 'hebrew|' + version : 'hebrew';
    const res = await fetch(`https://www.sefaria.org/api/v3/texts/${encodeURIComponent(title)}?version=${encodeURIComponent(v)}`,
      { headers: { 'User-Agent': 'siddur-build' } });
    if (!res.ok) throw new Error(`${title}: HTTP ${res.status}`);
    const text = (await res.json()).versions?.[0]?.text;
    if (!text?.length || text.some(c => !c.length)) throw new Error(`${title}: missing or partial text`);
    cache.set(title, text);
  }
  return cache.get(title);
}

const clean = s => s.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\{[פס]\}/g, ' ')
  .replace(/[֑-ְ֯-ֽֿ-ׇ]/g, '');
export const countWords = text => [text].flat(9).map(clean).join(' ')
  .split(/[\s־]+/).filter(w => /[א-ת]/.test(w)).length;

// Chapters a..b (1-based, inclusive; b = 'end') of a book's chapter array.
const chapters = (b, a, z) => b.slice(a - 1, z === 'end' ? undefined : z);

async function torah(cell) {
  const m = cell.match(/(Gen\.|Ex\.|Lev\.|Num\.|Deut\.) (\d+):(\d+)[–-](\d+):(\d+)/);
  if (!m) throw new Error('Torah ref: ' + cell);
  const b = await book(TORAH[m[1]]), [c1, v1, c2, v2] = m.slice(2).map(Number);
  const verses = [];
  for (let c = c1; c <= c2; c++) b[c - 1].forEach((v, i) => {
    if ((c > c1 || i + 1 >= v1) && (c < c2 || i + 1 <= v2)) verses.push(v);
  });
  return countWords(verses);
}

// "Joshua 20-end", "I Samuel 26-end, II Samuel 1-7", "I Kings 20 to II Kings 5",
// "Joel and Amos", "Esther", "Obadiah, Jonah and Micah".
async function nakh(cell) {
  let total = 0;
  const span = cell.match(/^(.+?) (\d+) to (.+?) (\d+)$/);
  if (span) {
    total += countWords(chapters(await book(span[1]), +span[2], 'end'));
    return total + countWords(chapters(await book(span[3]), 1, +span[4]));
  }
  for (const part of cell.split(/, | and /)) {
    const m = part.match(/^(.+?)(?: (\d+)(?:-(\d+|end))?)?$/);
    const b = await book(m[1]);
    total += countWords(m[2] ? chapters(b, +m[2], m[3] || +m[2]) : b);
  }
  return total;
}

async function mishna(cell) {
  let total = 0;
  for (const name of cell.split(/, | and /)) {
    const t = MISHNA[name];
    if (!t) throw new Error('Unknown tractate: ' + name);
    total += countWords(await book(t === 'Pirkei Avot' ? t : 'Mishnah ' + t, MISHNA_VERSION));
  }
  return total;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  const table = data.tables[0];
  const text = c => c.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  table.lengths = [];
  for (const [t, n, k, m] of table.rows.map(r => r.map(text))) {
    table.lengths.push([await torah(t), await nakh(n), await nakh(k), await mishna(m)]);
    console.log(t.split(' Gen')[0].padEnd(24), table.lengths.at(-1).join('\t'));
  }
  const sums = table.lengths.map(l => l.reduce((a, b) => a + b, 0));
  const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
  table.stats = {
    weeks: sums.length,
    avg: Math.round(avg),
    min: Math.min(...sums),
    max: Math.max(...sums),
    sd: Math.round(Math.sqrt(sums.reduce((s, w) => s + (w - avg) ** 2, 0) / sums.length)),
    trackAvg: [0, 1, 2, 3].map(i => Math.round(table.lengths.reduce((s, l) => s + l[i], 0) / sums.length)),
  };
  console.log(table.stats);
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
}
