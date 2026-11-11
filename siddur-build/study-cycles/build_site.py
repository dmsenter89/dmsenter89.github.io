"""Write the three study-cycle data files the site renders (data/siddur/appendix/study-cycles/).

Run after the pipelines (see run.sh). Adds what the site shows beyond the plans
themselves: Five-Day references, Hebrew seder labels and opening/closing phrases,
and the siddur's Divine Name form (siddur-build/normalize-divine-name.mjs) in every phrase.
"""
import json
import subprocess
from pathlib import Path

import mam

HERE = Path(__file__).resolve().parent
SITE = HERE.parents[1] / "data/siddur/appendix/study-cycles"
HEB = dict(zip([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30], "אבגדהוזחטיכל"))


def gematria(n):  # seder numbers, 1..36
    return "טו" if n == 15 else "טז" if n == 16 else (HEB[n // 10 * 10] if n >= 10 else "") + (HEB[n % 10] if n % 10 else "")


def normalize(strings):
    js = "import('../normalize-divine-name.mjs').then(({normalizeDivineName: n}) => " \
         "process.stdout.write(JSON.stringify(JSON.parse(require('fs').readFileSync(0)).map(n))))"
    out = subprocess.run(["node", "-e", js], input=json.dumps(strings), capture_output=True, text=True, cwd=HERE, check=True)
    return json.loads(out.stdout)


def write(name, data, rows):
    """Normalize the Divine Name in each row's inc/fin, then write compactly like the other data files."""
    keys = [(r, k) for r in rows for k in ("inc", "fin") if k in r]
    for (r, k), s in zip(keys, normalize([r[k] for r, k in keys])):
        r[k] = s
    (SITE / name).write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", name, len(rows), "rows")


# Tanakh plans: already in the site's row format
cont = json.loads((HERE / "tanakh/output/plan_continuous.json").read_text())
write("even-tanakh-year.json", {"plans": cont}, [r for rows in cont.values() for r in rows])
par = json.loads((HERE / "tanakh/output/plan_parasha.json").read_text())
write("tanakh-by-parasha.json", {"weekNames": par["tr"], "plans": par["plans"]}, [r for rows in par["plans"].values() for r in rows])

# Five-Day Seder Cycle
plan = json.loads((HERE / "seder/outputs/plan.json").read_text())
text = {}
rows, names = [], {}
for r in plan["rows"]:
    vs = text.setdefault(r["book"], {(x["ch"], x["v"]): x for x in mam.verses(r["book"])})
    (c1, v1), (c2, v2) = (tuple(map(int, x.split(":"))) for x in (r["start"], r["end"]))
    span = f"{v1}–{v2}" if c1 == c2 else f"{v1}–{c2}:{v2}"
    end = r["endk"]
    if end == "seder end":  # label the seder's own end by MAM's mark there, if any
        end = {"P": "petuha", "S": "setuma"}.get(vs[(c2, v2)]["mark"], "seder")
    names[r["week"]] = f"{r['tr']} {r['seder']}"
    rows.append(dict(w=r["week"], d=r["dayn"], ref=f"{r['book']} {c1}:{span}", p=f"{r['heb']} · סדר {gematria(r['seder'])}",
                     np=[], words=r["words"], verses=r["verses"], end=end,
                     inc=vs[(c1, v1)]["first"], fin=vs[(c2, v2)]["last"]))
write("five-day-seder-cycle.json", {"weekNames": [names[w] for w in sorted(names)], "plans": {"5": rows}}, rows)
