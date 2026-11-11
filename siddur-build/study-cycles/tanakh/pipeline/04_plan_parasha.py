"""Step 4: Plan 2 Torah track. Split each parasha on its own into exactly
days-per-week readings of even length.

Writes: work/torah_parasha.json  {"6": [rows], "5": [rows]}
"""
import os

import numpy as np

from common import HAND, PARAMS, PARASHIYYOT, WORK, apply_scene_breaks, read_json, solve_block, torah_ref, write_json

d = read_json(os.path.join(WORK, "torah_verses.json"))
V, starts = d["verses"], d["parasha_start"]
n = len(V)
cost = [v["cost"] for v in V]
kind = [v["kind"] for v in V]
# hand breaks that apply to this plan only, on top of the shared ones
apply_scene_breaks(V, cost, kind, HAND["torah_parasha_plan_only"], PARAMS["torah_break_costs"]["scene"])
pen = np.array(cost)
w = np.array([v["words"] for v in V], float)
cs = np.concatenate([[0], np.cumsum(w)])
alpha = PARAMS["cost_function"]["alpha"]
bounds = starts + [n]
assert len(starts) == PARAMS["plans"]["parasha"]["parashiyyot"]

out = {}
for D in PARAMS["plans"]["days_per_week"]:
    rows = []
    for p in range(len(starts)):
        a, b = bounds[p], bounds[p + 1]
        for t, (x, y) in enumerate(solve_block(cs, pen, a, b, D, alpha)):
            rows.append(dict(
                w=p + 1, d=t + 1, ref=torah_ref(V, x, y), p=PARASHIYYOT[p]["hebrew"], np=[],
                words=int(cs[y] - cs[x]), verses=int(y - x), end=kind[y - 1],
                inc=V[x]["first"]))
    out[str(D)] = rows
    ws = np.array([r["words"] for r in rows])
    print(D, "days/week:", len(rows), "readings, words", ws.min(), "-", ws.max(), "mean", round(ws.mean()))
write_json(os.path.join(WORK, "torah_parasha.json"), out)
