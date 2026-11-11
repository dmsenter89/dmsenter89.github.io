"""Text source: Miqra according to the Masorah, via ../../mam.py (see that file for
what counts as a word and how section marks are read). Interface as in common.get_source."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
import mam  # noqa: E402
from ey_table import sedarim  # noqa: E402,F401  (re-exported for common.py)

NAME = "Miqra according to the Masorah (Sefaria)"


def load_book(code):
    return [dict(c=x["ch"], v=x["v"], words=x["words"], mark={"P": "petuha", "S": "setuma"}.get(x["mark"]))
            for x in mam.verses(code)]


def verse_words(code):
    return {(x["ch"], x["v"]): x["text"] for x in mam.verses(code)}
