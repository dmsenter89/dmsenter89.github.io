# Siddur content toolkit

Node toolkit for authoring `/siddur/` content: Hebrew transliteration and
Divine Name normalization, run once per edit to regenerate machine-derived
fields in the chapter JSON files under `data/siddur/`.

`data/siddur/**/*.json` **is** the source of truth — there is no separate
copy of chapter content living in this directory. Edit those files directly,
then run `generate.mjs` on the file you changed:

```bash
cd siddur-build
npm install                      # first time only, restores node_modules
node generate.mjs ../data/siddur/daily/before-sleep.json
```

This rewrites the file in place: normalizes the Divine Name in every `hebrew`
field, and regenerates `translit` for every `type: "text"` item. It never
touches `translation` — that's hand-authored and untouched by any tooling.

## Adding a new chapter

1. Add `content/siddur/<part>/<chapter>.md` — front matter only (`title`,
   `weight`, `robots: "noindex, nofollow"`), no body. `weight` controls
   sidebar order within the part.
2. Add `data/siddur/<part>/<chapter>.json` with the shape below.
3. Run `generate.mjs` on it (see above).
4. `hugo server -D` and check it renders — see "Verifying changes" below.

Adding a new **part** (e.g. `shabbat` alongside `daily`) additionally needs
a `content/siddur/<part>/_index.md` (title + weight, same front matter
shape) — that's what gives the part a heading in the sidebar. No template
changes are needed; the sidebar nav and chapter layout are fully generic
over the content tree.

## Chapter JSON schema

```json
{
  "title": "Chapter Title",
  "sections": [
    {
      "id": "section-slug",
      "title": "Section Heading (renders as <h2 id=\"section-slug\">)",
      "items": [
        {
          "type": "rubric",
          "id": "rubric-1",
          "hebrew": "unvocalized instructional Hebrew",
          "translation": "English gloss of the instruction"
        },
        {
          "type": "text",
          "id": "item-id",
          "hebrew": "vocalized liturgy, with niqqud",
          "translit": "filled in by generate.mjs — do not hand-author",
          "translation": "original English translation, hand-authored"
        },
        {
          "type": "include",
          "ref": "shared/shema",
          "sectionId": "shema-paragraph-1"
        },
        {
          "type": "expandable",
          "id": "purim-al-hanissim",
          "label": "Purim — Al HaNissim",
          "items": [
            { "type": "text", "id": "purim-cue", "hebrew": "...", "translation": "..." },
            { "type": "text", "id": "purim-full", "hebrew": "...", "translation": "..." }
          ]
        },
        {
          "type": "group",
          "id": "food-type-choice",
          "items": [
            { "type": "rubric", "id": "grain-label", "hebrew": "...", "translation": "For the five grains:" },
            { "type": "text", "id": "grain-row", "hebrew": "...", "translation": "..." }
          ]
        },
        {
          "type": "toggle",
          "id": "amidah-middle",
          "options": [
            { "id": "full", "label": "Full Amidah", "items": [ { "type": "text", "id": "...", "hebrew": "...", "translation": "..." } ] },
            { "id": "havinenu", "label": "Havinenu", "items": [ { "type": "text", "id": "...", "hebrew": "...", "translation": "..." } ] }
          ]
        }
      ]
    }
  ]
}
```

- `type: "rubric"` — unvocalized instructional Hebrew (stage directions,
  halachic notes). No transliteration is generated — the library needs
  niqqud to produce anything meaningful, and this text isn't recited anyway.
  Optional `lead` / `hebrewLead` strings render in bold ahead of the
  `translation` / `hebrew` text, as a run-in topic label (see Daily > Hălakha).
- `type: "text"` — vocalized liturgy that goes through all three display
  toggle states (Hebrew / transliteration / translation).
- `type: "hebrew"` — Hebrew-only reference text with no transliteration or
  translation (e.g. the ṭĕ'amim names in Appendix > Ṭĕ'amim). Always visible,
  independent of the Hebrew/translit/translation display toggle, since
  there's no other representation to fall back to. `generate.mjs` should
  **not** be run against these items (there's no `translit` field to fill
  in, and none should be added).
- `type: "include"` — splices another data file's section in by id, inline,
  at this point in the item list (no extra heading is introduced). Used for
  content reused across chapters — see "Shared content" below. Resolves via
  `ref` split on `/` and indexed into Hugo's site data (so `"shared/shema"`
  → `data/siddur/shared/shema.json`), then finds the section whose `id`
  matches `sectionId` and renders its `items` in place.
- `type: "expandable"` — a collapsed-by-default `<details>` box (no JS) for
  occasion-specific insertions that most readers skip most days (Al HaNissim
  on Purim/Chanukah, Ya'aleh V'Yavo on Rosh Chodesh/Chol HaMoed). `label` is
  the always-visible English summary text; `items` is a nested array
  rendered exactly like a section's items (typically a short "cue" `text`
  item followed by the `full` inserted text — see Blessings After Eating for
  a worked example). **`generate.mjs` recurses into `expandable` items'
  nested `items` array** — anything with an `items` array gets walked, so
  this composes with more nesting if it's ever needed.
