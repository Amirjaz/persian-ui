// Sanity checks on the built package. Run after `pnpm build`.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const coreFiles = ["dist/core/index.js", "dist/core/index.cjs", "dist/core/index.d.ts", "dist/core/index.d.cts"];
for (const file of coreFiles) check(existsSync(root + file), `missing ${file}`);

// The core entry must work without React: no import, require or reference to it.
for (const file of coreFiles.filter((file) => existsSync(root + file))) {
  const text = readFileSync(root + file, "utf8");
  check(!/\breact\b/i.test(text), `${file} references react`);
  check(!text.includes('"use client"'), `${file} has a "use client" directive`);
}

// jalaali-js is MIT-licensed: its notice has to ship with the ported code.
for (const file of ["dist/core/index.js", "dist/core/index.cjs"]) {
  if (existsSync(root + file)) {
    check(readFileSync(root + file, "utf8").includes("Behrang Norouzinia"), `${file} lost the jalaali-js license notice`);
  }
}

// Both module formats load and work.
const esm = await import(new URL("../dist/core/index.js", import.meta.url).href);
const cjs = createRequire(import.meta.url)("../dist/core/index.cjs");
for (const [name, mod] of [["ESM", esm], ["CJS", cjs]]) {
  check(mod.toGregorian({ year: 1404, month: 1, day: 1 }) === "2025-03-21", `${name} build: toGregorian is broken`);
  check(mod.validateSheba("").reason === "empty", `${name} build: validateSheba is broken`);
}

if (failures.length > 0) {
  console.error(`check-dist failed:\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(`check-dist: ${coreFiles.length} core files OK (ESM + CJS load, no React, license notice kept)`);
