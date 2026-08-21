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
- `type: "text"` — vocalized liturgy that goes through all three display
  toggle states (Hebrew / transliteration / translation).
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
> Transliteration, Appendix > Seder ha-Mishmarah). These use a different
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
for tables with no Hebrew column (e.g. Seder ha-Mishmarah).

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

## Verifying changes

`hugo server -D`, then check the rendered chapter at a phone-width viewport
— that's the primary use case (jumping straight to one short prayer while
praying alone), and mobile-specific bugs (off-canvas sidebar, RTL text
wrapping) won't show up in a desktop-width check. See `layouts/siddur/`.
