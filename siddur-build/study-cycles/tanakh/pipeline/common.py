"""Shared code for the Tanakh reading-plan pipeline.

Everything that is a number or a hand decision comes from ../config/*.json.
The algorithms here are the ones that produced the published pages; they are
the text is Miqra according to the Masorah (../mam.py). Keep the arithmetic order
in the solvers if you need the same tie-breaking.
"""
import json
import os
import re

import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
import mam  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONFIG = os.path.join(ROOT, "config")
WORK = os.path.join(ROOT, "work")
OUT = os.path.join(ROOT, "output")


def load(name):
    with open(os.path.join(CONFIG, name), encoding="utf8") as f:
        return json.load(f)


def read_json(path):
    with open(path, encoding="utf8") as f:
        return json.load(f)


def write_json(path, obj, **kw):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf8") as f:
        json.dump(obj, f, ensure_ascii=False, **kw)


PARAMS = load("params.json")
BOOKS = load("books.json")
PARASHIYYOT = load("parashiyyot.json")["list"]
HAND = load("hand_breaks.json")



# ---------------------------------------------------------------- parsing

def parse_book(osis):
    """One dict per verse from MAM (../mam.py): ch, v, words, mark ('P'/'S'/''), first (opening phrase)."""
    return [dict(ch=x["ch"], v=x["v"], words=x["words"], mark=x["mark"], first=x["first"]) for x in mam.verses(osis)]


# ---------------------------------------------------------------- labels

def torah_ref(V, a, b):
    """Reference for Torah verses V[a:b] (OSIS book ids)."""
    A, B = V[a], V[b - 1]
    if A["book"] != B["book"]:
        return f"{A['book']} {A['ch']}:{A['v']} – {B['book']} {B['ch']}:{B['v']}"
    if A["ch"] == B["ch"]:
        return f"{A['book']} {A['ch']}:{A['v']}–{B['v']}"
    return f"{A['book']} {A['ch']}:{A['v']}–{B['ch']}:{B['v']}"


def make_nakh_ref(V):
    """Reference formatter for one Nakh stream. Whole chapters print as 'Ps 3'
    or 'Ps 3–5'; a reading spanning books is joined with ' · '."""
    chlast = {}
    for v in V:
        chlast[(v["book"], v["ch"])] = v["v"]

    def sub(a, b):
        A, B = V[a], V[b - 1]
        if A["v"] == 1 and B["v"] == chlast[(B["book"], B["ch"])]:
            return f"{A['ab']} {A['ch']}" if A["ch"] == B["ch"] else f"{A['ab']} {A['ch']}–{B['ch']}"
        if A["ch"] == B["ch"]:
            return f"{A['ab']} {A['ch']}:{A['v']}–{B['v']}"
        return f"{A['ab']} {A['ch']}:{A['v']}–{B['ch']}:{B['v']}"

    def ref(a, b):
        parts, s = [], a
        for i in range(a, b):
            if i == b - 1 or V[i + 1]["book"] != V[i]["book"]:
                parts.append(sub(s, i + 1))
                s = i + 1
        return " · ".join(parts)

    return ref


# ---------------------------------------------------------------- solvers

