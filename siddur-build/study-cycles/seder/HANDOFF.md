# Handoff: five-day ʾEreṣ Yisraʾel seder cycle

This file records everything that produced the delivered plan, `reference_outputs/chumash_reading_days_wlc.xlsx`, dated 2026-11-10. The code in `src/` was consolidated from the working scripts. Run on the WLC text, it reproduces that file cell for cell, along with its JSON and the review page data. `./run_all.sh --verify` checks this.

## 0. Scope: what this project is and isn't

**In scope:** the Torah only. That means 141 ʾEreṣ Yisraʾel triennial sedarim, one a week, each split into exactly five reading days (Sunday–Thursday), with Friday and Shabbat for review.

**Not part of this project:** the handoff request asked about rules for Nĕviʾim and Kĕthuvim, such as how they share a day's target, Psalm boundaries, Psalm 119 stanzas and short books read together. **None of these exist in this project**, so no code, parameters or decisions for them are included. They belong to the owner's separate Tanakh reading plan, which was built in a different conversation; nothing from it was available when this handoff was written.

The same goes for the earlier "even yearly cycle" (the 50-week, 5- and 6-day Chumash calendar) that this project started from. It was built in another conversation, and its code isn't here. I haven't reconstructed it.

## 1. Code

The final pipeline is in `src/`. Every file is complete and runnable, with no placeholders.

| File | Role |
|---|---|
| `common.py` | Paths, parameters, book list, seder and ʿăliyya tables, Hebrew numerals, the text-source loader, `iter_sedarim`, and `break_kind` (the break classifier) |
| `textsource_wlc.py` | Text adapter for the WLC: XML parsing, word counting, petuḥa and setuma detection. It documents the adapter interface a new text must implement |
| `splitter.py` | `split_auto` (the cost function and an exact dynamic-programming optimizer), `split_forced` (applies hand-picked day starts), `day_starts_of` |
| `build_plan.py` | Main build: splits every seder, applies `data/overrides.json`, writes `outputs/plan.json` and `outputs/override_report.json`, prints stats |
| `find_review_candidates.py` | Flags sedarim for hand review and generates the alternative splits shown for each |
| `build_review_page.py` + `templates/review_page.html` | Builds the tap-to-choose review page from the flagged sedarim |
| `make_overrides.py` | Turns the review record into `data/overrides.json`: the options as shown, plus the owner's choices and edits |
| `build_xlsx.py` | Builds the spreadsheet: Reading Days, Sedarim, Stats (all formulas) and Notes |
| `validate_inputs.py` | Checks the hand-typed tables for consistency against each other and against the text |
| `verify_reference.py` | Checks that a WLC run reproduces `reference_outputs/` exactly |
| `extras/calendar_count.mjs` | Counts how many Shabbatoth a year advance the cycle (source of the "about 45–46 a year" figure) |
| `extras/vocab_coverage.py` | Lemma-frequency coverage (source of "the 100 most frequent words cover about 58%") |

**How the working scripts map to this code.** The plan was first built with one-off scripts that loaded each other with `exec`. They are not included; their logic is in `src/` with the same loops, comparisons and tie-breaking, and the outputs match exactly.

- `split.py`, `split2.py` and `split3.py` became `common.py`, `textsource_wlc.py`, `splitter.py` and `build_plan.py`.
- `review.py`, `custom.py` and `build_review.py` became `find_review_candidates.py`. Their hand-typed dictionaries (option notes and scene splits) became `data/review_notes.json` and `data/scene_options.json`.
- `build.py` and `build3.py` became `build_xlsx.py`.

Two drafts were superseded and are not part of the final output:

- **First pass (2026-11-07), `split.py`:** no ʿăliyya breaks; costs were section mark 0, chapter end 0.05, other verse 0.15. A stricter variant (`split_strict.py`) used chapter end 0.2 and other verse 0.6. These produced the first numbers quoted in chat (114 words a day, with 43% of days ending mid-paragraph).
- **Pacing comparisons, `opts.py`:** halving long sedarim or giving every seder two weeks. The owner rejected these in favor of one seder a week.

The template has one intentional change from the page the owner used. "Accept recommendations" now skips sedarim that have no recommendation, which only happens on a new text. The item count is also filled in rather than hard-coded as 44.

## 2. Parameters

All parameters are in `config/params.json`.

