"""Step 3: Plan 1 Torah track. Split the whole Torah into weeks*days readings
of even length, never crossing a book.

Writes: work/torah_continuous.json  {"6": [rows], "5": [rows]}
"""
import os

import numpy as np

from common import PARAMS, PARASHIYYOT, WORK, read_json, solve_uniform, torah_ref, write_json

d = read_json(os.path.join(WORK, "torah_verses.json"))
V, starts = d["verses"], d["parasha_start"]
w = np.array([v["words"] for v in V], float)
pen = np.array([v["cost"] for v in V])
order = [v["book"] for v in V]
book_ids = list(dict.fromkeys(order))
bid = np.array([book_ids.index(b) for b in order])
heb_at = {s: PARASHIYYOT[k]["hebrew"] for k, s in enumerate(starts)}
cfg = PARAMS["plans"]["continuous"]
alpha = PARAMS["cost_function"]["alpha"]
assert not cfg["torah_may_cross_books"]

out = {}
for days in PARAMS["plans"]["days_per_week"]:
    N = cfg["weeks"] * days
    segs = solve_uniform(w, pen, bid, N, alpha, cfg["torah_max_verses_per_reading"])
    rows = []
    for t, (a, b) in enumerate(segs):
        rows.append(dict(
            w=t // days + 1, d=t % days + 1, ref=torah_ref(V, a, b),
            p=heb_at[max(s for s in starts if s <= a)],
            np=[heb_at[s] for s in starts if a < s < b],
            words=int(sum(V[i]["words"] for i in range(a, b))), verses=b - a,
            end=V[b - 1]["kind"], inc=V[a]["first"]))
    out[str(days)] = rows
    ws = np.array([r["words"] for r in rows])
    print(days, "days/week:", N, "readings, words", ws.min(), "-", ws.max(), "mean", round(ws.mean()))
write_json(os.path.join(WORK, "torah_continuous.json"), out)