- `type: "group"` — the same nested-`items` shape as `expandable`, but
  rendered as an always-open bordered box instead of a collapsed `<details>`.
  Used for a set of mutually exclusive alternatives that should all stay
  visible at once, e.g. the grain/wine/fruit choice in Me'en Shalosh
  (Blessings After Eating → Other Foods): a `rubric` label + `text` row per
  option, boxed together so the reader can see all the choices without
  expanding anything.
- `type: "toggle"` — a radio-button group for choosing between alternative
  renditions of the same passage, e.g. the full Amidah vs. Havinenu in the
  middle of the weekday Arvith Amidah, or the four Shabbat nusachim
  (Arvith/Shahrith/Minha/Eretz Yisrael) for Kedushat HaYom in Tefilah.
  `options` is an array of `{id, label, items}` objects; `items` is a
  nested array rendered like a section's items. The first option is
  selected by default. Only one panel is ever shown — unlike `group`,
  these aren't meant to be compared side by side. The CSS keys the visible
  panel to radio/panel position via `:nth-of-type`, so up to four options
  is a hard limit, not just a convention — extend the CSS rules in
  `assets/siddur.css` (and the doc comment in
  `layouts/_partials/siddur-item.html`) if a fifth is ever needed.

## Divine Name

Every occurrence of the Tetragrammaton — the "יי" shorthand and any
differently-vowelized spelling alike — gets normalized to a single
consistent form: **יְיָ** (yud-sheva, yud-qamats). English always reads
"Adhonay".

This used to be the unvocalized י״י (gershayim) form, but real niqqud on the
letters is what a browser/font needs to correctly position a following
cantillation mark (ta'am) — with no niqqud there's nothing for the mark to
attach to, and it renders as a stray glyph trailing after the letter instead
of tucked under/over it. Confirmed across multiple fonts; not fixable with
CSS. `יְיָ` looks slightly different from the more common י״י abbreviation,
but is itself a standard Sephardic convention, and fixes the rendering.

Implementation lives in `normalize-divine-name.mjs`: `normalizeDivineName()`
rewrites the saved `hebrew` field (dropping the source's original varied
niqqud on that word, preserving cantillation if present); `generate.mjs`
then shields `יְיָ` behind a placeholder before calling `transliterate()` and
swaps in "Adhonay" afterward, since the library has no clean way to force a
fixed reading for a specific word/phrase — it would otherwise transliterate
the letters literally (e.g. "yĕya").

**Known gap:** some heavily-disguised variants in as-yet-unprocessed source
content (extra consonants inserted, not just revocalized — e.g.
"יוּהוּווּהוּ") aren't matched by the current regex. Review `generate.mjs`
output before normalizing any chapter that might contain those.

## Cantillation punctuation in translit

The transliteration library silently drops sof pasuq (׃) and paseq (׀)
instead of rendering them, which turns a transliterated biblical passage
(Tehilla, the Amida's scriptural quotes, Ashrei, etc.) into one run-on line
with no indication of where each verse ends. `punctuation.mjs` shields both
marks before calling `transliterate()` and swaps them back into `translit`
afterward — sof pasuq becomes `.`, paseq is dropped with its surrounding
whitespace collapsed to one space. The saved `hebrew` field is untouched.
Add another cantillation mark here if a future chapter needs one; nothing
else needs to change.

Ordinary punctuation has a related library bug: a maqaf compound touching any
non-Hebrew character (`.` `,` `;` `:` brackets, parentheses, em-dash) loses
every dagesh in its second word — `כָל־רוֹאֵינוּ.` came out `khol-roʾenw.`,
`הַזְּמַנִּים` lost its doubling. `generate.mjs` therefore splits each `hebrew`
string on punctuation and transliterates only the Hebrew between, passing the
punctuation through as-is. ASCII `"` is left out of the split, since it
stands in for gershayim inside abbreviations.

## Gender-variant inline labels

Some liturgy has a short instructional label marking where the text differs
by the reciter's gender, e.g. `מוֹדֶה (אִשָּׁה: מוֹדָה) אֲנִי` — the label
itself (`אִשָּׁה:`) isn't recited, so transliterating it literally
(`ʾishsha:`) would be misleading. `inline-labels.mjs` maps known labels to a
plain English rendering (`אִשָּׁה:` → `a woman says:`) that `generate.mjs`
substitutes into `translit` only — the saved `hebrew` and rendered page both
keep the real label. Add new labels to `LABEL_MAP` there as they come up;
nothing else needs to change.

Two established patterns for gender variation, both drawn from
`Siddur_Edot_HaMizrach` on Sefaria (public API, no auth:
`https://www.sefaria.org/api/texts/<ref>?lang=he&with=all`) — check there
before inventing a new pattern for a blessing that already has one:

- **Same blessing, one word swaps**: append the alternate as a trailing
  note after the sof pasuq, e.g.
  `...שֶׁלֹּא עָשַׂנִי גּוֹי׃ (אִשָּׁה: גּוֹיָה)`.
- **Fully separate blessing**: e.g. the third of the three "shelo asani"
  blessings — a rubric cues each version (`האיש מברך` / `האשה מברכת בלי שם
  ומלכות`) and each gets its own `text` item.

## Optional bracketed text

Text in `[...]` (Hebrew and English both) is optional/commonly-included
liturgy, kept literally in the JSON and rendered as plain text with the
brackets visible — no toggle, matching how printed siddurim show it. See
Modeh Ani's `[וֵאלֹהֵי אֲבוֹתַי]` for an example.

## Shared content

Text recited identically in multiple chapters (e.g. the Shema, needed in
both the bedtime and morning/evening services) lives once in
`data/siddur/shared/<name>.json`, in the same schema as a chapter (`title` +
`sections`), and gets pulled into a chapter via a `type: "include"` item
(see schema above). Run `generate.mjs` on the shared file directly, the same
as any other content file.

## Appendix / reference tables

Some pages aren't liturgy at all — they're plain reference tables (Appendix
> Transliteration, Appendix > Sedher HaMishmara). These use a different
content shape and a different layout, not the `sections`/`items` schema
above:

```json
{
  "title": "Page Title",
  "tables": [
    {
      "id": "table-slug",
      "title": "Table Heading (renders as <h2 id=\"table-slug\">)",
      "headers": ["Column 1", "Column 2"],
      "hebrewColumn": true,
      "rows": [["א", "..."], ["ב", "..."]]
    }
  ],
  "note": "optional italic footnote shown below all tables"
}
```

The content `.md` file needs `layout: "tables"` in its front matter (routes
to `layouts/siddur/tables.html`, which resolves the data file the same
path-mirroring way `single.html` does, then hands each table off to
`layouts/_partials/siddur-table.html`). `hebrewColumn: true` styles and
marks up (`lang="he" dir="rtl"`) each row's first cell as Hebrew; omit it
for tables with no Hebrew column (e.g. Sedher HaMishmara).

**Appendix > Transliteration is auto-generated, not hand-authored.** Run
`node generate-transliteration-table.mjs` (no arguments) to regenerate
`data/siddur/appendix/transliteration.json` straight from `schema.mjs`,
resolved through the same `new SBL(sephardicSchema)` default-merging that
`transliterate()` itself does internally — so the reference page can never
drift from the actual transliteration behavior. Re-run it any time
`schema.mjs` changes; there is nothing else to update by hand.

## Content source

Hebrew text and translation base material comes from the user's Google Doc
"Siddur Skeleton". Two "Ways of Torah" siddur PDFs live in the same Drive
folder as reference material — **do not copy phrasing from that published
translation**; write original translations from the Hebrew. The doc grows
over time; re-fetch it rather than trusting a stale copy when picking up new
content.

## Biblical citations

For any **direct biblical citation** (a verse or passage quoted as such, not
liturgy that merely echoes biblical language), **always pull the Hebrew with
ta'amim from Sefaria** ("Miqra according to the Masorah", the default Hebrew
version) rather than using the unpointed-for-cantillation text from the
source doc. Strip Sefaria's HTML (`<b>`, `&thinsp;`, the `{פ}`/`{ס}`
parasha-break spans), keep maqqef, paseq and sof pasuq, drop any hand-added
commas, then run `generate.mjs` as usual — it normalizes the Divine Name
while preserving the cantillation.

