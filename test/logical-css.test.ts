/// <reference types="node" />
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * Right-to-left correctness depends on never using physical left/right
 * properties. This scans every stylesheet (source and build output) and every
 * inline style, so a stray `margin-left` fails the build.
 */

const ROOT = join(import.meta.dirname, "..");

const PHYSICAL: Array<[RegExp, string]> = [
  [/^(?:margin|padding|border|scroll-margin|scroll-padding)-(?:left|right)\b/, "use the -inline-start/-inline-end form"],
  [/^(?:left|right)$/, "use inset-inline-start/inset-inline-end"],
  [/^border-(?:top|bottom)-(?:left|right)-radius$/, "use border-start-start-radius and friends"],
];

const PHYSICAL_VALUES: Array<[RegExp, RegExp, string]> = [
  [/^text-align$/, /^(?:left|right)\b/, "use start/end"],
  [/^(?:float|clear)$/, /^(?:left|right)\b/, "use inline-start/inline-end"],
  [/^(?:transform|translate)$/, /translateX\(|^\S+\s/, "horizontal movement doesn't follow the direction"],
];

/** Splits a value on spaces that aren't inside (possibly nested) parentheses. */
function values(value: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of value.trim()) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (/\s/.test(char) && depth === 0) {
      if (current) parts.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/** Problems in one `property: value` declaration, or an empty list. */
export function physicalProblems(declaration: string): string[] {
  const colon = declaration.indexOf(":");
  if (colon === -1) return [];
  const property = declaration.slice(0, colon).trim().toLowerCase();
  const value = declaration.slice(colon + 1).replace(/!important/i, "").trim();
  if (property.startsWith("--")) return [];

  const problems: string[] = [];
  for (const [pattern, advice] of PHYSICAL) if (pattern.test(property)) problems.push(advice);
  for (const [propertyPattern, valuePattern, advice] of PHYSICAL_VALUES) {
    if (propertyPattern.test(property) && valuePattern.test(value)) problems.push(advice);
  }
  const shorthand = /^(?:margin|padding|inset|border-width|border-style|border-color|scroll-margin|scroll-padding)$/;
  if (shorthand.test(property)) {
    const parts = values(value);
    if (parts.length === 4 && parts[1] !== parts[3]) problems.push("left and right differ: use the -inline forms");
  }
  if (property === "border-radius") {
    const corners = values(value.split("/")[0]!);
    if (new Set(corners).size > 1) problems.push("corners are physical: use border-start-start-radius and friends");
  }
  return problems;
}

function stylesheetProblems(css: string): string[] {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/[;{}]/)
    .flatMap((declaration) => physicalProblems(declaration).map((problem) => `${declaration.trim()} → ${problem}`));
}

function inlineStyleProblems(tsx: string): string[] {
  const problems: string[] = [];
  for (const [block] of tsx.matchAll(/style=\{\{[\s\S]*?\}\}/g)) {
    if (/\b(?:margin|padding|border)(?:Left|Right)\w*\s*:|\b(?:left|right)\s*:/.test(block)) problems.push(block);
    if (/textAlign\s*:\s*["'](?:left|right)["']/.test(block)) problems.push(block);
  }
  return problems;
}

function files(dir: string, extension: RegExp): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path, extension);
    return extension.test(name) ? [path] : [];
  });
}

describe("the logical-properties guard", () => {
  it("catches physical properties", () => {
    expect(physicalProblems("margin-left: 4px")).not.toEqual([]);
    expect(physicalProblems("padding-right: 1rem")).not.toEqual([]);
    expect(physicalProblems("border-left-color: red")).not.toEqual([]);
    expect(physicalProblems("left: 0")).not.toEqual([]);
    expect(physicalProblems("border-top-right-radius: 4px")).not.toEqual([]);
    expect(physicalProblems("text-align: right")).not.toEqual([]);
    expect(physicalProblems("float: left")).not.toEqual([]);
    expect(physicalProblems("transform: translateX(4px)")).not.toEqual([]);
    expect(physicalProblems("margin: 0 1rem 0 2rem")).not.toEqual([]);
    expect(physicalProblems("border-radius: 4px 0")).not.toEqual([]);
    expect(inlineStyleProblems("<div style={{ marginLeft: 4 }} />")).not.toEqual([]);
    expect(inlineStyleProblems('<div style={{ textAlign: "right" }} />')).not.toEqual([]);
  });

  it("allows logical and symmetric ones", () => {
    const allowed = [
      "margin-inline-start: 4px",
      "inset-inline-end: 0",
      "text-align: start",
      "margin: 0 1rem",
      "padding: 1px 2px 3px 2px",
      "border-radius: 4px",
      "border-radius: calc(var(--r) - 2px)",
      "border-radius: var(--pui-field-radius, var(--pui-radius))",
      "margin: var(--a, 0 1px) var(--b, 2px)",
      "inset-block-start: calc(100% + 4px)",
      "--pui-left: 3px",
      "transform: scale(1.1)",
    ];
    for (const declaration of allowed) expect(physicalProblems(declaration)).toEqual([]);
  });
});

describe("stylesheets use logical properties only", () => {
  const stylesheets = [...files(join(ROOT, "src"), /\.css$/), ...files(join(ROOT, "dist"), /\.css$/)];

  it("finds the stylesheets", () => {
    expect(stylesheets.length).toBeGreaterThan(3);
  });

  it.each(stylesheets.map((file) => [relative(ROOT, file), file]))("%s", (_name, file) => {
    expect(stylesheetProblems(readFileSync(file, "utf8"))).toEqual([]);
  });

  it.each(files(join(ROOT, "src"), /\.tsx$/).map((file) => [relative(ROOT, file), file]))(
    "%s has no physical inline styles",
    (_name, file) => {
      expect(inlineStyleProblems(readFileSync(file, "utf8"))).toEqual([]);
    },
  );
});