def solve_uniform(w, pen, bid, N, alpha, maxv):
    """Split verses into exactly N readings, all with the same target T =
    total/N, normalised by T. A reading may not span two values of bid
    (book ids). At most maxv verses per reading. Exact DP.
    Returns list of (start, end) verse-index pairs, end exclusive."""
    n = len(w)
    cs = np.concatenate([[0], np.cumsum(w)])
    T = cs[-1] / N
    INF = 1e18
    prev = np.full(n + 1, INF)
    prev[0] = 0
    back = np.zeros((N + 1, n + 1), dtype=np.int32)
    for k in range(1, N + 1):
        cur = np.full(n + 1, INF)
        arg = np.zeros(n + 1, dtype=np.int32)
        j = np.arange(1, n + 1)
        for L in range(1, maxv + 1):
            i = j - L
            ok = (i >= 0) & (bid[np.maximum(i, 0)] == bid[j - 1])
            W = np.where(ok, cs[j] - cs[np.maximum(i, 0)], 0)
            c = np.where(ok, prev[np.maximum(i, 0)] + alpha * ((W - T) / T) ** 2 + pen[j - 1], INF)
            better = c < cur[1:]
            cur[1:] = np.where(better, c, cur[1:])
            arg[1:] = np.where(better, i, arg[1:])
        prev = cur
        back[k] = arg
    cuts = [n]
    for k in range(N, 0, -1):
        cuts.append(back[k][cuts[-1]])
    cuts = cuts[::-1]
    return [(int(cuts[t]), int(cuts[t + 1])) for t in range(N)]


def solve_block(cs, pen, a, b, D, alpha):
    """Split verses a..b-1 into exactly D readings, target T = words/D,
    normalised by T, no length limit. Exact O(D*n^2) DP (plan 2)."""
    T = (cs[b] - cs[a]) / D
    INF = 1e18
    best = np.full((D + 1, b - a + 1), INF)
    arg = np.zeros((D + 1, b - a + 1), int)
    best[0, 0] = 0
    for k in range(1, D + 1):
        for j in range(1, b - a + 1):
            for i in range(k - 1, j):
                if best[k - 1, i] >= INF:
                    continue
                c = best[k - 1, i] + alpha * ((cs[a + j] - cs[a + i] - T) / T) ** 2 + pen[a + j - 1]
                if c < best[k, j]:
                    best[k, j] = c
                    arg[k, j] = i
    cuts = [b - a]
    for k in range(D, 0, -1):
        cuts.append(arg[k, cuts[-1]])
    cuts = cuts[::-1]
    return [(int(a + cuts[t]), int(a + cuts[t + 1])) for t in range(D)]


def solve_targets(w, pen, targets, alpha, maxv):
    """Split one stream into exactly len(targets) readings with per-reading
    targets, normalised by mean(targets); at most maxv verses per reading;
    readings may cross books. Exact DP (Neviʾim / Ketuvim tracks)."""
    n = len(w)
    cs = np.concatenate([[0], np.cumsum(w)])
    N = len(targets)
    scale = targets.mean()
    INF = 1e18
    prev = np.full(n + 1, INF)
    prev[0] = 0
    back = np.zeros((N + 1, n + 1), dtype=np.int32)
    j = np.arange(1, n + 1)
    for k in range(1, N + 1):
        T = targets[k - 1]
        cur = np.full(n + 1, INF)
        arg = np.zeros(n + 1, dtype=np.int32)
        for L in range(1, maxv + 1):
            i = j - L
            ii = np.maximum(i, 0)
            c = np.where(i >= 0, prev[ii] + alpha * ((cs[j] - cs[ii] - T) / scale) ** 2 + pen[j - 1], INF)
            b = c < cur[1:]
            cur[1:] = np.where(b, c, cur[1:])
            arg[1:] = np.where(b, i, arg[1:])
        prev = cur
        back[k] = arg
    cuts = [n]
    for k in range(N, 0, -1):
        cuts.append(int(back[k][cuts[-1]]))
    cuts = cuts[::-1]
    return [(cuts[t], cuts[t + 1]) for t in range(N)]


def apply_scene_breaks(V, cost, kind, entries, scene_cost):
    """Lower cost to scene_cost (kind 'scene') after each listed verse whose
    cost is higher. Returns the set of indices that were changed."""
    want = {(e["book"], e["ch"], e["v"]) for e in entries}
    changed = set()
    for i, v in enumerate(V):
        if (v["book"], v["ch"], v["v"]) in want and cost[i] > scene_cost:
            cost[i] = scene_cost
            kind[i] = "scene"
            changed.add(i)
    return changed
