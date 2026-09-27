// Captures the README images from the playground. Dev only.
// 1. pnpm dev   2. node scripts/screenshots.mjs   (uses the installed Edge; PUI_BROWSER_CHANNEL=chrome for Chrome)
/* global document -- used inside page.evaluate, which runs in the browser */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const URL = "http://localhost:5199/?shots";
const SHOTS = ["bidi", "inputs", "picker", "directions"];

mkdirSync("docs/images", { recursive: true });
const browser = await chromium.launch({ channel: process.env.PUI_BROWSER_CHANNEL ?? "msedge" });
const page = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 1100, height: 900 } });
await page.goto(URL, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

for (const name of SHOTS) {
  const path = `docs/images/${name}.png`;
  await page.locator(`#shot-${name}`).screenshot({ path });
  console.log("wrote", path);
}
await browser.close();
