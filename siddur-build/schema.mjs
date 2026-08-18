// The custom Sephardic-style transliteration schema, finalized in chat.
// Import this wherever transliterate() is called so there's exactly one
// place to update if the scheme ever changes.
//
// Divine Name handling is settled: the saved Hebrew source is normalized
// (see normalize-divine-name.mjs) so every occurrence -- the "יי" shorthand
// and every differently-vowelized spelling of the four-letter Name alike --
// is written consistently as unvocalized י״י, with cantillation preserved
// where present. The English side renders that as "Adhonay". Because the
// library can't cleanly treat "י״י" as one word (gershayim is punctuation,
// so it tokenizes as two separate single-yod words), that substitution is
// NOT done via DIVINE_NAME/ADDITIONAL_FEATURES below -- it's a plain string
// swap around transliterate(), handled in generate.mjs. DIVINE_NAME is left
// set here only as a defensive fallback, in case Hebrew ever reaches
// transliterate() without going through normalization first.

export const sephardicSchema = {
  // Begedkefet -- hard (dagesh)
  BET_DAGESH: "b",
  GIMEL_DAGESH: "g",
  DALET_DAGESH: "d",
  KAF_DAGESH: "k",
  PE_DAGESH: "p",
  TAV_DAGESH: "t",

  // Begedkefet -- soft (rafe)
  BET: "v",
  GIMEL: "gh",
  DALET: "dh",
  KAF: "kh",
  PE: "f",
  TAV: "th",

  // Final letter forms -- match their soft/rafe medial counterparts
  FINAL_KAF: "kh",
  FINAL_PE: "f",
  // FINAL_TSADI intentionally left at the library default ("ṣ"), matching
  // TSADI below -- samekh/tsadi keep the standard (non-swapped) convention.

  // Shin / Sin
  SHIN: "sh",
  SIN: "s",

  // Ayin
  AYIN: "'",

  // Vowels -- plain throughout (no macron/circumflex), per user preference.
  QAMATS: "a",
  QAMATS_HE: "a",
  HOLAM: "o",
  HOLAM_HASER: "o",
  HOLAM_VAV: "o",
  TSERE: "e",
  TSERE_YOD: "e",
  SEGOL_YOD: "e",
  HIRIQ_YOD: "i",
  SHUREQ: "u",
  QUBUTS: "u",
  MS_SUFX: "aw",

  // Reduced/vocal vowels -- kept breve-marked ("half circle pointing down",
  // e.g. ĕ) to stay visually distinct from the plain full vowels above.
  VOCAL_SHEVA: "ĕ",
  HATAF_PATAH: "ă",
  // HATAF_QAMATS and HATAF_SEGOL intentionally left at the library
  // defaults ("ŏ" and "ĕ") -- already breve-marked, nothing to override.

  // Defensive fallback only -- see note above. The real Divine Name
  // rendering happens as a string swap in generate.mjs, driven by
  // normalize-divine-name.mjs.
  DIVINE_NAME: "Adhonay",
};
