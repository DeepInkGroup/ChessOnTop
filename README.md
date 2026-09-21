# CO.T / ChessOn.Top

Live site: [deepinkgroup.github.io/ChessOnTop](https://deepinkgroup.github.io/ChessOnTop/)

A responsive chess opening studio with 3,815 searchable ECO A–E lines, six interactive beginner lessons, a legal interactive board, move playback, practice from either side, position recognition across move orders, saved openings, and local progress. Play mode adds complete games against a computer opponent, opening book replies, two difficulty settings, takebacks, and game result feedback.

The board includes player rails, three color themes, check and last move feedback, and optional legal move guides. Practice offers Guided, Recall, and Challenge formats with miss tracking. Administrators curate the Books reading room, which is available to users with Premium permission.

Player accounts can be created and signed in locally. Passwords are salted and hashed before browser storage. The local administrator account uses `Admin` / `Admin123!` and can grant Premium permission, enable or disable users, delete accounts, curate books, and publish a studio announcement. This is a browser-only demo account system; production authentication requires a trusted server and database.

The expand button beside the board opens Focus Board, a large centered playing view that keeps legal moves, board themes, orientation, game state, and practice feedback active.

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
```

The browser check uses installed Chrome or Edge (or `CHROME_PATH`) and writes screenshots to the ignored `artifacts/` folder.

## Data and artwork

Opening names and PGN lines come from [lichess-org/chess-openings](https://github.com/lichess-org/chess-openings), released under CC0. The source TSV files and license are included in `public/`.

Board pieces are the [Chessnut set used by Lichess](https://github.com/lichess-org/lila/tree/master/public/piece/chessnut), created by Alexis Luengas and listed under Apache 2.0 in [Lichess's copying notice](https://github.com/lichess-org/lila/blob/master/COPYING.md). A copy of the license is included in `public/pieces/LICENSE.txt`.

Your saved openings and completed practice lines are stored in your browser's local storage. No account or backend is required.
