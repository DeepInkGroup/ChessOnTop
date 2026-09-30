# CO.T / ChessOn.Top

Live site: [deepinkgroup.github.io/ChessOnTop](https://deepinkgroup.github.io/ChessOnTop/)

A responsive chess opening studio with 3,836 searchable ECO A–E lines, interactive beginner lessons, a legal interactive board, move playback, practice from either side, position recognition across move orders, saved openings, and local progress. Play mode adds complete games against a computer opponent, opening book replies, two difficulty settings, takebacks, and game result feedback.

The board includes player rails, three color themes, check and last move feedback, and optional legal move guides. Practice offers Guided, Recall, and Challenge formats with miss tracking. Administrators curate the Books reading room, which is available to users with Premium permission.

Player accounts can be created and signed in locally. Passwords are salted and hashed before browser storage. The local administrator account uses `Admin` / `Admin123!` and can grant Premium permission, enable or disable users, delete accounts, curate books, and publish a studio announcement. This is a browser-only demo account system; production authentication requires a trusted server and database.

The expand button beside the board opens Focus Board, a large centered playing view that keeps legal moves, board themes, orientation, game state, and practice feedback active. Undo is available in Practice, free exploration, Live Analysis, Play, and Focus Board.

Practice review uses Stockfish.js to show move quality, evaluation and material charts, phase summaries, and a board snapshot for each move. Live Analysis places the playable board in the center, with position evaluation, engine continuations, and separate live and full game search settings. Search results update at completed depths and display depth, nodes, speed, time, and hash use. Full game review compares engine candidates from the same search depth and shows search workload alongside accuracy and move impact charts. Depth caps reach 32 plies; the live search can use up to 10 seconds per position, and full game review can use up to 5 seconds per position. Fast, Balanced, and Thorough review presets show an estimated time budget. It can load a PGN from the standard starting position and automatically review both sides after a pause in play. Completed reviews are reused when new moves extend the same game, so only the new moves need a fresh review. The review shows a two side accuracy chart, replayable turning points, recognized opening names as the line develops, move labels, a move by move notebook, accuracy, and opening, tactics, strategy, and endgame breakdowns. The notebook includes a heuristic findability score for the engine's best move; this is not a measured percentage of players. The displayed game Elo is a sample adjusted training estimate, not an official rating. Move accuracy follows the published [Lichess win chance formula](https://lichess.org/page/accuracy), averaged across each side's moves. Engine searches run in the browser.

## Run

```sh
npm install
npm run dev
```

If PowerShell blocks `npm.ps1`, use `npm.cmd` in the commands above.

`npm run build` creates a production bundle. `npm run prepare:data` regenerates the app's catalog from the included TSV files.

## Check

```sh
npm run test:data
npm run test:ui
npm run test:engine
```

The browser check uses installed Chrome or Edge (or `CHROME_PATH`) and writes screenshots to the ignored `artifacts/` folder.

## Data and artwork

Opening names and PGN lines come from [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings), released under CC0. The source TSV files and license are included in `public/`.

Board pieces are the [Chessnut set used by Lichess](https://github.com/lichess-org/lila/tree/master/public/piece/chessnut), created by Alexis Luengas and listed under Apache 2.0 in [Lichess's copying notice](https://github.com/lichess-org/lila/blob/master/COPYING.md). A copy of the license is included in `public/pieces/LICENSE.txt`.

Browser analysis uses [Stockfish.js 19 Lite](https://github.com/nmrugg/stockfish.js). The build copies its worker, WASM file, GPL license, and source attribution into the generated `public/engine/` directory.

Your saved openings and completed practice lines are stored in your browser's local storage. No account or backend is required.
