"""Miqra according to the Masorah (MAM), from Sefaria, as the text for every study cycle.

    from mam import verses
    verses('Gen')  ->  [{ch, v, words, mark, first, last, text}, ...]

  words  written words (kĕthiv), split on spaces and maqaf (MAM's implicit maqaf included)
  mark   'P' / 'S' / '' : the last {פ}/{ס} in the verse, even mid-verse (pisqa bĕʾemṣaʿ
         pasuq counts as a break after the whole verse)
  text   the verse as read (qere), with niqqud and no te'amim, as a list of words;
  first  its opening four words, last  its closing three. The Divine Name is normalized later, in build_site.py.

Book codes are OSIS (Gen, 1Sam, Ps, ...). Each book is fetched once from Sefaria's
default Hebrew version (MAM) into .cache/; delete the cache to refetch. sha256 of
each cached text is checked against mam-sha256.txt so an upstream edit is noticed:
run `python3 mam.py --update-hashes` after reviewing such a change.
"""
import hashlib
import html
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
CACHE = HERE / ".cache"
HASHES = HERE / "mam-sha256.txt"

SEFARIA = {  # OSIS code -> Sefaria title
    "Gen": "Genesis", "Exod": "Exodus", "Lev": "Leviticus", "Num": "Numbers", "Deut": "Deuteronomy",
    "Josh": "Joshua", "Judg": "Judges", "1Sam": "I Samuel", "2Sam": "II Samuel", "1Kgs": "I Kings",
    "2Kgs": "II Kings", "Isa": "Isaiah", "Jer": "Jeremiah", "Ezek": "Ezekiel", "Hos": "Hosea", "Joel": "Joel",
    "Amos": "Amos", "Obad": "Obadiah", "Jonah": "Jonah", "Mic": "Micah", "Nah": "Nahum", "Hab": "Habakkuk",
    "Zeph": "Zephaniah", "Hag": "Haggai", "Zech": "Zechariah", "Mal": "Malachi", "Ps": "Psalms", "Prov": "Proverbs",
    "Job": "Job", "Song": "Song of Songs", "Ruth": "Ruth", "Lam": "Lamentations", "Eccl": "Ecclesiastes",
    "Esth": "Esther", "Dan": "Daniel", "Ezra": "Ezra", "Neh": "Nehemiah", "1Chr": "I Chronicles", "2Chr": "II Chronicles",
}

_FOOTNOTE = re.compile(r'<sup class="footnote-marker">.*?</sup><i class="footnote">.*?</i>', re.S)
_MARK = re.compile(r'<span class="mam-spi-(pe|samekh)">\{.\}</span>')
_KETIV = re.compile(r'<span class="mam-kq-k">(.*?)</span>')
_QERE = re.compile(r'<span class="mam-kq-q">(.*?)</span>')
_TEAMIM = re.compile("[֑-ֽֿ֯׀׃͏]")  # te'amim, meteg, rafe, paseq, sof pasuq, CGJ


def _text(book, check=True):
    """Chapters of verse strings, from the cache or Sefaria."""
    path = CACHE / f"{book}.json"
    if not path.exists():
        url = "https://www.sefaria.org/api/v3/texts/" + urllib.parse.quote(SEFARIA[book]) + "?version=hebrew"
        version = json.load(urllib.request.urlopen(url))["versions"][0]
        assert version["versionTitle"] == "Miqra according to the Masorah", version["versionTitle"]
        CACHE.mkdir(exist_ok=True)
        path.write_text(json.dumps(version["text"], ensure_ascii=False), encoding="utf-8")
    raw = path.read_bytes()
    known = dict(line.split()[::-1] for line in HASHES.read_text().splitlines() if line.strip()) if HASHES.exists() else {}
    if check and book in known and known[book] != hashlib.sha256(raw).hexdigest():
        sys.exit(f"{book}: MAM text changed upstream (sha256 differs from mam-sha256.txt); review, then --update-hashes")
    return json.loads(raw)


def _plain(s, keep):
    """Verse markup -> text. keep='ketiv' drops qere, keep='qere' drops ketiv (written vs read)."""
    s = _FOOTNOTE.sub("", s)
    s = _MARK.sub(" ", s)
    drop, take = (_QERE, _KETIV) if keep == "ketiv" else (_KETIV, _QERE)
    s = drop.sub("", s)
    s = take.sub(lambda m: m[1].strip("()[]"), s)
    s = s.replace("<br>", " ").replace("׆", "")  # inverted nun
    s = re.sub(r"<b>׀</b>|<[^>]+>", "", s)
    return html.unescape(s).replace(" ", " ").replace(" ", " ")


def _display(s):
    s = _TEAMIM.sub("", _plain(s, "qere")).replace("ׇ", "ָ")  # qamaṣ qaṭan -> qamaṣ
    return unicodedata.normalize("NFC", " ".join(s.split()))


def verses(book):
    out = []
    for c, chapter in enumerate(_text(book), 1):
        for v, s in enumerate(chapter, 1):
            marks = _MARK.findall(s)
            written = [w for w in re.split(r"[\s־]+", _plain(s, "ketiv")) if re.search("[א-ת]", w)]
            shown = _display(s).split()
            out.append(dict(ch=c, v=v, words=len(written), mark={"pe": "P", "samekh": "S"}[marks[-1]] if marks else "",
                            first=" ".join(shown[:4]), last=" ".join(shown[-3:]), text=shown))
    return out


if __name__ == "__main__":
    if "--update-hashes" in sys.argv:
        for b in SEFARIA:
            _text(b, check=False)  # fetch anything missing
        HASHES.write_text("".join(f"{hashlib.sha256((CACHE / f'{b}.json').read_bytes()).hexdigest()}  {b}\n" for b in SEFARIA))
        print("wrote", HASHES)
    else:
        for b in SEFARIA:
            vs = verses(b)
            print(b, len(vs), "verses", sum(x["words"] for x in vs), "words",
                  sum(x["mark"] == "P" for x in vs), "P", sum(x["mark"] == "S" for x in vs), "S")
