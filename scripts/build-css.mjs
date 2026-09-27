// Bundles src/styles into two stylesheets:
//   dist/styles.css            wrapped in @layer persian-ui, so any unlayered app CSS wins
//   dist/styles.unlayered.css  the same rules without a layer, for browsers older than
//                              Chrome 99 / Safari 15.4 / Firefox 97 (they ignore @layer blocks)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const IMPORT = /@import\s+["']([^"']+)["'];?/g;

function inline(file) {
  const css = readFileSync(file, "utf8");
  return css.replace(IMPORT, (_statement, path) => inline(join(dirname(file), path)).trim());
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const banner = `/*! ${pkg.name} v${pkg.version} | MIT License */\n`;
const css = inline("src/styles/index.css").trim();

mkdirSync("dist", { recursive: true });
writeFileSync("dist/styles.unlayered.css", `${banner}${css}\n`);
writeFileSync("dist/styles.css", `${banner}@layer persian-ui {\n${css}\n}\n`);
console.log("CSS dist/styles.css, dist/styles.unlayered.css");
