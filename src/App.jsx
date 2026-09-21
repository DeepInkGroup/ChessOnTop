import { useEffect, useMemo, useState } from "react";
import { Chess } from "chess.js";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Check,
  ChevronLeft,
  Copy,
  ChevronRight,
  Compass,
  FlipHorizontal,
  GraduationCap,
  Heart,
  Eye,
  EyeOff,
  LayoutDashboard,
  Library,
  Lightbulb,
  ListChecks,
  LogIn,
  LogOut,
  Maximize2,
  Menu,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  Swords,
  Search,
  SkipBack,
  SkipForward,
  Sparkles,
  Settings,
  ShieldCheck,
  Target,
  Timer,
  Trash2,
  Trophy,
  User,
  UserPlus,
  Users,
  Zap,
  X,
} from "lucide-react";
import openingsA from "./data/openings-a.json";
import openingsB from "./data/openings-b.json";
import openingsC from "./data/openings-c.json";
import openingsD from "./data/openings-d.json";
import openingsE from "./data/openings-e.json";
import { createOpeningBook, gameResult, pickComputerMove } from "./play";

const rawOpenings = [
  ...openingsA,
  ...openingsB,
  ...openingsC,
  ...openingsD,
  ...openingsE,
];

const parseMoves = (pgn) =>
  pgn
    .replace(/\d+\.(?:\.\.)?/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
const OPENINGS = rawOpenings.map((item) => ({
  ...item,
  moves: parseMoves(item.pgn),
  family: item.name.split(":")[0],
}));
const OPENING_BY_ID = new Map(OPENINGS.map((item) => [item.id, item]));
const OPENING_BY_LINE = new Map(
  OPENINGS.map((item) => [item.moves.join(" "), item]),
);
const OPENING_BY_POSITION = new Map(OPENINGS.map((item) => [item.epd, item]));
const OPENING_BOOK = createOpeningBook(OPENINGS);
const featuredNames = [
  "Sicilian Defense: Najdorf Variation",
  "Queen's Gambit Declined",
  "Ruy Lopez: Berlin Defense",
];
const FEATURED = featuredNames
  .map(
    (name) =>
      OPENINGS.filter((item) => item.name === name).sort(
        (a, b) => b.moves.length - a.moves.length,
      )[0],
  )
  .filter(Boolean);
const POPULAR_FAMILIES = [
  "Sicilian Defense",
  "French Defense",
  "Caro-Kann Defense",
  "Ruy Lopez",
  "Italian Game",
  "Queen's Gambit",
  "English Opening",
  "King's Indian Defense",
].filter((family) => OPENINGS.some((item) => item.family === family));
const DEFAULT_OPENING = FEATURED[0] || OPENINGS[0];
const ECO_GROUPS = [
  {
    letter: "A",
    name: "Flank openings",
    detail: "English, Réti & more",
    icon: "♘",
  },
  {
    letter: "B",
    name: "Semi-open games",
    detail: "Sicilian, Caro-Kann & more",
    icon: "♞",
  },
  {
    letter: "C",
    name: "Open games",
    detail: "Ruy Lopez, French & more",
    icon: "♗",
  },
  {
    letter: "D",
    name: "Closed games",
    detail: "Queen's Gambit & more",
    icon: "♜",
  },
  {
    letter: "E",
    name: "Indian defenses",
    detail: "King's Indian & more",
    icon: "♝",
  },
];
const familyNotes = [
  {
    match: "Sicilian Defense",
    description:
      "An ambitious answer to 1. e4. Black fights for the d4 square from the flank and invites an unbalanced game.",
    goals: [
      "Keep an eye on the d4 square",
      "Develop naturally before launching an attack",
      "Notice how the pawn structure shapes the plans",
    ],
  },
  {
    match: "Queen's Gambit",
    description:
      "White challenges Black’s central pawn with c4, creating a lasting contest for central space.",
    goals: [
      "Challenge the d5 pawn with c4",
      "Develop while keeping the center flexible",
      "Watch for tension between the c and d pawns",
    ],
  },
  {
    match: "Ruy Lopez",
    description:
      "A classical opening that puts pressure on the knight defending Black’s e5 pawn.",
    goals: [
      "Develop the bishop to b5",
      "Castle and support the center",
      "Build pressure before resolving the tension",
    ],
  },
  {
    match: "Italian Game",
    description:
      "Fast development and a direct look at f7 make this a clear way to learn open positions.",
    goals: [
      "Develop the bishop toward f7",
      "Castle early",
      "Use the center to give your pieces room",
    ],
  },
  {
    match: "French Defense",
    description:
      "Black builds a sturdy center and prepares to challenge White’s pawn chain.",
    goals: [
      "Notice Black’s ...e6 and ...d5 setup",
      "Track the central pawn chain",
      "Look for well-timed pawn breaks",
    ],
  },
  {
    match: "Caro-Kann Defense",
    description:
      "A dependable reply to 1. e4 that prepares ...d5 while keeping the light-squared bishop active.",
    goals: [
      "Prepare the ...d5 challenge",
      "Develop pieces behind the pawn center",
      "Pay attention to the light-squared bishop",
    ],
  },
  {
    match: "King's Indian Defense",
    description:
      "Black lets White claim space, then prepares to challenge that center with active pieces and pawn breaks.",
    goals: [
      "Fianchetto the king-side bishop",
      "Castle before the center opens",
      "Look for the right moment to challenge the center",
    ],
  },
  {
    match: "English Opening",
    description:
      "White starts with c4, controlling central squares from the side and keeping several setups available.",
    goals: [
      "Control d5 from the flank",
      "Choose a flexible development setup",
      "Watch for transpositions into d4 openings",
    ],
  },
];
const genericNotes = {
  A: "A flexible opening that approaches the center from the flank. Follow the line to see how the pieces coordinate.",
  B: "A dynamic response to 1. e4. Follow the moves and notice when each side challenges the center.",
  C: "A central opening that rewards quick development. Watch how the pieces gain activity.",
  D: "A queen-pawn opening built around central tension. Notice how pawn moves shape the piece play.",
  E: "An Indian opening where the center and piece activity develop together. Look for the pawn break that changes the position.",
};
const BASICS_LESSONS = [
  {
    title: "The goal of chess",
    eyebrow: "01 · THE OBJECTIVE",
    icon: Target,
    description:
      "Every game is a race to make your pieces work together and checkmate the opposing king.",
    points: [
      "Check means the king is under attack. You must respond to it immediately.",
      "Checkmate means the king is in check and no legal move can save it.",
      "A game can end in a draw, including when a player has no legal move but is not in check.",
    ],
    exercise: "Find the king on each side, then make a legal move that gives check.",
    quiz: { question: "What must you do when your king is in check?", choices: ["Move any pawn", "Answer the check", "Offer a draw"], answer: 1 },
  },
  {
    title: "Meet the pieces",
    eyebrow: "02 · HOW THEY MOVE",
    icon: Compass,
    description:
      "Each piece has its own way of moving. Click a piece on the board to see its legal destinations.",
    points: [
      "The queen combines the rook’s straight lines and the bishop’s diagonals.",
      "The knight jumps in an L shape and can hop over other pieces.",
      "Pawns move forward, capture diagonally, and become stronger when they reach the far side.",
    ],
    exercise: "Select every piece once and compare the legal move dots on the board.",
    quiz: { question: "Which piece can jump over other pieces?", choices: ["Bishop", "Knight", "Rook"], answer: 1 },
  },
  {
    title: "Special moves",
    eyebrow: "03 · THE EXCEPTIONS",
    icon: Sparkles,
    description:
      "Three special rules give you more ways to protect your king and use your pawns.",
    points: [
      "Castling moves your king two squares toward a rook, then brings that rook beside the king. The path must be clear and safe.",
      "En passant lets a pawn capture an adjacent pawn immediately after it advances two squares past it.",
      "A pawn reaching the last rank promotes to a queen, rook, bishop, or knight.",
    ],
    exercise: "Clear the path between your king and rook, then try castling.",
    quiz: { question: "When can a pawn use en passant?", choices: ["Any time", "Immediately after a two-square pawn move", "Only in check"], answer: 1 },
  },
  {
    title: "Opening principles",
    eyebrow: "04 · YOUR FIRST PLAN",
    icon: Trophy,
    description:
      "A few simple ideas help you reach a playable position in almost every opening.",
    points: [
      "Fight for the center with pawns and pieces. Central squares give your pieces more choices.",
      "Develop your knights and bishops instead of moving the same piece again and again.",
      "Keep your king safe. Castling early often connects your rooks and prepares the middlegame.",
    ],
    exercise: "Play five moves while developing two pieces and controlling the center.",
    quiz: { question: "Which is usually a good opening priority?", choices: ["Move one piece repeatedly", "Develop knights and bishops", "Push every rook pawn"], answer: 1 },
  },
  {
    title: "Tactical patterns",
    eyebrow: "05 · SPOT THE IDEA",
    icon: Zap,
    description: "Tactics are short forcing sequences. Learn the shapes and you will notice opportunities faster.",
    points: [
      "A fork attacks two or more pieces at the same time.",
      "A pin stops a piece from moving because something more valuable sits behind it.",
      "A skewer attacks a valuable piece first and wins the piece behind it after it moves.",
    ],
    exercise: "Place a knight near the center and look for two targets it can attack at once.",
    quiz: { question: "What does a fork do?", choices: ["Attacks two targets", "Protects the king", "Trades queens"], answer: 0 },
  },
  {
    title: "Endgame essentials",
    eyebrow: "06 · FINISH WELL",
    icon: Timer,
    description: "With fewer pieces, the king becomes active and every pawn move carries more weight.",
    points: [
      "Bring your king toward the center when major attacking pieces have left the board.",
      "Create and support passed pawns that have no enemy pawn blocking their path.",
      "Use opposition to force the other king away from important squares.",
    ],
    exercise: "Trade pieces on the free board, then march your king toward the center.",
    quiz: { question: "What changes for the king in an endgame?", choices: ["It stays hidden", "It becomes an active piece", "It cannot move"], answer: 1 },
  },
];
const PIECE_GUIDE = [
  { name: "King", code: "K", movement: "One square in any direction" },
  { name: "Queen", code: "Q", movement: "Any distance, straight or diagonal" },
  { name: "Rook", code: "R", movement: "Any distance along a rank or file" },
  { name: "Bishop", code: "B", movement: "Any distance diagonally" },
  { name: "Knight", code: "N", movement: "An L shape; it can jump" },
  { name: "Pawn", code: "P", movement: "Forward; captures diagonally" },
];
const BEGINNER_ROUTINE = [
  { icon: ShieldCheck, title: "Check for danger", detail: "Is your king safe, and what is your opponent threatening?" },
  { icon: Target, title: "Look for forcing moves", detail: "Scan checks, captures, and direct threats first." },
  { icon: Eye, title: "Find loose pieces", detail: "Notice every piece that is attacked or left undefended." },
  { icon: Compass, title: "Improve your position", detail: "If there is no tactic, activate your least useful piece." },
];
const BASICS_DRILLS = [
  { question: "Which first move helps White control the center?", choices: ["a4", "e4", "h3"], answer: 1, note: "e4 claims central space and opens lines for the queen and bishop." },
  { question: "Which piece can jump over another piece?", choices: ["Knight", "Bishop", "Rook"], answer: 0, note: "The knight is the only piece that can jump over occupied squares." },
  { question: "What should you check before planning your move?", choices: ["The clock color", "Your opponent’s threat", "Your captured pieces"], answer: 1, note: "Start with your opponent’s last move and identify every immediate threat." },
  { question: "What is usually the safest early home for your king?", choices: ["The center", "After castling", "In front of a pawn"], answer: 1, note: "Castling usually moves the king away from the open center and activates a rook." },
  { question: "A fork is a move that…", choices: ["Attacks two targets", "Trades every pawn", "Ends in a draw"], answer: 0, note: "A fork creates two or more threats with one piece." },
];
const pieceCode = { k: "K", q: "Q", r: "R", b: "B", n: "N", p: "P" };
const pieceName = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};
const files = "abcdefgh".split("");
const DEFAULT_BOOKS = [];
const pieceAsset = (name) => `${import.meta.env.BASE_URL}pieces/${name}.svg`;
const PRACTICE_STYLES = [
  { id: "guided", title: "Guided line", detail: "Legal move dots and optional hints", icon: ListChecks },
  { id: "recall", title: "Recall drill", detail: "No move dots. Trust your memory", icon: Zap },
  { id: "challenge", title: "Challenge run", detail: "No hints. Count every miss", icon: Timer },
];

