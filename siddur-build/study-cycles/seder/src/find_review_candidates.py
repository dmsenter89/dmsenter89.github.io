"""Find sedarim whose automatic split needs a human look, and build the options.

    python3 src/find_review_candidates.py [--source NAME] [--out PATH]

A seder is flagged when its automatic split (no overrides) has a break of a
kind in params review.flag_if_any_break_kind (mid-paragraph), or when its
heaviest day / lightest day >= review.flag_if_heaviest_over_lightest_at_least.

Options per flagged seder, in params review.option_order:
  keep   - the automatic split
  strict - the optimizer with verse cost = review.option_strict_verse_cost
           (mid-paragraph breaks effectively forbidden)
  even   - the optimizer with verse cost = review.option_even_verse_cost
  scene  - the hand-picked split in data/scene_options.json (offered=true)
Identical splits are shown once (first key wins). Where data/review_notes.json
has hand-written text for the seder, only options with a note are shown and
the note's recommendation is used; this reproduces the 2026-11 review page
(data/review_items_shown.json) exactly on the WLC text. Seders flagged without
notes get every distinct option, a generated problem line and no
recommendation.

Output: outputs/review_items.json (the review page's data; see build_review_page.py).
"""
import argparse
import re

from common import BOOK, DATA, OUTPUTS, PARAMS, SLUG_TO_CODE, get_source, iter_sedarim, load_json, write_json
from splitter import day_starts_of, split_auto, split_forced

KIND_LABEL = {"petuha": "petuḥa", "setuma": "setuma", "aliyah": "ʿăliyya", "chapter": "chapter end",
              "verse": "mid-paragraph", "seder end": "seder end"}
_POINTING = re.compile(r"[֑-ׇ]")


def strip_pointing(s):
    return _POINTING.sub("", s)


def option_days(seg, days):
    out = []
    for i, d in enumerate(days):
        f, l = seg[d["s"]], seg[d["e"] - 1]
        ref = f"{f['c']}:{f['v']}–{l['v']}" if f["c"] == l["c"] else f"{f['c']}:{f['v']}–{l['c']}:{l['v']}"
        out.append(dict(ref=ref, words=d["words"], end="seder end" if i == len(days) - 1 else KIND_LABEL[d["end"]]))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", default=None)
    ap.add_argument("--out", default=str(OUTPUTS / "review_items.json"))
    args = ap.parse_args()
    source = get_source(args.source)
    R = PARAMS["review"]
    k, costs = PARAMS["days_per_seder"], PARAMS["break_costs"]
    notes = {(n["book"], n["seder"]): n for n in load_json(DATA / "review_notes.json")["items"]}
    scene = {(s["book"], s["seder"]): s["day_starts"] for s in load_json(DATA / "scene_options.json")["options"] if s["offered"]}
    texts = {}
    items = []
    for _, b, n, seg, alset in iter_sedarim(source):
        cur = split_auto(seg, alset, costs, k)
        words = [d["words"] for d in cur]
        mids = [j for j, d in enumerate(cur[:-1]) if d["end"] in R["flag_if_any_break_kind"]]
        ratio = max(words) / min(words)
        if not mids and ratio < R["flag_if_heaviest_over_lightest_at_least"]:
            continue
        cand = {
            "keep": day_starts_of(seg, cur),
            "strict": day_starts_of(seg, split_auto(seg, alset, dict(costs, verse=R["option_strict_verse_cost"]), k)),
            "even": day_starts_of(seg, split_auto(seg, alset, dict(costs, verse=R["option_even_verse_cost"]), k)),
        }
        if (b, n) in scene:
            cand["scene"] = scene[(b, n)]
        note = notes.get((b, n))
        seen, opts = set(), []
        for key in R["option_order"]:
            if key not in cand:
                continue
            t = tuple(cand[key])
            if t in seen or (note and key not in note["option_notes"]):
                continue
            seen.add(t)
            opts.append(dict(key=key, label=R["option_labels"][key],
                             note=note["option_notes"][key] if note else "No hand-written note for this text.",
                             days=option_days(seg, split_forced(seg, alset, cand[key], k))))
        if note:
            rec, issue = note["recommended"], note["issue"]
            if rec not in [o["key"] for o in opts]:
                print(f"warning: {b} {n}: recommended option '{rec}' is no longer distinct on this text; no recommendation shown")
                rec = None
        else:
            rec = None
            parts = [f"day {j + 1} ends mid-paragraph at {seg[cur[j]['e'] - 1]['c']}:{seg[cur[j]['e'] - 1]['v']}" for j in mids]
            if ratio >= R["flag_if_heaviest_over_lightest_at_least"]:
                parts.append(f"uneven week: days run {min(words)} to {max(words)} words")
            issue = ("; ".join(parts) + ".").capitalize() if parts else ""
        if b not in texts:
            texts[b] = source.verse_words(b)
        tx = texts[b]
        breaks = []
        for j in mids:
            e = cur[j]["e"]
            a, z = seg[e - 1], seg[e]
            breaks.append(dict(before=f"{a['c']}:{a['v']}",
                               bword=strip_pointing(" ".join(tx[(a["c"], a["v"])][-R["seam_words_before"]:])),
                               after=f"{z['c']}:{z['v']}",
                               aword=strip_pointing(" ".join(tx[(z["c"], z["v"])][:R["seam_words_after"]]))))
        a, z = seg[0], seg[-1]
        items.append(dict(id=f"{BOOK[b]['slug']}-{n}", book=BOOK[b]["translit"], seder=n,
                          range=f"{a['c']}:{a['v']}–{z['c']}:{z['v']}", kind="mid" if mids else "uneven",
                          issue=issue, rec=rec, breaks=breaks, options=opts))
    write_json(args.out, items)
    unnoted = [i["id"] for i in items if (SLUG_TO_CODE[i["id"].split("-")[0]], i["seder"]) not in notes]
    print(len(items), "sedarim flagged;", sum(i["kind"] == "mid" for i in items), "with mid-paragraph breaks;",
          len(unnoted), "without hand-written notes", unnoted if unnoted else "")


if __name__ == "__main__":
    main()
