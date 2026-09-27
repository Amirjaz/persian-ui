/// <reference types="node" />
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as core from "../src/core/index";
import * as components from "../src/react/index";

/* The README is the reference: it has to mention every CSS variable and export. */

const ROOT = join(import.meta.dirname, "..");
const readme = readFileSync(join(ROOT, "README.md"), "utf8");

describe("README", () => {
  const styles = readdirSync(join(ROOT, "src/styles"))
    .filter((name) => name.endsWith(".css"))
    .map((name) => readFileSync(join(ROOT, "src/styles", name), "utf8"))
    .join("\n");
  const variables = [...new Set(styles.match(/--pui-[\w-]+/g))].sort();

  it("finds the CSS variables", () => {
    expect(variables.length).toBeGreaterThan(20);
  });

  it.each(variables)("documents %s", (variable) => {
    expect(readme).toContain(`\`${variable}\``);
  });

  it.each(Object.keys(core))("documents core export %s", (name) => {
    expect(readme).toContain(name);
  });

  it.each(Object.keys(components))("documents component export %s", (name) => {
    expect(readme).toContain(name);
  });
});
