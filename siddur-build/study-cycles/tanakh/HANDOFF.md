# Handoff: even Tanakh reading plans

This package rebuilds two published reading-plan pages from source:

| Page | File | What it is |
|---|---|---|
| **Even Tanakh Year** (plan 1, "continuous") | `expected/even-tanakh-year.html` | The Torah read straight through in 50 weeks, ignoring parasha boundaries. Each day also has a Neviʾim and a Ketuvim reading, so all of Tanakh is finished in 50 weeks. Readings are balanced by word count. |
| **Tanakh by the Parasha** (plan 2, "parasha") | `expected/tanakh-by-parasha.html` | Each of the 54 parashiyyot is split into 5 or 6 balanced days, with Neviʾim and Ketuvim readings alongside, so Tanakh ends with Wĕzoʾth Habbĕrakha. |

Each page has two versions, 6 reading days a week (Shabbat is the catch-up day) and 5 reading days (Friday and Shabbat are catch-up days). A three-way switch on the page chooses Torah, Nakh, or Both.

**Status:** `./run_all.sh --compare` rebuilds all four outputs (two JSON files and two HTML pages) from the pinned inputs, and they match the published files byte for byte. The next step planned is to swap the source text from the Westminster Leningrad Codex (WLC) to *Miqra according to the Masorah* (MAM). Section 7 says what that touches.

---

## 1. Code

### How to run

```bash
pip install -r requirements.txt     # numpy only
./run_all.sh --compare              # ~1 min; fetches WLC, builds, verifies
```

The outputs go to `output/`, and intermediate files go to `work/`.

### Pipeline (`pipeline/`, the final working version)

| Step | Script | Reads | Writes | Does |
|---|---|---|---|---|
| 0 | `inputs/fetch_wlc.sh` | — | `inputs/wlc/*.xml` | Downloads the 39 WLC books at a pinned commit and checks their sha256. |
| 1 | `01_parse_torah.py` | WLC Gen–Deut, `inputs/hebcal/aliyot.json` | `work/torah_verses.json` | Parses verses and counts words. Detects petuḥa/setuma. Renumbers the Decalogue. Marks ʿaliyya ends and parasha starts. Assigns a break cost and kind to every verse. Applies the shared hand scene breaks. |
| 2 | `02_parse_nakh.py` | WLC Neviʾim + Ketuvim | `work/nakh_verses.json` | Does the same for Nakh in the Rambam's order: Psalm ends, Ps 119 stanzas, hand scene breaks, and the surcharge on plain-verse breaks in poetic books. |
| 3 | `03_plan_continuous.py` | step 1 | `work/torah_continuous.json` | Plan 1 Torah track: one DP over the whole Torah into 300 or 250 readings, never crossing a book. |
| 4 | `04_plan_parasha.py` | step 1 | `work/torah_parasha.json` | Plan 2 Torah track: applies the plan-2-only hand breaks, then splits each parasha with its own DP into 6 or 5 readings. |
| 5 | `05_nakh_tracks.py continuous\|parasha` | steps 2 + 3/4 | `output/plan_*.json` | Neviʾim and Ketuvim tracks: per-day targets fill out what the Torah reading leaves, with one DP per track. |
| 6 | `06_render.py` | `output/plan_*.json`, `templates/` | `output/*.html` | Puts the JSON into the page templates. |
| 7 | `07_verify.py [--compare]` | everything | `work/report.json` | Checks coverage, checks plain-verse endings against the accepted list, and optionally byte-compares with `expected/`. Writes the stats, hand-break usage and the mid-verse-mark list. |

`common.py` holds the parser, the reference formatters and the three solvers. Every number and hand decision is read from `config/`.

### Relationship to what was actually run

The pipeline is a consolidation of the scripts that produced the pages. I rewrote it so it runs cleanly end to end, and it reproduces the original output exactly. The scripts as they ran are kept verbatim in `original_scripts/` for provenance. Their quirks are why they weren't shipped as the main code:

