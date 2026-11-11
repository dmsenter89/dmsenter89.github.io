"""Step 2: parse Neviʾim and Ketuvim in the Rambam's order and give every verse
the cost of ending a reading after it.

Writes: work/nakh_verses.json  (one list; field 'track' is 'n' or 'k')
"""
import os

from common import BOOKS, HAND, PARAMS, WORK, parse_book, write_json

C = PARAMS["nakh_break_costs"]

V = []
for track, books in (("n", BOOKS["neviim"]), ("k", BOOKS["ketuvim"])):
    for bk in books:
        for v in parse_book(bk["osis"]):
            V.append(dict(book=bk["osis"], ab=bk["abbrev"], track=track, **v))
n = len(V)

# break costs, first matching rule wins (computed on the combined stream; the
# last verse of each book is a book end either way)
cost, kind = [], []
for i, v in enumerate(V):
    nxt = V[i + 1] if i + 1 < n else None
    if nxt is None or nxt["book"] != v["book"]:
        k = "book_end"
    elif v["mark"] == "P":
        k = "petuha"
    elif v["mark"] == "S":
        k = "setuma"
    elif nxt["ch"] != v["ch"]:
        k = "psalm_end" if v["book"] == "Ps" else "chapter_end"
    elif v["book"] == "Ps" and v["ch"] == 119 and v["v"] % C["ps119_stanza_size"] == 0:
        k = "ps119_stanza"
    else:
        k = "verse"
    cost.append(C[k])
    kind.append(k)

# hand scene breaks, then the poetic-book surcharge on plain verses
want = {(e["book"], e["ch"], e["v"]) for e in HAND["nakh_all_plans"]}
poetic = set(C["poetic_books"])
for i, v in enumerate(V):
    if (v["book"], v["ch"], v["v"]) in want and cost[i] > C["scene"]:
        cost[i], kind[i] = C["scene"], "scene"
    elif cost[i] == C["verse"] and v["book"] in poetic:
        cost[i] = C["verse_poetic"]          # kind stays 'verse'

for i, v in enumerate(V):
    v["cost"] = cost[i]
    v["kind"] = kind[i]
write_json(os.path.join(WORK, "nakh_verses.json"), dict(verses=V))
for t in "nk":
    print("track", t, "verses", sum(v["track"] == t for v in V),
          "words", sum(v["words"] for v in V if v["track"] == t))
