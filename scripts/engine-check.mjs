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
  for (const [name, width, height] of [["phone", 390, 844], ["tablet", 768, 1024], ["ipad", 1024, 768], ["desktop", 1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    page.on("pageerror", (error) => errors.push(`${name}: ${error.message}`));
    await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle" });
    if (width <= 1050) await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Practice room" }).click();
    await page.waitForTimeout(300);
    const boardTop = await page.locator(".board-wrap").evaluate((board) => board.getBoundingClientRect().top + scrollY);
    const catalogTop = await page.locator("#practice-lines").evaluate((panel) => panel.getBoundingClientRect().top + scrollY);
    if (width <= 1050) assert.ok(boardTop < catalogTop, `${name} board should appear before the opening catalog`);
    await page.screenshot({ path: resolve(output, `practice-${name}.png`) });
    await page.locator('.board-wrap [aria-label="e2 white pawn"]').click();
    await page.locator('.board-wrap [aria-label="e4"]').click();
    if (name === "desktop") {
      await page.getByRole("button", { name: "Enlarge board" }).click();
      const focus = page.getByRole("dialog", { name: "Large chess board" });
      await focus.getByRole("button", { name: "Undo move on large board" }).click();
      assert.equal(await focus.locator('[aria-label="e2 white pawn"]').count(), 1);
      await focus.getByRole("button", { name: "Close large board" }).click();
      await page.locator('.board-wrap [aria-label="e2 white pawn"]').click();
      await page.locator('.board-wrap [aria-label="e4"]').click();
    }
    await page.getByRole("button", { name: "Undo move", exact: true }).click();
    assert.equal(await page.locator('.board-wrap [aria-label="e2 white pawn"]').count(), 1, `${name} practice undo should restore the position`);
    await page.locator('.board-wrap [aria-label="e2 white pawn"]').click();
    await page.locator('.board-wrap [aria-label="e4"]').click();
    await page.getByRole("button", { name: /Analyze with Stockfish/ }).click();
    const report = page.getByRole("dialog", { name: "Practice engine analysis" });
    await report.waitFor();
    await report.locator(".analysis-metrics").waitFor({ timeout: 60000 });
    assert.ok((await report.locator(".analysis-move-list button").count()) >= 1);
    assert.match(await report.locator(".analysis-best-line").innerText(), /ENGINE CHOICE/);
    assert.equal(await report.locator(".analysis-mini-board .board").count(), 1);
    assert.equal(await report.locator(".analysis-chart-grid .data-chart").count(), 2);
    assert.equal(await report.locator(".quality-mix").count(), 1);
    assert.equal(await page.locator("body").evaluate((body) => body.scrollWidth <= innerWidth + 1), true, `${name} has horizontal overflow`);
    await page.screenshot({ path: resolve(output, `engine-${name}.png`) });
    await report.getByRole("button", { name: /Open in Live Analysis/ }).click();
    await page.locator(".live-variations > div").first().waitFor({ timeout: 60000 });
    assert.equal(await page.locator(".live-variations > div").count(), 3, `${name} should show three engine lines`);
    assert.equal(await page.locator(".analysis-mode").count(), 1);
    const beforeMoveCount = await page.locator(".live-board-moves button").count();
    const whiteToMove = (await page.locator(".live-hero-status").innerText()).includes("White to move");
    await page.locator(`.board-wrap [aria-label="${whiteToMove ? "g1 white" : "g8 black"} knight"]`).click();
    await page.locator(`.board-wrap [aria-label="${whiteToMove ? "f3" : "f6"}"]`).click();
    assert.equal(await page.locator(".live-board-moves button").count(), beforeMoveCount + 1);
    await page.waitForFunction(() => document.querySelectorAll('.live-chart-grid .data-chart:first-child circle').length >= 2, null, { timeout: 60000 });
    await page.getByRole("button", { name: "Undo move", exact: true }).click();
    assert.equal(await page.locator(".live-board-moves button").count(), beforeMoveCount);
    if (name === "desktop") await page.getByRole("combobox", { name: "Review candidates" }).selectOption("3");
    await page.getByRole("textbox", { name: "PGN to analyze" }).fill("1. d4 d5 2. c4");
    await page.getByRole("button", { name: /Load game/ }).click();
    await page.getByText(/Loaded 3 moves/).waitFor();
    await page.locator(".live-variations > div").first().waitFor({ timeout: 60000 });
    await page.waitForFunction(() => document.querySelectorAll('.live-chart-grid .data-chart:first-child circle').length === 4, null, { timeout: 60000 });
    await page.locator(".live-review-list button").first().click();
    if (name === "desktop") assert.match(await page.locator(".live-review-settings-note").innerText(), /3 candidates/);
    assert.match(await page.locator(".live-move-notebook").innerText(), /Human findability of the engine move/);
    assert.doesNotMatch(await page.locator(".live-opening-route h3").innerText(), /No catalog match yet/);
    await page.locator(".live-move-notebook").scrollIntoViewIfNeeded();
    await page.screenshot({ path: resolve(output, `review-${name}.png`) });
    assert.equal(await page.locator(".live-board-moves button").count(), 4, `${name} review navigation should keep the full game`);
    assert.match(await page.locator(".live-center-heading > span").innerText(), /1\/3 moves/);
    await page.locator(".live-board-moves button").last().click();
    assert.equal(await page.locator("body").evaluate((body) => body.scrollWidth <= innerWidth + 1), true, `${name} live page has horizontal overflow`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: resolve(output, `live-${name}.png`) });
    if (width <= 1050) await page.getByRole("button", { name: "Open menu" }).click();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Live analysis" }).click();
    await page.locator(".live-variations > div").first().waitFor({ timeout: 60000 });
    assert.equal(await page.locator(".live-board-moves button").count(), 1, `${name} direct navigation should start a new board`);
    const boardWidth = await page.locator(".board-wrap").evaluate((board) => board.getBoundingClientRect().width);
    assert.ok(boardWidth > (width <= 1050 ? Math.min(width * .72, 440) : 300), `${name} board is too narrow: ${boardWidth}px`);
    if (name === "desktop") {
      const centered = await page.locator(".live-center").evaluate((element) => {
        const board = element.getBoundingClientRect();
        const arena = element.parentElement.getBoundingClientRect();
        return Math.abs(board.left + board.width / 2 - (arena.left + arena.width / 2));
      });
      assert.ok(centered < 70, `desktop board should be centered in the main arena: ${centered}px`);
      await page.getByRole("combobox", { name: "Engine depth" }).selectOption("8");
      await page.getByRole("combobox", { name: "Review depth" }).selectOption("32");
      await page.getByRole("combobox", { name: "Review candidates" }).selectOption("5");
      await page.getByRole("combobox", { name: "Review time per move" }).selectOption("5000");
      assert.equal(await page.getByRole("combobox", { name: "Review depth" }).inputValue(), "32");
      await page.getByRole("combobox", { name: "Review depth" }).selectOption("14");
      await page.getByRole("combobox", { name: "Review candidates" }).selectOption("2");
      await page.getByRole("combobox", { name: "Review time per move" }).selectOption("200");
      await page.getByRole("combobox", { name: "Engine lines" }).selectOption("1");
      await page.locator(".live-variations > div").first().waitFor({ timeout: 60000 });
      assert.equal(await page.locator(".live-variations > div").count(), 1);
      await page.getByRole("switch", { name: "Auto analyze" }).click();
      assert.equal(await page.getByRole("switch", { name: "Auto analyze" }).getAttribute("aria-checked"), "false");
      await page.getByRole("button", { name: "Analyze position" }).click();
      await page.locator(".live-variations > div").first().waitFor({ timeout: 60000 });
      await page.getByRole("textbox", { name: "PGN to analyze" }).fill("1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6");
      await page.getByRole("button", { name: /Load game/ }).click();
      await page.getByText(/Loaded 14 moves/).waitFor();
      await page.locator(".live-review-list button").nth(13).waitFor({ timeout: 120000 });
      assert.match(await page.locator(".live-side-review.w").innerText(), /GAME RATING[\s\S]*Elo/);
      assert.match(await page.locator(".live-side-review.b").innerText(), /GAME RATING[\s\S]*Elo/);
      assert.equal(await page.locator(".live-category-row").count(), 4);
    }
    await page.close();
    console.log(`${name}: Stockfish analysis ready; board ${Math.round(boardWidth)}px`);
  }
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await server.close();
}