- **Hard-coded paths and hidden side effects:** `plan_continuous/data.py` rewrites `plans.json` whenever it is imported, and `plan_parasha/build.py` imports it from `/root/plan`. Every script reads and writes files in the current directory.
- **Fragile labels:** "kind" labels were recovered from float cost values, and lists were patched in place by `sed` between runs. What's in `original_scripts/` is the final patched state.
- **As-run order:**
  1. `hebcal/aliyot.mjs` produced `aliyot.json`.
  2. `plan_continuous/build.py <wlc-dir>` produced `verses.json`.
  3. `dp.py` produced `segs300.json` and `segs250.json`.
  4. `data.py` produced `plans.json`.
  5. `nakh.py <wlc-dir>` produced `nakh_verses.json`.
  6. `three.py` produced `plans3.json`, which is plan 1's data.
  7. For plan 2, run from `/root/plan`: `plan_parasha/build.py` produced `torah.json`, then `plan_parasha/nakh.py` produced `full.json`, which is plan 2's data.

Not included, because they were superseded or never saved:

- `nakh_dp.py` and `nakh_data.py`: an intermediate version with one combined Nakh track, replaced by the three-track version (`three.py`).
- `template.html` and `template2.html`: drafts of the Torah-only page and the two-track page.
- The page HTML was built and later edited with throwaway inline Python snippets: injecting data, adding the Nakh columns, then the three-way switch. **Those snippets were never saved and can't be recovered.** They don't need to be, because their combined result is the final page. `templates/*.tmpl` are the final published pages with the embedded JSON replaced by `__DATA__` and `__TR__`, and step 6 reproduces the pages exactly from them.

---

## 2. Parameters (`config/params.json`)

### Cost function

The DP minimises the sum over all readings of

```
alpha · ((W − T) / S)²  +  break_cost(last verse of the reading)
```

where W is the words in the reading, T its target and S a normaliser. `alpha = 12.0`. The DP is exact, not greedy or heuristic.

| Track | Target T | Normaliser S | Max verses per reading | Crossing allowed? |
|---|---|---|---|---|
| Plan 1 Torah | total Torah words ÷ readings (300 or 250) | T | 120 (never binds; the longest is 49) | No book crossing |
| Plan 2 Torah | parasha words ÷ days (6 or 5) | T | none | Split per parasha, so it can never cross a parasha or a book |
| Neviʾim / Ketuvim (both plans) | see below | mean of that track's targets | 260 (never binds; the longest is 63) | Yes, readings may cross books |

**How Neviʾim and Ketuvim share a day:**

```
Ttot          = (Torah words + Neviʾim words + Ketuvim words) / readings
remainder_d   = Ttot − torah_words_d
target_track_d = remainder_d × W_track / (W_neviim + W_ketuvim)
```

With WLC, Neviʾim has 141,513 words and Ketuvim 84,012, which gives shares of 62.75% and 37.25%. The Torah track is computed first and isn't affected by Nakh. Both Nakh tracks have exactly as many readings as the Torah track, and each reading has at least one verse.

**Reading counts:** plan 1 has 50 weeks × 6 = 300 readings or 50 × 5 = 250. Plan 2 has 54 × 6 = 324 or 54 × 5 = 270.

### Break costs: Torah

These are the costs of ending a reading after a verse. The first rule that matches wins, in this order:

| Order | Kind | Cost | Rule |
|---|---|---|---|
| 1 | `book` | 0.0 | last verse of a book |
| 2 | `petuha` | 0.0 | verse contains an `x-pe` seg |
| 3 | `setuma` | 0.1 | verse contains an `x-samekh` seg |
| 4 | `aliyah` | 0.6 | last verse of any hebcal ʿaliyya, including maftir |
| 5 | `chapter` | 1.2 | last verse of a chapter |
| 6 | `verse` | 3.0 | anything else |
| then | `scene` | 0.8 | a hand-listed verse whose cost is above 0.8 drops to 0.8 |

