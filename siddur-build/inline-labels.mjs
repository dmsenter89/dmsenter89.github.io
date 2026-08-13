// Small inline instructional labels -- e.g. the "(woman: <alternate word>)"
// parenthetical used for gender-variant liturgy -- that should render as a
// plain English phrase in the transliteration column instead of being
// transliterated themselves. They're a reading instruction, not text that's
// actually recited, so "אִשָּׁה:" transliterating to "ʾishsha:" is wrong in
// spirit even though it's technically correct. The word that follows the
// label (e.g. מוֹדָה) IS recited, and is transliterated normally -- only the
// label itself is swapped.
//
// To add a new label, add an entry here; nothing else needs to change.
export const LABEL_MAP = {
  "אִשָּׁה:": "a woman says:",
};

// @@-delimited ASCII placeholders (not e.g. null bytes) so this file stays
// plain text -- a null byte makes git treat the whole file as binary,
// which breaks GitHub's diff view for no benefit.
function placeholderFor(index) {
  return "@@LABEL" + index + "@@";
}

export function shieldLabels(hebrew) {
  return Object.keys(LABEL_MAP).reduce(
    (text, label, i) => text.split(label).join(placeholderFor(i)),
    hebrew
  );
}

export function unshieldLabels(text) {
  return Object.values(LABEL_MAP).reduce(
    (result, replacement, i) => result.split(placeholderFor(i)).join(replacement),
    text
  );
}
