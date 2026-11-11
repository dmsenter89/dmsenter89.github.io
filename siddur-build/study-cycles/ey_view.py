"""Display data for the EY Triennial page: data/siddur/appendix/ey-triennial-view.json.

The hand-maintained table (ey-triennial.json: Hebrew references, English names and
notes for special readings) is turned into English references with opening phrases
(and closing phrases for whole readings) from MAM. build_site.py calls build().
"""
import json
import re

import mam
from ey_table import BOOKS, TABLE, num

# Hebrew book name -> (OSIS code, English label). Longest names first when matching.
HEB = {"בראשית": "Gen", "שמות": "Exod", "ויקרא": "Lev", "במדבר": "Num", "דברים": "Deut",
       "יהושע": "Josh", "שופטים": "Judg", "שמואל א": "1Sam", "שמואל ב": "2Sam", "מלכים א": "1Kgs", "מלכים ב": "2Kgs",
       "ישעיהו": "Isa", "ירמיהו": "Jer", "יחזקאל": "Ezek", "הושע": "Hos", "יואל": "Joel", "עמוס": "Amos",
       "עובדיה": "Obad", "יונה": "Jonah", "מיכה": "Mic", "נחום": "Nah", "חבקוק": "Hab", "צפניה": "Zeph",
       "חגי": "Hag", "זכריה": "Zech", "מלאכי": "Mal"}
LABEL = {"1Sam": "1 Sam", "2Sam": "2 Sam", "1Kgs": "1 Kgs", "2Kgs": "2 Kgs"}
NOTE = {"בשבת": "on Shabbath", "בחול": "on weekdays", "שחרית": "Shaḥrith", "מנחה בלבד": "Minḥa only"}
_V = {}


def verses(book):
    if book not in _V:
        vs = mam.verses(book)
        _V[book] = dict(list=vs, idx={(x["ch"], x["v"]): i for i, x in enumerate(vs)},
                        chlen={x["ch"]: x["v"] for x in vs})
    return _V[book]


def parse(s, book=None):
    """'ישעיהו סה:יז – סו:ד' | 'יהושע י:יב-יד, לח-מג' | 'יואל ד:יח – עמוס א:ה' | 'עובדיה' | 'כו:ג-ה'
    -> [(book, (c1, v1), (c2, v2)), ...] (several for comma-joined ranges)."""
    def take_book(t):
        for name in sorted(HEB, key=len, reverse=True):
            if t == name or t.startswith(name + " "):
                return HEB[name], t[len(name):].strip()
        return None, t
    b, rest = take_book(s.strip())
    book = b or book
    if not rest:  # whole book
        cl = verses(book)["chlen"]
        return [(book, (1, 1), (max(cl), cl[max(cl)]))]
    first, *more = [p.strip() for p in rest.split(",")]
    parts = [p.strip() for p in re.split(r"\s*[–-]\s*", first)]
    a = parts[0]
    b2, z = take_book(parts[-1]) if len(parts) > 1 else (None, a)
    b2 = b2 or book
    cl = verses(book)["chlen"]
    if ":" not in a:  # whole chapter(s)
        out = [(book, (num(a), 1), (num(z), cl[num(z)]))]
    else:
        c1, v1 = map(num, a.split(":"))
        c2, v2 = map(num, z.split(":")) if ":" in z else (c1, num(z))
        out = [(book, (c1, v1), (c2, v2))] if b2 == book else [(book, (c1, v1), (None, None)), (b2, (1, 1), (c2, v2))]
    for m in more:  # ', לח-מג': more verses in the last chapter
        c = out[-1][2][0]
        x, *y = [num(t) for t in re.split(r"\s*[–-]\s*", m)]
        out.append((out[-1][0], (c, x), (c, y[0] if y else x)))
    return out


