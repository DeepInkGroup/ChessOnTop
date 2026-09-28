import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, "artifacts");
mkdirSync(output, { recursive: true });
const chrome = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find(existsSync);
assert.ok(chrome, "Chrome or Edge is required for the engine check.");

process.env.GITHUB_PAGES = "true";
const server = await createServer({ configFile: resolve(root, "vite.config.js"), server: { host: "127.0.0.1", port: 0 } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
  const errors = [];
  for (const [name, width, height] of [["phone", 390, 844], ["tablet", 768, 1024], ["ipad", 1024, 768]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
    await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Practice room" }).click();
    await page.waitForTimeout(300);
    const boardTop = await page.locator(".board-wrap").evaluate((board) => board.getBoundingClientRect().top + scrollY);
    const catalogTop = await page.locator("#practice-lines").evaluate((panel) => panel.getBoundingClientRect().top + scrollY);
    assert.ok(boardTop < catalogTop, `${name} board should appear before the opening catalog`);
    await page.screenshot({ path: resolve(output, `practice-${name}.png`) });
    await page.locator('.board-wrap [aria-label="e2 white pawn"]').click();
    await page.locator('.board-wrap [aria-label="e4"]').click();
    await page.getByRole("button", { name: /Analyze with Stockfish/ }).click();
    const report = page.getByRole("dialog", { name: "Practice engine analysis" });
    await report.waitFor();
    await report.locator(".analysis-metrics").waitFor({ timeout: 60000 });
    assert.ok((await report.locator(".analysis-move-list button").count()) >= 1);
    assert.match(await report.locator(".analysis-best-line").innerText(), /ENGINE CHOICE/);
    assert.equal(await page.locator("body").evaluate((body) => body.scrollWidth <= innerWidth + 1), true, `${name} has horizontal overflow`);
    await page.screenshot({ path: resolve(output, `engine-${name}.png`) });
    await report.getByRole("button", { name: "Close analysis" }).click();
    const boardWidth = await page.locator(".board-wrap").evaluate((board) => board.getBoundingClientRect().width);
    assert.ok(boardWidth > Math.min(width * .72, 440), `${name} board is too narrow: ${boardWidth}px`);
    await page.close();
    console.log(`${name}: Stockfish analysis ready; board ${Math.round(boardWidth)}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await server.close();
}
