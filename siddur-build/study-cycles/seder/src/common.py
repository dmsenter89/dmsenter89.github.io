"""Shared tables and helpers for the five-day ʾEreṣ Yisraʾel seder cycle.

Everything that more than one script needs lives here: paths, parameters,
book list, seder and ʿăliyya tables, Hebrew numerals, the text-source
loader and the break classifier.
"""
import importlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CONFIG = ROOT / "config"
OUTPUTS = ROOT / "outputs"
sys.path.insert(0, str(ROOT.parent))  # siddur-build/study-cycles: mam.py, ey_table.py


def load_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write_json(path, obj, indent=None):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(obj, ensure_ascii=False, indent=indent), encoding="utf-8")


PARAMS = load_json(CONFIG / "params.json")
BOOKS = load_json(DATA / "books.json")              # in reading order
BOOK = {b["code"]: b for b in BOOKS}
BOOK_CODES = [b["code"] for b in BOOKS]
SLUG_TO_CODE = {b["slug"]: b["code"] for b in BOOKS}


# ---------------------------------------------------------------- Hebrew numerals
_HV = dict(zip("אבגדהוזחטיכלמנסעפצקרשת",
               [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400]))
_HEB_DIGITS = [(400, "ת"), (300, "ש"), (200, "ר"), (100, "ק"), (90, "צ"), (80, "פ"), (70, "ע"), (60, "ס"),
               (50, "נ"), (40, "מ"), (30, "ל"), (20, "כ"), (10, "י"), (9, "ט"), (8, "ח"), (7, "ז"), (6, "ו"),
               (5, "ה"), (4, "ד"), (3, "ג"), (2, "ב"), (1, "א")]


def heb_to_int(s):
    """Hebrew numeral -> int, by summing letter values (so טו and יה both give 15)."""
    return sum(_HV[c] for c in s if c in _HV)


def int_to_heb(n):
    """int -> Hebrew numeral without gershayim; 15 and 16 are written טו and טז."""
    if n == 15:
        return "טו"
    if n == 16:
        return "טז"
    out = ""
    for v, c in _HEB_DIGITS:
        while n >= v:
            if n in (15, 16):
                out += int_to_heb(n)
                n = 0
                break
            out += c
            n -= v
    return out


def parse_ref(s):
    """'24:17' -> (24, 17)."""
    c, v = s.split(":")
    return int(c), int(v)


# ---------------------------------------------------------------- tables
def load_seder_starts():
    """{book code: [(chapter, verse), ...]} - first verse of each seder, from the site's EY table."""
    from ey_table import sedarim
    return {b: [s["start"] for s in rows] for b, rows in sedarim().items()}


def load_aliyot():
    """{book code: [[(chapter, verse) of each ʿăliyya start], ... one list per seder]}, from the EY table."""
    from ey_table import sedarim
    return {b: [[a for a, _ in s["aliyot"]] for s in rows] for b, rows in sedarim().items()}


# ---------------------------------------------------------------- text source
def get_source(name=None):
    """Import src/textsource_<name>.py (NAME, load_book, verse_words; see textsource_mam.py)."""
    return importlib.import_module("textsource_" + (name or PARAMS["text_source"]))


def load_verses(source, book):
    """Verses of one book from the text source, with 'chend' (last verse of its chapter) added."""
    verses = source.load_book(book)
    for i, vv in enumerate(verses):
        nxt = verses[i + 1] if i + 1 < len(verses) else None
        vv["chend"] = nxt is None or nxt["c"] != vv["c"]
    return verses


def iter_sedarim(source):
    """Yield (week, book, seder number, verses of the seder, set of ʿăliyya starts) in reading order.

    The ʿăliyya set excludes each seder's first ʿăliyya (it is the seder start,
    never an internal break).
    """
    starts, aliyot = load_seder_starts(), load_aliyot()
    week = 0
    for b in BOOK_CODES:
        if len(aliyot[b]) != len(starts[b]):
            raise ValueError(f"{b}: {len(starts[b])} seder starts but {len(aliyot[b])} ʿăliyya lines")
        verses = load_verses(source, b)
        idx = {(x["c"], x["v"]): i for i, x in enumerate(verses)}
        missing = [s for s in starts[b] if s not in idx]
        if missing:
            raise KeyError(f"{b}: seder start(s) {missing} not found in the text source's verse numbering")
        bounds = [idx[s] for s in starts[b]] + [len(verses)]
        for si in range(len(bounds) - 1):
            week += 1
            yield week, b, si + 1, verses[bounds[si]:bounds[si + 1]], set(aliyot[b][si][1:])


def break_kind(seg, e, alset):
    """Kind of the break between seg[e-1] and seg[e] (0 < e < len(seg))."""
    x = seg[e - 1]
    if x["mark"]:
        return x["mark"]                      # 'petuha' or 'setuma'
    if (seg[e]["c"], seg[e]["v"]) in alset:
        return "aliyah"
    if x["chend"]:
        return "chapter"
    return "verse"


def fmt_range(f, l, sep_same="–", sep_cross="–"):
    if f["c"] == l["c"]:
        return f"{f['c']}:{f['v']}{sep_same}{l['v']}"
    return f"{f['c']}:{f['v']}{sep_cross}{l['c']}:{l['v']}"


def fmt_range_he(f, l):
    if f["c"] == l["c"]:
        return f"{int_to_heb(f['c'])}:{int_to_heb(f['v'])}-{int_to_heb(l['v'])}"
    return f"{int_to_heb(f['c'])}:{int_to_heb(f['v'])} - {int_to_heb(l['c'])}:{int_to_heb(l['v'])}"
