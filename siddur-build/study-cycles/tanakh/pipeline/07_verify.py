"""Step 7: checks and a summary report.

1. Every verse of each track is read exactly once, in order, in every plan.
2. Days ending at a plain verse are exactly config/hand_breaks.json
   accepted_exceptions (the check is skipped with --no-exceptions-check, for
   use after changing the source text).
3. Writes work/report.json: per-plan length statistics, break-kind counts,
   and which hand scene breaks were actually used.

Usage: python pipeline/07_verify.py [--no-exceptions-check]
"""
import collections
import os
import sys

import numpy as np

from common import HAND, OUT, WORK, read_json, write_json

check_exc = "--no-exceptions-check" not in sys.argv
ok = True


def fail(msg):
    global ok
    ok = False
    print("FAIL:", msg)


tv = read_json(os.path.join(WORK, "torah_verses.json"))["verses"]
nv = read_json(os.path.join(WORK, "nakh_verses.json"))["verses"]
counts = {"torah": (len(tv), sum(v["words"] for v in tv))}
for t in "nk":
    s = [v for v in nv if v["track"] == t]
    counts[t] = (len(s), sum(v["words"] for v in s))

p1 = read_json(os.path.join(OUT, "plan_continuous.json"))
p2 = read_json(os.path.join(OUT, "plan_parasha.json"))["plans"]
report = {"source_counts": {k: {"verses": a, "words": b} for k, (a, b) in counts.items()}, "plans": {}}
exceptions_found = []
for pname, plans in (("continuous", p1), ("parasha", p2)):
    for key, rows in plans.items():
        for track, get in (("torah", lambda r: r), ("neviim", lambda r: r["n"]), ("ketuvim", lambda r: r["k"])):
            cnt = counts[{"torah": "torah", "neviim": "n", "ketuvim": "k"}[track]]
            if sum(get(r)["verses"] for r in rows) != cnt[0] or sum(get(r)["words"] for r in rows) != cnt[1]:
                fail(f"{pname} {key} {track}: verses/words do not add up to the source")
            for r in rows:
                if get(r)["end"] == "verse":
                    exceptions_found.append((pname, key, track, get(r)["ref"]))
        tot = np.array([r["words"] + r["n"]["words"] + r["k"]["words"] for r in rows])
        st = {}
        for track, get in (("torah", lambda r: r), ("neviim", lambda r: r["n"]), ("ketuvim", lambda r: r["k"])):
            ws = np.array([get(r)["words"] for r in rows])
            st[track] = dict(min=int(ws.min()), max=int(ws.max()), mean=round(float(ws.mean()), 1),
                             sd=round(float(ws.std()), 1), ends=dict(collections.Counter(get(r)["end"] for r in rows)))
        st["day_total"] = dict(min=int(tot.min()), max=int(tot.max()), mean=round(float(tot.mean()), 1),
                               sd=round(float(tot.std()), 1), cv=round(float(tot.std() / tot.mean()), 4))
        report["plans"][f"{pname}/{key}"] = dict(readings=len(rows), **st)

# 2. accepted exceptions
expected_exc = sorted((e["plan"], e["days"], e["track"], e["ref"]) for e in HAND["accepted_exceptions"]["list"])
report["plain_verse_endings"] = sorted(exceptions_found)
if check_exc and sorted(exceptions_found) != expected_exc:
    fail(f"plain-verse endings differ from accepted_exceptions: found {sorted(exceptions_found)}")


# 4a. hand-break usage: in which plans does a reading end after this verse?
usage = {}
end_idx = {}
for pname, plans in (("continuous", p1), ("parasha", p2)):
    for key, rows in plans.items():
        pos = 0
        for r in rows:
            pos += r["verses"]
            v = tv[pos - 1]
            end_idx.setdefault((v["book"], v["ch"], v["v"]), []).append(f"{pname}/{key}")
        for t in "nk":
            sub = [v for v in nv if v["track"] == t]
            pos = 0
            for r in rows:
                pos += r[t]["verses"]
                v = sub[pos - 1]
                end_idx.setdefault((v["book"], v["ch"], v["v"]), []).append(f"{pname}/{key}")
for group in ("torah_all_plans", "torah_parasha_plan_only", "nakh_all_plans"):
    usage[group] = [dict(book=e["book"], ch=e["ch"], v=e["v"], used_in=end_idx.get((e["book"], e["ch"], e["v"]), []))
                    for e in HAND[group]]
report["hand_break_usage"] = usage

write_json(os.path.join(WORK, "report.json"), report, indent=1)
for k, v in report["plans"].items():
    print(k, v["readings"], "readings; day total", v["day_total"])
print("plain-verse endings:", report["plain_verse_endings"])
print("OK" if ok else "CHECKS FAILED")
sys.exit(0 if ok else 1)
