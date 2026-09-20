import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Chess } from "chess.js";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const openings = JSON.parse(
  readFileSync(resolve(root, "src/data/openings.json"), "utf8"),
);
const errors = [];
const volumes = new Set();

for (const opening of openings) {
  volumes.add(opening.eco[0]);
  const game = new Chess();
  const moves = opening.pgn
    .replace(/\d+\.(?:\.\.)?/g, " ")
    .trim()
    .split(/\s+/);
  for (const move of moves) {
    try {
      game.move(move);
    } catch {
      errors.push(`${opening.eco} ${opening.name}: ${move}`);
      break;
    }
  }
  if (game.fen().split(" ").slice(0, 4).join(" ") !== opening.epd) {
    errors.push(`${opening.eco} ${opening.name}: position does not match`);
  }
}

if (
  openings.length < 3000 ||
  new Set(openings.map((opening) => opening.id)).size !== openings.length ||
  "ABCDE".split("").some((letter) => !volumes.has(letter)) ||
  errors.length
) {
  console.error({
    count: openings.length,
    volumes: [...volumes],
    errors: errors.slice(0, 10),
  });
  process.exit(1);
}
console.log(`Validated ${openings.length} legal opening lines across ECO A–E.`);
