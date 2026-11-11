"""Step 1: parse the Torah (MAM), attach parasha and ʿaliyya boundaries, and give
every verse the cost of ending a reading after it.

Writes: work/torah_verses.json
"""
import os

from common import BOOKS, HAND, PARAMS, PARASHIYYOT, ROOT, WORK, apply_scene_breaks, parse_book, read_json, write_json

aliyot_path = os.path.join(ROOT, "hebcal", "aliyot.json")
V = [dict(book=bk["osis"], **v) for bk in BOOKS["torah"] for v in parse_book(bk["osis"])]
n = len(V)
idx = {(v["book"], v["ch"], v["v"]): i for i, v in enumerate(V)}

# ʿaliyya ends (all entries, including maftir 'M') and parasha starts (ʿaliyya 1)
hebcal_to_osis = {b["hebcal"]: b["osis"] for b in BOOKS["torah"]}
aliyah_end, parasha_start = set(), []
for a in read_json(aliyot_path):
    bk = hebcal_to_osis[a["k"]]
    c, vv = map(int, a["e"].split(":"))
    aliyah_end.add(idx[(bk, c, vv)])
    if a["aliyah"] == "1":
        c, vv = map(int, a["b"].split(":"))
        parasha_start.append((idx[(bk, c, vv)], a["parsha"]))
parasha_start.sort()
assert [p for _, p in parasha_start] == [p["hebcal"] for p in PARASHIYYOT], "parasha order/names differ from config"

# break costs, first matching rule wins
C = PARAMS["torah_break_costs"]
cost, kind = [], []
for i, v in enumerate(V):
    if i == n - 1 or V[i + 1]["book"] != v["book"]:
        k = "book_end"
    elif v["mark"] == "P":
        k = "petuha"
    elif v["mark"] == "S":
        k = "setuma"
    elif i in aliyah_end:
        k = "aliyah_end"
    elif V[i + 1]["ch"] != v["ch"]:
        k = "chapter_end"
    else:
        k = "verse"
    cost.append(C[k])
    kind.append(k)
apply_scene_breaks(V, cost, kind, HAND["torah_all_plans"], C["scene"])

for i, v in enumerate(V):
    v["cost"] = cost[i]
    v["kind"] = kind[i]
write_json(os.path.join(WORK, "torah_verses.json"),
           dict(verses=V, parasha_start=[i for i, _ in parasha_start]))
print("torah verses", n, "words", sum(v["words"] for v in V),
      "P", sum(v["mark"] == "P" for v in V), "S", sum(v["mark"] == "S" for v in V))