The English is an original translation like everything else (see below), and
carries **no inline verse reference** — no `(Psalm 118:20)` after the text.

## Translation style

All English is original, written from the Hebrew, in one of two registers.

**Recited texts** (`type: "text"` — prayers, psalms, Tanakh quotes):

- Loose iambic meter, a natural 4–5 stress-beat pulse per thought unit, easy
  to say aloud.
- Continuous prose, never broken into poetic lines; commas, semicolons and
  em-dashes mark the breath pauses.
- Warm, dignified, traditional and reverent, in the register of prayerbooks
  like Kehot or ArtScroll.
- Fixed vocabulary: *melekh* = King (never "Sovereign"); *qoneh* = Maker,
  Creator or Possessor (never "owner"); *ḥesedh* = loving-kindness, kindness
  or devotion; *raḥamim* = compassion or mercy; *ḥasde avoth* = devotion /
  merits of the Patriarchs.
- *ʾavoth* / *ʾăvothenu* = forefathers, our forefathers (not "ancestors" or
  "fathers"); "the Patriarchs" where the three are meant.
- Avoid "sin": in English it carries Christian connotations the Hebrew does
  not have. *ḥeṭʾ* is missing the mark — "err", "error", "failings", "shortcomings", whichever reads naturally in
  context; *'awon* = wrongdoing (plural "wrongs"; "guilt" where it means the
  burden carried); *pesha'* = defiance, "defy". Not "iniquity" or
  "transgression" either — they sound just as churchly. "Sin" is a last resort, for where nothing else works.
- *tĕshuva* = return ("who desires our return"), never "repentance". In
  rubrics it stays untranslated — tĕshuva, glossed once as "(return)".
- The Tetragrammaton is always "Adhonay". Where the Hebrew actually reads
  אֲדֹנָי (not the Tetragrammaton), write "my Lord".