function readLocal(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function useStoredList(key) {
  const [value, setValue] = useState(() => readLocal(key, []));
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

function readStored(key, fallback, storage = localStorage) {
  try {
    const value = JSON.parse(storage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function useStoredValue(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback));
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue];
}

async function passwordDigest(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function makeGame(moves) {
  const game = new Chess();
  for (const move of moves) {
    try {
      game.move(move);
    } catch {
      break;
    }
  }
  return game;
}

function Board({
  game,
  orientation,
  selectedSquare,
  onSquareClick,
  onMove,
  interactiveColor = game.turn(),
  theme = "moss",
  showLegalMoves = true,
  compact = false,
}) {
  const ranks =
    orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const orderedFiles = orientation === "w" ? files : [...files].reverse();
  const lastMove = game.history({ verbose: true }).at(-1);
  const checkedKing = game.isCheck()
    ? game.board().flat().find((piece) => piece?.type === "k" && piece.color === game.turn())?.square
    : null;
  const legal = selectedSquare
    ? game
        .moves({ square: selectedSquare, verbose: true })
        .map((move) => move.to)
    : [];

  return (
    <div
      className={`board board-${theme} ${compact ? "board-compact" : ""}`}
      role="grid"
      aria-label={`Chess board, ${orientation === "w" ? "White" : "Black"} at bottom`}
    >
      {ranks.flatMap((rank, rowIndex) =>
        orderedFiles.map((file, colIndex) => {
          const square = `${file}${rank}`;
          const piece = game.get(square);
          const isLight = (files.indexOf(file) + rank) % 2 === 0;
          const canDrag = piece && piece.color === interactiveColor && !compact;
          return (
            <button
              key={square}
              type="button"
              role="gridcell"
              className={`square ${isLight ? "light" : "dark"} ${selectedSquare === square ? "selected" : ""} ${lastMove?.from === square ? "last-move last-from" : ""} ${lastMove?.to === square ? "last-move last-to" : ""} ${checkedKing === square ? "in-check" : ""}`}
              onClick={() => !compact && onSquareClick(square)}
              onDragOver={(event) => !compact && event.preventDefault()}
              onDrop={(event) => {
                if (!compact) {
                  event.preventDefault();
                  onMove(event.dataTransfer.getData("text/plain"), square);
                }
              }}
              aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${pieceName[piece.type]}` : ""}`}
              tabIndex={compact ? -1 : 0}
            >
              {colIndex === 0 && (
                <span className="coordinate rank">{rank}</span>
              )}
              {rowIndex === 7 && (
                <span className="coordinate file">{file}</span>
              )}
              {legal.includes(square) && !compact && showLegalMoves && (
                <span className={`legal-dot ${piece ? "capture" : ""}`} />
              )}
              {piece && (
                <img
                  draggable={!!canDrag}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/plain", square);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  src={pieceAsset(`${piece.color}${pieceCode[piece.type]}`)}
                  alt=""
                  className="piece"
                />
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}

function PlayerRail({ color, active, label, detail }) {
  return (
    <div className={`player-rail ${active ? "active" : ""}`}>
      <span className={`player-avatar ${color === "b" ? "black" : ""}`}>{color === "w" ? "♙" : "♟"}</span>
      <div><strong>{label}</strong><small>{detail}</small></div>
      <span className="player-clock">{active ? "YOUR TURN" : "WAITING"}</span>
    </div>
  );
}

function MiniBoard({ opening }) {
  const game = useMemo(() => makeGame(opening.moves.slice(0, 6)), [opening]);
  return (
    <div className="mini-board">
      <Board game={game} orientation="w" compact />
    </div>
  );
}

function App() {
  const [view, setView] = useState("overview");
  const [search, setSearch] = useState("");
  const [ecoFilter, setEcoFilter] = useState("All");
  const [openingFamily, setOpeningFamily] = useState("All");
  const [openingSort, setOpeningSort] = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(12);
  const [collectionTab, setCollectionTab] = useState("saved");
  const [activeLesson, setActiveLesson] = useState(0);
  const [basicAnswers, setBasicAnswers] = useState({});
  const [coordinateTarget, setCoordinateTarget] = useState("e4");
  const [coordinateScore, setCoordinateScore] = useState({ correct: 0, tries: 0 });
  const [coordinateFeedback, setCoordinateFeedback] = useState("Find the square before you click.");
  const [basicsDrill, setBasicsDrill] = useState({ index: 0, choice: null, score: 0 });
  const [selectedId, setSelectedId] = useState(DEFAULT_OPENING.id);
  const [mode, setMode] = useState("learn");
  const [ply, setPly] = useState(Math.min(6, DEFAULT_OPENING.moves.length));
  const [freeMoves, setFreeMoves] = useState([]);
  const [playMoves, setPlayMoves] = useState([]);
  const [playSide, setPlaySide] = useState("w");
  const [difficulty, setDifficulty] = useState("focused");
  const [practicePly, setPracticePly] = useState(0);
  const [practiceSide, setPracticeSide] = useState("w");
  const [practiceStyle, setPracticeStyle] = useState("guided");
  const [practiceMistakes, setPracticeMistakes] = useState(0);
  const [practiceFeedback, setPracticeFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [orientation, setOrientation] = useState("w");
  const [boardTheme, setBoardTheme] = useStoredValue("cot-board-theme", "moss");
  const [boardFocus, setBoardFocus] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [favorites, setFavorites] = useStoredList("openfile-favorites");
  const [completed, setCompleted] = useStoredList("openfile-completed");
  const [readingList, setReadingList] = useStoredList("openfile-reading-list");
  const [basicCompleted, setBasicCompleted] = useStoredList("openfile-basics-completed");
  const [users, setUsers] = useStoredValue("openfile-users", []);
  const [books, setBooks] = useStoredValue("openfile-books-v2", DEFAULT_BOOKS);
  const [articles, setArticles] = useStoredValue("cot-articles", []);
  const [siteNotice, setSiteNotice] = useStoredValue("openfile-site-notice", "");
  const [siteSettings, setSiteSettings] = useStoredValue("cot-site-settings", { announcementVisible: true, registrationOpen: true });
  const [currentUser, setCurrentUser] = useState(() => readStored("openfile-session", null, sessionStorage));
  const [authMode, setAuthMode] = useState("signin");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminTab, setAdminTab] = useState("overview");
  const [newBook, setNewBook] = useState({ title: "", author: "", focus: "", level: "Intermediate", content: "" });
  const [newArticle, setNewArticle] = useState({ title: "", author: "", category: "Strategy", summary: "", content: "" });
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const visibleBooks = books.filter((book) => book.visible !== false);
  const visibleArticles = articles.filter((article) => article.visible !== false);

  useEffect(() => {
    if (currentUser) sessionStorage.setItem("openfile-session", JSON.stringify(currentUser));
    else sessionStorage.removeItem("openfile-session");
  }, [currentUser]);
  useEffect(() => {
    setProfileName(currentUser?.name || "");
    setProfileMessage("");
  }, [currentUser?.id]);

  const opening = OPENING_BY_ID.get(selectedId) || DEFAULT_OPENING;
  const notes = familyNotes.find((note) =>
    opening.family.startsWith(note.match),
  ) || {
    description: genericNotes[opening.eco[0]],
    goals: [
      "Follow the main move order",
      "Notice the central pawn structure",
      "Replay the line until it feels familiar",
    ],
  };
  const lesson = BASICS_LESSONS[activeLesson];
  const drill = BASICS_DRILLS[basicsDrill.index];
  const displayedMoves =
    mode === "play"
      ? playMoves
      : mode === "explore"
      ? freeMoves
      : opening.moves.slice(0, mode === "practice" ? practicePly : ply);
  const game = useMemo(
    () => makeGame(displayedMoves),
    [displayedMoves.join(" ")],
  );
  const recognizedOpening =
    mode === "explore" || mode === "play"
      ? OPENING_BY_LINE.get(displayedMoves.join(" ")) ||
        OPENING_BY_POSITION.get(game.fen().split(" ").slice(0, 4).join(" "))
      : null;
  const availablePracticeMoves = opening.moves.filter(
    (_, index) => index % 2 === (practiceSide === "w" ? 0 : 1),
  ).length;
  const playResult = mode === "play" ? gameResult(game, playSide) : null;
  const computerThinking = mode === "play" && !playResult && game.turn() !== playSide;

  const filteredOpenings = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matches = OPENINGS.filter((item) => {
      if (ecoFilter !== "All" && item.eco[0] !== ecoFilter) return false;
      if (openingFamily !== "All" && item.family !== openingFamily) return false;
      if (
        view === "collection" &&
        !(collectionTab === "saved"
          ? favorites.includes(item.id)
          : completed.includes(item.id))
      )
        return false;
      return (
        !query ||
        `${item.name} ${item.eco} ${item.pgn}`.toLowerCase().includes(query)
      );
    });
    return [...matches].sort((a, b) => {
      if (openingSort === "name") return a.name.localeCompare(b.name);
      if (openingSort === "shortest") return a.moves.length - b.moves.length || a.name.localeCompare(b.name);
      if (openingSort === "deepest") return b.moves.length - a.moves.length || a.name.localeCompare(b.name);
      return 0;
    });
  }, [search, ecoFilter, openingFamily, openingSort, view, collectionTab, favorites, completed]);

  useEffect(() => {
    setVisibleCount(12);
  }, [search, ecoFilter, openingFamily, openingSort, view, collectionTab]);
  useEffect(() => {
    if (!playing || mode !== "learn") return;
    if (ply >= opening.moves.length) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setPly((current) => current + 1), 700);
    return () => clearTimeout(timer);
  }, [playing, mode, ply, opening]);
  useEffect(() => {
    if (!computerThinking || pendingPromotion) return;
    const timer = setTimeout(() => {
      const move = pickComputerMove(makeGame(playMoves), difficulty, OPENING_BOOK);
      if (move) setPlayMoves((current) => [...current, move.san]);
    }, 420);
    return () => clearTimeout(timer);
  }, [computerThinking, playMoves, difficulty, pendingPromotion]);
  useEffect(() => {
    if (mode !== "practice") return;
    if (availablePracticeMoves === 0) {
      setPracticeFeedback(
        `This line has no ${practiceSide === "w" ? "White" : "Black"} moves to practice. Choose the other side or a longer line.`,
      );
      return;
    }
    if (practicePly >= opening.moves.length) {
      setPracticeFeedback("Line complete! Nicely played.");
      setCompleted((current) =>
        current.includes(opening.id) ? current : [...current, opening.id],
      );
      return;
    }
    const nextColor = practicePly % 2 === 0 ? "w" : "b";
    if (nextColor !== practiceSide) {
      const timer = setTimeout(
        () => setPracticePly((current) => current + 1),
        540,
      );
      return () => clearTimeout(timer);
    }
  }, [
    mode,
    practicePly,
    practiceSide,
    opening,
    availablePracticeMoves,
    setCompleted,
  ]);
  useEffect(() => {
    const handleKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        document.querySelector(".search-box input")?.focus();
        return;
      }
      if (
        mode !== "learn" ||
        ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
      )
        return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setPly((current) => Math.max(0, current - 1));
        setPlaying(false);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setPly((current) => Math.min(opening.moves.length, current + 1));
        setPlaying(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode, opening.moves.length]);
  useEffect(() => {
    if (!pendingPromotion) return;
    const handleEscape = (event) => {
      if (event.key === "Escape") setPendingPromotion(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [pendingPromotion]);
  useEffect(() => {
    if (!boardFocus) return;
    const handleEscape = (event) => event.key === "Escape" && setBoardFocus(false);
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [boardFocus]);

  function resetForOpening(item) {
    setSelectedId(item.id);
    setPly(Math.min(6, item.moves.length));
    setFreeMoves([]);
    setPlayMoves([]);
    setPracticePly(0);
    setPracticeMistakes(0);
    setPracticeFeedback("");
    setShowHint(false);
    setSelectedSquare(null);
    setPendingPromotion(null);
    setPlaying(false);
    if (view !== "practice") setMode("learn");
    if (window.innerWidth < 1100)
      setTimeout(
        () =>
          document
            .getElementById("study-panel")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        70,
      );
  }

  function chooseView(next) {
    if (next === "admin" && currentUser?.role !== "admin") next = "account";
    setView(next);
    setBoardFocus(false);
    setMobileMenuOpen(false);
    if (next === "collection") {
      setEcoFilter("All");
      setSearch("");
    }
    if (next === "practice") {
      setMode("practice");
      setPracticePly(0);
      setPracticeFeedback("");
      setShowHint(false);
      setPracticeMistakes(0);
    }
    if (next === "basics") {
      setMode("explore");
      setFreeMoves([]);
      setSelectedSquare(null);
      setPendingPromotion(null);
    }
    if (next === "play") {
      setMode("play");
      setPlayMoves([]);
      setSelectedSquare(null);
      setPendingPromotion(null);
      setOrientation(playSide);
    }
    if (next === "overview") setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseMode(next) {
    setMode(next);
    setSelectedSquare(null);
    setPendingPromotion(null);
    setPlaying(false);
    setPracticeFeedback("");
    setPracticeMistakes(0);
    setShowHint(false);
    if (next === "practice") setPracticePly(0);
    if (next === "explore") setFreeMoves(opening.moves.slice(0, ply));
    if (next === "play") {
      setPlayMoves([]);
      setOrientation(playSide);
    }
  }

  function toggleFavorite(id) {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function tryMove(from, to, promotion) {
    if (mode === "play" && (computerThinking || playResult)) return;
    if (
      mode === "practice" &&
      (practicePly >= opening.moves.length || availablePracticeMoves === 0)
    )
      return;
    if (!from || from === to) {
      setSelectedSquare(null);
      return;
    }
    let move;
    try {
      move = new Chess(game.fen()).move({
        from,
        to,
        promotion: promotion || "q",
      });
    } catch {
      move = null;
    }
    setSelectedSquare(null);
    if (!move) return;
    if (move.promotion && !promotion) {
      setPendingPromotion({ from, to, color: move.color });
      return;
    }
    if (mode === "practice") {
      const expected = opening.moves[practicePly];
      if (move.san === expected) {
        setPracticePly((current) => current + 1);
        setPracticeFeedback("That’s the move!");
        setShowHint(false);
      } else {
        setPracticeMistakes((current) => current + 1);
        setPracticeFeedback(
          `That move is legal, but it is outside this line. Try again${showHint ? ` — ${expected}` : "."}`,
        );
      }
    } else if (mode === "play") {
      setPlayMoves((current) => [...current, move.san]);
    } else if (mode === "learn") {
      setFreeMoves([...opening.moves.slice(0, ply), move.san]);
      setMode("explore");
      setPracticeFeedback("");
    } else {
      setFreeMoves((current) => [...current, move.san]);
    }
  }

  function handleSquareClick(square) {
    if (mode === "play" && (computerThinking || playResult)) return;
    if (
      mode === "practice" &&
      (practicePly >= opening.moves.length || availablePracticeMoves === 0)
    )
      return;
    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }
    const piece = game.get(square);
    if (selectedSquare && (!piece || piece.color !== game.turn())) {
      tryMove(selectedSquare, square);
      return;
    }
    setSelectedSquare(piece?.color === game.turn() ? square : null);
  }

  const title = {
    overview: "Your opening studio",
    basics: "Learn the basics",
    openings: "Opening library",
    practice: "Practice room",
    play: "Play a game",
    collection: "My repertoire",
    books: "Chess books",
    articles: "Chess articles",
    account: currentUser ? "Your account" : "Sign in",
    admin: "Admin panel",
  }[view];
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "openings", label: "Opening library", icon: BookOpen },
    { id: "basics", label: "Learn the basics", icon: GraduationCap },
    { id: "practice", label: "Practice room", icon: Target },
    { id: "play", label: "Play a game", icon: Swords },
    { id: "books", label: "Books", icon: Library },
    { id: "articles", label: "Articles", icon: Lightbulb },
    { id: "collection", label: "My repertoire", icon: Bookmark },
    { id: currentUser?.role === "admin" ? "admin" : "account", label: currentUser?.role === "admin" ? "Admin panel" : currentUser ? "My account" : "Sign in", icon: currentUser?.role === "admin" ? ShieldCheck : User },
  ];

  async function copyPgn() {
    try {
      await navigator.clipboard.writeText(
        mode === "explore" || mode === "play" ? game.pgn() : opening.pgn,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function updateAuthField(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
    setAuthError("");
  }

  async function submitAuth(event) {
    event.preventDefault();
    const email = authForm.email.trim().toLowerCase();
    const password = authForm.password;
    if (authMode === "signin" && authForm.email.trim() === "Admin" && password === "Admin123!") {
      setCurrentUser({ id: "admin", name: "Administrator", email: "Admin", role: "admin" });
      setAuthForm({ name: "", email: "", password: "" });
      setView("admin");
      return;
    }
    if (authMode === "signup") {
      if (siteSettings.registrationOpen === false) {
        setAuthError("New account registration is currently paused.");
        return;
      }
      if (authForm.name.trim().length < 2 || !email.includes("@") || password.length < 8) {
        setAuthError("Use your name, a valid email, and at least 8 password characters.");
        return;
      }
      if (users.some((user) => user.email === email)) {
        setAuthError("An account with this email already exists.");
        return;
      }
      const salt = crypto.randomUUID();
      const passwordHash = await passwordDigest(password, salt);
      const user = { id: crypto.randomUUID(), name: authForm.name.trim(), email, salt, passwordHash, role: "user", premium: false, status: "active", joined: new Date().toISOString() };
      setUsers((current) => [...current, user]);
      setCurrentUser({ id: user.id, name: user.name, email: user.email, role: "user", premium: false });
      setAuthForm({ name: "", email: "", password: "" });
      setView("account");
      return;
    }
    const user = users.find((item) => item.email === email);
    if (!user || user.status === "disabled" || (await passwordDigest(password, user.salt)) !== user.passwordHash) {
      setAuthError(user?.status === "disabled" ? "This account has been disabled by an administrator." : "Email or password is incorrect.");
      return;
    }
    setCurrentUser({ id: user.id, name: user.name, email: user.email, role: "user", premium: !!user.premium });
    setAuthForm({ name: "", email: "", password: "" });
    setView("account");
  }

  function signOut() {
    setCurrentUser(null);
    setAuthMode("signin");
    setView("account");
  }

  function saveProfile(event) {
    event.preventDefault();
    const name = profileName.trim();
    if (name.length < 2 || currentUser?.role !== "user") return;
    setUsers((current) => current.map((user) => user.id === currentUser.id ? { ...user, name } : user));
    setCurrentUser((current) => ({ ...current, name }));
    setProfileMessage("Profile updated.");
  }

  function exportStudioContent() {
    const snapshot = {
      product: "CO.T / ChessOn.Top",
      exportedAt: new Date().toISOString(),
      books,
      articles,
      announcement: siteNotice,
      settings: siteSettings,
    };
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
    link.href = url;
    link.download = `cot-content-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function addBook(event) {
    event.preventDefault();
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    const palette = ["sage", "navy", "clay", "cream", "berry", "gold"];
    setBooks((current) => [...current, { ...newBook, id: crypto.randomUUID(), mark: String(current.length + 1).padStart(2, "0"), color: palette[current.length % palette.length], visible: true }]);
    setNewBook({ title: "", author: "", focus: "", level: "Intermediate", content: "" });
  }

  function addArticle(event) {
    event.preventDefault();
    if (!newArticle.title.trim() || !newArticle.content.trim()) return;
    setArticles((current) => [{
      ...newArticle,
      id: crypto.randomUUID(),
      author: newArticle.author.trim() || "CO.T Editorial",
      published: new Date().toISOString(),
      visible: true,
    }, ...current]);
    setNewArticle({ title: "", author: "", category: "Strategy", summary: "", content: "" });
  }

  function chooseCoordinate(square) {
    const correct = square === coordinateTarget;
    setCoordinateScore((current) => ({
      correct: current.correct + (correct ? 1 : 0),
      tries: current.tries + 1,
    }));
    if (!correct) {
      setCoordinateFeedback(`${square} is not it. Keep looking for ${coordinateTarget}.`);
      return;
    }
    const nextSquares = ["c6", "f2", "b7", "g5", "a3", "h6", "d8", "e1"];
    const next = nextSquares[coordinateScore.correct % nextSquares.length];
    setCoordinateFeedback(`Correct — that was ${coordinateTarget}. Now find ${next}.`);
    setCoordinateTarget(next);
  }

  return (
    <div className={`app-shell ${view === "play" && mode === "play" ? "play-mode" : ""} ${["overview", "basics", "books", "articles", "account", "admin"].includes(view) ? "wide-mode" : ""}`}>
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div
          className="brand"
          onClick={() => chooseView("overview")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => event.key === "Enter" && chooseView("overview")}
        >
          <div className="brand-mark">♞</div>
          <div>
            <strong>
              CO<span>.</span>T
            </strong>
            <small>CHESSON.TOP</small>
          </div>
        </div>
        <div className="side-section-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => chooseView(id)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{label}</span>
              {id === "collection" && favorites.length > 0 && (
                <em>{favorites.length}</em>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {mobileMenuOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="mobile-menu icon-button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span>ChessOn.Top</span>
            <ChevronRight size={15} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} />
              <input
                aria-label="Search openings"
                placeholder="Search openings or ECO..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  if (event.target.value) {
                    setEcoFilter("All");
                    setOpeningFamily("All");
                    setView("openings");
                  }
                }}
              />
              {search && (
                <button aria-label="Clear search" onClick={() => setSearch("")}>
                  <X size={15} />
                </button>
              )}
              <kbd>Ctrl K</kbd>
            </label>
            <button className="avatar" aria-label={currentUser ? "Your account" : "Sign in"} onClick={() => chooseView(currentUser?.role === "admin" ? "admin" : "account")}>
              {currentUser?.name?.[0]?.toUpperCase() || <User size={16} />}
            </button>
          </div>
        </header>
        {siteNotice && siteSettings.announcementVisible !== false && <div className="site-notice"><Sparkles size={14} /> {siteNotice}</div>}

        <div className="workspace">
          <main className="content">
            {view === "overview" && (
              <>
                <div className="welcome-line">
                  <span>
                    GOOD DAY, STRATEGIST <span className="wave">✳</span>
                  </span>
                  <span className="welcome-date">YOUR JOURNEY STARTS HERE</span>
                </div>
                <section className="hero">
                  <div className="hero-copy">
                    <div className="hero-label">
                      <Sparkles size={14} /> YOUR NEXT MOVE STARTS HERE
                    </div>
                    <h1>
                      Own the opening.
                      <br />
                      <em>Enjoy the game.</em>
                    </h1>
                    <p>
                      Explore timeless ideas, discover your favorite lines, and
                      build the confidence to play them.
                    </p>
                    <div className="hero-actions">
                      <button
                        className="primary-button"
                        onClick={() => chooseView("openings")}
                      >
                        Explore openings <ArrowRight size={17} />
                      </button>
                      <button
                        className="hero-secondary"
                        onClick={() => chooseView("play")}
                      >
                        <Swords size={15} /> Play a game
                      </button>
                    </div>
                  </div>
                  <div className="hero-art" aria-hidden="true">
                    <div className="hero-board-grid">
                      {Array.from({ length: 64 }, (_, i) => (
                        <span key={i} />
                      ))}
                    </div>
                    <div className="hero-knight">♞</div>
                    <div className="hero-spark one">✦</div>
                    <div className="hero-spark two">✦</div>
                  </div>
                </section>
                <div className="stat-row">
                  <div>
                    <span className="stat-icon green">
                      <Compass size={20} />
                    </span>
                    <strong>{OPENINGS.length.toLocaleString()}</strong>
                    <small>opening lines</small>
                  </div>
                  <div>
                    <span className="stat-icon peach">
                      <BookOpen size={20} />
                    </span>
                    <strong>5</strong>
                    <small>ECO collections</small>
                  </div>
                  <div>
                    <span className="stat-icon lavender">
                      <Heart size={20} />
                    </span>
                    <strong>{favorites.length}</strong>
                    <small>saved for later</small>
                  </div>
                </div>
                <div className="section-heading">
                  <div>
                    <span className="eyebrow dark">HANDPICKED FOR YOU</span>
                    <h2>Start with a classic</h2>
                    <p>Three great paths into the world of openings.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => chooseView("openings")}
                  >
                    View all openings <ArrowUpRight size={16} />
                  </button>
                </div>
                <div className="featured-grid">
                  {FEATURED.map((item, index) => (
                    <button
                      className={`feature-card feature-${index}`}
                      key={item.id}
                      onClick={() => resetForOpening(item)}
                    >
                      <div className="feature-top">
                        <span>
                          {String(index + 1).padStart(2, "0")} / FEATURED LINE
                        </span>
                        <ArrowUpRight size={17} />
                      </div>
                      <MiniBoard opening={item} />
                      <div className="feature-bottom">
                        <span className="eco-pill">{item.eco}</span>
                        <h3>{item.family}</h3>
                        <p>
                          {item.name.includes(":")
                            ? item.name.split(":").slice(1).join(":").trim()
                            : "Classic opening"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="section-heading category-heading">
                  <div>
                    <span className="eyebrow dark">FIND YOUR DIRECTION</span>
                    <h2>Explore by collection</h2>
                    <p>Five chapters. Thousands of possibilities.</p>
                  </div>
                </div>
                <div className="collection-grid">
                  {ECO_GROUPS.map((group) => (
                    <button
                      key={group.letter}
                      className="collection-card"
                      onClick={() => {
                        setEcoFilter(group.letter);
                        setOpeningFamily("All");
                        chooseView("openings");
                      }}
                    >
                      <span className="collection-icon">{group.icon}</span>
                      <span className="collection-letter">
                        ECO {group.letter}
                      </span>
                      <strong>{group.name}</strong>
                      <small>{group.detail}</small>
                      <ChevronRight className="collection-arrow" size={17} />
                    </button>
                  ))}
                </div>
              </>
            )}

            {view === "basics" && (
              <>
                <div className="page-heading basics-heading">
                  <div>
                    <span className="eyebrow dark">
                      A FRIENDLY PLACE TO BEGIN
                    </span>
                    <h1>
                      Learn the basics<span className="heading-dot">.</span>
                    </h1>
                    <p>
                      Get comfortable with the board, the pieces, and your first
                      plan.
                    </p>
                  </div>
                  <div className="heading-decoration">♔</div>
                </div>
                <div className="basics-intro">
                  <span className="basics-intro-icon">
                    <GraduationCap size={23} />
                  </span>
                  <div>
                    <strong>Learn one idea at a time</strong>
                    <p>
                      Read a short lesson, then try it on the free practice
                      board.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setMode("explore");
                      setFreeMoves([]);
                      setSelectedSquare(null);
                      setBoardFocus(true);
                    }}
                  >
                    Try the board <ArrowRight size={16} />
                  </button>
                </div>
                <div className="basics-progress-card">
                  <div className="basics-progress-copy"><span>{basicCompleted.length} of {BASICS_LESSONS.length} complete</span><strong>{basicCompleted.length === BASICS_LESSONS.length ? "Foundation complete" : "Your learning path"}</strong></div>
                  <div className="basics-progress-track"><span style={{ width: `${(basicCompleted.length / BASICS_LESSONS.length) * 100}%` }} /></div>
                  <span className="basics-progress-percent">{Math.round((basicCompleted.length / BASICS_LESSONS.length) * 100)}%</span>
                </div>
                <div className="section-heading basics-section-heading">
                  <div>
                    <span className="eyebrow dark">A LITTLE AT A TIME</span>
                    <h2>Your first six lessons</h2>
                    <p>Read the idea, try the board challenge, then pass the checkpoint.</p>
                  </div>
                </div>
                <div className="lesson-grid">
                  {BASICS_LESSONS.map((item, index) => {
                    const LessonIcon = item.icon;
                    return (
                      <button
                        key={item.title}
                        className={`lesson-card ${activeLesson === index ? "active" : ""}`}
                        onClick={() => setActiveLesson(index)}
                      >
                        <span className="lesson-card-top">
                          <span>{item.eyebrow}</span>
                          <LessonIcon size={19} />
                        </span>
                        <strong>{item.title}</strong>
                        {basicCompleted.includes(index) ? <span className="lesson-card-complete"><Check size={14} /> Done</span> : <ArrowUpRight size={17} className="lesson-card-arrow" />}
                      </button>
                    );
                  })}
                </div>
                <section className="lesson-detail">
                  <div className="lesson-detail-top">
                    <span className="eyebrow dark">{lesson.eyebrow}</span>
                    <div className="lesson-number">
                      {String(activeLesson + 1).padStart(2, "0")} / {String(BASICS_LESSONS.length).padStart(2, "0")}
                    </div>
                  </div>
                  <h2>{lesson.title}</h2>
                  <p className="lesson-description">{lesson.description}</p>
                  {activeLesson === 1 && (
                    <div className="piece-guide">
                      {PIECE_GUIDE.map((piece) => (
                        <div key={piece.code} className="piece-guide-card">
                          <img src={pieceAsset(`w${piece.code}`)} alt="" />
                          <div>
                            <strong>{piece.name}</strong>
                            <span>{piece.movement}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="lesson-points">
                    {lesson.points.map((point, index) => (
                      <div key={point}>
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <p>{point}</p>
                      </div>
                    ))}
                  </div>
                  <div className="notation-tip">
                    <BookOpen size={17} />
                    <p>
                      <strong>Reading a move:</strong> e4 means a pawn moves to
                      e4. Nf3 means a knight moves to f3. O-O means castle
                      toward the king’s side.
                    </p>
                  </div>
                  <div className="lesson-practice">
                    <span><Target size={18} /></span>
                    <div><strong>Try it on the board</strong><p>{lesson.exercise}</p></div>
                    <button onClick={() => { setMode("explore"); setFreeMoves([]); setSelectedSquare(null); setBoardFocus(true); }}>Open challenge board <Maximize2 size={15} /></button>
                  </div>
                  <div className={`lesson-checkpoint ${basicAnswers[activeLesson] === lesson.quiz.answer ? "correct" : ""}`}>
                    <div className="checkpoint-heading"><span className="eyebrow dark">QUICK CHECKPOINT</span>{basicAnswers[activeLesson] === lesson.quiz.answer && <span className="checkpoint-passed"><Check size={13} /> Passed</span>}</div>
                    <h3>{lesson.quiz.question}</h3>
                    <div className="checkpoint-options">
                      {lesson.quiz.choices.map((choice, index) => <button key={choice} className={basicAnswers[activeLesson] === index ? index === lesson.quiz.answer ? "correct" : "wrong" : ""} onClick={() => {
                        setBasicAnswers((current) => ({ ...current, [activeLesson]: index }));
                        if (index === lesson.quiz.answer) setBasicCompleted((current) => current.includes(activeLesson) ? current : [...current, activeLesson]);
                      }}><span>{String.fromCharCode(65 + index)}</span>{choice}{basicAnswers[activeLesson] === index && (index === lesson.quiz.answer ? <Check size={14} /> : <X size={14} />)}</button>)}
                    </div>
                    {basicAnswers[activeLesson] !== undefined && basicAnswers[activeLesson] !== lesson.quiz.answer && <p className="checkpoint-feedback">Not quite. Review the lesson above and try again.</p>}
                  </div>
                  <div className="lesson-footer">
                    <span>{basicCompleted.includes(activeLesson) ? "Lesson complete. Keep going." : "Pass the checkpoint to complete this lesson."}</span>
                    <button
                      onClick={() => activeLesson < BASICS_LESSONS.length - 1 ? setActiveLesson(activeLesson + 1) : chooseView("openings")}
                    >
                      {activeLesson < BASICS_LESSONS.length - 1
                        ? "Next lesson"
                        : "Explore openings"}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
                <div className="basics-lab">
                  <section className="coordinate-trainer">
                    <div className="basics-tool-heading">
                      <div>
                        <span className="eyebrow dark">BOARD VISION</span>
                        <h2>Find <strong>{coordinateTarget}</strong></h2>
                      </div>
                      <span className="coordinate-score">{coordinateScore.correct} correct · {coordinateScore.tries} tries</span>
                    </div>
                    <div className="coordinate-board" role="group" aria-label={`Find square ${coordinateTarget}`}>
                      {[8, 7, 6, 5, 4, 3, 2, 1].flatMap((rank, rowIndex) =>
                        files.map((file, columnIndex) => {
                          const square = `${file}${rank}`;
                          return (
                            <button
                              type="button"
                              key={square}
                              className={(rowIndex + columnIndex) % 2 === 0 ? "light" : "dark"}
                              aria-label={`Square ${square}`}
                              onClick={() => chooseCoordinate(square)}
                            >
                              {columnIndex === 0 && <span className="coordinate-rank">{rank}</span>}
                              {rowIndex === 7 && <span className="coordinate-file">{file}</span>}
                            </button>
                          );
                        }),
                      )}
                    </div>
                    <p className="coordinate-feedback" aria-live="polite">{coordinateFeedback}</p>
                  </section>
                  <section className="thinking-routine">
                    <div className="basics-tool-heading">
                      <div>
                        <span className="eyebrow dark">BEFORE EVERY MOVE</span>
                        <h2>Your thinking routine</h2>
                      </div>
                    </div>
                    <p className="thinking-intro">Use this quick scan in every practice game until it becomes automatic.</p>
                    <div className="thinking-habits">
                      {BEGINNER_ROUTINE.map(({ icon: HabitIcon, title: habitTitle, detail }, index) => (
                        <div className="thinking-habit" key={habitTitle}>
                          <span><HabitIcon size={17} /></span>
                          <div><small>STEP {index + 1}</small><strong>{habitTitle}</strong><p>{detail}</p></div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className="basics-drill">
                    <div className="drill-visual" aria-hidden="true"><span>3</span><Timer size={25} /><small>MINUTE<br />SPRINT</small></div>
                    <div className="drill-content">
                      <div className="basics-tool-heading"><div><span className="eyebrow dark">NEW · FOUNDATION SPRINT</span><h2>Turn ideas into quick recall</h2></div><span className="coordinate-score">{basicsDrill.score} correct</span></div>
                      <div className="drill-progress" aria-label={`Question ${basicsDrill.index + 1} of ${BASICS_DRILLS.length}`}>{BASICS_DRILLS.map((_, index) => <span key={index} className={index <= basicsDrill.index ? "active" : ""} />)}</div>
                      <h3>{drill.question}</h3>
                      <div className="drill-options">
                        {drill.choices.map((choice, index) => (
                          <button key={choice} disabled={basicsDrill.choice !== null} className={basicsDrill.choice === index ? index === drill.answer ? "correct" : "wrong" : basicsDrill.choice !== null && index === drill.answer ? "correct" : ""} onClick={() => setBasicsDrill((current) => ({ ...current, choice: index, score: current.score + (index === drill.answer ? 1 : 0) }))}><span>{String.fromCharCode(65 + index)}</span>{choice}</button>
                        ))}
                      </div>
                      {basicsDrill.choice !== null && <div className={`drill-result ${basicsDrill.choice === drill.answer ? "correct" : ""}`}><span>{basicsDrill.choice === drill.answer ? <Check size={16} /> : <X size={16} />}</span><p><strong>{basicsDrill.choice === drill.answer ? "Correct." : "Keep this one in mind."}</strong> {drill.note}</p><button onClick={() => setBasicsDrill((current) => ({ ...current, index: (current.index + 1) % BASICS_DRILLS.length, choice: null }))}>Next question <ArrowRight size={15} /></button></div>}
                    </div>
                  </section>
                </div>
              </>
            )}

            {view === "play" && (
              <section className="play-intro">
                <span className="eyebrow dark">PUT YOUR IDEAS IN MOTION</span>
                <h1>Every opening leads to a game.</h1>
                <p>Play a complete game against the computer. Opening moves come from the library; after that, it plays on its own.</p>
                <div className="play-intro-grid">
                  <div><span>01</span><strong>Choose your side</strong><p>Play White or Black. The board turns with you.</p></div>
                  <div><span>02</span><strong>Make your moves</strong><p>Tap a piece to see legal squares, or drag it.</p></div>
                  <div><span>03</span><strong>Discover the opening</strong><p>See the name when a known position appears.</p></div>
                </div>
                <button className="primary-button" onClick={() => document.getElementById("study-panel")?.scrollIntoView({ behavior: "smooth" })}>Go to board <ArrowRight size={16} /></button>
              </section>
            )}
            {view === "books" && (currentUser?.role === "admin" || currentUser?.premium ? (
              <>
                <section className="books-hero">
                  <div>
                    <span className="eyebrow dark">THE READING ROOM</span>
                    <h1>Chess wisdom,<br /><em>one page at a time.</em></h1>
                    <p>A curated shelf for every stage of your game. Save a title and build a reading path alongside your repertoire.</p>
                  </div>
                  <div className="books-hero-art" aria-hidden="true"><span>♜</span><span>BOOKS<br />FOR THE<br />BOARD</span></div>
                </section>
                <div className="books-heading">
                  <div><span className="eyebrow dark">CURATED CLASSICS</span><h2>Build your chess library</h2></div>
                  <span>{readingList.length} saved · {visibleBooks.length} books</span>
                </div>
                <div className="books-grid">
                  {visibleBooks.map((book) => (
                    <article className="book-card" key={book.id}>
                      <div className={`book-cover ${book.color}`}>
                        <span className="book-number">CO.T / {book.mark}</span>
                        <span className="book-piece">{Number(book.mark) % 2 ? "♞" : "♝"}</span>
                        <strong>{book.title}</strong>
                        <small>{book.author}</small>
                      </div>
                      <div className="book-meta">
                        <span>{book.level}</span>
                        <h3>{book.title}</h3>
                        <p>{book.focus}</p>
                        <div className="book-actions">
                          {book.content?.trim() && <button className="read-book" onClick={() => setSelectedBook(book)}><BookOpen size={15} /> Read book</button>}
                          <button className={readingList.includes(book.id) ? "saved" : ""} onClick={() => setReadingList((current) => current.includes(book.id) ? current.filter((id) => id !== book.id) : [...current, book.id])}>
                            {readingList.includes(book.id) ? <Check size={15} /> : <Bookmark size={15} />}
                            {readingList.includes(book.id) ? "Saved" : "Save"}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                  {visibleBooks.length === 0 && <div className="books-empty"><Library size={32} /><h3>The shelf is being curated.</h3><p>An administrator can add books from the Admin panel.</p></div>}
                </div>
                <section className="reading-path">
                  <div className="reading-path-icon"><Library size={24} /></div>
                  <div><span className="eyebrow dark">A SIMPLE READING PATH</span><h2>Read. Set the board. Replay.</h2><p>Take one position from each chapter and play it on the Explore board. Active practice turns a good book into useful chess.</p></div>
                  <button className="primary-button" onClick={() => { chooseView("basics"); setMode("explore"); }}>Open practice board <ArrowRight size={16} /></button>
                </section>
              </>
            ) : (
              <section className="premium-gate">
                <div className="premium-lock"><span>♛</span></div>
                <span className="eyebrow dark">PREMIUM READING ROOM</span>
                <h1>Books for players<br />who want to go deeper.</h1>
                <p>The chess book library is available to Premium members. Ask an administrator to enable Premium access for your account.</p>
                {!currentUser ? <button className="primary-button" onClick={() => chooseView("account")}><LogIn size={16} /> Sign in to your account</button> : <div className="premium-account"><User size={16} /><span>Signed in as <strong>{currentUser.name}</strong> · Standard account</span></div>}
              </section>
            ))}
            {view === "articles" && (
              <>
                <section className="articles-hero">
                  <div>
                    <span className="eyebrow">CO.T JOURNAL</span>
                    <h1>Ideas for your<br /><em>next game.</em></h1>
                    <p>Clear lessons on openings, strategy, tactics, and the habits that help chess ideas stick.</p>
                  </div>
                  <div className="articles-hero-mark" aria-hidden="true"><Lightbulb size={56} /><span>READ · THINK · PLAY</span></div>
                </section>
                <div className="articles-heading">
                  <div><span className="eyebrow dark">LATEST STORIES</span><h2>The ChessOn.Top journal</h2></div>
                  <span>{visibleArticles.length} {visibleArticles.length === 1 ? "article" : "articles"}</span>
                </div>
                {visibleArticles.length ? (
                  <div className="articles-grid">
                    {visibleArticles.map((article, index) => (
                      <article className={`article-card article-tone-${index % 3}`} key={article.id}>
                        <div className="article-card-top"><span>{article.category}</span><small>{new Date(article.published).toLocaleDateString()}</small></div>
                        <div className="article-glyph" aria-hidden="true">{index % 2 ? "♝" : "♞"}</div>
                        <h3>{article.title}</h3>
                        <p>{article.summary || article.content.slice(0, 150)}</p>
                        <div className="article-card-footer"><span>By {article.author}</span><button onClick={() => setSelectedArticle(article)}>Read article <ArrowUpRight size={15} /></button></div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="articles-empty"><Lightbulb size={34} /><h2>The journal is ready for its first story.</h2><p>Articles published from the Admin panel will appear here.</p></div>
                )}
              </>
            )}
            {view === "account" && (
              !currentUser ? (
                <section className="auth-page">
                  <div className="auth-visual">
                    <div className="auth-visual-copy"><span className="eyebrow">WELCOME TO CHESSON.TOP</span><h1>Your next move<br /><em>starts here.</em></h1><p>Save a repertoire, track mastered lines, and carry your reading list with you.</p></div>
                    <div className="auth-position" aria-hidden="true"><span>♜</span><span>♞</span><span>♝</span><span>♛</span></div>
                  </div>
                  <div className="auth-card">
                    <div className="auth-mark">♞</div>
                    <span className="eyebrow dark">PLAYER ACCOUNT</span>
                    <h2>{authMode === "signin" ? "Welcome back" : "Join the studio"}</h2>
                    <p>{authMode === "signin" ? "Sign in to continue your chess journey." : "Create your account and start building a repertoire."}</p>
                    <div className="auth-tabs">
                      <button className={authMode === "signin" ? "active" : ""} onClick={() => { setAuthMode("signin"); setAuthError(""); }}>Sign in</button>
                      <button disabled={siteSettings.registrationOpen === false} className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setAuthError(""); }}>{siteSettings.registrationOpen === false ? "Registration paused" : "Create account"}</button>
                    </div>
                    <form onSubmit={submitAuth}>
                      {authMode === "signup" && <label>Full name<input aria-label="Full name" value={authForm.name} onChange={(event) => updateAuthField("name", event.target.value)} placeholder="Your name" autoComplete="name" /></label>}
                      <label>{authMode === "signin" ? "Email or username" : "Email address"}<input aria-label="Email or username" value={authForm.email} onChange={(event) => updateAuthField("email", event.target.value)} placeholder={authMode === "signin" ? "you@example.com" : "you@example.com"} autoComplete="username" /></label>
                      <label>Password<div className="password-field"><input aria-label="Password" type={showPassword ? "text" : "password"} value={authForm.password} onChange={(event) => updateAuthField("password", event.target.value)} placeholder="At least 8 characters" autoComplete={authMode === "signin" ? "current-password" : "new-password"} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
                      {authError && <div className="auth-error" role="alert">{authError}</div>}
                      <button className="auth-submit" type="submit">{authMode === "signin" ? <LogIn size={17} /> : <UserPlus size={17} />}{authMode === "signin" ? "Sign in" : "Create my account"}<ArrowRight size={16} /></button>
                    </form>
                  </div>
                </section>
              ) : (
                <section className="account-page">
                  <div className="account-hero">
                    <span className="account-avatar">{currentUser.name[0]}</span>
                    <div><span className="eyebrow">YOUR PLAYER PROFILE</span><h1>Welcome, {currentUser.name}.</h1><p>{currentUser.email}</p><span className={`member-pill ${currentUser.premium ? "premium" : ""}`}>{currentUser.premium ? <Sparkles size={12} /> : <User size={12} />}{currentUser.premium ? "Premium member" : "Standard member"}</span></div>
                    <button onClick={signOut}><LogOut size={16} /> Sign out</button>
                  </div>
                  <div className="account-stats"><div><Bookmark size={20} /><strong>{favorites.length}</strong><span>Saved lines</span></div><div><Trophy size={20} /><strong>{completed.length}</strong><span>Mastered</span></div><div><GraduationCap size={20} /><strong>{basicCompleted.length}/{BASICS_LESSONS.length}</strong><span>Basics complete</span></div><div><Library size={20} /><strong>{readingList.length}</strong><span>Books saved</span></div></div>
                  <div className="profile-grid">
                    <section className="profile-progress">
                      <div className="profile-section-heading"><span><Target size={19} /></span><div><span className="eyebrow dark">LEARNING PULSE</span><h2>Your progress</h2></div></div>
                      <div className="profile-progress-row"><div><strong>Chess foundations</strong><span>{basicCompleted.length} of {BASICS_LESSONS.length} lessons</span></div><em>{Math.round((basicCompleted.length / BASICS_LESSONS.length) * 100)}%</em><div><span style={{ width: `${(basicCompleted.length / BASICS_LESSONS.length) * 100}%` }} /></div></div>
                      <div className="profile-progress-row"><div><strong>Opening practice</strong><span>{completed.length} mastered lines</span></div><em>{favorites.length ? Math.min(100, Math.round((completed.length / favorites.length) * 100)) : 0}%</em><div><span style={{ width: `${favorites.length ? Math.min(100, (completed.length / favorites.length) * 100) : 0}%` }} /></div></div>
                      <button onClick={() => chooseView(basicCompleted.length < BASICS_LESSONS.length ? "basics" : "practice")}>{basicCompleted.length < BASICS_LESSONS.length ? "Continue foundations" : "Start a practice line"}<ArrowRight size={15} /></button>
                    </section>
                    <section className="profile-details">
                      <div className="profile-section-heading"><span><User size={19} /></span><div><span className="eyebrow dark">ACCOUNT DETAILS</span><h2>Your profile</h2></div></div>
                      <form onSubmit={saveProfile}><label>Display name<input aria-label="Display name" value={profileName} onChange={(event) => { setProfileName(event.target.value); setProfileMessage(""); }} /></label><label>Email address<input value={currentUser.email} disabled /></label><div className="profile-form-footer"><span aria-live="polite">{profileMessage}</span><button type="submit">Save changes</button></div></form>
                    </section>
                    <section className="profile-preferences">
                      <div><span className="eyebrow dark">BOARD PREFERENCE</span><h2>Choose your board</h2><p>This color will be used across study, practice, and play.</p></div>
                      <div className="profile-theme-picker">{["moss", "wood", "slate"].map((theme) => <button key={theme} className={`${theme} ${boardTheme === theme ? "active" : ""}`} onClick={() => setBoardTheme(theme)}><span /><strong>{theme}</strong>{boardTheme === theme && <Check size={14} />}</button>)}</div>
                    </section>
                    <section className={`membership-card ${currentUser.premium ? "premium" : ""}`}><span>{currentUser.premium ? <Sparkles size={22} /> : <ShieldCheck size={22} />}</span><div><span className="eyebrow">MEMBERSHIP</span><h2>{currentUser.premium ? "Your reading room is unlocked." : "Standard player access"}</h2><p>{currentUser.premium ? "You can read every published book and save titles to your reading list." : "An administrator can grant Premium access to the complete book library."}</p></div><button onClick={() => chooseView(currentUser.premium ? "books" : "articles")}>{currentUser.premium ? "Browse books" : "Read articles"}<ArrowRight size={15} /></button></section>
                  </div>
                  <div className="profile-actions-heading"><span className="eyebrow dark">QUICK LINKS</span><h2>Pick up where you left off</h2></div>
                  <div className="account-actions"><button onClick={() => chooseView("practice")}><Target size={20} /><span><strong>Continue practicing</strong><small>Train one of your opening lines</small></span><ArrowRight size={17} /></button><button onClick={() => chooseView("collection")}><Bookmark size={20} /><span><strong>Open your repertoire</strong><small>Review saved and mastered lines</small></span><ArrowRight size={17} /></button><button onClick={() => chooseView("books")}><Library size={20} /><span><strong>Visit your reading room</strong><small>Find your saved chess books</small></span><ArrowRight size={17} /></button><button onClick={() => chooseView("articles")}><Lightbulb size={20} /><span><strong>Read the journal</strong><small>Explore new chess ideas</small></span><ArrowRight size={17} /></button></div>
                </section>
              )
            )}
            {view === "admin" && currentUser?.role === "admin" && (
              <section className="admin-page">
                <div className="admin-header"><div><span className="eyebrow">CO.T CONTROL ROOM</span><h1>Admin panel</h1><p>Manage accounts, books, articles, and studio settings.</p></div><button onClick={signOut}><LogOut size={16} /> Sign out</button></div>
                <div className="admin-tabs">{[["overview", LayoutDashboard, "Overview"], ["users", Users, "Users"], ["books", Library, "Books"], ["articles", Lightbulb, "Articles"], ["settings", Settings, "Settings"]].map(([id, Icon, label]) => <button key={id} className={adminTab === id ? "active" : ""} onClick={() => setAdminTab(id)}><Icon size={16} /> {label}</button>)}</div>
                {adminTab === "overview" && <><div className="admin-metrics"><div><Users size={21} /><span>Registered users</span><strong>{users.length}</strong><small>{users.filter((user) => user.status !== "disabled").length} active</small></div><div><Library size={21} /><span>Library books</span><strong>{books.length}</strong><small>{visibleBooks.length} visible</small></div><div><Lightbulb size={21} /><span>Published articles</span><strong>{articles.length}</strong><small>{visibleArticles.length} visible</small></div><div><BookOpen size={21} /><span>Opening lines</span><strong>{OPENINGS.length.toLocaleString()}</strong><small>ECO A–E</small></div></div><div className="admin-welcome"><ShieldCheck size={28} /><div><h2>Studio controls are ready.</h2><p>Moderate accounts, write books and articles, and publish a message across the studio.</p></div></div></>}
                {adminTab === "users" && <div className="admin-table-card"><div className="admin-section-heading"><div><span className="eyebrow dark">ACCOUNT DIRECTORY</span><h2>Registered users</h2></div><span>{users.length} total</span></div>{users.length ? <div className="admin-table"><div className="admin-table-head"><span>User</span><span>Joined</span><span>Status</span><span>Actions</span></div>{users.map((user) => <div className="admin-table-row" key={user.id}><span className="admin-user"><i>{user.name[0]}</i><span><strong>{user.name}</strong><small>{user.email}</small></span></span><span>{new Date(user.joined).toLocaleDateString()}</span><span><em className={user.status === "disabled" ? "disabled" : "active"}>{user.status || "active"}</em></span><span className="admin-row-actions"><button className={`premium ${user.premium ? "active" : ""}`} onClick={() => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, premium: !item.premium } : item))}><Sparkles size={15} />{user.premium ? "Premium" : "Make premium"}</button><button onClick={() => setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: item.status === "disabled" ? "active" : "disabled" } : item))}>{user.status === "disabled" ? <Eye size={15} /> : <EyeOff size={15} />}{user.status === "disabled" ? "Enable" : "Disable"}</button><button className="danger" aria-label={`Delete ${user.name}`} onClick={() => setUsers((current) => current.filter((item) => item.id !== user.id))}><Trash2 size={15} /></button></span></div>)}</div> : <div className="admin-empty"><Users size={30} /><strong>No registered users yet</strong><span>New player accounts will appear here.</span></div>}</div>}
                {adminTab === "books" && <div className="admin-books"><form className="admin-book-form" onSubmit={addBook}><div><span className="eyebrow dark">WRITE FOR THE SHELF</span><h2>New book</h2><p>Publish a complete readable book for Premium members.</p></div><label>Title<input required value={newBook.title} onChange={(event) => setNewBook((current) => ({ ...current, title: event.target.value }))} placeholder="Book title" /></label><label>Author<input required value={newBook.author} onChange={(event) => setNewBook((current) => ({ ...current, author: event.target.value }))} placeholder="Author" /></label><label>Summary<input value={newBook.focus} onChange={(event) => setNewBook((current) => ({ ...current, focus: event.target.value }))} placeholder="What it teaches" /></label><label>Level<select value={newBook.level} onChange={(event) => setNewBook((current) => ({ ...current, level: event.target.value }))}><option>Beginner</option><option>Intermediate</option><option>Advanced</option><option>All levels</option></select></label><label>Book content<textarea value={newBook.content} onChange={(event) => setNewBook((current) => ({ ...current, content: event.target.value }))} placeholder={"Write the book here. Use blank lines between chapters or sections.\n\nChapter 1 — The first idea..."} /></label><small className="editor-count">{newBook.content.length.toLocaleString()} characters</small><button className="primary-button" type="submit">Publish book <ArrowRight size={16} /></button></form><div className="admin-book-list">{books.map((book) => <div key={book.id}><span className={`admin-book-swatch ${book.color}`}>{book.mark}</span><span><strong>{book.title}</strong><small>{book.author} · {book.level}{book.content?.trim() ? " · Readable" : " · No content"}</small></span><button onClick={() => setBooks((current) => current.map((item) => item.id === book.id ? { ...item, visible: item.visible === false } : item))}>{book.visible === false ? <EyeOff size={15} /> : <Eye size={15} />}{book.visible === false ? "Hidden" : "Visible"}</button><button className="danger" aria-label={`Delete ${book.title}`} onClick={() => setBooks((current) => current.filter((item) => item.id !== book.id))}><Trash2 size={15} /></button></div>)}</div></div>}
                {adminTab === "articles" && <div className="admin-articles"><form className="admin-article-form" onSubmit={addArticle}><div><span className="eyebrow dark">PUBLISH TO THE JOURNAL</span><h2>New article</h2><p>Share a lesson, plan, or game idea with every reader.</p></div><label>Title<input required value={newArticle.title} onChange={(event) => setNewArticle((current) => ({ ...current, title: event.target.value }))} placeholder="Article title" /></label><div className="admin-form-row"><label>Author<input value={newArticle.author} onChange={(event) => setNewArticle((current) => ({ ...current, author: event.target.value }))} placeholder="CO.T Editorial" /></label><label>Category<select value={newArticle.category} onChange={(event) => setNewArticle((current) => ({ ...current, category: event.target.value }))}><option>Strategy</option><option>Openings</option><option>Tactics</option><option>Endgames</option><option>Mindset</option></select></label></div><label>Short summary<textarea className="summary-field" value={newArticle.summary} onChange={(event) => setNewArticle((current) => ({ ...current, summary: event.target.value }))} placeholder="A short introduction for the article card" maxLength={220} /></label><label>Article content<textarea required value={newArticle.content} onChange={(event) => setNewArticle((current) => ({ ...current, content: event.target.value }))} placeholder={"Write the full article here.\n\nUse blank lines to create readable paragraphs."} /></label><small className="editor-count">{newArticle.content.length.toLocaleString()} characters</small><button className="primary-button" type="submit">Publish article <ArrowRight size={16} /></button></form><div className="admin-article-list">{articles.length ? articles.map((article) => <div key={article.id}><span><Lightbulb size={17} /></span><div><strong>{article.title}</strong><small>{article.category} · {article.author}</small></div><button onClick={() => setArticles((current) => current.map((item) => item.id === article.id ? { ...item, visible: item.visible === false } : item))}>{article.visible === false ? <EyeOff size={15} /> : <Eye size={15} />}{article.visible === false ? "Hidden" : "Visible"}</button><button className="danger" aria-label={`Delete ${article.title}`} onClick={() => setArticles((current) => current.filter((item) => item.id !== article.id))}><Trash2 size={15} /></button></div>) : <div className="admin-empty"><Lightbulb size={30} /><strong>No articles yet</strong><span>Your published articles will appear here.</span></div>}</div></div>}
                {adminTab === "settings" && <div className="admin-settings">
                  <section className="settings-card announcement-settings">
                    <div className="settings-card-heading"><span><Sparkles size={19} /></span><div><span className="eyebrow dark">STUDIO MESSAGE</span><h2>Announcement bar</h2><p>Share a short update across the studio.</p></div></div>
                    <label>Announcement<textarea value={siteNotice} onChange={(event) => setSiteNotice(event.target.value)} placeholder="Example: New opening drills are available this week." maxLength={120} /></label>
                    <div className="settings-field-footer"><small>{siteNotice.length}/120 characters</small>{siteNotice && <button className="settings-text-button" onClick={() => setSiteNotice("")}>Clear message</button>}</div>
                    <div className="settings-toggle-row"><div><strong>Show announcement</strong><span>Display this message below the top navigation.</span></div><button role="switch" aria-label="Show announcement" aria-checked={siteSettings.announcementVisible !== false} className={`toggle-switch ${siteSettings.announcementVisible !== false ? "on" : ""}`} onClick={() => setSiteSettings((current) => ({ ...current, announcementVisible: current.announcementVisible === false }))}><span /></button></div>
                    <div className="settings-preview"><span>LIVE PREVIEW</span><div className={siteSettings.announcementVisible === false ? "muted" : ""}><Sparkles size={14} /> {siteNotice || "Your announcement will appear here."}</div></div>
                  </section>
                  <div className="settings-stack">
                    <section className="settings-card"><div className="settings-card-heading"><span><Users size={19} /></span><div><span className="eyebrow dark">ACCESS</span><h2>Account registration</h2></div></div><div className="settings-toggle-row"><div><strong>Allow new accounts</strong><span>Players can create a profile from the sign in page.</span></div><button role="switch" aria-label="Allow new accounts" aria-checked={siteSettings.registrationOpen !== false} className={`toggle-switch ${siteSettings.registrationOpen !== false ? "on" : ""}`} onClick={() => { setSiteSettings((current) => ({ ...current, registrationOpen: current.registrationOpen === false })); setAuthMode("signin"); }}><span /></button></div></section>
                    <section className="settings-card"><div className="settings-card-heading"><span><FlipHorizontal size={19} /></span><div><span className="eyebrow dark">APPEARANCE</span><h2>Default board</h2><p>Choose the board color used for every player.</p></div></div><div className="settings-board-picker">{["moss", "wood", "slate"].map((theme) => <button key={theme} className={`${theme} ${boardTheme === theme ? "active" : ""}`} onClick={() => setBoardTheme(theme)} aria-label={`Use ${theme} board`}><span /><strong>{theme}</strong>{boardTheme === theme && <Check size={14} />}</button>)}</div></section>
                    <section className="settings-card backup-card"><div className="settings-card-heading"><span><Copy size={19} /></span><div><span className="eyebrow dark">NEW · CONTENT BACKUP</span><h2>Export studio content</h2><p>Download books, articles, announcements, and settings as a JSON snapshot.</p></div></div><div className="backup-summary"><span><strong>{books.length}</strong> books</span><span><strong>{articles.length}</strong> articles</span><span><strong>1</strong> settings file</span></div><button className="settings-primary" onClick={exportStudioContent}><Copy size={15} /> Download snapshot</button></section>
                  </div>
                </div>}
              </section>
            )}
            {view !== "overview" && view !== "basics" && view !== "play" && view !== "books" && view !== "articles" && view !== "account" && view !== "admin" && (
              <>
                <div className="page-heading">
                  <div>
                    <span className="eyebrow dark">
                      {view === "practice"
                        ? "MAKE IT SECOND NATURE"
                        : view === "collection"
                          ? "YOUR PERSONAL LIBRARY"
                          : "THE COMPLETE CATALOG"}
                    </span>
                    <h1>
                      {title}
                      <span className="heading-dot">.</span>
                    </h1>
                    <p>
                      {view === "practice"
                        ? "Choose a line, play the moves, and make the ideas stick."
                        : view === "collection"
                          ? "Your saved openings and completed practice lines live here."
                          : `Search and study ${OPENINGS.length.toLocaleString()} opening lines from the complete ECO collection.`}
                    </p>
                  </div>
                  <div className="heading-decoration">♞</div>
                </div>
                {view === "openings" && (
                  <section className="opening-discovery">
                    <div className="opening-discovery-copy">
                      <span className="eyebrow">OPENING EXPLORER</span>
                      <h2>Choose a path into the position.</h2>
                      <p>Filter by ECO group or opening family, then study every move on the interactive board.</p>
                    </div>
                    <div className="opening-discovery-stats">
                      <div><strong>{OPENINGS.length.toLocaleString()}</strong><span>verified lines</span></div>
                      <div><strong>{POPULAR_FAMILIES.length}</strong><span>popular families</span></div>
                      <div><strong>{favorites.length}</strong><span>saved lines</span></div>
                    </div>
                    <button onClick={() => {
                      const item = OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
                      resetForOpening(item);
                      setBoardFocus(true);
                    }}><Sparkles size={16} /> Surprise me</button>
                  </section>
                )}
                {view === "practice" && (
                  <><div className="practice-callout">
                    <span className="practice-callout-icon">
                      <Target size={21} />
                    </span>
                    <div>
                      <strong>Learn by doing</strong>
                      <p>
                        Pick an opening below, choose your side on the board,
                        and find each move in the line.
                      </p>
                    </div>
                    <ArrowRight size={20} />
                  </div>
                  <div className="practice-styles" aria-label="Practice style">
                    {PRACTICE_STYLES.map(({ id, title: styleTitle, detail, icon: StyleIcon }) => (
                      <button key={id} className={practiceStyle === id ? "active" : ""} onClick={() => {
                        setPracticeStyle(id);
                        setPracticePly(0);
                        setPracticeMistakes(0);
                        setPracticeFeedback("");
                        setShowHint(false);
                        setSelectedSquare(null);
                      }}>
                        <span><StyleIcon size={18} /></span>
                        <strong>{styleTitle}</strong>
                        <small>{detail}</small>
                        {practiceStyle === id && <Check size={15} className="practice-style-check" />}
                      </button>
                    ))}
                  </div></>
                )}
                {view === "collection" && (
                  <div className="collection-tabs">
                    <button
                      className={collectionTab === "saved" ? "active" : ""}
                      onClick={() => setCollectionTab("saved")}
                    >
                      <Bookmark size={16} /> Saved{" "}
                      <span>{favorites.length}</span>
                    </button>
                    <button
                      className={collectionTab === "mastered" ? "active" : ""}
                      onClick={() => setCollectionTab("mastered")}
                    >
                      <Check size={16} /> Mastered{" "}
                      <span>{completed.length}</span>
                    </button>
                  </div>
                )}
                {view !== "collection" && (
                  <div className="filter-panel">
                    <div className="filter-title">
                      <div><span>Browse the collection</span><small>{filteredOpenings.length.toLocaleString()} matching lines</small></div>
                      <label className="opening-sort">Sort by<select aria-label="Sort openings" value={openingSort} onChange={(event) => setOpeningSort(event.target.value)}><option value="recommended">Recommended</option><option value="name">Name A–Z</option><option value="shortest">Shortest first</option><option value="deepest">Deepest first</option></select></label>
                    </div>
                    <div className="filter-chips">
                      <button
                        className={ecoFilter === "All" ? "active" : ""}
                        onClick={() => { setEcoFilter("All"); setOpeningFamily("All"); }}
                      >
                        All openings
                      </button>
                      {ECO_GROUPS.map((group) => (
                        <button
                          key={group.letter}
                          className={ecoFilter === group.letter ? "active" : ""}
                          onClick={() => { setEcoFilter(group.letter); setOpeningFamily("All"); }}
                        >
                          {group.letter} <span>{group.name}</span>
                        </button>
                      ))}
                    </div>
                    {view === "openings" && <div className="family-filter" aria-label="Popular opening families"><span>Popular families</span><div><button className={openingFamily === "All" ? "active" : ""} onClick={() => setOpeningFamily("All")}>Any family</button>{POPULAR_FAMILIES.map((family) => <button key={family} className={openingFamily === family ? "active" : ""} onClick={() => { setOpeningFamily(family); setEcoFilter("All"); }}>{family.replace(" Defense", "").replace(" Opening", "")}</button>)}</div></div>}
                  </div>
                )}
                {view === "collection" && filteredOpenings.length === 0 && (
                  <div className="empty-state">
                    <div>♞</div>
                    <h3>
                      {collectionTab === "saved"
                        ? "Your repertoire starts with one line."
                        : "Your first mastered line is waiting."}
                    </h3>
                    <p>
                      {collectionTab === "saved"
                        ? "Save an opening from the library to find it here."
                        : "Complete a practice line and it will appear here."}
                    </p>
                    <button
                      className="primary-button"
                      onClick={() =>
                        chooseView(
                          collectionTab === "saved" ? "openings" : "practice",
                        )
                      }
                    >
                      {collectionTab === "saved"
                        ? "Browse openings"
                        : "Start practicing"}{" "}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                {(view !== "collection" || filteredOpenings.length > 0) && (
                  <>
                    <div className="library-header">
                      <div>
                        <span className="eyebrow dark">
                          {view === "collection"
                            ? "YOUR PICKS"
                            : "EXPLORE & STUDY"}
                        </span>
                        <h2>
                          {openingFamily !== "All"
                            ? openingFamily
                            : ecoFilter === "All"
                            ? "All opening lines"
                            : `${ECO_GROUPS.find((group) => group.letter === ecoFilter)?.name}`}
                        </h2>
                      </div>
                      <span>
                        Showing{" "}
                        {Math.min(visibleCount, filteredOpenings.length)} of{" "}
                        {filteredOpenings.length.toLocaleString()}
                      </span>
                    </div>
                    <div className="opening-list">
                      {filteredOpenings.slice(0, visibleCount).map((item) => (
                        <div
                          key={item.id}
                          className={`opening-row ${selectedId === item.id ? "selected" : ""}`}
                        >
                          <button
                            className="opening-row-main"
                            onClick={() => resetForOpening(item)}
                          >
                            <span className="opening-eco">{item.eco}</span>
                            <span className="opening-text">
                              <strong>{item.name}</strong>
                              <small><span>{item.family}</span>{item.pgn}</small>
                            </span>
                            <span className="move-count">
                              <strong>{item.moves.length}</strong> moves
                            </span>
                            <span className="study-line">Study line</span>
                            <ChevronRight size={18} />
                          </button>
                          <button
                            className={`favorite-button ${favorites.includes(item.id) ? "saved" : ""}`}
                            aria-label={
                              favorites.includes(item.id)
                                ? "Remove saved opening"
                                : "Save opening"
                            }
                            onClick={() => toggleFavorite(item.id)}
                          >
                            <Bookmark
                              size={18}
                              fill={
                                favorites.includes(item.id)
                                  ? "currentColor"
                                  : "none"
                              }
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                    {filteredOpenings.length === 0 && (
                      <div className="no-results">
                        <Search size={28} />
                        <strong>No openings found</strong>
                        <p>Try another name, ECO code, or move sequence.</p>
                      </div>
                    )}
                    {visibleCount < filteredOpenings.length && (
                      <button
                        className="load-more"
                        onClick={() => setVisibleCount((count) => count + 24)}
                      >
                        Show more openings <ChevronRight size={16} />
                      </button>
                    )}
                  </>
                )}
              </>
            )}
            <div className="content-footer">
              <span className="footer-brand">CO.T / <strong>ChessOn.Top</strong> · DeepInk Group</span>
              <div className="footer-links">
                <a href="https://t.me/DeepInkGroup" target="_blank" rel="noreferrer" aria-label="DeepInk Group on Telegram" title="Telegram">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 3.1 18.4 20c-.2 1.2-.9 1.5-1.9.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.4-5 9-8.1c.4-.4-.1-.6-.6-.3L5.9 13.7 1.1 12.2c-1-.3-1-1 .2-1.5L20 3.5c.9-.3 1.7.2 1.6-.4Z" /></svg>
                </a>
                <a href="https://www.chess.com/member/azomorodian" target="_blank" rel="noreferrer" aria-label="Azomorodian on Chess.com" title="Chess.com">
                  <span className="chesscom-icon" aria-hidden="true">♞</span>
                </a>
                <a href="https://github.com/DeepInkGroup" target="_blank" rel="noreferrer" aria-label="DeepInk Group on GitHub" title="GitHub">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .7a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.5v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.4-1.3-5.4-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2A11 11 0 0 1 12 6.8c1 0 2 .1 2.9.4 2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.4 5.7.4.4.8 1.1.8 2.2v2.5c0 .3.2.6.8.5A11.5 11.5 0 0 0 12 .7Z" /></svg>
                </a>
              </div>
            </div>
          </main>

          {!(["overview", "basics", "books", "articles", "account", "admin"].includes(view)) && <aside className="study-panel" id="study-panel">
            <div className="study-top">
              <div>
                <span className="eyebrow dark">YOUR STUDY SPACE</span>
                <h2>
                  On the board <span>↗</span>
                </h2>
              </div>
              <div className="study-top-actions">
              <button className="panel-focus" aria-label="Enlarge board" title="Enlarge board" onClick={() => setBoardFocus(true)}><Maximize2 size={17} /></button>
              {!(view === "basics" && mode === "explore") && (
                <button
                  className={`panel-save ${favorites.includes(opening.id) ? "saved" : ""}`}
                  aria-label={
                    favorites.includes(opening.id)
                      ? "Remove saved opening"
                      : "Save opening"
                  }
                  onClick={() => toggleFavorite(opening.id)}
                >
                  <Bookmark
                    size={18}
                    fill={
                      favorites.includes(opening.id) ? "currentColor" : "none"
                    }
                  />
                </button>
              )}
              </div>
            </div>
            <div className="mode-tabs" role="tablist" aria-label="Study mode">
              <button
                role="tab"
                aria-selected={mode === "learn"}
                className={mode === "learn" ? "active" : ""}
                onClick={() => chooseMode("learn")}
              >
                Learn
              </button>
              <button
                role="tab"
                aria-selected={mode === "practice"}
                className={mode === "practice" ? "active" : ""}
                onClick={() => chooseMode("practice")}
              >
                Practice
              </button>
              <button
                role="tab"
                aria-selected={mode === "explore"}
                className={mode === "explore" ? "active" : ""}
                onClick={() => chooseMode("explore")}
              >
                Explore
              </button>
              <button
                role="tab"
                aria-selected={mode === "play"}
                className={mode === "play" ? "active" : ""}
                onClick={() => chooseMode("play")}
              >
                Play
              </button>
            </div>
            <div className="study-opening">
              <span className="eco-pill dark-pill">
                {mode === "play"
                  ? "GAME"
                  : view === "basics" && mode === "explore"
                  ? "START"
                  : opening.eco}
              </span>
              <div>
                <h3>
                  {mode === "play"
                    ? recognizedOpening?.name || "Your game"
                    : view === "basics" && mode === "explore"
                    ? "Free practice board"
                    : opening.name}
                </h3>
                <p>
                  {mode === "play"
                    ? recognizedOpening ? "Opening recognized from your moves" : "Play from the starting position"
                    : mode === "explore" && recognizedOpening
                    ? `Position reached: ${recognizedOpening.name}`
                    : view === "basics" && mode === "explore"
                      ? "Try any legal move. Click a piece to see where it can go."
                      : `${opening.moves.length} move line · ${opening.family}`}
                </p>
              </div>
            </div>
            <PlayerRail
              color={orientation === "w" ? "b" : "w"}
              active={game.turn() === (orientation === "w" ? "b" : "w")}
              label={mode === "play" && playSide !== (orientation === "w" ? "b" : "w") ? "CO.T Coach" : (orientation === "w" ? "Black" : "White")}
              detail={mode === "play" && playSide !== (orientation === "w" ? "b" : "w") ? difficulty === "focused" ? "Focused opponent" : "Casual opponent" : "Study side"}
            />
            <div className="board-wrap">
              <Board
                game={game}
                orientation={orientation}
                selectedSquare={selectedSquare}
                onSquareClick={handleSquareClick}
                onMove={tryMove}
                interactiveColor={mode === "play" ? (computerThinking || playResult ? null : playSide) : game.turn()}
                theme={boardTheme}
                showLegalMoves={mode !== "practice" || practiceStyle === "guided"}
              />
            </div>
            <PlayerRail
              color={orientation}
              active={game.turn() === orientation}
              label={mode === "play" && playSide === orientation ? "You" : orientation === "w" ? "White" : "Black"}
              detail={mode === "practice" ? `${practiceMistakes} ${practiceMistakes === 1 ? "miss" : "misses"}` : mode === "play" && playSide === orientation ? "Playing now" : "Study side"}
            />
            <div className="board-under">
              <span>
                <MousePointer2 size={14} /> Click or drag pieces to move
              </span>
              <div className="board-tools">
                <div className="theme-picker" aria-label="Board color">
                  {["moss", "wood", "slate"].map((theme) => <button key={theme} aria-label={`${theme} board`} className={`${theme} ${boardTheme === theme ? "active" : ""}`} onClick={() => setBoardTheme(theme)} />)}
                </div>
              <button
                aria-label="Flip board"
                title="Flip board"
                onClick={() =>
                  setOrientation((value) => (value === "w" ? "b" : "w"))
                }
              >
                <FlipHorizontal size={17} />
              </button>
              </div>
            </div>

            {mode === "play" && (
              <div className={`game-status ${playResult ? "finished" : ""}`} role="status" aria-live="polite">
                <span className={`turn-indicator ${game.turn() === "b" ? "black" : ""}`} />
                <div>
                  <strong>{playResult || (computerThinking ? "Computer is thinking…" : game.isCheck() ? "Your king is in check" : "Your move")}</strong>
                  <small>{playResult ? "Start a new game or review your moves." : `${game.turn() === "w" ? "White" : "Black"} to move${game.isCheck() ? " · Check" : ""}`}</small>
                </div>
              </div>
            )}

            {mode === "play" && (
              <div className="play-controls">
                <div className="play-setting">
                  <span>YOUR SIDE</span>
                  <div className="segmented">
                    {[["w", "White"], ["b", "Black"]].map(([side, label]) => (
                      <button key={side} className={playSide === side ? "active" : ""} onClick={() => {
                        setPlaySide(side);
                        setPlayMoves([]);
                        setOrientation(side);
                        setSelectedSquare(null);
                      }}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="play-setting">
                  <span>OPPONENT</span>
                  <div className="segmented">
                    <button className={difficulty === "casual" ? "active" : ""} onClick={() => setDifficulty("casual")}>Casual</button>
                    <button className={difficulty === "focused" ? "active" : ""} onClick={() => setDifficulty("focused")}>Focused</button>
                  </div>
                </div>
                <div className="play-actions">
                  <button onClick={() => {
                    setPlayMoves((current) => current.slice(0, Math.max(0, current.length - (current.length % 2 === (playSide === "w" ? 0 : 1) ? 2 : 1))));
                    setSelectedSquare(null);
                  }} disabled={!playMoves.length}><ChevronLeft size={16} /> Take back</button>
                  <button onClick={() => { setPlayMoves([]); setSelectedSquare(null); setPendingPromotion(null); }}><RotateCcw size={16} /> New game</button>
                </div>
              </div>
            )}

            {mode === "learn" && (
              <><div className="playback-controls">
                <button
                  aria-label="First move"
                  onClick={() => {
                    setPly(0);
                    setPlaying(false);
                  }}
                >
                  <SkipBack size={18} />
                </button>
                <button
                  aria-label="Previous move"
                  onClick={() => {
                    setPly((value) => Math.max(0, value - 1));
                    setPlaying(false);
                  }}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="control-play"
                  aria-label={playing ? "Pause playback" : "Play line"}
                  onClick={() => {
                    if (ply === opening.moves.length) setPly(0);
                    setPlaying((value) => !value);
                  }}
                >
                  {playing ? (
                    <Pause size={17} fill="currentColor" />
                  ) : (
                    <Play size={17} fill="currentColor" />
                  )}
                </button>
                <button
                  aria-label="Next move"
                  onClick={() => {
                    setPly((value) =>
                      Math.min(opening.moves.length, value + 1),
                    );
                    setPlaying(false);
                  }}
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  aria-label="Last move"
                  onClick={() => {
                    setPly(opening.moves.length);
                    setPlaying(false);
                  }}
                >
                  <SkipForward size={18} />
                </button>
              </div>
              <button className="play-from-position" onClick={() => {
                const side = game.turn();
                setPlayMoves(opening.moves.slice(0, ply));
                setPlaySide(side);
                setOrientation(side);
                setMode("play");
                setSelectedSquare(null);
                setPlaying(false);
              }}><Swords size={15} /> Play from this position <ArrowRight size={14} /></button></>
            )}
            {mode === "practice" && (
              <div className="practice-controls">
                <div className="side-picker">
                  <span>Play as</span>
                  <button
                    className={practiceSide === "w" ? "active" : ""}
                    onClick={() => {
                      setPracticeSide("w");
                      setPracticePly(0);
                      setPracticeMistakes(0);
                      setPracticeFeedback("");
                      setShowHint(false);
                    }}
                  >
                    White
                  </button>
                  <button
                    className={practiceSide === "b" ? "active" : ""}
                    onClick={() => {
                      setPracticeSide("b");
                      setPracticePly(0);
                      setPracticeMistakes(0);
                      setPracticeFeedback("");
                      setShowHint(false);
                    }}
                  >
                    Black
                  </button>
                </div>
                <div className="practice-actions">
                  <button onClick={() => setShowHint(true)} disabled={practiceStyle === "challenge"}>
                    <Lightbulb size={16} /> Hint
                  </button>
                  <button
                    onClick={() => {
                      setPracticePly(0);
                      setPracticeMistakes(0);
                      setPracticeFeedback("");
                      setShowHint(false);
                    }}
                  >
                    <RotateCcw size={16} /> Restart
                  </button>
                </div>
              </div>
            )}
            {mode === "explore" && (
              <div className="explore-controls">
                <span>Play any legal move to explore a position.</span>
                <button
                  onClick={() => {
                    setFreeMoves([]);
                    setSelectedSquare(null);
                  }}
                >
                  <RotateCcw size={16} /> Reset board
                </button>
              </div>
            )}

            <div className="moves-section">
              <div className="moves-heading">
                <strong>
                  {mode === "play"
                    ? "Game moves"
                    : mode === "practice"
                    ? "Your practice line"
                    : mode === "explore"
                      ? "Moves played"
                      : "Main line"}
                </strong>
                <span>
                  {mode === "play"
                    ? `${playMoves.length} ${playMoves.length === 1 ? "move" : "moves"}`
                    : mode === "explore"
                    ? `${freeMoves.length} ${freeMoves.length === 1 ? "move" : "moves"}`
                    : `${mode === "practice" ? practicePly : ply}/${opening.moves.length}`}
                </span>
              </div>
              {mode === "learn" || mode === "practice" ? (
                <div className="line-progress">
                  <span
                    style={{
                      width: `${((mode === "practice" ? practicePly : ply) / opening.moves.length) * 100}%`,
                    }}
                  />
                </div>
              ) : null}
              <div className="move-list">
                {(mode === "play" ? playMoves : mode === "explore" ? freeMoves : opening.moves).map(
                  (move, index) => (
                    <button
                      key={`${index}-${move}`}
                      className={`${index < (mode === "practice" ? practicePly : ply) && mode !== "explore" ? "played" : ""} ${index === (mode === "practice" ? practicePly : ply) - 1 && mode !== "explore" ? "current" : ""}`}
                      onClick={() => {
                        if (mode === "learn") {
                          setPly(index + 1);
                          setPlaying(false);
                        } else if (mode === "play") {
                          setPlayMoves((current) => current.slice(0, index + 1));
                          setSelectedSquare(null);
                        } else if (mode === "explore")
                          setFreeMoves((current) =>
                            current.slice(0, index + 1),
                          );
                      }}
                      disabled={mode === "practice"}
                    >
                      {index % 2 === 0 && (
                        <small>{Math.floor(index / 2) + 1}.</small>
                      )}
                      {mode === "practice" &&
                      index >= practicePly &&
                      !(showHint && index === practicePly)
                        ? "•••"
                        : move}
                    </button>
                  ),
                )}
              </div>
              {(mode !== "explore" && mode !== "play" || mode === "explore" && freeMoves.length > 0 || mode === "play" && playMoves.length > 0) && (
                <button className="copy-pgn" onClick={copyPgn}>
                  <Copy size={13} />{" "}
                  {copied
                    ? "Copied"
                    : mode === "explore" || mode === "play"
                      ? "Copy moves"
                      : "Copy PGN"}
                </button>
              )}
            </div>
            {mode === "practice" && (
              <div className="practice-feedback-wrap">
              <div className="practice-score">
                <span>{PRACTICE_STYLES.find((item) => item.id === practiceStyle)?.title}</span>
                <strong>{practiceMistakes === 0 ? "Perfect so far" : `${practiceMistakes} ${practiceMistakes === 1 ? "miss" : "misses"}`}</strong>
              </div>
              <div
                className={`feedback ${practiceFeedback.includes("outside") ? "error" : ""}`}
                aria-live="polite"
              >
                {practiceFeedback ||
                  (practicePly >= opening.moves.length
                    ? "Line complete!"
                    : showHint
                      ? `Find ${opening.moves[practicePly] || "the next move"} on the board.`
                      : practicePly % 2 === (practiceSide === "w" ? 0 : 1)
                        ? "Your move. Find the next move in the line."
                        : "Your opponent is moving...")}
              </div>
              </div>
            )}
            {mode !== "play" && <div className="insight-card">
              <div className="insight-heading">
                <span>
                  <Lightbulb size={17} />
                </span>
                <strong>
                  {view === "basics" && mode === "explore"
                    ? "From this lesson"
                    : "The idea behind it"}
                </strong>
              </div>
              <p>
                {view === "basics" && mode === "explore"
                  ? lesson.description
                  : notes.description}
              </p>
              <div className="insight-divider" />
              <span className="eyebrow dark">WHAT TO NOTICE</span>
              <ul>
                {(view === "basics" && mode === "explore"
                  ? lesson.points
                  : notes.goals
                ).map((goal) => (
                  <li key={goal}>
                    <Check size={14} />
                    {goal}
                  </li>
                ))}
              </ul>
            </div>}
          </aside>}
        </div>
      </div>
      {selectedBook && (
        <div className="reader-overlay" role="dialog" aria-modal="true" aria-label={`Reading ${selectedBook.title}`} onClick={() => setSelectedBook(null)}>
          <article className="reader-page" onClick={(event) => event.stopPropagation()}>
            <button className="reader-close" aria-label="Close book" onClick={() => setSelectedBook(null)}><X size={20} /></button>
            <header><span className="eyebrow dark">CO.T READING ROOM · {selectedBook.level}</span><h1>{selectedBook.title}</h1><p>By {selectedBook.author}</p></header>
            {selectedBook.focus && <p className="reader-lead">{selectedBook.focus}</p>}
            <div className="reader-content">{selectedBook.content.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => index === 0 ? <p className="reader-opening" key={index}>{paragraph}</p> : <p key={index}>{paragraph}</p>)}</div>
          </article>
        </div>
      )}
      {selectedArticle && (
        <div className="reader-overlay" role="dialog" aria-modal="true" aria-label={`Reading ${selectedArticle.title}`} onClick={() => setSelectedArticle(null)}>
          <article className="reader-page article-reader" onClick={(event) => event.stopPropagation()}>
            <button className="reader-close" aria-label="Close article" onClick={() => setSelectedArticle(null)}><X size={20} /></button>
            <header><span className="eyebrow dark">{selectedArticle.category} · {new Date(selectedArticle.published).toLocaleDateString()}</span><h1>{selectedArticle.title}</h1><p>By {selectedArticle.author}</p></header>
            {selectedArticle.summary && <p className="reader-lead">{selectedArticle.summary}</p>}
            <div className="reader-content">{selectedArticle.content.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => index === 0 ? <p className="reader-opening" key={index}>{paragraph}</p> : <p key={index}>{paragraph}</p>)}</div>
          </article>
        </div>
      )}
      {boardFocus && !(["overview", "books", "articles", "account", "admin"].includes(view)) && (
        <div className="focus-board-overlay" role="dialog" aria-modal="true" aria-label="Large chess board">
          <div className="focus-board-stage">
            <div className="focus-board-header">
              <div><span className="eyebrow">FOCUS BOARD</span><strong>{mode === "play" ? recognizedOpening?.name || "Your game" : opening.name}</strong></div>
              <div className="focus-header-actions"><div className="theme-picker" aria-label="Board color">{["moss", "wood", "slate"].map((theme) => <button key={theme} aria-label={`${theme} board`} className={`${theme} ${boardTheme === theme ? "active" : ""}`} onClick={() => setBoardTheme(theme)} />)}</div><button className="focus-flip" aria-label="Flip large board" onClick={() => setOrientation((value) => value === "w" ? "b" : "w")}><FlipHorizontal size={18} /></button><button className="focus-close" aria-label="Close large board" onClick={() => setBoardFocus(false)}><X size={20} /></button></div>
            </div>
            <PlayerRail color={orientation === "w" ? "b" : "w"} active={game.turn() === (orientation === "w" ? "b" : "w")} label={mode === "play" && playSide !== (orientation === "w" ? "b" : "w") ? "CO.T Coach" : orientation === "w" ? "Black" : "White"} detail={mode === "play" ? "Opponent" : "Study side"} />
            <div className="focus-board-shell"><Board game={game} orientation={orientation} selectedSquare={selectedSquare} onSquareClick={handleSquareClick} onMove={tryMove} interactiveColor={mode === "play" ? (computerThinking || playResult ? null : playSide) : game.turn()} theme={boardTheme} showLegalMoves={mode !== "practice" || practiceStyle === "guided"} /></div>
            <PlayerRail color={orientation} active={game.turn() === orientation} label={mode === "play" && playSide === orientation ? "You" : orientation === "w" ? "White" : "Black"} detail={mode === "practice" ? `${practiceMistakes} ${practiceMistakes === 1 ? "miss" : "misses"}` : "Playing now"} />
            <div className="focus-board-footer"><span>{game.isCheck() ? "Check · " : ""}{game.turn() === "w" ? "White" : "Black"} to move</span><span>{mode === "practice" ? `${practicePly}/${opening.moves.length} moves` : `${displayedMoves.length} moves played`}</span></div>
          </div>
        </div>
      )}
      {pendingPromotion && (
        <div
          className="promotion-backdrop"
          onClick={() => setPendingPromotion(null)}
        >
          <div
            className="promotion-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Choose a promotion piece"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="eyebrow dark">PAWN PROMOTION</span>
            <h2>Choose your new piece</h2>
            <div className="promotion-options">
              {["Q", "R", "B", "N"].map((piece) => (
                <button
                  key={piece}
                  autoFocus={piece === "Q"}
                  aria-label={`Promote to ${{ Q: "queen", R: "rook", B: "bishop", N: "knight" }[piece]}`}
                  onClick={() => {
                    tryMove(
                      pendingPromotion.from,
                      pendingPromotion.to,
                      piece.toLowerCase(),
                    );
                    setPendingPromotion(null);
                  }}
                >
                  <img
                    src={pieceAsset(`${pendingPromotion.color}${piece}`)}
                    alt=""
                  />
                </button>
              ))}
            </div>
            <button
              className="promotion-cancel"
              onClick={() => setPendingPromotion(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
