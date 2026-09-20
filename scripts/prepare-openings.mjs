import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { Chess } from "chess.js";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const openings = [];
const dataDir = resolve(root, "src", "data");
mkdirSync(dataDir, { recursive: true });

for (const letter of "abcde") {
  const rows = readFileSync(resolve(root, "public", `${letter}.tsv`), "utf8")
    .trim()
    .split(/\r?\n/);
  const volume = [];
  for (const row of rows.slice(1)) {
    const [eco, name, pgn] = row.split("\t");
    if (eco && name && pgn) {
      const game = new Chess();
      for (const move of pgn
        .replace(/\d+\.(?:\.\.)?/g, " ")
        .trim()
        .split(/\s+/))
        game.move(move);
      const id = createHash("sha1")
        .update(`${eco}|${name}|${pgn}`)
        .digest("hex")
        .slice(0, 12);
      const epd = game.fen().split(" ").slice(0, 4).join(" ");
      const opening = { id, eco, name, pgn, epd };
      openings.push(opening);
      volume.push(opening);
    }
  }
  writeFileSync(
    resolve(dataDir, `openings-${letter}.json`),
    JSON.stringify(volume),
  );
}

writeFileSync(resolve(dataDir, "openings.json"), JSON.stringify(openings));
console.log(`Prepared ${openings.length} opening lines.`);