### Break costs: Neviʾim/Ketuvim

| Order | Kind | Cost | Rule |
|---|---|---|---|
| 1 | `book` | 0.0 | last verse of a book |
| 2 | `petuha` | 0.0 | `x-pe` |
| 3 | `setuma` | 0.1 | `x-samekh` |
| 4 | `psalm` | 0.0 | chapter end in Tĕhillim (every psalm boundary counts as a section) |
| 5 | `chapter` | 0.5 | chapter end in any other book |
| 6 | `stanza` | 0.2 | Ps 119, verse number divisible by 8 (the alphabetic stanzas) |
| 7 | `verse` | 3.0 | anything else |
| then | `scene` | 0.8 | a hand-listed verse whose cost is above 0.8 drops to 0.8 |
| else | `verse` | 5.0 | a plain verse (cost 3.0) in Ps, Job, Prov, Eccl, Song or Lam |

### Other rules

- **Word count:** the number of `<w>` elements in the verse. Prefixes joined by `/` count as one word; maqaf-joined words count separately. Torah counts `<w>` inside `<note>` (the qere) and Nakh does not; see 6b.
- **Decalogue:** WLC Exod 20:13–16 are merged into 20:13, and Deut 5:17–20 into 5:17, giving Jewish numbering. Word counts are summed, the mark is the last one in the range, and later verses are renumbered.
- **Short books read together:** there is no special rule for this. It falls out of Nakh readings being allowed to cross books. Book ends cost 0, so the optimizer usually stops at them unless the book is too short. For example, ʿOvadya never gets a day of its own.
- **Chapter-end fallback:** Rut, ʾIyyov, Mishle and Qoheleth have few or no section marks in WLC, so their days end at chapter ends (cost 0.5). The poetic surcharge (5.0) pushes poetry days toward chapter ends rather than mid-chapter verses.
- **Catch-up days** carry no reading. The 6-day plan's catch-up day is Shabbat, and the 5-day plan's are Friday and Shabbat.

---

## 3. Hand decisions

### Hand-picked break points (`config/hand_breaks.json`, read by the code)

| Group | Entries | Applies to | Used in the final output | Unused |
|---|---|---|---|---|
| `torah_all_plans` | 56 | Plan 1 and plan 2 Torah | 44 | Gen 24:61, 27:29, 31:42, 34:12, 37:24, 41:13, 42:17, 43:14, 45:15; Exod 5:21; Num 22:21; Deut 28:46 |
| `torah_parasha_plan_only` | 21 | Plan 2 Torah only | 15 | Exod 39:21, 39:31; Lev 16:28, 26:22, 26:39; Deut 34:8 |
| `nakh_all_plans` | 18 | Neviʾim/Ketuvim, both plans | 14 | Eccl 2:26; Neh 9:31; Ezek 40:4, 40:27 |

`work/report.json → hand_break_usage` lists each entry and the plans where it was used.

**What was recorded, and what wasn't:**
- **Rounds:** each entry carries the review round it came from. `reasons` gives the reason for each round: what the optimizer had produced and why breaks were added.
- **Per-item reasons:** these were not written down at the time. I'm not reconstructing them. Each entry has `opens_next`, the first words of the following verse, added for this handoff, so a reviewer can see where the break falls and check it against MAM.
- **Notes from the conversation:** where something was said about an item, it's in `note`. Examples: the stages of Gen 24, the end of the "time" poem at Qoh 3:8, the end of Daniʾel's prayer at 9:19, before 11:21, and the gates in Ezek 40.

### Accepted exceptions (`hand_breaks.json → accepted_exceptions`)

Five days in the final output end at a plain verse, all in the 6-day parasha plan. `07_verify.py` fails if this set changes.

