"""Step 5: add the Neviʾim and Ketuvim tracks to a Torah plan, sized so that
each day's total (Torah + Neviʾim + Ketuvim) stays even.

Usage: python pipeline/05_nakh_tracks.py continuous|parasha
Reads:  work/torah_<plan>.json, work/nakh_verses.json
Writes: output/plan_continuous.json  ({"6": rows, "5": rows})
        output/plan_parasha.json     ({"plans": {...}, "tr": [...], "he": [...]})
"""
import collections
import os
import sys

import numpy as np

from common import OUT, PARAMS, PARASHIYYOT, WORK, BOOKS, make_nakh_ref, read_json, solve_targets, write_json

plan = sys.argv[1]
assert plan in ("continuous", "parasha")
plans = read_json(os.path.join(WORK, f"torah_{plan}.json"))
allv = read_json(os.path.join(WORK, "nakh_verses.json"))["verses"]
heb = {b["osis"]: b["hebrew"] for b in BOOKS["neviim"] + BOOKS["ketuvim"]}
cfg = PARAMS["plans"]["nakh"]
alpha = PARAMS["cost_function"]["alpha"]
assert cfg["may_cross_books"]

tracks = {}
for t in ("n", "k"):
    V = [v for v in allv if v["track"] == t]
    tracks[t] = (V, np.array([v["cost"] for v in V]))
W = {t: sum(v["words"] for v in V) for t, (V, _) in tracks.items()}

for key in [str(d) for d in PARAMS["plans"]["days_per_week"]]:
    tw = np.array([r["words"] for r in plans[key]], float)
    N = len(tw)
    Ttot = (tw.sum() + W["n"] + W["k"]) / N
    rem = Ttot - tw
    for t, (V, pen) in tracks.items():
        w = np.array([v["words"] for v in V], float)
        segs = solve_targets(w, pen, rem * W[t] / (W["n"] + W["k"]), alpha, cfg["max_verses_per_reading"])
        ref = make_nakh_ref(V)
        for r, (a, b) in zip(plans[key], segs):
            books = []
            for i in range(a, b):
                h = heb[V[i]["book"]]
                if h not in books:
                    books.append(h)
            end = V[b - 1]["kind"]
            label = {"book_end": "book", "petuha": "petuha", "setuma": "setuma", "psalm_end": "psalm",
                     "chapter_end": "chapter", "ps119_stanza": "stanza", "scene": "scene", "verse": "verse"}[end]
            r[t] = dict(ref=ref(a, b), b=books, words=sum(V[i]["words"] for i in range(a, b)),
                        verses=b - a, end=label)
        ws = np.array([r[t]["words"] for r in plans[key]])
        print(plan, key, t, ws.min(), "-", ws.max(), "mean", round(ws.mean()),
              dict(collections.Counter(r[t]["end"] for r in plans[key])))
    tot = np.array([r["words"] + r["n"]["words"] + r["k"]["words"] for r in plans[key]])
    print(plan, key, "day total", tot.min(), "-", tot.max(), "mean", round(tot.mean()))

# Torah 'end' labels: rename the internal rule names to the published labels
TL = {"book_end": "book", "petuha": "petuha", "setuma": "setuma", "aliyah_end": "aliyah",
      "scene": "scene", "chapter_end": "chapter", "verse": "verse"}
for rows in plans.values():
    for r in rows:
        r["end"] = TL[r["end"]]

if plan == "continuous":
    write_json(os.path.join(OUT, "plan_continuous.json"), plans)
else:
    write_json(os.path.join(OUT, "plan_parasha.json"),
               dict(plans=plans, tr=[p["translit"] for p in PARASHIYYOT], he=[p["hebrew"] for p in PARASHIYYOT]))