def label(segs):
    def one(book, a, z):
        bl = LABEL.get(book, book)
        cl = verses(book)["chlen"]
        if z == (None, None):  # runs to the next book
            return f"{bl} {a[0]}:{a[1]}"
        if a[1] == 1 and z[1] == cl[z[0]]:
            return f"{bl} {a[0]}" if a[0] == z[0] else f"{bl} {a[0]}–{z[0]}"
        if a == z:
            return f"{bl} {a[0]}:{a[1]}"
        return f"{bl} {a[0]}:{a[1]}–{z[1]}" if a[0] == z[0] else f"{bl} {a[0]}:{a[1]}–{z[0]}:{z[1]}"
    out = one(*segs[0])
    for i, (book, a, z) in enumerate(segs[1:], 1):
        prev = segs[i - 1]
        if prev[2] == (None, None):  # cross-book: 'Joel 4:18–Amos 1:5'
            out += f"–{LABEL.get(book, book)} {z[0]}:{z[1]}"
        else:  # comma: 'Josh 10:12–14, 38–43'
            out += f", {a[1]}–{z[1]}" if a != z else f", {a[1]}"
    return out


def verse(book, cv):
    return verses(book)["list"][verses(book)["idx"][cv]]


def reading(s, book=None, fin=False):
    segs = parse(s, book)
    r = dict(ref=label(segs), inc=verse(segs[0][0], segs[0][1])["first"])
    if fin:
        r["fin"] = verse(segs[-1][0], segs[-1][2])["last"]
    return r


def haftarah(s):
    """A haftarah cell -> {ref, inc, note} or None ('אין מפטירים')."""
    alt = s.split(" / ")
    m = re.match(r"(.*?)\s*\(([^)]*)\)$", alt[0])
    text, note = (m[1], NOTE[m[2]]) if m else (alt[0], "")
    if text.startswith("אין מפטירים"):
        return None
    for other in alt[1:]:  # 'אין מפטירים (בחול)'
        m = re.match(r"אין מפטירים\s*\(([^)]*)\)", other)
        note += f"; none {NOTE[m[1]]}"
    return dict(reading(text), note=note) if note else reading(text)


def build():
    d = json.loads(TABLE.read_text(encoding="utf-8"))
    books = []
    for b in d["books"]:
        code = BOOKS[b["id"]]
        sed = []
        for i, row in enumerate(b["rows"]):
            segs = parse(row["parshiyot"], code)
            (_, a, z), = segs
            ix = verses(code)["idx"]
            span = verses(code)["list"][ix[a]:ix[z] + 1]
            sed.append(dict(n=i + 1, he=row["num"], **reading(row["parshiyot"], code, fin=True),
                            verses=len(span), words=sum(x["words"] for x in span),
                            haftarah=haftarah(row["haftarah"]),
                            aliyot=[reading(c, code) for c in row["aliyot"] if c.strip()]))
        books.append(dict(id=b["id"], title=b["title"], sedarim=sed))

    sh = d["specialHaftarot"]
    haf = dict(id=sh["id"], title=sh["title"], note=sh["en_note"],
               rows=[dict(name=r["en"]["name"], he=r["name"], when=r["en"]["when"], note=r["en"]["note"],
                          haftarah=haftarah(r["haftarah"])) for r in sh["rows"]])

    occ = []
    for o in d["specialReadings"]["occasions"]:
        book = parse(o["textWeekday"])[0][0]
        wk = [c for c in o["aliyotWeekday"] if c.strip()]
        sb = [c for c in o["aliyotShabbat"] if c.strip()]
        torah = [dict(label="", **reading(o["textWeekday"], fin=True))]
        if o["textShabbat"]:
            torah = [dict(torah[0], label="Weekdays"), dict(label="Shabbath", **reading(o["textShabbat"], fin=True))]
        aliyot = [dict(label=lab, items=[reading(c, book) for c in cells])
                  for lab, cells in (("Weekdays" if sb else "", wk), ("Shabbath" if wk else "", sb)) if cells]
        occ.append(dict(name=o["en"]["name"], he=o["name"], notes=o["en"]["notes"], torah=torah,
                        aliyot=aliyot, haftarah=haftarah(o["haftarah"])))
    sr = d["specialReadings"]
    return dict(books=books, specialHaftarot=haf, specialReadings=dict(id=sr["id"], title=sr["title"], rows=occ))


if __name__ == "__main__":
    v = build()
    for b in v["books"]:
        print(b["title"], len(b["sedarim"]), b["sedarim"][0]["ref"], b["sedarim"][0]["haftarah"])
    for r in v["specialHaftarot"]["rows"][:3] + v["specialReadings"]["rows"][:2]:
        print(json.dumps(r, ensure_ascii=False)[:300])