| Track | Reading | Status |
|---|---|---|
| Torah | Exod 39:2–16 (Pĕqudhe) | Reviewed and accepted: the parasha has too few breaks to split six ways |
| Torah | Lev 13:40–51 (Tazriaʿ) | Reviewed and accepted |
| Torah | Lev 20:9–18 (Qĕdhoshim) | Reviewed and accepted |
| Ketuvim | Ruth 2:1–11 | **Not reviewed.** Overlooked; never shown to Michael |
| Neviʾim | 2 Kgs 22:3–23:7 | **Not reviewed.** Overlooked; never shown to Michael |

### Other decisions made by hand (all are in config, none in code)

- **Plan length and catch-up days:** 50 weeks for plan 1, and the catch-up days described in section 2. Michael chose 5 or 6 reading days with a catch-up day.
- **Book order:** the Rambam, Hilkhot Sefer Torah 7:15, as read from the Torat Emet 370 text on Sefaria. Neviʾim: Josh, Judg, Sam, Kgs, Jer, Ezek, Isa, the Twelve. Ketuvim: Ruth, Ps, Job, Prov, Eccl, Song, Lam, Dan, Esth, Ezra(–Neh), Chr.
  - The Rambam lists the Twelve as one book. Their internal order here is the standard one, which is an assumption.
  - Sam, Kgs and Chr halves share one Hebrew label, and Neh is labelled עזרא.
- **Neviʾim/Ketuvim as separate tracks:** Michael asked for three readings a day ("meshullash") rather than one combined Nakh reading.
- **Poetic surcharge:** plain verses in poetic books cost 5.0, added during Nakh review round 1.
- **Versification:** only the Decalogue was renumbered.
- **Parasha names:** the transliteration is Michael's scheme, applied strictly. That includes a word-final ʾ (Wayyeraʾ, Boʾ) and spelled-out rafe letters (Ki Thissaʾ, Pĕqudhe). Michael was asked whether to drop the final ʾ, and no answer was recorded. The Hebrew names were typed by hand with deficient spellings.

---

## 4. Inputs

| Input | Where it came from | In this package |
|---|---|---|
| Hebrew text with section marks | Westminster Leningrad Codex, OSIS XML from **openscriptures/morphhb**, `wlc/<Book>.xml`, commit `3d15126fb1ef74867fc1434be1942e837932691f`. Downloaded on 2026-10-30 from `master`; on 2026-11-10 I confirmed all 39 files are byte-identical to that commit. The URL pattern is `https://raw.githubusercontent.com/openscriptures/morphhb/<commit>/wlc/<Book>.xml`. | Not bundled (28 MB). `inputs/fetch_wlc.sh` downloads it and checks it against `inputs/wlc_sha256.txt`. |
| ʿAliyya and parasha boundaries | `@hebcal/leyning` 10.1.0 and `@hebcal/core` 6.14.7 (Node 22). `getLeyningForParsha(p).fullkriyah` for each of the 54 `parshiot`. The result has 431 rows: 54 × ʿaliyyot 1–7 plus 53 maftir (Wĕzoʾth Habbĕrakha has none). These are hebcal's standard (Ashkenazi) full-kriyah divisions. | `inputs/hebcal/aliyot.json`. Regenerate with `npm ci && node aliyot.mjs > aliyot.json`. |
| Book order and labels | Typed by hand from the Rambam as above | `config/books.json` |
| Parasha names (Hebrew and transliteration) | Typed by hand, in hebcal order, checked by name against `aliyot.json` | `config/parashiyyot.json` |
| Page design and text | Hand-written HTML/CSS/JS | `templates/` |

The pages load Google Fonts (Frank Ruhl Libre, Newsreader, IBM Plex Sans/Mono) and nothing else external.

---

## 5. Outputs

### `output/plan_continuous.json` (plan 1)

`{"6": [row, …300], "5": [row, …250]}`

### `output/plan_parasha.json` (plan 2)

`{"plans": {"6": [row, …324], "5": [row, …270]}, "tr": [54 transliterated names], "he": [54 Hebrew names]}`

### Row fields (one row = one reading day)

