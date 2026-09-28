import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { createServer } from "vite";

const chrome = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
assert.ok(chrome, "Chrome or Edge is required for the export check.");

const server = await createServer({
  configFile: "vite.config.js",
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
let browser;
try {
  browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Opening library" }).first().click();
  await page.locator(".opening-position-export .piece").first().waitFor();
  await page.getByRole("textbox", { name: "Search openings" }).fill("CO.T Space Gain Plan");
  await page.locator(".opening-row-main").first().click();
  const selected = await page.locator(".opening-position-selected strong").innerText();
  assert.match(selected, /Alekhine Defense: CO\.T Space Gain Plan/);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PNG" }).click(),
  ]);
  const png = readFileSync(await download.path());
  assert.equal(png.readUInt32BE(16), 1400);
  assert.equal(png.readUInt32BE(20), 1800);
  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: "Save PDF" }).click(),
  ]);
  await popup.locator("img").waitFor();
  await popup.waitForFunction(() => document.querySelector("img")?.naturalWidth === 1400);
  await page.getByRole("button", { name: "Practice room" }).first().click();
  await page.locator(".practice-checkpoint-options button").nth(1).click();
  const progress = await page.locator(".moves-heading span").innerText();
  assert.ok(Number(progress.split("/")[0]) > 0, "Middle checkpoint must start after the first move.");
  assert.deepEqual(errors, []);
  console.log(`Export and checkpoint verified: ${selected}; PNG ${png.length} bytes; checkpoint ${progress}`);
} finally {
  await browser?.close();
  await server.close();
}
