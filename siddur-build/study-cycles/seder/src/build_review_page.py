"""Turn outputs/review_items.json into the review page.

    python3 src/build_review_page.py [--items PATH] [--out PATH]

The page (outputs/review_page.html) lists each flagged seder, the text on
both sides of every mid-paragraph break, and its options with daily word
counts; the reviewer taps one option per seder.

Saving choices uses the claude.ai Artifact 'db' capability
(claude.use('db'), collection 'choices', doc id = review id,
body {choice, at}). It works only when the page is published as a claude.ai
artifact with capabilities {"db": {}}; opened as a plain file it still
renders but cannot save. Export the collection to data/review_choices.json
(same shape) and run src/make_overrides.py.
"""
import argparse
import json

from common import OUTPUTS, ROOT, load_json


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--items", default=str(OUTPUTS / "review_items.json"))
    ap.add_argument("--out", default=str(OUTPUTS / "review_page.html"))
    args = ap.parse_args()
    items = load_json(args.items)
    tpl = (ROOT / "src" / "templates" / "review_page.html").read_text(encoding="utf-8")
    data = json.dumps(items, ensure_ascii=False).replace("</", "<\\/")
    html = tpl.replace("__COUNT__", str(len(items))).replace("__DATA__", data)
    open(args.out, "w", encoding="utf-8").write(html)
    print("wrote", args.out, f"({len(items)} sedarim)")


if __name__ == "__main__":
    main()