**Unit and target**
- One seder is one week, split into `days_per_seder` = 5 days named Sunday to Thursday.
- There is **no global daily target**. Each seder's target is its own T = seder words ÷ 5. Week-to-week length therefore follows the sedarim; that was the owner's decision, made because the sedarim are a masoretic unit.

**Cost of a split**

    cost = Σ_days (day_words − T)²  +  Σ_internal breaks  break_costs[kind] × T²

| Break kind | Rule (first that applies, for a break after verse v) | Cost × T² |
|---|---|---|
| `petuha` | v carries a petuḥa mark in the text | 0 |
| `setuma` | v carries a setuma mark | 0 |
| `aliyah` | the next verse starts an ʿăliyya in `data/aliyot.txt` (excluding the seder's first ʿăliyya) | 0.03 |
| `chapter` | v is the last verse of its chapter | 0.06 |
| `verse` | anything else (mid-paragraph) | 0.25 |
| `seder end` | the seder's last verse | 0 |

The `verse` cost of 0.25 was chosen with the owner on 2026-11-07. At 0.15, 99 days ended mid-paragraph and 90% of days were within ±25% of target. At 0.25 the figures are 38 and 79.6%. The owner preferred clean sense units over evenness. The other values tried were 0.35 (20 mid-paragraph days, 75%) and 0.5 (8 mid-paragraph days, 72%).

**Optimizer and constraints**
- The optimizer is exact. It is a dynamic program over break points with exactly 5 non-empty days.
- Ties keep the earliest break: the comparison is strict `<`, and day starts are tried in increasing order.
- No day crosses a seder boundary. Since every book ends a seder, no day crosses a book either.
- Topic changes are not detected automatically. Chapter ends are the fallback, and hand-picked scene breaks cover 13 sedarim (see 3).

**Review rules** (2026-11-07)
- A seder is flagged if any break in its automatic split is `verse`, or if its heaviest day ÷ lightest day ≥ 2.2.
- Alternatives offered for a flagged seder:
  - **keep:** the automatic split.
  - **strict:** the `verse` cost raised to 50, which effectively forbids mid-paragraph breaks.
  - **even:** the `verse` cost lowered to 0.15.
  - **scene:** a hand-picked split.
- Duplicate splits are shown once, in that order. Where hand-written notes exist, only options with a note are shown.
- The text beside each break shows the last 4 words before it and the first 5 after it, with pointing removed.

**Spreadsheet Stats thresholds**
- Short day: under 60 words. Long day: over 200 words.
- Heavy seder: over 700 words. Light seder: under 400 words.
- Evenness bands: ±10%, ±15% and ±25% of target.

**Special cases**
- Wayyiqraʾ sedarim 11 and 12 are taken as chapters 15 and 16 in full (the seder 12 start was corrected from 15:25 to 16:1; see 4).
- Mid-verse section marks (pisqa beʾemṣaʿ pasuq) are treated as a break after the whole verse (see 6).
- There are no other special cases.

## 3. Hand decisions

All hand decisions are data files that the code reads. `data/overrides.json` is read by `build_plan.py`. It is generated by `make_overrides.py` from four files:

- `data/review_items_shown.json`: what the owner saw.
- `data/review_choices.json`: the owner's taps, exported from the review artifact's database on 2026-11-10.
- `data/modifications.json`: the owner's comment on Bĕreʾshith 16.
- `data/review_notes.json`: problem text, recommendations and option notes.

**Reasons.** The owner gave no per-seder reasons except the Bĕreʾshith 16 comment. For each decision the record keeps three things: why the seder was flagged (`problem`), what the chosen option does as it was described to the owner (`chosen_option_note`), and whether it followed Claude's recommendation. It differs from the recommendation in two places: Bĕreʾshith 9 (kept rather than scene breaks) and Bĕreʾshith 16 (evener split with an edit, rather than keep).

**The Bĕreʾshith 16 edit.** The owner commented on the evener split (day starts 24:17, 24:37, 24:53, 25:1): *"I think the evener split is good, but the second day i would end at verse 41 because it's cleaner than 36"*. The applied day starts are 24:17, 24:42, 24:53, 25:1. Day 2 (24:17–41, 311 words) is now the heaviest day in the plan.

**Scene breaks.** `data/scene_options.json` holds 22 hand-picked scene splits for 21 sedarim; Shĕmoth 21 has two alternatives. Claude picked them from the story structure. 13 were offered and 9 were not, with each reason recorded: they scored worse, or, for Dĕvarim 9, had no note.

**Correction to the seder table.** Wayyiqraʾ seder 12 starts at 16:1. The owner flagged on 2026-11-07 that the site's table was wrong ("Should be full chapter"); it had 15:25.

**Days 2–5 starts per reviewed seder** (word counts are for the WLC text):

| Seder | Why reviewed | Chosen | Recommended | Days 2–5 start at | Day words |
|---|---|---|---|---|---|
| Bĕreʾshith 1 | Day 4 ends inside the sixth day of creation. | section breaks | section breaks | 1:9, 1:14, 1:24, 2:1 | 90, 69, 126, 149, 35 |
| Bĕreʾshith 9 | Day 2 ends inside the descent to Egypt, just before the plagues on Pharaoh. | keep | scene breaks | 12:10, 12:17, 13:5, 13:14 | 127, 88, 101, 125, 69 |
| Bĕreʾshith 10 | Day 4 ends inside the covenant between the pieces, at the birds of prey. | section breaks | section breaks | 14:8, 14:15, 15:1, 15:7 | 102, 107, 134, 85, 173 |
| Bĕreʾshith 11 | Day 4 ends mid-dialogue, before Abraham's plea for Yishmaʿel. | scene breaks | scene breaks | 16:8, 17:1, 17:15, 17:23 | 107, 116, 178, 111, 66 |
| Bĕreʾshith 13 | Day 1 ends in the middle of the mob at Loṭ's door. | section breaks | section breaks | 19:12, 19:18, 19:24, 19:30 | 166, 109, 84, 81, 123 |
| Bĕreʾshith 16 | Day 1 ends at the well, while Rivqa waters the camels. | evener + owner edit | keep | 24:17, 24:42, 24:53, 25:1 | 254, 311, 179, 175, 209 |
| Bĕreʾshith 21 | Uneven week: day 2 (30:28–30) is only 35 words. | keep | keep | 30:28, 30:31, 30:35, 30:40 | 72, 35, 65, 78, 85 |
| Bĕreʾshith 24 | Day 1 ends one verse into Ḥamor's proposal. | scene breaks | scene breaks | 34:8, 34:20, 34:25, 35:1 | 131, 147, 81, 100, 132 |
| Bĕreʾshith 26 | Uneven week: day 1 (37:1–4) is only 52 words. | scene breaks | scene breaks | 37:5, 37:12, 37:18, 37:25 | 66, 101, 75, 89, 163 |
| Bĕreʾshith 33 | Day 3 ends while Yosef is handing out gifts for the journey. | section breaks | section breaks | 45:1, 45:17, 46:1, 46:8 | 222, 226, 171, 97, 212 |
| Bĕreʾshith 34 | Day 4 ends inside the famine land reform. | scene breaks | scene breaks | 47:1, 47:11, 47:18, 47:27 | 105, 152, 118, 166, 76 |
| Bĕreʾshith 36 | Day 4 ends as the brothers send their message to Yosef. | scene breaks | scene breaks | 49:13, 49:27, 50:7, 50:15 | 134, 133, 188, 123, 168 |
| Shĕmoth 4 | Day 1 cuts the four expressions of redemption before “wehevethi.” | section breaks | section breaks | 6:10, 6:14, 6:24, 7:1 | 122, 53, 119, 93, 95 |
| Shĕmoth 11 | Day 3 ends in the middle of the Song of the Sea. | section breaks | section breaks | 14:22, 14:26, 15:1, 15:20 | 107, 54, 99, 198, 110 |
| Shĕmoth 13 | Uneven week: day 5 (17:14–16) is only 37 words. | scene breaks | scene breaks | 16:32, 17:1, 17:4, 17:8 | 51, 77, 56, 71, 119 |
| Shĕmoth 19 | Day 2 ends inside the goat-hair curtains. | section breaks | section breaks | 26:7, 26:15, 26:23, 26:26 | 92, 109, 86, 41, 52 |
| Shĕmoth 21 | Day 3 ends inside the breastplate section. | keep | keep | 28:6, 28:15, 28:27, 28:36 | 114, 115, 142, 141, 121 |
| Wayyiqraʾ 5 | Uneven week: days 1 and 3 are under 50 words. | scene breaks | scene breaks | 10:4, 10:8, 10:12, 10:16 | 49, 75, 43, 81, 79 |
| Wayyiqraʾ 8 | Day 2 ends inside the law of baldness. | section breaks | section breaks | 13:35, 13:40, 13:50, 13:56 | 111, 58, 130, 112, 78 |
| Wayyiqraʾ 10 | Day 4 ends inside the purification of a house. | keep | keep | 14:39, 14:43, 14:46, 14:51 | 84, 55, 46, 62, 72 |
| Wayyiqraʾ 11 | Uneven week: day 1 is 60 words, day 5 is 133. | keep | keep | 15:6, 15:13, 15:18, 15:25 | 60, 88, 77, 98, 133 |
| Wayyiqraʾ 14 | Day 1 ends inside the law of the shĕlamim offering. | section breaks | section breaks | 19:9, 19:12, 19:16, 19:20 | 80, 35, 50, 53, 52 |
| Wayyiqraʾ 15 | Day 3 ends inside the list of forbidden unions. | keep | keep | 19:33, 20:8, 20:17, 20:23 | 108, 170, 123, 107, 90 |
| Wayyiqraʾ 22 | Day 3 ends inside the law of a dedicated field. | keep | keep | 27:9, 27:14, 27:20, 27:28 | 109, 67, 87, 100, 95 |
| Bĕmidhbar 4 | Uneven week: day 1 (4:17–20) is only 43 words. | keep | keep | 4:21, 4:29, 4:38, 5:1 | 43, 115, 115, 142, 132 |
| Bĕmidhbar 6 | Day 1 ends one verse into the princes' offerings. | section breaks | section breaks | 7:1, 7:12, 7:24, 7:36 | 41, 152, 137, 132, 132 |
| Bĕmidhbar 10 | Day 4 ends at 12:8, inside the Miryam episode. | keep | keep | 11:23, 11:30, 12:1, 12:9 | 140, 110, 88, 104, 93 |
| Bĕmidhbar 15 | Uneven week: day 1 is 161 words, day 5 is 69. | keep | keep | 17:27, 18:8, 18:15, 18:21 | 161, 144, 105, 112, 69 |
| Bĕmidhbar 16 | Day 3 ends inside the laws of corpse impurity. | scene breaks | scene breaks | 19:1, 19:11, 20:1, 20:7 | 112, 147, 199, 84, 108 |
| Bĕmidhbar 17 | Day 4 ends inside the battle with Siḥon, before the poets' song. | scene breaks | scene breaks | 20:22, 21:4, 21:21, 21:33 | 114, 158, 211, 161, 64 |
| Bĕmidhbar 19 | Day 1 ends inside Bilʿam's second oracle. | scene breaks | scene breaks | 23:18, 23:27, 24:10, 24:14 | 73, 105, 157, 70, 131 |
| Bĕmidhbar 22 | Day 1 ends before Moshe carries out Yehoshuaʿ's appointment. | keep | keep | 27:22, 28:5, 28:11, 28:16 | 94, 73, 63, 73, 102 |
| Bĕmidhbar 24 | Day 2 ends inside the laws of vows. | keep | keep | 30:7, 30:14, 31:6, 31:13 | 86, 105, 111, 115, 156 |
| Bĕmidhbar 26 | Day 1 ends inside Moshe's rebuke of Gad and Reʾuven. | scene breaks | scene breaks | 32:6, 32:16, 32:25, 32:33 | 71, 137, 117, 110, 121 |
| Bĕmidhbar 27 | Day 2 ends inside the list of encampments. | keep | keep | 33:10, 33:27, 33:40, 33:50 | 110, 87, 88, 70, 109 |
| Bĕmidhbar 28 | Uneven week: day 5 (35:6–8) is only 50 words. | keep | keep | 34:7, 34:16, 35:1, 35:6 | 82, 115, 107, 76, 50 |
| Dĕvarim 4 | Day 1 ends at 4:4, inside Moshe's opening charge. | keep | keep | 4:5, 4:15, 4:25, 4:31 | 170, 183, 157, 101, 178 |
| Dĕvarim 9 | Day 4 ends inside the list of wonders in Egypt. | section breaks | section breaks | 10:6, 10:12, 10:16, 11:2 | 81, 99, 62, 93, 137 |
| Dĕvarim 13 | Uneven week: day 3 (15:19–23) is only 60 words. | keep | keep | 15:12, 15:19, 16:1, 16:9 | 104, 100, 60, 129, 137 |
| Dĕvarim 16 | Day 2 ends inside the ʿegla ʿărufa ritual. | scene breaks | scene breaks | 21:1, 21:10, 21:15, 21:22 | 170, 136, 70, 114, 118 |
| Dĕvarim 21 | Three days end inside the curses (28:15–68). | keep | keep | 28:15, 28:32, 28:50, 28:63 | 199, 219, 224, 222, 240 |
| Dĕvarim 22 | Days 2 and 3 end inside the warnings after the covenant. | keep | keep | 29:15, 29:20, 29:26, 30:4 | 83, 103, 105, 95, 111 |
| Dĕvarim 24 | Day 2 ends inside Haʾazinu. | keep | keep | 32:13, 32:24, 32:36, 32:44 | 125, 122, 119, 97, 153 |
| Dĕvarim 25 | Day 4 ends at Moshe's burial, before his epitaph. | keep | keep | 33:12, 33:20, 34:1, 34:7 | 135, 89, 115, 90, 86 |

The 24 "keep" decisions force the WLC automatic cut points. On WLC this changes nothing. On another text they pin those verses rather than letting the optimizer re-choose them; `--keep-as-automatic` releases them (see 6).

## 4. Inputs

| Input | Source | Notes |
|---|---|---|
| Torah text, words, petuḥa and setuma | OSHB morphhb `wlc/{Gen,Exod,Lev,Num,Deut}.xml`, commit `3d15126fb1ef74867fc1434be1942e837932691f` | Downloaded 2026-11-07. Byte-identical to that commit, re-fetched 2026-11-10 (`inputs/wlc/SHA256SUMS`). Internal version: WLC 4.20, morphology release 2018-12-14. Details in `inputs/wlc/SOURCE.md` |
| Seder starts, `data/seder_starts.json` | Typed by Claude from https://dmsenter89.github.io/siddur/appendix/ey-triennial/ on 2026-11-07 | One correction from the owner (Wayyiqraʾ 12 → 16:1). Totals: Bĕreʾshith 36, Shĕmoth 29, Wayyiqraʾ 22, Bĕmidhbar 29, Dĕvarim 25 |
| ʿĂliyyoth, `data/aliyot.txt` | Typed by Claude from the same page on 2026-11-07 | Seven cells per seder, Hebrew numerals `chapter:verse-verse`. Only each cell's start is used |
| Books, `data/books.json` | Typed by hand | Order, OSIS file codes, Hebrew names, transliteration (owner's scheme), English names |
| Day names, labels | `config/params.json` | — |
| Calendar (extras) | `@hebcal/core` 6.15.0 via npm, run under Node 22.23.4 | Hebrew years 5788–5799, diaspora and Israel |
| Owner's review choices | claude.ai artifact https://claude.ai/artifact/K7gDKhGm1XxDmC8QhrB8th, db collection `choices` | Exported 2026-11-10 into `data/review_choices.json` |

**Caveat on the two hand-typed tables.** I could not download the page's HTML from this workspace; outbound requests to github.io were refused by the proxy with a 403, both on 2026-11-07 and 2026-11-10. The tables were typed from the output of a page-reading tool that returns a model-written rendering of the page, not the raw HTML. That 2026-11-07 output is no longer available, **so the tables can't be re-checked byte for byte against what the page said that day.**

On 2026-11-10 I read the page again through the same tool for the 19 seder rows behind the warnings in 6. Every cell matched `data/aliyot.txt`, so those inconsistencies are in the site's table, not my transcription, to the extent a model-mediated reader can show. The safest fix is still to regenerate `seder_starts.json` and `aliyot.txt` from the source data in your siddur repository, using one versification throughout.

## 5. Outputs

**`outputs/plan.json`**: `{rows, sed, split_source, text_source}`

`rows` has one object per reading day, 705 in total:

| Field | Meaning |
|---|---|
| `week` | 1–141, the seder's position in the cycle (not a calendar week) |
| `book` | Book code (`Gen` … `Deut`) |
| `tr`, `heb` | Book name, transliterated and in Hebrew |
| `seder` | Seder number within the book |
| `seder_he` | Seder number as a Hebrew numeral |
| `dayn` | Day number, 1–5 |
| `day` | Day name, Sunday–Thursday |
| `start`, `end` | First and last verse, `c:v` (Hebrew numbering) |
| `ref` | English reference, e.g. `Genesis 24:17–41` (en dash; `c:v–c:v` across chapters) |
| `href` | Hebrew reference, e.g. `בראשית כד:יז-מא` (hyphen; ` - ` across chapters; no gershayim) |
| `verses`, `words` | Counts for the day |
| `endk` | How the day ends: `petuha`, `setuma`, `aliyah`, `chapter`, `verse` (mid-paragraph) or `seder end` |
| `target` | The seder's T = seder words ÷ 5, rounded to 0.1 |

`sed` has one object per seder: `week`, `book`, `n` (seder number), `words`, `verses`, `ref` (`c:v–c:v`), `heref` (Hebrew), and `days` (the five day word counts).

`split_source` maps week to the label shown in the spreadsheet's Split column: `Automatic`, `Reviewed: kept`, `Reviewed: section breaks`, `Reviewed: evener split`, `Reviewed: scene breaks` or `Reviewed: evener, day 2 to 24:41`. `text_source` is the adapter's `NAME`.

`reference_outputs/plan_wlc.json` has only `rows` and `sed`; it predates the two extra keys.

**`outputs/chumash_reading_days.xlsx`**
- **Reading Days** has one row per day. Columns: Week, Book, ספר, Seder, סדר, Day #, Day, Start, End, Reference, מראה מקום, Verses, Words, Ends on, Daily target (words), % of target, Split.
  - "Ends on" maps `endk` to Petuḥa, Setuma, ʿĂliyya, Chapter end, Mid-paragraph or Seder end.
  - Daily target is the formula `SUMIFS(words by week)/5`; % of target is Words ÷ target.
  - Even weeks are shaded.
- **Sedarim** has one row per seder: Week, Book, ספר, Seder, סדר, Range, טווח, then formulas for Verses, Words, Avg words/day, Lightest day, Heaviest day and Heaviest ÷ lightest.
- **Stats** is all formulas: overall totals, words per day (mean, median, SD, CV, percentiles, short and long days), verses per day, evenness bands, words per seder, where days end, and a by-book table.
- **Notes** has ten lines on how the plan was made. Two of them come from the text adapter's `SHEET_NOTES`.
- Formulas are written without cached values. Excel computes them on open. The reference copy was recalculated with LibreOffice.

**`outputs/review_items.json`**: one object per flagged seder.

| Field | Meaning |
|---|---|
| `id` | `<slug>-<n>`, e.g. `gen-16` |
| `book` | Book name, transliterated |
| `seder` | Seder number |
| `range` | The seder's verse range |
| `kind` | `mid` or `uneven` |
| `issue` | The problem, in words |
| `rec` | Recommended option key, or null |
| `breaks` | One entry per mid-paragraph break: `before`, `bword`, `after`, `aword` (verse refs and the words on each side) |
| `options` | One entry per option: `key`, `label`, `note`, `days` (each with `ref`, `words`, `end`) |

**`outputs/override_report.json`**: one entry per applied override.

| Field | Meaning |
|---|---|
| `id` | Review id |
| `choice` | The owner's choice |
| `day_starts` | Forced first verses of days 2–5 |
| `ends_now`, `ends_at_decision` | Break kinds on the current text and on WLC |
| `words_now`, `words_at_decision` | Day word counts on the current text and on WLC |
| `automatic_day_starts_now` | What the optimizer would pick on the current text |
| `changed` | True if the ends or word counts differ from the decision |

**`outputs/review_page.html`** is a self-contained page. It saves choices only when published as a claude.ai artifact with `capabilities: {"db": {}}`.

## 6. Open issues

**Known to be approximate**
- **Qere words are counted twice.** `textsource_wlc.py` counts every `<w>`, including qere readings inside `<note>` elements: 70 extra words in 64 verses (for example Gen 8:17). Ketiv and qere are both counted where they differ. This was not intended, but it is what the delivered plan uses.
- **Mid-verse section marks.** Four petuḥa or setuma marks fall inside a verse: Gen 35:22, Deut 2:8, Deut 5:21 and Deut 23:8. Each is treated as a break after the whole verse. Three day ends rest on this: Gen 35:9–22 (petuḥa), Deut 2:2–8 (setuma) and Deut 5:11–21 (setuma). Each of those days includes the words after the mark, which really begin the next section.
- **The Decalogue follows WLC's verse numbering.** Seder starts, ʿăliyyoth and override verses are all `c:v` keys. Check that the new text numbers Exod 20 and Deut 5 the same way; `validate_inputs.py` errors on any key that doesn't exist.
- **Topic changes are not modeled.** Chapter ends stand in for them, and only 13 sedarim have hand-picked scene breaks.
- **The calendar figure is rough.** "About 45–46 regular Shabbatoth a year" (3.1 years per pass) comes from `extras/calendar_count.mjs`. It excludes Shabbatoth on Yom Ṭov, Ḥol HaMoʿed, Rosh Ḥodesh and Yom Kippur. It counts year by year from 23 Tishrei, even though the cycle spans years. The diaspora average is 45.5; Israel's is 46.0. The exclusion list is my reading of the owner's rule ("the EY tradition of replacing the reading on Rosh Hodesh in addition to YT"); the owner never confirmed Ḥol HaMoʿed.
- **Curriculum doc estimate.** The figure of "6–10 repetitions per pasuq a week" is my estimate, not a computed value.

**Decided provisionally**
- The `verse` cost of 0.25, the 2.2 ratio threshold, the review option costs (50 and 0.15) and the other break costs were chosen by eye on WLC output.
- On a new text, "keep" decisions still force WLC's automatic cut points. Whether they should instead follow the optimizer (`--keep-as-automatic`) is open.
- The notes in `data/review_notes.json` and `scene_options.json` quote WLC word counts and describe WLC breaks. On another text they may be wrong; re-read them before reusing recommendations.
- Bĕreʾshith 16 day 2 is 311 words, the heaviest day, by the owner's choice.

**Inconsistencies in the hand-typed ʿăliyya table**

`validate_inputs.py` reports these 18. None is fatal, because only ʿăliyya starts are used, but each start feeds the 0.03 break cost.

- Gen seder 1: ʿăliyya 4 starts 1:14 but ʿăliyya 3 ends 1:12 (skips 1 verse(s))
- Gen seder 17: last ʿăliyya ends 26:34, seder ends 26:35
- Gen seder 22: last ʿăliyya ends 32:2, seder ends 32:3
- Gen seder 23: first ʿăliyya starts (32, 3), seder starts (32, 4)
- Gen seder 23: ʿăliyya 5 starts 33:1 but ʿăliyya 4 ends 32:32 (skips 1 verse(s))
- Gen seder 28: last ʿăliyya ends 40:22, seder ends 40:23
- Gen seder 31: last ʿăliyya ends 43:14, seder ends 43:15
- Gen seder 32: first ʿăliyya starts (43, 15), seder starts (43, 16)
- Exod seder 15: last ʿăliyya ends 20:23, seder ends 20:26
- Exod seder 29: ʿăliyya 7 starts 40:33 but ʿăliyya 6 ends 40:33 (overlaps by 1 verse(s))
- Lev seder 18: ʿăliyya 7 starts 24:13 but ʿăliyya 6 ends 24:9 (skips 3 verse(s))
- Lev seder 21: ʿăliyya 7 starts 26:44 but ʿăliyya 6 ends 26:44 (overlaps by 1 verse(s))
- Num seder 10: ʿăliyya 3 starts 11:25 but ʿăliyya 2 ends 11:25 (overlaps by 1 verse(s))
- Num seder 12: ʿăliyya 4 starts 14:26 but ʿăliyya 3 ends 14:27 (overlaps by 2 verse(s))
- Num seder 20: ʿăliyya 3 starts 26:1 but ʿăliyya 2 ends 25:18 (skips 1 verse(s))
- Deut seder 15: last ʿăliyya ends 20:8, seder ends 20:9
- Deut seder 21: ʿăliyya 6 starts 29:1 but ʿăliyya 5 ends 28:58 (skips 11 verse(s))
- Deut seder 24: ʿăliyya 3 starts 32:13 but ʿăliyya 2 ends 32:11 (skips 1 verse(s))

These cells match the site (see 4). What they mean:

- **Genesis 31–32 uses Christian numbering in the ʿăliyya cells.** Hebrew 32:1 is Christian 31:55. The seder ranges are Hebrew (Bĕreʾshith 23 = 32:4–33:17), but its ʿăliyyoth (`לב:ג-ח`, `לב:ט-יב`, `לב:יג-כ`, `לב:כא-לב`) follow Christian numbering. This explains four warnings: seder 22's last ʿăliyya ending at 32:2, seder 23's first starting at 32:3, the skipped 32:33, and the skip before 33:1. **Effect on the delivered plan:** two Bĕreʾshith 23 days (32:4–12 and 32:13–20) are marked as ending on an ʿăliyya, but the true Hebrew ʿăliyya starts are 32:14 and 32:22, one verse later.
- **The Decalogue numbering differs.** The site ends Shĕmoth 15 at 20:23, which fits the Hebrew-Bible numbering where the four short commandments are one verse (Exodus 20 = 23 verses, Deuteronomy 5 = 30). WLC numbers them separately: 26 and 33 verses, with 20:13–16 being לא תרצח, לא תנאף, לא תגנב, לא תענה. Sedarim still begin at the same places (21:1 and 6:4), so their content is unchanged. But the site's ʿăliyya starts after those commandments point three verses early in WLC: Shĕmoth 15's 20:15 and 20:19, and Dĕvarim 5's 5:19, 5:25 and 5:29. **Effect on the delivered plan:** Dĕvarim 5 day 4 (5:22–28) is marked as ending on an ʿăliyya. That is an artifact; the site's 5:29 is WLC 5:32. Shĕmoth 15's days end on a setuma (20:6) and a petuḥa (20:17), so they are unaffected. This is also why Shĕmoth 15's last ʿăliyya appears to end at 20:23 instead of 20:26.
- **Miqra according to the Masorah** most likely uses the combined Decalogue numbering and Hebrew numbering in Genesis 32, which would match the site's ʿăliyyoth in Exodus 20 and Deuteronomy 5 but not in Genesis 32. Confirm before trusting either table.
- **Dĕvarim 21** (`כח:טו-נח` followed by `כט:א`): 58 is probably a typo for 68. The cells may also use Christian numbering there (Christian 29:1 = Hebrew 28:69).
- **Bĕreʾshith 31/32** (`מג:טו`): the seder range says seder 32 begins at 43:16, but its first ʿăliyya says 43:15. I can't tell which is right.
- **The rest** are single-verse gaps or overlaps between consecutive ʿăliyyoth, probably typos in the site's table: Gen 1:13, Gen 26:35, Gen 40:23, Exod 40:33, Lev 24:10–12, Lev 26:44, Num 11:25, Num 14:26–27, Deut 20:9, Deut 32:12. Num 25:19 is probably numbering again: Christian Bibles join Hebrew 25:19 to 26:1, so the site's ʿăliyya starting 26:1 may be meant to include it.

**Known bug fixed in the source data**
- Wayyiqraʾ seder 12 started at 15:25 on the site; corrected to 16:1. Check whether the site itself has been fixed.

**Things the current tooling doesn't do**
- No dates are attached to weeks. Week = seder number.
- `find_review_candidates.py` doesn't re-flag sedarim that were already overridden but no longer meet the criteria on a new text. Use `override_report.json` for those.

**Could not be recovered exactly**
- **The raw page.** The seder and ʿăliyya tables as they appeared on the page on 2026-11-07 (see 4). The data files are my transcription.
- **Per-seder reasons.** The owner gave none beyond the Bĕreʾshith 16 comment. The recorded "reasons" are the flag reason and the option description shown at the time.
- **Projects built elsewhere.** The earlier yearly Chumash calendar and the Tanakh reading-plan rules (see 0) were built in other conversations and are not available here.
- **The open comment thread.** The comment thread on the review artifact (b57ec577…) is still open in claude.ai. Claude couldn't resolve it because it wasn't sent to Claude.

## 7. Re-running on Miqra according to the Masorah

1. **Write a text adapter.** Create `src/textsource_mam.py` with `NAME`, `SHEET_NOTES`, `load_book` and `verse_words`, following the interface in `src/textsource_wlc.py`. Decide and document what counts as a word (maqqef compounds, ketiv/qere) and where petuḥa and setuma fall. MAM follows the Aleppo Codex tradition, so expect section marks to move.
2. **Validate.** Run `python3 src/validate_inputs.py --source mam` and fix any seder, ʿăliyya or override verse that doesn't exist in MAM's numbering.
3. **Build.** Run `python3 src/build_plan.py --source mam`, then read the "differing from what was decided on" list and `outputs/override_report.json`.
4. **Review.** Run `python3 src/find_review_candidates.py --source mam` and `build_review_page.py`, publish the page, collect choices, then update `data/review_choices.json`, `modifications.json`, `review_notes.json` and `scene_options.json`.
5. **Regenerate overrides.** `make_overrides.py` deliberately refuses to run on anything but WLC, because `at_decision` records the decision-time text. For a MAM review, change that guard and the `at_decision.text` value.
6. **Write the spreadsheet.** Run `python3 src/build_xlsx.py --source mam`; the Notes sheet takes its source lines from the adapter.
