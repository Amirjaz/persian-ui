// Captures the README images from the playground. Dev only.
// 1. pnpm dev   2. node scripts/screenshots.mjs   (uses the installed Edge; PUI_BROWSER_CHANNEL=chrome for Chrome)
// Set PORT if the playground isn't on 5199, and PUI_SHOTS_DIR to write somewhere other than docs/images.
/* global document -- used inside page.evaluate, which runs in the browser */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const URL = `http://localhost:${process.env.PORT ?? 5199}/?shots`;
const SHOTS = ["hero", "bidi", "search", "themes"];
const OUT = process.env.PUI_SHOTS_DIR ?? "docs/images";

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: process.env.PUI_BROWSER_CHANNEL ?? "msedge" });
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1400, height: 1000 } });
await page.goto(URL, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

for (const name of SHOTS) {
  const path = `${OUT}/${name}.png`;
  // Transparent outside the scene's rounded corners.
  await page.locator(`#shot-${name}`).screenshot({ path, omitBackground: true, animations: "disabled" });
  console.log("wrote", path);
}
await browser.close();