| Field | Meaning |
|---|---|
| `w` | Plan 1: week 1–50. Plan 2: parasha number 1–54 (index into `tr`/`he`). |
| `d` | Day in the week, 1–6 or 1–5. Day 1 is Sunday. |
| `ref` | Torah reading, e.g. `Gen 1:1–19` or `Gen 2:4–3:21`. Book ids are OSIS (`Gen Exod Lev Num Deut`), with an en dash. |
| `p` | Hebrew name of the parasha the reading starts in (plan 2: the reading's parasha). |
| `np` | Plan 1: Hebrew names of parashiyyot that begin inside the reading, after its first verse. Plan 2: always `[]`. |
| `words` / `verses` | Size of the Torah reading. |
| `end` | Kind of break after the last verse: `petuha`, `setuma`, `book`, `aliyah`, `scene`, `chapter`, or `verse` (a plain verse). |
| `inc` | First word of the reading, vowels kept and cantillation removed (U+0591–05AF, U+05BD, U+05C0, U+05C3). |
| `n` | Neviʾim reading: `{ref, b, words, verses, end}`. |
| `k` | Ketuvim reading, same shape. |

For the Nakh tracks:
- **`ref`:** whole chapters print as `Ps 3` or `Ps 3–5`, and a reading that spans books joins its parts with ` · `, e.g. `Obad 1 · Jonah 1–2`. Book labels are the `abbrev` values in `books.json`.
- **`b`:** the Hebrew book labels covered, in order and without repeats.
- **`end`:** also allows `psalm` and `stanza`.

### HTML pages

These are self-contained: the data is inlined as `const DATA` (and `const TR` in plan 2). The statistics at the top of each page are computed live from DATA for the selected mode.

The pages save to the viewer's browser storage under these keys:
- `plan`: `"6"` or `"5"`
- `mode`: `torah`, `nakh` or `both` (an older `nakh` key is migrated)
- `done`: an object keyed `"<plan>:<w>:<d>"`

`work/report.json` is produced by verify: per-plan statistics, break-kind counts, plain-verse endings, hand-break usage, and mid-verse section marks.

---

## 6. Open issues

**a. Source text.** WLC's petuḥot and setumot are Leningrad's. They differ in places from the Aleppo tradition the Rambam records, and that is the reason for the planned switch to MAM. The page notes say so explicitly, and that text must change (see 6k).

**b. Inconsistent word counting (bug, kept to reproduce the output).** Torah counts both ketiv and qere where a qere note exists, which adds 70 words out of 80,052. Nakh drops notes, so it counts ketiv only. With MAM, decide ketiv or qere once and use it for both. The setting is `params.word_count.*_include_note_words`.

**c. Position of section marks is ignored.** A verse is marked P or S if the mark appears anywhere in it. WLC has 58 verses where the mark sits mid-verse (pisqa bĕʾemṣaʿ pasuq and similar). Among them are Gen 35:22, Deut 2:8, Deut 23:8 and many in Samuel. The code treats each of these as a zero-cost break at the end of the verse, which is approximate. The full list is in `report.json → mid_verse_section_marks`. Deut 5:21 (WLC numbering) has two marks; P wins.

**d. Torah verse count is 5,847, not the usual 5,845.**
- One extra comes from WLC printing Num 25:19 as its own verse, which in Jewish editions is the opening of 26:1. Because of it, references can show "Num 25:19", and its P mark gives a break inside what Jewish editions treat as one verse.
- The other extra is in Deuteronomy, which has 956 verses here against the commonly cited 955. I didn't track down where it comes from.
- MAM uses Jewish numbering, so this should go away, but check the ʿaliyya mapping after the switch.

**e. Versification in general.** Only the Decalogue was renumbered. WLC versus Jewish numbering in Nakh was not checked. If MAM numbers any verse differently from WLC, the `book/ch/v` entries in `hand_breaks.json` may point at the wrong verse; use `opens_next` to re-anchor them. hebcal ʿaliyya references use standard Jewish numbering, and step 1 asserts that every one resolves. All ʿaliyyot were also checked to be contiguous with WLC plus the Decalogue fix.

**f. ʿAliyya divisions are hebcal's standard (Ashkenazi) ones.** Sephardic divisions differ in some parashiyyot. They matter only as cost-0.6 break points. This choice was provisional and never discussed.

**g. Parameters were set by judgement, not tuned:** alpha, all break costs, the poetic surcharge, and the 120/260 caps (which don't bind). Results were checked by eye against the lists of chapter and plain-verse endings.

**h. Determinism.** The solvers break ties by keeping the first strictly better option, so floating-point ties could in principle resolve differently on another platform or numpy build. `--compare` will show any difference. With a new source text, expect every day to change.

**i. Unreviewed days.** Ruth 2:1–11 and 2 Kgs 22:3–23:7, both in the 6-day parasha plan, end at a plain verse and were never reviewed (see section 3).

**j. Saved progress is positional.** Ticks are stored by plan, week and day, not by reading. Re-running the plan with a new text changes which reading a stored tick refers to for anyone who has been using the published pages.

**k. Hard-coded page text that has to be rewritten after a re-run (`templates/`).**
- **Plan 1:**
  - "Text and section marks follow the Leningrad Codex…"
  - "daily aliyot run from 33 to 935 words, with most days between about 80 and 380" (verified against the current data: 33–935, 10th–90th percentile 81–381)
  - "about 63% and 37%"
  - "Rut, Iyyov, Mishle and Qohelet have few or no section marks…"
  - "50 to 51 weeks"
  - "no day ends mid-paragraph at an arbitrary verse" (true now)
- **Plan 2:**
  - "Three days in the 6-day plan end at an ordinary verse, in Pĕqudhe, Tazriaʿ and Qĕdhoshim" (this omits the two Nakh days in 6i)
  - the Leningrad sentence
- **Both:** the legend and lede.
- The statistics block is computed live, so it needs no change.

**l. Transliteration inconsistency.** Plan 1's notes give the Nakh book names in a looser scheme (Yehoshuaʿ, Rut, Qohelet, Divre haYamim). Plan 2 uses Michael's scheme (Yĕhoshuaʿ, Ruth, Qoheleth, Divre Hayyamim). The final ʾ in parasha names is pending (see section 3).

**m. Calendar handling.**
- **Plan 1:** a fixed 50 weeks with no dates. A leap year leaves about 4 spare weeks, and Tishʿa bĕʾAv is left to the catch-up day.
- **Plan 2:** doubled parashiyyot and festival displacement are handled only by a note on the page ("read both that week"). There is no logic for them.

**n. Display.** A reading that ends at a book end shows the פ badge, the same as a petuḥa.

---

## 7. Switching to MAM: what changes

1. **Parser:** replace `parse_wlc_book` in `pipeline/common.py`. Everything downstream needs only, per verse, `ch`, `v`, `words`, `mark` (`'P'`/`'S'`/`''`) and `first`.
   - **Marks:** in the MAM text I've seen on Sefaria, petuḥot and setumot appear as `{פ}` and `{ס}` in the verse text. Check the export you use, and decide how to handle marks that fall mid-verse (6c).
   - **Ketiv/qere:** settle it per 6b.
2. **Decalogue:** drop or adjust `versification_fixes` once you've checked how your MAM export divides the Decalogue verses. That decides whether a merge is still needed. I haven't checked this.
3. **ʿAliyyot:** re-check that every `aliyot.json` reference resolves (step 1 asserts it), and consider Sephardic divisions (6f).
4. **Hand breaks:** re-anchor `hand_breaks.json` with `opens_next`. Then review the new chapter and plain-verse endings in `report.json` and update `accepted_exceptions`.
5. **Run:** `./run_all.sh` without `--compare`, since the results will differ from `expected/`. Run `07_verify.py --no-exceptions-check` until the exceptions list is updated.
6. **Page text:** rewrite the hard-coded text listed in 6k.
