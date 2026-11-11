"""Split one seder into k reading days.

split_auto   - the optimizer: exact dynamic program over break points.
split_forced - a split given by hand (first verses of days 2..k).

Both return k day records:
    {s, e, words, verses, end, target}
where seg[s:e] are the day's verses, end is the kind of break that ends the
day ('petuha', 'setuma', 'aliyah', 'chapter', 'verse', or 'seder end'), and
target is T = seder words / k.
"""
from common import break_kind, parse_ref


def _prefix(seg):
    pre = [0]
    for x in seg:
        pre.append(pre[-1] + x["words"])
    return pre


def split_auto(seg, alset, costs, k):
    """Minimize sum_days (words - T)^2 + sum_breaks costs[kind] * T * T.

    Exactly k non-empty days; breaks only between verses of this seder.
    Ties keep the earliest start s (strict '<'), which the delivered plan
    depends on, so keep the loop order and the comparison as they are.
    """
    n = len(seg)
    T = sum(x["words"] for x in seg) / k
    pre = _prefix(seg)
    INF = float("inf")
    dp = [[INF] * (n + 1) for _ in range(k + 1)]
    bk = [[0] * (n + 1) for _ in range(k + 1)]
    dp[0][0] = 0
    for j in range(1, k + 1):
        for e in range(j, n + 1):
            pe = 0 if e == n else costs[break_kind(seg, e, alset)] * T * T
            for s in range(j - 1, e):
                if dp[j - 1][s] == INF:
                    continue
                c = dp[j - 1][s] + (pre[e] - pre[s] - T) ** 2 + pe
                if c < dp[j][e]:
                    dp[j][e] = c
                    bk[j][e] = s
    cuts, e = [], n
    for j in range(k, 0, -1):
        s = bk[j][e]
        cuts.append((s, e))
        e = s
    cuts.reverse()
    return [dict(s=s, e=e, words=pre[e] - pre[s], verses=e - s,
                 end="seder end" if e == n else break_kind(seg, e, alset), target=T) for s, e in cuts]


def split_forced(seg, alset, day_starts, k):
    """Split at the given first verses of days 2..k (strings like '24:17')."""
    li = {(x["c"], x["v"]): i for i, x in enumerate(seg)}
    if len(day_starts) != k - 1:
        raise ValueError(f"need {k - 1} day starts, got {day_starts}")
    try:
        es = [li[parse_ref(c)] for c in day_starts]
    except KeyError as err:
        raise KeyError(f"day start {err} is not inside this seder") from None
    bounds = [0] + es + [len(seg)]
    if not all(a < b for a, b in zip(bounds, bounds[1:])):
        raise ValueError(f"day starts {day_starts} are not strictly increasing inside the seder")
    pre = _prefix(seg)
    T = pre[-1] / k
    bd = [0] + es + [len(seg)]
    return [dict(s=bd[i], e=bd[i + 1], words=pre[bd[i + 1]] - pre[bd[i]], verses=bd[i + 1] - bd[i],
                 end="seder end" if i == k - 1 else break_kind(seg, bd[i + 1], alset), target=T)
            for i in range(k)]


def day_starts_of(seg, days):
    """First verses of days 2..k as 'c:v' strings."""
    return [f"{seg[d['s']]['c']}:{seg[d['s']]['v']}" for d in days[1:]]
