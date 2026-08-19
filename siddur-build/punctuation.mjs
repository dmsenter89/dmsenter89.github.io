// Biblical cantillation punctuation marks that the transliteration library
// silently drops instead of rendering, which leaves transliterated verses
// (Tehilla, the Amida's scriptural quotes, etc.) as one run-on line with no
// indication of where each verse ends. Shielded before transliterate() and
// swapped back afterward, the same way normalize-divine-name.mjs shields the
// Divine Name.
//
// - Sof pasuq (׃, U+05C3) marks the end of a verse -- rendered as ".".
// - Paseq (׀, U+05C0) is a minor disjunctive mark with no real transliteration
//   equivalent -- dropped, collapsing the surrounding whitespace down to one
//   space so it doesn't leave a visible double space behind.
//
// To add another cantillation mark that the library drops, add a case here;
// nothing else needs to change.

const SOF_PASUQ_PLACEHOLDER = "@@SOF_PASUQ@@";
const PASEQ_PLACEHOLDER = "@@PASEQ@@";

export function shieldPunctuation(hebrew) {
  // A leading space keeps the placeholder from gluing onto the preceding
  // word -- sof pasuq/paseq otherwise touch the last letter/mark directly,
  // with no space, and the library misreads the word boundary as a result
  // (e.g. "קׇרְאֵֽנוּ׃" transliterates as "qorĕʾenw" instead of "qorʾenu"
  // once the placeholder is glued straight onto it).
  return hebrew
    .split("׃")
    .join(" " + SOF_PASUQ_PLACEHOLDER)
    .split("׀")
    .join(" " + PASEQ_PLACEHOLDER);
}

export function unshieldPunctuation(text) {
  return text
    .split(new RegExp(`\\s*${SOF_PASUQ_PLACEHOLDER}\\s*`, "g"))
    .join(". ")
    .split(new RegExp(`\\s*${PASEQ_PLACEHOLDER}\\s*`, "g"))
    .join(" ");
}
