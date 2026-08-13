// Normalizes every occurrence of the Divine Name in a Hebrew string to a
// single consistent form: יְיָ (yud-sheva, yud-qamats) -- a common
// Sephardic substitution convention, chosen (over the unvocalized י״י
// gershayim form used earlier in this project) because real niqqud gives
// cantillation marks a proper anchor to attach to. Without any niqqud on
// the letter, browsers/fonts have no attachment point for a following
// ta'am and render it as a detached mark trailing after the letter instead
// of positioned under/over it -- confirmed empirically across multiple
// fonts. Niqqud on a normal letter fixes that.
//
// Handles two source forms, each possibly carrying niqqud and/or cantillation
// (ta'amim) marks scattered through it:
//   - the two-yod shorthand ("יי", already unvocalized in this corpus)
//   - the fully-spelled Tetragrammaton, in ANY vowel-pointing (the source
//     doc deliberately varies the niqqud per occurrence -- an intentional
//     Sephardic convention, not a typo -- so this can't just match one
//     specific vowelization)
//
// Cantillation marks found within a matched span ARE preserved and
// reattached after the second yud (after its qamats). Original niqqud
// found within a matched span is DROPPED -- none of the source doc's
// varied/kabbalistic vowel-pointing is preserved, by design; the
// sheva/qamats pair below is fixed, not derived from the source.
//
// NOTE: the source doc's Arvit section also contains more heavily disguised
// variants with extra consonants inserted (e.g. "יוּהוּווּהוּ", not just
// revocalized) -- those are NOT matched by this pattern yet, since that
// content isn't in scope for the current chapter. Extend DIVINE_NAME_RE (or
// review its output) before normalizing any chapter that includes them.

const HEBREW_LETTER = "\\u05D0-\\u05EA";
const MARK = "\\u0591-\\u05C7"; // covers both teamim (0591-05AF) and niqqud
const SHEVA = "ְ";
const QAMATS = "ָ";

const DIVINE_NAME_RE = new RegExp(
  `(?<![${HEBREW_LETTER}][${MARK}]*)(?:` +
    `י[${MARK}]*ה[${MARK}]*ו[${MARK}]*ה[${MARK}]*` + // spelled Tetragrammaton, any niqqud
    `|` +
    `י[${MARK}]*י[${MARK}]*` + // two-yod shorthand
  `)(?![${MARK}]*[${HEBREW_LETTER}])`,
  "gu"
);

function isTeamim(ch) {
  const cp = ch.codePointAt(0);
  return cp >= 0x0591 && cp <= 0x05af;
}

export function normalizeDivineName(hebrew) {
  return hebrew.replace(DIVINE_NAME_RE, (match) => {
    const teamim = [...match].filter(isTeamim).join("");
    return "י" + SHEVA + "י" + QAMATS + teamim;
  });
}

// Placeholder used to shield the normalized Divine Name from the
// transliteration library's own per-letter handling, so it renders as the
// fixed reading "Adonay" instead of a literal letter-by-letter
// transliteration of יְיָ. See generate.mjs. Uses an @@-delimited ASCII
// token (not e.g. a null byte) so this file stays plain text -- a null
// byte makes git treat the whole file as binary, which breaks GitHub's
// diff view for no benefit.
export const DIVINE_NAME_PLACEHOLDER = "@@DIVINE_NAME@@";

export function shieldDivineName(hebrew) {
  return hebrew.replace(
    new RegExp(`י${SHEVA}י${QAMATS}[${MARK}]*`, "gu"),
    DIVINE_NAME_PLACEHOLDER
  );
}