- שַׁבָּת is "Shabbath", never "Sabbath".
- No KJV archaisms (thou, thee, wilt, doth) — modern capitalized pronouns
  (You, Your, He, His). No bracketed editorial insertions. No academic or
  bureaucratic wording.

**Informational texts** (`type: "rubric"` — halakha, instructions, notes):

- Plain, modern, accessible prose with no poetic rhythm; clarity comes first.
- Friendly, warm and conversational, like an encouraging guide; address the
  reader as "you" where the Hebrew's impersonal "he" allows it.
- Technical terms stay in transliteration: bĕrakha (not "blessing"), miṣwa
  (not "commandment"), and nouns like ṣiṣith, miqweh, ṭumʾa — glossed once in
  parentheses where a reader may not know them. Procedural jargon goes into
  English: "by Torah law", "by rabbinic law", "ideally", "after the fact"
  (not min hattora, middivre sofĕrim, lĕkhattĕḥilla, bĕdhi'ăvadh).
- *ṣeʾth hakkokhavim* stays transliterated — an English stand-in like
  "nightfall" misleads — glossed "(when the stars come out)" once per
  section where it appears.
- Source citations are kept exactly as they stand.
- Never cut content. If a passage reads as heavily mystical or kabbalistic,
  translate it and flag it to the user, who decides what to remove.

**Hebrew terms in visible English** (translations, section and page titles,
labels) use the site's technical transliteration scheme, the same one
`generate.mjs` produces, capitalized as English: Qiddush, Shabbath, Minḥa,
rĕvi'ith, Shulḥan 'Arukh, Sĕ'udha Shĕlishith — not Kiddush, Shabbat, Mincha.
Ids, file names and URLs stay plain ASCII (`kiddush-leil-shabbat`).

The title רִבִּי of a Talmudic sage is "Ribbi" (two ḥiriqs, as we pronounce
it) — Ribbi Ḥănanya ben 'Ăqashya, Ribbi Yĕhudha. Later and modern rabbis are
"Rabbi" (Rabbi Mordechai Eliyahu). In Hebrew, write ז״ל with gershayim (״),
not a straight quotation mark.

## Settled wording

Wording the user has approved. Before translating anything new, grep its
opening Hebrew words across `data/siddur/` and check this list: if a verse,
blessing formula or stock phrase is already translated, reuse that wording
verbatim so the site reads as one voice. Add to the list as new wording is
approved. ("Batch" numbers below refer to the 2026-10 retranslation passes.)

- **Blessing opening:** "Blessed are You, Adhonay our God, King of the
  universe, who has sanctified us with His commandments and commanded us …"
- **Boreʾ pĕri haggefen** (הַגֶּפֶן, never haggafen): "… who creates the fruit of the vine."
- **HaMoṣiʾ:** "… who brings forth bread from the earth."
- **Mĕqaddesh hashShabbath:** "… who makes the Shabbath holy."
- **Psalm 116:13:** "I lift the cup of salvation, and call upon the name of
  Adhonay."
- **Psalm 118:1:** "Give thanks to Adhonay, for He is good, for His
  loving-kindness endures forever."
- **Psalm 118:20:** "This is the gate of Adhonay; the righteous shall enter
  through it."
- **Psalm 90:17:** "May the pleasantness of my Lord, our God, be upon us;
  establish for us the work of our hands — the work of our hands, establish
  it."
- **Psalm 145:15–16:** "The eyes of all look to You in hope, and You give
  them their food in its season. You open Your hand, and satisfy the desire
  of every living thing."
- **Numbers 6:24–26:** "May Adhonay bless you and keep you. May Adhonay make
  His face shine upon you, and be gracious to you. May Adhonay lift up His
  face toward you, and grant you peace."
- **Genesis 2:1–3** and **Exodus 31:16–17:** as on the Qiddush page.
- **Shared core** — the Shĕma' (Deuteronomy 6:4–9), the Thirteen Attributes
  (Exodus 34:5–7, 9) and every weekday 'Ămidha blessing are settled as they
  stand in `data/siddur/shared/`; copy from there, including Psalm 51:17,
  Psalm 19:15, Psalm 113:2–4, Psalm 8:10 and 'Oseh shalom.
- **Daniel 9:18:** "… not on account of our own righteousness do we lay our
  pleas before You, but on account of Your great compassion." (Minḥa
  Taḥănun and Ribbon ha'olamim alike.)
- **Psalm 19:15:** "May the words of my mouth and the meditation of my heart
  find favor before You, Adhonay, my Rock and my Redeemer."
- **Daily services** — the three Shĕma' paragraphs, the 'Arvith bĕrakhoth
  (Ma'ăriv 'ăravim, ʾAhăvath 'olam, ʾEmeth weʾĕmuna, Hashkivenu), ʾAtta
  ḥonantanu, Psalm 121 and 'Alenu are settled as they stand in
  `data/siddur/daily/arvith.json`; Psalm 145, Psalm 25 and the Taḥănun
  verses as in `data/siddur/daily/minha.json`. Copy from there.
- **Psalm 20:10:** "Adhonay, save us! May the King answer us on the day we
  call."
- **Psalm 78:38:** "And He, being compassionate, pardons wrongdoing and does
  not destroy; time and again He turns back His anger, and does not rouse
  all His wrath."
- **Psalm 46:8 / 84:13:** "Adhonay of hosts is with us; the God of Jacob is
  our stronghold, Selah. Adhonay of hosts, happy is the one who trusts in
  You."
- **Psalm 84:5 / 144:15:** "Happy are those who dwell in Your house; they
  shall praise You evermore, Selah. Happy is the people for whom this is so;
  happy is the people whose God is Adhonay."
- **Psalm 25:6:** "Remember Your compassion, Adhonay, and Your kindnesses,
  for they are from of old."
- **More fixed renderings:** כפר = pardon; הַשָּׂטָן = the Adversary; צְדָקָה
  וָחֶסֶד = charity and loving-kindness; חֲסִידִים = the devout / Your devout
  ones; inline Hebrew cues stay bracketed ("[Quietly:]", "[in the rainy
  season: …]").
- **Page intros:** the prose body of a page's `.md` file is informational
  register too — rewrite it along with the JSON.
- **Citations in rubrics** keep their references but go into the scheme
  (Shulḥan 'Arukh, ʾOraḥ Ḥayyim; Moram for the Rema; "Rambam, Tĕfilla 4:19").
- **Havdala formula:** "… between the holy and the ordinary, between light
  and darkness, between Israel and the nations, and between the seventh day
  and the six days of work."
- **Stock phrases:** "our God and God of our forefathers"; "May it be Your
  will, Adhonay our God and God of our forefathers, …"; "speedily in our
  days"; "for the sake of His name"; "Selah" (English form, like Amen).
- **Fixed renderings:** רחמים = compassion ("have mercy on us" only for the
  verb רַחֵם); מַצְמִיחַ = makes … spring forth; צֶמַח דָּוִד = the branch of
  David; קֶרֶן = horn; שְׁכִינָה = His Presence; טֹטָפֹת = an emblem; מִינִים =
  heretics; biblical names in their English forms (Jesse, Zion, Rebecca).
- **חטא / עון / פשע:** err, error, failings, shortcomings ("for we have
  erred", "those who err") / wrongdoing, wrongs / defiance, "we have defied
  You", "the defiant". יִרְאַת חֵטְא = "we fear to do wrong".
  See the "sin" rule in `README.md`.
- **תְּשׁוּבָה:** "return" in recited text ("restore us to Your presence in
  whole-hearted return … who desires our return"); "tĕshuva" in rubrics.
- **Participles after a second-person opening** stay second person ("You
  make the dew fall", "You sustain the living").
- **Rubric vocabulary:** "say the bĕrakha" (not "recite the blessing");
  "the service" for תפלה as a prayer service; "ask a rabbi"; "our custom" /
  "the widespread custom" for מנהג; "a barrier (ḥăṣiṣa)"; "vessels" for כלים.
- **Shaḥrith** — Yoṣer ʾor, ʾAhăvath 'olam, ʾĔmeth wĕyaṣṣiv, the Sedher HaYom
  verses, Qawweh and ʾEn kelohenu are settled as they stand in
  `data/siddur/daily/shahrith.json`; HaMappil and Psalm 31:6 as in
  `data/siddur/daily/before-sleep.json`; Modeh ʾăni, 'Al divre thora and
  Deuteronomy 33:4 as in `data/siddur/daily/for-toddlers.json`. Copy from
  there.
- **Isaiah 42:21:** "Adhonay was pleased, for the sake of His righteousness,
  to make the Torah great and glorious."
- **Deuteronomy 33:4:** "Moses commanded us the Torah, the heritage of the
  congregation of Jacob."
- **More fixed renderings (batch 3):** חֶמְלָה = tenderness / tender care;
  פודה = ransom (גואל = redeem, מציל = deliver); יִרְאָה = fear; כָבוֹד in
  Psalm 30:13 = "my soul"; לְאָבוֹת וּבָנִים = "for fathers and for children"
  (literal parents, not the forefathers rule).
- **Upon Waking** — ʾĔlohay nĕshama, the morning bĕrakhoth, ʾĂsher yaṣar,
  the Torah bĕrakhoth with ʾEllu dhĕvarim, Ribbon ha'olamim through ʾAtta huʾ,
  and Numbers 6:22–27 are settled as they stand in
  `data/siddur/daily/upon-waking.json`. Copy from there.
- **More fixed renderings (batch 4):** עֲבֵרָה = misdeed(s); יֵצֶר טוֹב / רָע =
  the good / evil inclination; לְשׁוֹן הָרָע = slander; אֵל שַׁדַּי = God
  Almighty; הֶבֶל = a breath; רִבּוֹן = Master (of the worlds, of all works);
  מַתִּיר אֲסוּרִים as a morning bĕrakha = "who frees the bound" (the 'Ămidha
  keeps "set the captives free"); שם ומלכות in rubrics = "God's Name and
  Kingship"; Yom HaKippurim, Tish'a BĕʾAv.
- **Wordplay and glosses in recited text** go in quotation marks, never
  brackets (hălikhoth, "ways" / hălakhoth, "laws"); explanatory glosses the
  Hebrew doesn't have are dropped.
- **Shabbath services** — Psalms 29, 92 and 93 and Lĕkha Dhodhi are settled
  as they stand in `data/siddur/shabbat/kabbalat-shabbat.json`; the
  Qĕdhushath HaYom paragraphs (ʾAtta qiddashta, Yismaḥ Mosheh, ʾAtta ʾeḥadh,
  Hanaḥ lĕ'ammĕkha, Tikkanta Shabbath, Rĕṣeh na bimnuḥathenu) and Numbers
  28:9–10 as in `data/siddur/shabbat/tefilah.json`; Psalm 118:25–29, the
  spice, fire and HaMavdil bĕrakhoth as in
  `data/siddur/shabbat/havdalah.json`. Copy from there.
- **Proverbs 6:23:** "For the commandment is a lamp, and the Torah is
  light."
- **More fixed renderings (batch 5):** נֵר שֶׁל שַׁבָּת = the Shabbath light
  ("to kindle the Shabbath light"; "candle" only for the Havdala candle);
  הַמַּבְדִּיל = "who distinguishes"; מְנוּחָה … הַשְׁקֵט וָבֶטַח = "rest … quiet and
  security"; חֶמְדַּת יָמִים = "the most cherished of days"; קָרְבַּן מוּסָף = the
  additional offering; "make Havdala" / "make Qiddush" in rubrics; Rambam
  cited as "Rambam, Shabbath 5:1"; Ben ʾIsh Ḥay as "Year 2, Wayyeṣeʾ 14".
- **Blessings after and before eating** — Birkath HaMazon (HazZan, Nodheh,
  'Al HanNissim for Purim and Ḥănukka, Raḥem, Ya'ăleh Wĕyavoʾ, HaṭṬov
  wĕhamMeṭiv) is settled as it stands in
  `data/siddur/blessings/blessings-after-eating/birkat-hamazon.json`; Mĕ'en
  Shalosh and Boreʾ Nĕfashoth as in `other-foods.json` beside it; the food
  and fragrance bĕrakhoth as in
  `data/siddur/blessings/blessings-on-enjoyments.json`. Copy from there.
- **More fixed renderings (batch 6):** מָזוֹן = food; מִחְיָה = nourishment;
  כַּלְכָּלָה = sustenance; אֶרֶץ חֶמְדָּה = a cherished land; פֻּרְקָן = rescue;
  פְּלֵיטָה = deliverance; תְּשׁוּעוֹת = victories; רַחֲמֶיךָ הָרַבִּים = Your great
  compassion; דְּבִיר = shrine, הֵיכָל = Temple, מִקְדָּשׁ = sanctuary; מָשִׁיחַ
  בֶּן־דָּוִד = the Messiah, son of David (מְשִׁיחָךְ = Your anointed); חֵי
  הָעוֹלָמִים = the Life of the worlds.
- **Festival names** stay Hebrew in recited text, like Shabbath: Roʾsh
  Ḥodhesh, Pesaḥ, the Festival of Maṣṣoth, the Festival of Sukkoth, Ḥănukka,
  Purim. Post-biblical names take English forms too (Mattathias son of
  Johanan).
- **Split formulas** (Mĕ'en Shalosh): each alternative row carries its own
  "for", as the Hebrew עַל does; "(בא״י: …)" cues read "[In the Land of
  Israel: …]". Rubric cue before a bĕrakha: "Over bread, say:".
- **Ribbi** for Talmudic sages only (Ribbi Ḥănanya ben 'Ăqashya, Ribbi
  Yĕhudha); later and modern rabbis are "Rabbi" and keep their usual
  English spellings (Rabbi Mordechai Eliyahu, Ovadia Yosef, Salman Mutzafi).
  Hebrew ז״ל takes gershayim, not a straight quote.
- **Blessings, part 2, and lifecycle** — the Torah-study verses and prayers
  (Deuteronomy 4:44, Proverbs 4:2, Psalm 119:12, Hosea 12:11, Amos 2:11,
  Isaiah 60:21, the Bĕrakhoth 28b prayers, Ribbi Ḥănanya) are settled as
  they stand in `data/siddur/blessings/torah-study.json`; HaGomel, Psalm
  111:1 and 1 Chronicles 29:10–12 as in `birkat-hagomel.json` beside it;
  Song of Songs 2:14 and 6:9 and the Mi Shebberakh as in
  `data/siddur/lifecycle/zeved-habat.json`. Copy from there.
- **More fixed renderings (batch 7):** הַקָּדוֹשׁ בָּרוּךְ הוּא = the Holy One,
  blessed is He; לְחַיָּבִים = the undeserving; בֵּית הַמִּדְרָשׁ = the house of
  study; אֵל עוֹלָם = the everlasting God; הֲלָכָה in recited text = "law";
  נְאֻם = declares; "think them in your heart" for יהרהר בלבו; "before ten"
  for בעשרה; ז״ל = of blessed memory; "Before reading from …, begin with:".
- **Hălakha page (batch 8):** תפילה = "the 'Ămidha" where the standing
  prayer is meant ("go back to the beginning of the 'Ămidha"), "service" for
  Shaḥrith / Minḥa / 'Arvith / Musaf / Nĕ'ila, "prayer" for the miṣwa in
  general. יצא ידי חובתו = "you have fulfilled your obligation"; חוזר = "go
  back to …"; the 'Ăvodha bĕrakha ("Rĕṣeh"); Birkath HashShanim; Shomea'
  tĕfilla; Roʾsh HashShana; "the Ten Days of Tĕshuva". Citations there stay
  bare, as the Hebrew has them: "(Qiryath Shĕma' 1:1)", "(Tĕfilla 2:11)".
- **Kawwana:** stays transliterated, glossed once; its absence is reciting
  "mechanically, without that focus" — never "your heart wasn't in it",
  which sounds like a lack of feeling.
- **Zĕmannim:** ṣeʾth hakkokhavim stays transliterated, glossed "(when the
  stars come out)" once per section where it appears. Otherwise: dawn
  ('ammudh hashshaḥar), sunrise (haneṣ haḥamma), sunset, midnight, midday,
  "seasonal hours", pĕlagh haMinḥa, Minḥa Gĕdhola / Qĕṭanna; "the third
  hour"; ימות החמה = summer; בדיעבד או בשעת הדוחק = "after the fact or in
  pressing circumstances"; אנוס = "prevented by something beyond your
  control (ʾanus)"; תשלומין = "the make-up (tashlumin)"; סימן לדבר = "A way
  to remember it:".
- **Hălakha page (batch 9):** מעכבין = "stand in the way of prayer"; טהרת
  הידיים / המקום = clean hands, a clean place; ליבו as a body part = chest;
  בית הכיסא = bathroom; מגונה = "looked down on"; תפילתו תפילה = "your prayer
  counts"; סומך גאולה לתפילה = "join redemption to prayer"; nĕfilath panim,
  kĕri'a, qidda, hishtaḥăwaya stay transliterated; "the Shĕkhina (God's
  Presence)"; עבדים = servants; Psalm 29:2 as on the Qabbalath Shabbath page.
  רשות is normally "optional", but "the evening service is voluntary" in the
  Before 'Arvith paragraph. Cross-references stay as "(see section 8)"; "see
  also" is kept where the Hebrew has וראה.
- **Piyyut (batches 10–11):** continuous prose with a loose iambic pulse, no
  rhyme, one paragraph per stanza. In the piyyutim the Name follows the
  print: `אֲדֹנָי` = "my Lord". Acrostic notes spell the name in the site
  scheme (Yisraʾel, Shĕlomo, Ya'ăqov); biblical figures in running text keep
  English names (Solomon, Jacob). וָתִיק = Faithful One; גֵיא צַלְמָוֶת = "the
  valley of death's shadow"; שִׁילֹה = Shilo; נשמה is "she". סוֹד יְצָרוֹ (ʾĂghaddelkha) = "the secret
  of what He has formed". Wĕshamĕru as in the Shabbath 'Ămidha; Ribbi Ḥănanya as in `torah-study.json`.
- **Shabbath pizmonim** — Dĕror Yiqraʾ, Ki ʾEshmĕra Shabbath, ʾEreṣ WĕRum,
  ʾEl ʾEliyyahu and HaMavdil ben Qodhesh LĕḤol are settled as they stand in
  `data/siddur/shabbat/pizmonim.json`. Refrains: "It is a sign forever
  between Him and me."; חַי חַי חַי = "He lives, He lives, He lives."; "God of
  Elijah, God of Elijah — by the merit of Elijah the prophet, bring him, we
  pray."; "In honor of my heart's delight, Elijah the prophet."
- **More fixed renderings (batch 11):** מוצאי שבת = "Moṣaʾe Shabbath
  (Saturday night, once Shabbath has gone out)", glossed once per page;
  אוֹת יֶשַׁע = a sign of salvation; לֶחֶם פָּנִים = the showbread; יוֹם כִּפּוּר
  עֲוֹנִי = "the day my wrongdoing is pardoned"; שְׁכִינַת אֵל = the Presence of
  God; עוֹלָם שֶׁכֻּלּוֹ שַׁבָּת = "a world that is wholly Shabbath"; service names
  in recited text stay Hebrew ('Arvith, Shaḥrith, Musaf, Minḥa); "Elijah the
  prophet"; "Sephardic" as an English word. Pizmon authors keep their usual
  English spellings (Dunash ben Labrat, Rabbi Abraham ibn Ezra); the
  acrostic itself is in the scheme (ʾAvraham).
- **Yamim Noraʾim (batch 12)** — Ben ʾAdham, Lĕma'ankha ʾĔlohay, ʾErʾele
  Ma'la, Bĕṭerem Shĕḥaqim, 'Ănenu, ʾĂdhon HasSĕliḥoth, ʾEl Raḥum Shimkha,
  Yah Shĕma' ʾEvyonekha, Bĕzokhri 'al Mishkavi, Shomer Yisraʾel and Te'anu
  Wĕthe'athĕru are settled as they stand in
  `data/siddur/yamim-noraim/selihoth.json`; 'Ozreni ʾEl Ḥay as in
  `pizmonim.json` beside it. Refrains: "Adhonay reigns, Adhonay has reigned,
  Adhonay will reign forever and ever."; "Adhonay, He is God; Adhonay, He is
  God."; "My Lord, give heed and act; do not delay." (as in Minḥa); "we have
  erred before You; have mercy on us."; "Let us fall, we pray, into the hand
  of Adhonay, for His compassion is great."
- **Deuteronomy 1:11:** "May Adhonay, the God of your forefathers, add to
  you a thousand times as many as you are, and bless you, as He has promised
  you."
- **More fixed renderings (batch 12):** תְּפִלַּת הַשַּׁחַר in piyyut = "the prayer
  of dawn"; אֲרָקִים = the earth; פַּחַד יִצְחָק = Fear of Isaac; מָלֵא זַכִּיּוּת =
  full of clemency; אוֹת לְטוֹבָה = a sign for good; נֶפֶשׁ is "she", like
  נשמה; Talmudic sages in the scheme (Meʾir, Bar Yoḥay); "(twice)" and
  "(Amen)" stay in parentheses as the Hebrew has them; expandable label
  "The Ten Days of Tĕshuva"; "to keep things short, it isn't given here in
  full"; Hebrew abbreviations take gershayim (זצ״ל, הי״ט).
- **More fixed renderings (final sweep):** הֲלָכָה in rubrics and titles =
  hălakha; תחילת הלילה = "the start of the night" (never "nightfall");
  "Sephardic" and "Ashkenazi" as English words; Gaʾon (Rav Hai Gaʾon), but
  "the Vilna Gaon"; "ibn Ezra"; Pesaḥ in rubrics too; 'ăliyya / 'ăliyyoth,
  hafṭara / hafṭaroth, parashiyyoth, sidhraʾ; Nĕviʾim, Kĕthuvim, Mishna.
- **מַלְאָךְ = messenger**, never "angel" ("His messengers", "the messenger
  of Adhonay", "the ministering messengers", "the messenger who redeems").
  Other heavenly beings keep "angels": אֶרְאֵלֵי (Sĕliḥoth) and Aramaic
  עִירִין (Yah Ribbon) aren't מַלְאָךְ.
- **Tĕfillath HaDerekh** — the prayer itself, the city (kĕrakh) requests and
  thanksgivings, Psalm 91:11, Genesis 32:2–3 and Exodus 23:20 are settled as
  they stand in `data/siddur/blessings/tefillath-haderekh.json`. Copy from
  there. Fixed renderings: לְשָׁלוֹם in recited text = "in peace" (the
  bĕshalom/lĕshalom distinction is explained in rubrics, "go toward peace");
  תַּצְעִידֵנוּ = guide our steps; תִּסְמְכֵנוּ = uphold us; אוֹיֵב וְאוֹרֵב = "every
  enemy and lurking foe"; שׁוֹמֵעַ תְּפִלָּה = "who hears prayer"; לְוָיָה =
  accompanying (lĕwaya); פַּרְסָה = parsa; כְּרַךְ = city (kĕrakh); Mahanaim.
  Authorities: Maran, Beth Yosef, Ṭaz, Maghen ʾAvraham, Mishna Bĕrura, Pĕri
  Ḥadhash, Kaf HaḤayyim, 'Odh Yosef Ḥay, Kol Bo, Ḥizzĕquni, Darkhe Moshe,
  "Moram's gloss"; Rabbi Qafih, Shabazi, Maharitz, Tiklalim (Yemenite prayer
  books); Talmudic ʾAbbaye in the scheme.

## Hebrew to re-check against the source

Passages whose Hebrew reads as garbled (possibly OCR damage). They were
translated by sense and the Hebrew left alone; check them against the
printed source.

- `blessings/birkat-hagomel.json`, `hagomel-law-a`: `ומי שחלה בעיניו ונתרפא,
  לא נהגו לברך במקום, בעשרה בלי שם ומלכות` — probably "לא נהגו לברך, ומכל
  מקום יברך בעשרה…". Translated in line with law 2. The same item's
  Ben ʾIsh Ḥay references (`עקב ב, ו־ז`; `עקב ב, א` in
  `hagomel-instr-before`) were carried over as "'Eqev 2:6–7" / "'Eqev 2:1";
  confirm what the ב stands for.
- `lifecycle/zeved-habat.json`, `zeved-habat-commentary-1`: `שבזה משבחים
  ברוך הוא גם על טובה על שזכתה לבת`, and `מן המקבל הגר"ש סלמן מוצפי` (read
  as המקובל, "the kabbalist").

## Verifying changes

`hugo server -D`, then check the rendered chapter at a phone-width viewport
— that's the primary use case (jumping straight to one short prayer while
praying alone), and mobile-specific bugs (off-canvas sidebar, RTL text
wrapping) won't show up in a desktop-width check. See `layouts/siddur/`.
