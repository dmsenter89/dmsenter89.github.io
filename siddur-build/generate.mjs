// Usage: node generate.mjs <chapter.json>
//
// For every item in a chapter file (sections -> items):
//   1. Normalizes the Divine Name in `hebrew` to a consistent unvocalized
//      י״י, preserving cantillation where present (see
//      normalize-divine-name.mjs). This rewrites the saved `hebrew` field
//      itself -- the varied/kabbalistic vowel-pointing from the source doc
//      is NOT preserved anywhere, by design.
//   2. Regenerates `translit` for type: "text" items only, rendering the
//      normalized Divine Name as "Adhonay" and cantillation punctuation
//      (sof pasuq, paseq) per punctuation.mjs -- the library otherwise
//      drops both silently.
// Overwrites the file in place.
//
// - `type: "rubric"` items have their Divine Name normalized (for
//   consistency in the saved Hebrew) but get no `translit` -- unvocalized
//   instructional text isn't something the transliteration library can
//   handle meaningfully.
// - `translation` fields are NEVER touched. Translit (and the Divine Name
//   normalization) are treated as fully machine-derived and safe to
//   regenerate on every run; translation is hand-authored content.
//
// Chapter shape: see README / siddur-handoff.md for the full schema.

import { readFileSync, writeFileSync } from "node:fs";
import { transliterate } from "hebrew-transliteration";
import { sephardicSchema } from "./schema.mjs";
import {
  normalizeDivineName,
  shieldDivineName,
  DIVINE_NAME_PLACEHOLDER,
} from "./normalize-divine-name.mjs";
import { shieldLabels, unshieldLabels } from "./inline-labels.mjs";
import { shieldPunctuation, unshieldPunctuation } from "./punctuation.mjs";

const path = process.argv[2];
if (!path) {
  console.error("Usage: node generate.mjs <chapter.json>");
  process.exit(1);
}

function transliterateWithDivineName(hebrew) {
  const labelShielded = shieldLabels(hebrew);
  const punctuationShielded = shieldPunctuation(labelShielded);
  const shielded = shieldDivineName(punctuationShielded);
  const rendered = transliterate(shielded, sephardicSchema);
  // Placeholder may pick up surrounding whitespace changes from the
  // library; replace on the raw token regardless of adjacent spacing.
  const withDivineName = rendered.split(DIVINE_NAME_PLACEHOLDER).join("Adhonay");
  return unshieldLabels(unshieldPunctuation(withDivineName)).trim();
}

const chapter = JSON.parse(readFileSync(path, "utf8"));
let translitCount = 0;
let normalizedCount = 0;
let missingTranslation = [];

// Recurses into "expandable" items' nested `items` array (occasion-specific
// insertions like Al HaNissim), which are otherwise siblings of ordinary
// section items in every other respect.
function processItems(items, sectionId) {
  for (const item of items ?? []) {
    if (item.hebrew) {
      const normalized = normalizeDivineName(item.hebrew);
      if (normalized !== item.hebrew) normalizedCount++;
      item.hebrew = normalized;

      if (item.type === "text") {
        item.translit = transliterateWithDivineName(item.hebrew);
        translitCount++;
        if (!item.translation || !item.translation.trim()) {
          missingTranslation.push(`${sectionId}/${item.id}`);
        }
      }
    }
    if (item.items) processItems(item.items, sectionId);
    if (item.options) {
      for (const opt of item.options) processItems(opt.items, sectionId);
    }
  }
}

for (const section of chapter.sections ?? []) {
  processItems(section.items, section.id);
}

writeFileSync(path, JSON.stringify(chapter, null, 2) + "\n");
console.log(`Normalized Divine Name in ${normalizedCount} item(s).`);
console.log(`Wrote ${translitCount} transliteration(s) to ${path}`);
if (missingTranslation.length) {
  console.log("Missing translations still needed for:", missingTranslation.join(", "));
}
