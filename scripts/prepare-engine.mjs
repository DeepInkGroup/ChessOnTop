import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const packageRoot = resolve(root, "node_modules", "stockfish");
const output = resolve(root, "public", "engine");
mkdirSync(output, { recursive: true });

for (const file of ["stockfish-19-lite-single.js", "stockfish-19-lite-single.wasm"]) {
  copyFileSync(resolve(packageRoot, "bin", file), resolve(output, file));
}
copyFileSync(resolve(packageRoot, "Copying.txt"), resolve(output, "Copying.txt"));
writeFileSync(resolve(output, "SOURCE.txt"), "Stockfish.js 19.0.0 by Nathan Rugg and Chess.com, LLC\nSource: https://github.com/nmrugg/stockfish.js/tree/v19.0.0\nLicense: GPL-3.0; see Copying.txt\n");
console.log("Prepared Stockfish 19 Lite for browser analysis.");
