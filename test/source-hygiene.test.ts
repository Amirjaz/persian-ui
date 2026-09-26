/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|css)$/.test(name) ? [path] : [];
  });
}

const isArabicLetter = (codePoint: number) => codePoint >= 0x0620 && codePoint <= 0x06ff;

/**
 * Invisible and bidi-control characters must be written as \u escapes: in raw
 * form they are unreviewable, and bidi controls can make code read differently
 * from how it runs ("Trojan Source"). The one exception is a ZWNJ inside a
 * Persian word, which is ordinary spelling.
 */
function hiddenCharacters(text: string): string[] {
  const chars = [...text];
  const found: string[] = [];
  let line = 1;
  chars.forEach((ch, index) => {
    if (ch === "\n") {
      line += 1;
      return;
    }
    const codePoint = ch.codePointAt(0)!;
    const hidden =
      codePoint === 0x00ad ||
      codePoint === 0x061c ||
      (codePoint >= 0x200b && codePoint <= 0x200f) ||
      (codePoint >= 0x2028 && codePoint <= 0x202e) ||
      (codePoint >= 0x2060 && codePoint <= 0x2069) ||
      codePoint === 0xfeff;
    if (!hidden) return;
    if (codePoint === 0x200c) {
      const before = chars[index - 1]?.codePointAt(0) ?? 0;
      const after = chars[index + 1]?.codePointAt(0) ?? 0;
      if (isArabicLetter(before) && isArabicLetter(after)) return;
    }
    found.push(`line ${line}: U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`);
  });
  return found;
}

describe("source hygiene", () => {
  const files = [...sourceFiles(join(ROOT, "src")), ...sourceFiles(join(ROOT, "test"))];

  it("finds the source files", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((file) => [relative(ROOT, file), file]))(
    "%s has no raw invisible or bidi-control characters",
    (_name, file) => {
      expect(hiddenCharacters(readFileSync(file, "utf8"))).toEqual([]);
    },
  );
});
