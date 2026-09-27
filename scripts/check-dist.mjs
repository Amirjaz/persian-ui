// Checks the built package. Run after `pnpm build`.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (file) => readFileSync(root + file, "utf8");
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

const expected = [
  "dist/index.js",
  "dist/index.cjs",
  "dist/index.d.ts",
  "dist/index.d.cts",
  "dist/core/index.js",
  "dist/core/index.cjs",
  "dist/core/index.d.ts",
  "dist/core/index.d.cts",
  "dist/styles.css",
  "dist/styles.unlayered.css",
];
for (const file of expected) check(existsSync(root + file), `missing ${file}`);
if (failures.length === 0) {
  // Core: no React and no "use client", so Server Components can call it.
  for (const file of expected.filter((file) => file.startsWith("dist/core/"))) {
    check(!/\breact\b/i.test(read(file)), `${file} references react`);
    check(!read(file).includes('"use client"'), `${file} has a "use client" directive`);
  }
  // jalaali-js is MIT-licensed: its notice has to ship with the ported code.
  for (const file of ["dist/core/index.js", "dist/core/index.cjs"]) {
    check(read(file).includes("Behrang Norouzinia"), `${file} lost the jalaali-js license notice`);
  }

  // Components: client-only, and core is imported, not bundled a second time.
  for (const file of ["dist/index.js", "dist/index.cjs"]) {
    const code = read(file);
    check(code.startsWith('"use client";'), `${file} doesn't start with "use client"`);
    check(code.includes("@amirjaz/persian-ui/core"), `${file} doesn't import the core entry`);
    check(!code.includes("Behrang Norouzinia"), `${file} bundles a copy of core`);
  }

  // Stylesheets.
  check(read("dist/styles.css").includes("@layer persian-ui {"), "styles.css isn't layered");
  check(!/@layer\s+[\w-]+\s*\{/.test(read("dist/styles.unlayered.css")), "styles.unlayered.css has a layer");
  for (const file of ["dist/styles.css", "dist/styles.unlayered.css"]) {
    check(read(file).includes(".pui-calendar__day") && !read(file).includes("@import"), `${file} is incomplete`);
  }

  // Both formats load the way an app would load them (core resolved through the exports map)
  // and the components render on the server.
  const esm = await import(new URL("../dist/index.js", import.meta.url).href);
  const cjs = createRequire(import.meta.url)("../dist/index.cjs");
  const core = await import("@amirjaz/persian-ui/core");
  check(core.toGregorian({ year: 1404, month: 1, day: 1 }) === "2025-03-21", "core: toGregorian is broken");
  for (const [format, components] of [["ESM", esm], ["CJS", cjs]]) {
    const html = renderToString(
      createElement(components.PersianText, null, "شماره +98 912 345 6789"),
    );
    check(html.includes('<bdi dir="ltr">+98 912 345 6789</bdi>'), `${format}: PersianText renders wrong`);
    const picker = renderToString(createElement(components.PersianDatePicker, { label: "تاریخ" }));
    check(picker.includes("pui-date-picker"), `${format}: PersianDatePicker doesn't render`);
  }
}

if (failures.length > 0) {
  console.error(`check-dist failed:\n  - ${failures.join("\n  - ")}`);
  process.exit(1);
}
console.log(
  `check-dist: ${expected.length} files OK (core React-free, components "use client" and import core, CSS layered + unlayered, ESM/CJS render on the server)`,
);
