import fc from "fast-check";

/*
 * Valid identifiers are always generated from their checksum rules. Never put a
 * real person's national ID or a real account's Sheba number in tests or docs.
 */

/** Appends the national-ID check digit to a 9-digit body. */
export function nationalIdFromBody(body: string): string {
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(body[i]) * (10 - i);
  const remainder = sum % 11;
  return body + String(remainder < 2 ? remainder : 11 - remainder);
}

const isIssuableBody = (body: string): boolean =>
  !/^(\d)\1{8}$/.test(body) && body.slice(3) !== "000000";

/** Valid national IDs (never a single repeated digit, never all-zero digits 4 to 9). */
export const nationalIdArb = fc
  .stringMatching(/^\d{9}$/)
  .filter(isIssuableBody)
  .map(nationalIdFromBody);

/** Valid national IDs that start with "00", as Tehran codes do. */
export const zeroPrefixedNationalIdArb = fc
  .stringMatching(/^00\d{7}$/)
  .filter(isIssuableBody)
  .map(nationalIdFromBody);

/** Builds "IR" + check digits + BBAN (22 digits) using ISO 13616 (I = 18, R = 27). */
export function shebaFromBban(bban: string): string {
  const remainder = BigInt(`${bban}182700`) % 97n;
  const checkDigits = (98n - remainder).toString().padStart(2, "0");
  return `IR${checkDigits}${bban}`;
}

/** Valid Sheba numbers with random 22-digit account parts. */
export const shebaArb = fc.stringMatching(/^\d{22}$/).map(shebaFromBban);
