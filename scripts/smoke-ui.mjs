import assert from "node:assert/strict";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import { createServer } from "vite";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = resolve(root, "artifacts");
mkdirSync(output, { recursive: true });
const executablePath = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((path) => path && existsSync(path));
assert.ok(executablePath, "Set CHROME_PATH to a Chrome or Edge executable.");
const server = await createServer({
  configFile: resolve(root, "vite.config.js"),
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const url = server.resolvedUrls.local[0];
const errors = [];
let browser;

try {
  browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  assert.match(await page.locator(".hero h1").innerText(), /Own the opening/);
  assert.match(await page.locator(".brand").innerText(), /CO\.T/);
  assert.equal(await page.locator(".study-panel").count(), 0);
  await page.screenshot({
    path: resolve(output, "desktop.png"),
    fullPage: true,
  });
  assert.equal(await page.locator('.footer-links a[href="https://github.com/DeepInkGroup"]').count(), 1);

  await page.getByRole("button", { name: "Opening library" }).click();
  await page.locator(".board-wrap .piece").first().waitFor();
  const arrowFrom = await page.locator('.board-wrap [data-square="e2"]').boundingBox();
  const arrowTo = await page.locator('.board-wrap [data-square="e4"]').boundingBox();
  assert.ok(arrowFrom && arrowTo);
  await page.mouse.move(arrowFrom.x + arrowFrom.width / 2, arrowFrom.y + arrowFrom.height / 2);
  await page.mouse.down({ button: "right" });
  await page.mouse.move(arrowTo.x + arrowTo.width / 2, arrowTo.y + arrowTo.height / 2, { steps: 6 });
  await page.mouse.up({ button: "right" });
  assert.equal(await page.locator(".board-wrap .board-arrow").count(), 1);
  await page.screenshot({ path: resolve(output, "board-arrow.png"), fullPage: true });
  await page.getByRole("button", { name: "Enlarge board" }).click();
  const annotatedFocusBoard = page.getByRole("dialog", { name: "Large chess board" });
  await annotatedFocusBoard.waitFor();
  assert.equal(await annotatedFocusBoard.locator(".board-arrow").count(), 1);
  await annotatedFocusBoard.getByRole("button", { name: "Close large board" }).click();
  await page.getByRole("button", { name: "Clear board arrows" }).click();
  assert.equal(await page.locator(".board-wrap .board-arrow").count(), 0);
  assert.match(await page.locator(".opening-discovery").innerText(), /Opening explorer/i);
  await page.getByLabel("Sort openings").selectOption("name");
  await page.getByRole("button", { name: "Sicilian" }).click();
  assert.ok((await page.locator(".opening-row").count()) > 0);
  await page.getByRole("button", { name: "Any family" }).click();
  await page.screenshot({ path: resolve(output, "opening-library.png"), fullPage: true });
  await page.getByRole("button", { name: "Enlarge board" }).click();
  const focusBoard = page.getByRole("dialog", { name: "Large chess board" });
  await focusBoard.waitFor();
  assert.equal(await focusBoard.getByRole("grid").getByRole("gridcell").count(), 64);
  await page.screenshot({ path: resolve(output, "focus-board.png"), fullPage: true });
  await focusBoard.getByRole("button", { name: "Close large board" }).click();

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Books" }).click();
  await page.getByRole("heading", { name: /Books for players/ }).waitFor();
  assert.equal(await page.locator(".book-card").count(), 0);
  await page.screenshot({ path: resolve(output, "books.png"), fullPage: true });

  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Sign in" }).click();
  await page.screenshot({ path: resolve(output, "sign-in.png"), fullPage: true });
  await page.getByRole("button", { name: "Create account" }).click();
  await page.getByRole("textbox", { name: "Full name" }).fill("Test Player");
  await page.getByRole("textbox", { name: "Email or username" }).fill("player@example.com");
  await page.locator('input[aria-label="Password"]').fill("StrongPass9!");
  await page.getByRole("button", { name: "Create my account" }).click();
  await page.getByRole("heading", { name: "Welcome, Test Player." }).waitFor();
  assert.equal(await page.locator(".account-stats > div").count(), 4);
  assert.equal(await page.locator(".profile-preferences .appearance-theme").count(), 5);
  await page.getByRole("button", { name: "Use Ocean board" }).click();
  assert.equal(await page.getByRole("button", { name: "Use Ocean board" }).getAttribute("class"), "appearance-theme ocean active");
  const coordinatePreference = page.getByRole("switch", { name: "Show board coordinates" });
  await coordinatePreference.click();
  assert.equal(await coordinatePreference.getAttribute("aria-checked"), "false");
  await coordinatePreference.click();
  await page.getByLabel("Full name").fill("Test Strategist");
  await page.getByLabel("Country").fill("Iran");
  await page.getByLabel("FIDE rating").fill("1820");
  await page.getByLabel("Chess title").selectOption("CM");
  await page.getByLabel("Playing level").selectOption("Club player");
  await page.getByLabel("Favorite opening").fill("Sicilian Defense");
  await page.getByLabel("Short chess bio").fill("Building a practical tournament repertoire.");
  await page.getByRole("button", { name: "Save profile" }).click();
  await page.getByRole("heading", { name: "Welcome, Test Strategist." }).waitFor();
  await page.getByText("Profile updated.").waitFor();
  assert.match(await page.locator(".player-identity").innerText(), /Iran.*CM.*FIDE 1820/s);
  await page.screenshot({ path: resolve(output, "profile.png"), fullPage: true });
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Books" }).click();
  assert.match(await page.locator(".premium-account").innerText(), /Standard account/);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "My account" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("textbox", { name: "Email or username" }).fill("Admin");
  await page.locator('input[aria-label="Password"]').fill("Admin123!");
  await page.locator(".auth-submit").click();
  await page.getByRole("heading", { name: "Admin panel" }).waitFor();
  await page.locator(".admin-tabs").getByRole("button", { name: "Users" }).click();
  assert.match(await page.locator(".admin-table").innerText(), /Test Strategist/);
  await page.getByRole("button", { name: "Make premium" }).click();
  assert.match(await page.locator(".admin-table").innerText(), /Premium/);
  await page.locator(".admin-tabs").getByRole("button", { name: "Books" }).click();
  await page.getByPlaceholder("Book title").fill("Winning Chess Habits");
  await page.getByPlaceholder("Author").fill("CO.T Editorial");
  await page.getByPlaceholder("What it teaches").fill("A practical guide to better decisions.");
  await page.getByLabel("Book content").fill("Chapter 1 — Look first\n\nBefore every move, check your king and your opponent's threats.");
  await page.getByRole("button", { name: "Publish book" }).click();
  await page.getByText("Winning Chess Habits", { exact: true }).waitFor();
  await page.screenshot({ path: resolve(output, "admin-books.png"), fullPage: true });
  await page.locator(".admin-tabs").getByRole("button", { name: "Articles" }).click();
  await page.getByPlaceholder("Article title").fill("Three questions before every move");
  await page.getByPlaceholder("A short introduction for the article card").fill("Build a dependable thinking routine.");
  await page.getByLabel("Article content").fill("Start with your opponent's last move.\n\nThen scan checks, captures, and threats.");
  await page.getByRole("button", { name: "Publish article" }).click();
  await page.getByText("Three questions before every move", { exact: true }).waitFor();
  await page.screenshot({ path: resolve(output, "admin-articles.png"), fullPage: true });
  await page.locator(".admin-tabs").getByRole("button", { name: "Settings" }).click();
  await page.getByRole("textbox", { name: "Announcement", exact: true }).fill("New training week is live.");
  await page.getByText("New training week is live.").first().waitFor();
  const announcementSwitch = page.getByRole("switch", { name: "Show announcement" });
  await announcementSwitch.click();
  assert.equal(await page.locator(".site-notice").count(), 0);
  await announcementSwitch.click();
  assert.equal(await page.locator(".site-notice").count(), 1);
  const registrationSwitch = page.getByRole("switch", { name: "Allow new accounts" });
  await registrationSwitch.click();
  assert.equal(await registrationSwitch.getAttribute("aria-checked"), "false");
  await registrationSwitch.click();
  await page.getByRole("button", { name: "Use Slate board" }).click();
  assert.match(await page.getByRole("button", { name: "Use Slate board" }).getAttribute("class"), /active/);
  assert.equal(await page.getByRole("button", { name: "Download snapshot" }).count(), 1);
  await page.screenshot({ path: resolve(output, "admin.png"), fullPage: true });
  await page.locator(".admin-header").getByRole("button", { name: "Sign out" }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Articles" }).click();
  await page.getByRole("heading", { name: "Three questions before every move" }).waitFor();
  await page.getByRole("button", { name: "Read article" }).click();
  await page.getByRole("dialog", { name: /Reading Three questions/ }).waitFor();
  await page.getByRole("button", { name: "Close article" }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("textbox", { name: "Email or username" }).fill("player@example.com");
  await page.locator('input[aria-label="Password"]').fill("StrongPass9!");
  await page.locator(".auth-submit").click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Books" }).click();
  await page.locator(".book-card h3", { hasText: "Winning Chess Habits" }).waitFor();
  assert.equal(await page.locator(".book-card").count(), 1);
  await page.getByRole("button", { name: "Read book" }).click();
  await page.getByRole("dialog", { name: /Reading Winning Chess Habits/ }).waitFor();
  await page.getByRole("button", { name: "Close book" }).click();
  await page.getByRole("button", { name: "Overview" }).click();
  assert.equal(await page.locator(".study-panel").count(), 0);

  await page.getByRole("button", { name: "Play a game" }).first().click();
  assert.equal(await page.getByRole("tab", { name: "Play" }).getAttribute("aria-selected"), "true");
  await page.locator('.board-wrap [aria-label="e2 white pawn"]').click();
  await page.locator('.board-wrap [aria-label="e4"]').click();
  await page.waitForFunction(() => document.querySelectorAll(".move-list button").length === 2);
  assert.match(await page.locator(".game-status").innerText(), /Your move/);
  await page.getByRole("button", { name: "Take back" }).click();
  assert.equal(await page.locator(".move-list button").count(), 0);
  await page.getByRole("button", { name: "Black", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".move-list button").length === 1);
  assert.match(await page.locator(".game-status").innerText(), /Your move/);
  await page.screenshot({ path: resolve(output, "play.png"), fullPage: true });
  await page.getByRole("tab", { name: "Learn" }).click();
  await page.getByRole("button", { name: "Play from this position" }).click();
  assert.equal(await page.locator(".move-list button").count(), 6);
  assert.equal(await page.getByRole("tab", { name: "Play" }).getAttribute("aria-selected"), "true");

  await page.getByRole("button", { name: "Learn the basics" }).click();
  assert.equal(await page.locator(".lesson-card").count(), 7);
  assert.equal(await page.getByRole("button", { name: /Piece value and trades/ }).count(), 1);
  assert.equal(await page.locator(".study-panel").count(), 0);
  assert.equal(await page.locator(".thinking-habit").count(), 4);
  assert.equal(await page.locator(".basics-drill").count(), 1);
  assert.equal(await page.locator(".basics-drill .drill-progress span").count(), 10);
  await page.locator(".basics-drill").getByRole("button", { name: /e4/ }).click();
  assert.match(await page.locator(".basics-drill").innerText(), /Correct\./);
  assert.match(await page.locator(".basics-drill .coordinate-score").innerText(), /1 correct/);
  await page.getByRole("button", { name: "Square e4" }).click();
  assert.match(await page.locator(".coordinate-trainer .vision-stats").innerText(), /Accuracy\s+100%.*Current streak\s+1/is);
  await page.getByRole("tab", { name: /Color call/ }).click();
  await page.getByRole("button", { name: "Light square" }).click();
  assert.match(await page.locator(".coordinate-trainer .vision-stats").innerText(), /Best streak\s+2/is);
  await page.getByRole("button", { name: /Meet the pieces/ }).click();
  assert.equal(await page.locator(".piece-guide-card").count(), 6);
  await page.locator(".checkpoint-options button").nth(1).click();
  await page.getByText("Passed", { exact: true }).waitFor();
  assert.match(await page.locator(".basics-progress-card").innerText(), /1 of 7 complete/);
  await page.screenshot({
    path: resolve(output, "basics.png"),
    fullPage: true,
  });
  const sprint = page.locator(".basics-drill");
  await sprint.getByRole("button", { name: /Next question/ }).click();
  const sprintAnswers = [
    "Knight",
    "Your opponent’s threat",
    "After castling",
    "Attacks two targets",
    "5",
    "Castling",
    "A pawn with no enemy pawn able to stop it",
    "Defend or move it",
    "Checks, captures, threats",
  ];
  for (const [index, answer] of sprintAnswers.entries()) {
    await sprint.locator(".drill-options button").filter({ hasText: answer }).click();
    await sprint.getByRole("button", { name: index === sprintAnswers.length - 1 ? /See results/ : /Next question/ }).click();
  }
  await sprint.getByText("SPRINT COMPLETE").waitFor();
  assert.match(await sprint.innerText(), /10\/10.*best streak of 10/s);
  await page.screenshot({ path: resolve(output, "foundation-sprint-complete.png"), fullPage: true });
  await page.getByRole("button", { name: "Opening library" }).click();
  await page.locator('.board-wrap [aria-label="e2 white pawn"]').click();
  await page.locator('.board-wrap [aria-label="e4"]').click();
  assert.ok((await page.locator(".move-list").innerText()).includes("e4"));
  for (const [from, to] of [
    ["e7", "e5"],
    ["f1", "c4"],
    ["b8", "c6"],
    ["g1", "f3"],
  ]) {
    await page.locator(`.board-wrap [aria-label^="${from}"]`).click();
    await page.locator(`.board-wrap [aria-label^="${to}"]`).click();
  }
  assert.match(
    await page.locator(".study-opening p").innerText(),
    /Position reached: Italian Game/,
  );
  await page.getByRole("button", { name: "Reset board" }).click();
  for (const [from, to] of [
    ["a2", "a4"],
    ["h7", "h5"],
    ["a4", "a5"],
    ["h5", "h4"],
    ["a5", "a6"],
    ["h4", "h3"],
    ["a6", "b7"],
    ["h3", "g2"],
    ["b7", "a8"],
  ]) {
    await page.locator(`.board-wrap [aria-label^="${from}"]`).click();
    await page.locator(`.board-wrap [aria-label^="${to}"]`).click();
  }
  await page
    .getByRole("dialog", { name: "Choose a promotion piece" })
    .waitFor();
  await page.getByRole("button", { name: "Promote to knight" }).click();
  assert.equal(
    await page.locator('.board-wrap [aria-label="a8 white knight"]').count(),
    1,
  );

  await page.getByRole("button", { name: "Opening library" }).click();
  await page
    .getByRole("textbox", { name: "Search openings" })
    .fill("Sicilian Defense: Najdorf Variation");
  assert.ok((await page.locator(".opening-row").count()) > 0);
  await page.locator(".opening-row-main").first().click();
  assert.match(
    await page.locator(".study-opening h3").innerText(),
    /Sicilian Defense/,
  );
  await page.getByRole("button", { name: "Practice room" }).click();
  await page.getByRole("button", { name: /Recall drill/ }).click();
  await page.screenshot({ path: resolve(output, "practice-styles.png"), fullPage: true });
  await page.locator('.board-wrap [aria-label="e2 white pawn"]').click();
  assert.equal(await page.locator(".legal-dot").count(), 0);
  await page.locator('.board-wrap [aria-label="d2 white pawn"]').click();
  await page.locator('.board-wrap [aria-label="d4"]').click();
  await page.getByText(/Free practice is active/).waitFor();
  assert.match(await page.locator(".moves-heading").innerText(), /Your free practice/);
  assert.match(await page.locator(".study-opening p").innerText(), /Opening updated|recognition updates/);
  await page.locator('.board-wrap [aria-label="d7 black pawn"]').click();
  await page.locator('.board-wrap [aria-label="d5"]').click();
  assert.equal(await page.locator(".move-list button").count(), 2);
  await page.screenshot({ path: resolve(output, "practice-free.png"), fullPage: true });
  await page.getByRole("button", { name: /Guided line/ }).click();
  await page.getByRole("button", { name: "Hint", exact: true }).click();
  assert.ok(
    (await page.locator(".move-list button").nth(1).innerText()).includes(
      "•••",
    ),
  );
  await page.locator('.board-wrap [aria-label="e2 white pawn"]').click();
  await page.locator('.board-wrap [aria-label="e4"]').click();
  await page.getByText("That’s the move!").waitFor();
  await page.waitForTimeout(650);
  assert.ok(
    (await page.locator(".moves-heading span").innerText()).startsWith("2/"),
  );

  await page.getByRole("button", { name: "Save opening" }).last().click();
  await page.getByRole("button", { name: "My repertoire" }).click();
  assert.ok((await page.locator(".opening-row").count()) > 0);

  await page.getByRole("button", { name: "Opening library" }).click();
  await page
    .getByRole("textbox", { name: "Search openings" })
    .fill("Amar Opening");
  await page.locator(".opening-row-main").first().click();
  await page.getByRole("tab", { name: "Practice" }).click();
  await page.getByRole("button", { name: "Black" }).click();
  await page.getByText(/no Black moves to practice/).waitFor();
  assert.ok(
    (await page.locator(".moves-heading span").innerText()).startsWith("0/"),
  );
  await page.getByRole("button", { name: "White" }).click();
  await page.locator('.board-wrap [aria-label="g1 white knight"]').click();
  await page.locator('.board-wrap [aria-label="h3"]').click();
  await page.getByText("Line complete! Nicely played.").waitFor();
  await page.getByRole("button", { name: "My repertoire" }).click();
  await page.getByRole("button", { name: /Mastered/ }).click();
  assert.match(
    await page.locator(".opening-row-main").first().innerText(),
    /Amar Opening/,
  );

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto(url, { waitUntil: "networkidle" });
  await mobile.screenshot({
    path: resolve(output, "mobile.png"),
    fullPage: true,
  });
  assert.equal(
    await mobile
      .locator("body")
      .evaluate((body) => body.scrollWidth <= window.innerWidth),
    true,
  );
  await mobile.getByRole("button", { name: "Open menu" }).click();
  await mobile.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: "Play a game" }).click();
  await mobile.locator(".board-wrap .piece").first().waitFor();
  await mobile.waitForTimeout(300);
  assert.equal(
    await mobile.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth),
    true,
  );
  await mobile.screenshot({ path: resolve(output, "play-mobile.png"), fullPage: true });
  await mobile.getByRole("button", { name: "Open menu" }).click();
  await mobile.getByRole("button", { name: "Learn the basics" }).click();
  await mobile.waitForTimeout(320);
  assert.equal(await mobile.locator(".study-panel").count(), 0);
  await mobile.screenshot({
    path: resolve(output, "basics-mobile.png"),
    fullPage: true,
  });
  assert.equal(
    await mobile
      .locator("body")
      .evaluate((body) => body.scrollWidth <= window.innerWidth),
    true,
  );
  assert.deepEqual(errors, []);
  console.log("Browser smoke test passed. Screenshots saved in artifacts/.");
} finally {
  await browser?.close();
  await server.close();
}
