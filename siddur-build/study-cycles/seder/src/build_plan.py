"""Build the reading plan: every seder split into five days.

    python3 src/build_plan.py [--source NAME] [--no-overrides]

1. Load verses from the text source (config/params.json "text_source", or --source).
2. Cut the Torah into the 141 sedarim of the site's EY table (../ey_table.py).
3. Split each seder with the optimizer (splitter.split_auto, costs from params).
4. Replace the split of every seder listed in data/overrides.json with the
   hand-chosen day starts (splitter.split_forced).
   Overrides whose choice is 'keep' (no modification) are not forced: the owner
   accepted the automatic split, so they follow the optimizer on the current text.
   --no-overrides      : pure optimizer output.
5. Write outputs/plan.json and outputs/override_report.json, print stats.

override_report.json compares each override's breaks and day lengths on the
current text with what the owner saw when deciding (recorded in
overrides.json under at_decision); re-check any entry marked changed.
"""
import argparse
import statistics as st
import sys
from collections import Counter

from common import (BOOK, OUTPUTS, PARAMS, DATA, fmt_range, fmt_range_he, get_source, int_to_heb,
                    iter_sedarim, load_json, write_json)
from splitter import split_auto, split_forced


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=None)
    ap.add_argument("--no-overrides", action="store_true")
    args = ap.parse_args()

    source = get_source(args.source)
    k = PARAMS["days_per_seder"]
    costs = PARAMS["break_costs"]
    day_names = PARAMS["day_names"]
    ovr = {} if args.no_overrides else {(o["book"], o["seder"]): o for o in load_json(DATA / "overrides.json")["overrides"]}
    auto_label = PARAMS["review"]["split_labels"]["automatic"]

    rows, sed, split_source, report = [], [], {}, []
    for week, b, n, seg, alset in iter_sedarim(source):
        bk = BOOK[b]
        days = split_auto(seg, alset, costs, k)
        label = auto_label
        o = ovr.get((b, n))
        if o and not (o["choice"] == "keep" and not o.get("modification")):
            auto = days
            days = split_forced(seg, alset, o["day_starts"], k)
            label = o["label"]
            now_ends = [d["end"] for d in days]
            now_words = [d["words"] for d in days]
            report.append(dict(id=o["id"], book=b, seder=n, choice=o["choice"], day_starts=o["day_starts"],
                               ends_now=now_ends, ends_at_decision=o["at_decision"]["ends"],
                               words_now=now_words, words_at_decision=o["at_decision"]["words"],
                               automatic_day_starts_now=[f"{seg[d['s']]['c']}:{seg[d['s']]['v']}" for d in auto[1:]],
                               changed=(now_ends != o["at_decision"]["ends"] or now_words != o["at_decision"]["words"])))
        split_source[str(week)] = label
        a, z = seg[0], seg[-1]
        sed.append(dict(week=week, book=b, n=n, words=sum(x["words"] for x in seg), verses=len(seg),
                        ref=f"{a['c']}:{a['v']}–{z['c']}:{z['v']}",
                        heref=f"{int_to_heb(a['c'])}:{int_to_heb(a['v'])} – {int_to_heb(z['c'])}:{int_to_heb(z['v'])}",
                        days=[d["words"] for d in days]))
        for di, d in enumerate(days):
            f, l = seg[d["s"]], seg[d["e"] - 1]
            rows.append(dict(week=week, book=b, tr=bk["translit"], heb=bk["he"], seder=n, seder_he=int_to_heb(n),
                             dayn=di + 1, day=day_names[di], start=f"{f['c']}:{f['v']}", end=f"{l['c']}:{l['v']}",
                             ref=f"{bk['en']} {fmt_range(f, l)}", href=f"{bk['he']} {fmt_range_he(f, l)}",
                             verses=d["verses"], words=d["words"], endk=d["end"], target=round(d["target"], 1)))

    write_json(OUTPUTS / "plan.json", dict(rows=rows, sed=sed, split_source=split_source, text_source=source.NAME))
    write_json(OUTPUTS / "override_report.json", report, indent=1)

    W = [r["words"] for r in rows]
    q = st.quantiles(W, n=20)
    print(f"text source: {source.NAME}")
    print(len(sed), "sedarim,", len(rows), "days")
    print("words/day mean %.1f median %.0f sd %.1f min %d max %d p5 %.0f p25 %.0f p75 %.0f p95 %.0f"
          % (st.mean(W), st.median(W), st.pstdev(W), min(W), max(W), q[0], q[4], q[14], q[18]))
    print("day ends:", dict(Counter(r["endk"] for r in rows)))
    dev = [abs(r["words"] - r["target"]) / r["target"] for r in rows]
    print("within 15%% of target: %.0f%%  within 25%%: %.0f%%"
          % (100 * sum(x <= .15 for x in dev) / len(dev), 100 * sum(x <= .25 for x in dev) / len(dev)))
    changed = [r for r in report if r["changed"]]
    print(f"overrides applied: {len(report)}; differing from what was decided on: {len(changed)}"
          + (" (see outputs/override_report.json)" if changed else ""))
    for r in changed:
        print(f"  {r['id']}: ends {r['ends_at_decision']} -> {r['ends_now']}; words {r['words_at_decision']} -> {r['words_now']}")


if __name__ == "__main__":
    sys.exit(main())
