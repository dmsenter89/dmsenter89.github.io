# Study cycles

Builds the data for the three reading plans in Appendix > Study Cycles
(`data/siddur/appendix/study-cycles/`): Even Tanakh Year, Tanakh by Parasha
and the Five-Day Seder Cycle.

```bash
uv run --with numpy bash run.sh     # or: pip install numpy; bash run.sh   (needs node too)
```

`run.sh` checks the EY table, runs both planners and writes the three site
files with `build_site.py`, plus the EY Triennial page's display data
(`data/siddur/appendix/ey-triennial-view.json`, from `ey_view.py`: English
references, verse counts and MAM phrases for every seder, ʿăliyya, hafṭara and
special reading). Edit `ey-triennial.json`, never the view file; English names
and notes for the special readings live in its `en` fields. Review `git diff`
of the data before committing. To refresh only the EY page:
`python3 build_site.py`.

## Sources

- **Text:** *Miqra according to the Masorah* from Sefaria (`mam.py`): words,
  pĕthuḥoth and sĕthumoth, verse numbers, opening and closing phrases. Words
  are counted as written (kĕthiv); phrases show what is read (qere). A section
  mark in the middle of a verse counts as a break after that verse. Fetched
  texts are cached in `.cache/` and checked against `mam-sha256.txt`.
- **Sedarim and ʿăliyyoth** (Five-Day): the site's own EY table,
  `data/siddur/appendix/ey-triennial.json`, read by `ey_table.py`
  (`python3 ey_table.py` validates it). It was corrected on 2026-11-10 against
  Gavriel Martindale's calendar templates and Prof. Yosef Ofer's list. An
  ʿăliyya may overlap the previous one so that each has at least 3 verses.
- **Parasha ʿăliyyoth** (Tanakh plans): hebcal, `tanakh/hebcal/aliyot.json`.

## Layout

- `tanakh/`: Even Tanakh Year and Tanakh by Parasha. `config/` holds every
  parameter and hand decision (scene breaks, accepted mid-paragraph days);
  `pipeline/` steps 01–07.
- `seder/`: the Five-Day cycle. `config/params.json`, `data/overrides.json`
  (hand decisions, edited directly), and the 2026-11-07 review record
  (`data/review_*.json`, `scene_options.json`). `find_review_candidates.py` and
  `build_review_page.py` build a tap-to-choose review page if the plan needs
  another review round.
- `*/HANDOFF.md`: how each plan was first built, on the Leningrad Codex, with
  the reasoning behind parameters and hand decisions. The code has since moved
  to MAM; costs and rules are unchanged.
