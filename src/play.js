const values = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

export function createOpeningBook(openings) {
  const book = new Map();
  for (const opening of openings) {
    for (let index = 0; index < Math.min(opening.moves.length, 10); index += 1) {
      const key = opening.moves.slice(0, index).join(" ");
      if (!book.has(key)) book.set(key, new Map());
      const choices = book.get(key);
      const move = opening.moves[index];
      choices.set(move, (choices.get(move) || 0) + 1);
    }
  }
  return book;
}

function positionScore(game, color) {
  if (game.isCheckmate()) return game.turn() === color ? -100000 : 100000;
  if (game.isDraw()) return 0;
  let score = 0;
  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const file = piece.square.charCodeAt(0) - 97;
      const rank = Number(piece.square[1]) - 1;
      const center = 3.5 - (Math.abs(file - 3.5) + Math.abs(rank - 3.5)) / 2;
      const activity = piece.type === "p" || piece.type === "n" || piece.type === "b" ? center * 6 : 0;
      score += (piece.color === color ? 1 : -1) * (values[piece.type] + activity);
    }
  }
  return score;
}

export function pickComputerMove(game, difficulty, book) {
  const legal = game.moves({ verbose: true });
  if (!legal.length) return null;
  const choices = book.get(game.history().join(" "));
  if (choices) {
    const known = legal.filter((move) => choices.has(move.san));
    if (known.length) {
      const best = Math.max(...known.map((move) => choices.get(move.san)));
      const shortlist = known.filter((move) => choices.get(move.san) >= best * 0.65);
      return shortlist[Math.floor(Math.random() * shortlist.length)];
    }
  }

  const color = game.turn();
  let best = -Infinity;
  let bestMoves = [];
  for (const move of legal) {
    game.move(move);
    let score = positionScore(game, color);
    if (difficulty === "focused" && !game.isGameOver()) {
      let replyScore = Infinity;
      for (const reply of game.moves({ verbose: true })) {
        game.move(reply);
        replyScore = Math.min(replyScore, positionScore(game, color));
        game.undo();
      }
      score = replyScore;
    }
    game.undo();
    if (score > best + 0.01) {
      best = score;
      bestMoves = [move];
    } else if (score >= best - 0.01) {
      bestMoves.push(move);
    }
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

export function gameResult(game, humanSide) {
  if (game.isCheckmate()) return game.turn() === humanSide ? "Checkmate. The computer wins." : "Checkmate. You win!";
  if (game.isStalemate()) return "Draw by stalemate.";
  if (game.isThreefoldRepetition()) return "Draw by threefold repetition.";
  if (game.isInsufficientMaterial()) return "Draw: insufficient material.";
  if (game.isDraw()) return "The game is a draw.";
  return null;
}
