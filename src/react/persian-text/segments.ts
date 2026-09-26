export interface TextSegment {
  text: string;
  /** Left-to-right content (Latin text, numbers, phone numbers) that must be isolated. */
  ltr: boolean;
}

/**
 * A left-to-right run: Latin words and numbers in any script, joined by the
 * punctuation that holds phone numbers, ranges, versions, dates, e-mail
 * addresses and URLs together. The Persian group and decimal separators (٬ ٫)
 * are included so «۱٬۲۵۰» stays one number. A run never starts or ends with
 * punctuation, so a sentence's closing period stays with the sentence.
 */
const LTR_RUN =
  /\+?[\p{Script=Latin}\p{Nd}]+[#%+]*(?:[ \t\u00a0.,:/@_\-+()'&٫٬]+[\p{Script=Latin}\p{Nd}]+[#%+]*)*/gu;

/** Splits text into right-to-left text and left-to-right runs. */
export function splitLtrRuns(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(LTR_RUN)) {
    const start = match.index;
    if (start > last) segments.push({ text: text.slice(last, start), ltr: false });
    segments.push({ text: match[0], ltr: true });
    last = start + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), ltr: false });
  return segments;
}
