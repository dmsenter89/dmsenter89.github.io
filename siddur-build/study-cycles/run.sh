#!/usr/bin/env bash
# Rebuild all three study cycles from MAM and the EY table, and write the site data.
# Needs python3 with numpy (uv run --with numpy bash run.sh) and node.
set -euo pipefail
cd "$(dirname "$0")"
python3 ey_table.py
(cd tanakh/pipeline && for s in 01_parse_torah 02_parse_nakh 03_plan_continuous 04_plan_parasha; do python3 $s.py; done \
  && python3 05_nakh_tracks.py continuous && python3 05_nakh_tracks.py parasha && python3 07_verify.py)
(cd seder && PYTHONPATH=src python3 src/build_plan.py)
python3 build_site.py
