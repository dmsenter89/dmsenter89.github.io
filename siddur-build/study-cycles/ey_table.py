"""The ʾEreṣ Yisraʾel triennial table (data/siddur/appendix/ey-triennial.json), read as verses.

    from ey_table import sedarim
    sedarim()  ->  {'Gen': [{n, start, end, aliyot: [(start, end), ...]}, ...]   (7 ʿăliyyoth, 6 in a few short sedarim), ...}   (MAM numbering)

`python3 ey_table.py` checks the table against MAM: every seder follows the previous one
with no gap or overlap, its range cell agrees with the next seder's start, its ʿăliyyoth
cover it in order with no gap, and every verse exists. An ʿăliyya may repeat the last
verse(s) of the one before (that's how a 3-verse minimum is met); one under 3 verses warns.
"""
import json
import re
import sys
from pathlib import Path

from mam import verses

TABLE = Path(__file__).resolve().parents[2] / "data/siddur/appendix/ey-triennial.json"
BOOKS = {"bereshith": "Gen", "shemoth": "Exod", "vayikra": "Lev", "bemidbar": "Num", "devarim": "Deut"}
HE = {"Gen": "בראשית", "Exod": "שמות", "Lev": "ויקרא", "Num": "במדבר", "Deut": "דברים"}
_HV = dict(zip("אבגדהוזחטיכלמנסעפצקרשת", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400]))


def num(s):
    return sum(_HV[c] for c in s)


def span(cell, chlen):
    """'א:א – ב:ג' | 'יא:א-לב' | 'כז' (whole chapter) -> ((c1, v1), (c2, v2)). chlen(c) = verses in c."""
    parts = [p for p in re.split(r"\s*[–-]\s*", re.sub("^[א-ת]+ (?=[א-ת]+:)", "", cell.strip())) if p]
    if ":" not in parts[0]:
        c1, c2 = num(parts[0]), num(parts[-1])
        return (c1, 1), (c2, chlen(c2))
    c1, v1 = map(num, parts[0].split(":"))
    z = parts[-1]
    c2, v2 = map(num, z.split(":")) if ":" in z else (c1, num(z))
    return (c1, v1), (c2, v2)


def sedarim():
    out = {}
    for book in json.loads(TABLE.read_text(encoding="utf-8"))["books"]:
        code = BOOKS[book["id"]]
        chlen = {}
        for x in verses(code):
            chlen[x["ch"]] = x["v"]
        out[code] = [dict(n=i + 1, start=a, end=z, aliyot=[span(c, chlen.get) for c in row["aliyot"] if c.strip()])
                     for i, row in enumerate(book["rows"]) for a, z in [span(row["parshiyot"], chlen.get)]]
    return out


def check():
    errors, warnings = [], []
    for code, rows in sedarim().items():
        vs = verses(code)
        order = {(x["ch"], x["v"]): i for i, x in enumerate(vs)}
        idx = lambda cv: order.get(cv)
        for i, s in enumerate(rows):
            where = f"{code} seder {s['n']}"
            ends = [s["start"], s["end"]] + [cv for al in s["aliyot"] for cv in al]
            if any(idx(cv) is None for cv in ends):
                errors.append(f"{where}: verse not in MAM: {[cv for cv in ends if idx(cv) is None]}"); continue
            want_start = 0 if i == 0 else idx(rows[i - 1]["end"]) + 1
            if idx(s["start"]) != want_start:
                errors.append(f"{where}: starts {s['start']}, previous seder ends {rows[i - 1]['end'] if i else None}")
            if i == len(rows) - 1 and idx(s["end"]) != len(vs) - 1:
                errors.append(f"{where}: last seder ends {s['end']}, book ends {(vs[-1]['ch'], vs[-1]['v'])}")
            al = s["aliyot"]
            if len(al) != 7:
                warnings.append(f"{where}: {len(al)} ʿăliyyoth")
            pos = idx(s["start"])
            for k, (a, z) in enumerate(al, 1):
                if idx(a) > pos or (k == 1 and idx(a) != pos):
                    errors.append(f"{where}: ʿăliyya {k} starts {a}, expected {(vs[pos]['ch'], vs[pos]['v'])} or earlier")
                if idx(z) - idx(a) + 1 < 3:
                    warnings.append(f"{where}: ʿăliyya {k} ({a}–{z}) has {idx(z) - idx(a) + 1} verses")
                pos = max(pos, idx(z) + 1)
            if pos != idx(s["end"]) + 1:
                errors.append(f"{where}: ʿăliyyoth end at {al[-1][1]}, seder ends {s['end']}")
    for w in warnings:
        print("warning", w)
    for e in errors:
        print("ERROR", e)
    print(f"{sum(len(r) for r in sedarim().values())} sedarim; {len(errors)} errors, {len(warnings)} warnings")
    return not errors


if __name__ == "__main__":
    sys.exit(0 if check() else 1)
