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
//
// A single inseparable-preposition letter (ה/ו/ב/כ/ל/מ/ש -- "ha-", "ve-",
// "be-", "ke-", "le-", "mi-", "she-") is commonly prefixed onto the Name,
// either fused directly with no separator (לַיהֹוָה, "to Adhonay") or joined
// by a maqaf (טוֹב־יְהֹוָה, "Adhonay is good" -- note here the maqaf joins
// two whole separate words, "good" and the Name, not a one-letter prefix;
// distinguishing the two only matters for what gets captured as "prefix",
// since either way only the Name itself gets rewritten). That leading
// letter (and any niqqud/trope sitting on it, e.g. a trope mark landing on
// the prefix's own vowel rather than inside the Name) is captured and kept
// verbatim ahead of the normalized Name -- only the Name portion itself is
// rewritten to יְיָ.
//
// Maqaf, paseq, and sof pasuq (U+05BE, U+05C0, U+05C3) are deliberately
// excluded from MARK below, even though they sit inside the Unicode
// niqqud/teamim block, because they're punctuation rather than vocalization:
//   - maqaf joins two independent words rather than gluing a prefix onto
//     one -- treating it like ordinary whitespace in the lookbehind/lookahead
//     is what lets a maqaf-joined Name (טוֹב־יְהֹוָה, אֶת־יְהֹוָה) get
//     matched at all; folding it into MARK made those silently fall through
//     unmatched.
//   - paseq/sof pasuq trailing a Name at a verse's end would otherwise get
//     swallowed by the Name pattern's own trailing `[MARK]*` and then
//     silently dropped (isTeamim() doesn't count them as teamim worth
//     reattaching) -- e.g. "...נְאֻם־יְהֹוָה׃" losing its sof pasuq.

const HEBREW_LETTER = "\\u05D0-\\u05EA";
// niqqud + teamim, excluding maqaf (05BE), paseq (05C0), and sof pasuq (05C3)
const MARK = "\\u0591-\\u05BD\\u05BF\\u05C1-\\u05C2\\u05C4-\\u05C7";
const MAQAF = "\\u05BE";
const PREFIX_LETTER = "\\u05D4\\u05D5\\u05D1\\u05DB\\u05DC\\u05DE\\u05E9"; // ה ו ב כ ל מ ש
const SHEVA = "ְ";
const QAMATS = "ָ";

const DIVINE_NAME_RE = new RegExp(
  `(?<![${HEBREW_LETTER}][${MARK}]*)([${PREFIX_LETTER}][${MARK}]*${MAQAF}?)?(?:` +
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
  return hebrew.replace(DIVINE_NAME_RE, (match, prefix) => {
    const nameOnly = match.slice((prefix || "").length);
    const teamim = [...nameOnly].filter(isTeamim).join("");
    return (prefix || "") + "י" + SHEVA + "י" + QAMATS + teamim;
  });
}

// Placeholder used to shield the normalized Divine Name from the
// transliteration library's own per-letter handling, so it renders as the
// fixed reading "Adhonay" instead of a literal letter-by-letter
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
