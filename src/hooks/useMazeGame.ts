import { useState, useRef, useCallback, useEffect } from 'react';

type Dir = 'n' | 's' | 'e' | 'w';
type Cell = Set<Dir>;
type Maze = Cell[][];
type PRNG = () => number;

// ── PRNG (mulberry32) ─────────────────────────────────────────────────────
function makePRNG(seed: number): PRNG {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dateSeed(d: Date): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// ── Maze generation ───────────────────────────────────────────────────────
const OPP: Record<Dir, Dir> = { n: 's', s: 'n', e: 'w', w: 'e' };
const MX: Record<Dir, number> = { n: 0, s: 0, e: 1, w: -1 };
const MY: Record<Dir, number> = { n: -1, s: 1, e: 0, w: 0 };
const DIRS: Dir[] = ['n', 's', 'e', 'w'];

function emptyGrid(cols: number, rows: number): Maze {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => new Set<Dir>())
  );
}

// Recursive backtracker — long corridors, low branching (easier to follow).
function buildMazeDFS(cols: number, rows: number, rng: PRNG): Maze {
  const cell = emptyGrid(cols, rows);
  const vis = Array.from({ length: rows }, () => new Uint8Array(cols));
  vis[0][0] = 1;
  const stk: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  while (stk.length) {
    const { x, y } = stk[stk.length - 1];
    const nbrs = DIRS.filter(d => {
      const nx = x + MX[d], ny = y + MY[d];
      return nx >= 0 && nx < cols && ny >= 0 && ny < rows && !vis[ny][nx];
    });
    if (!nbrs.length) { stk.pop(); continue; }
    const d = nbrs[Math.floor(rng() * nbrs.length)];
    const nx = x + MX[d], ny = y + MY[d];
    cell[y][x].add(d);
    cell[ny][nx].add(OPP[d]);
    vis[ny][nx] = 1;
    stk.push({ x: nx, y: ny });
  }
  return cell;
}

// Prim's — short branches, many decision points (harder to navigate).
function buildMazePrim(cols: number, rows: number, rng: PRNG): Maze {
  const cell = emptyGrid(cols, rows);
  const inMaze = Array.from({ length: rows }, () => new Uint8Array(cols));
  inMaze[0][0] = 1;
  const frontier: { x: number; y: number }[] = [];
  const addFrontier = (x: number, y: number) => {
    for (const d of DIRS) {
      const nx = x + MX[d], ny = y + MY[d];
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !inMaze[ny][nx]) {
        frontier.push({ x: nx, y: ny });
        inMaze[ny][nx] = 2;
      }
    }
  };
  addFrontier(0, 0);
  while (frontier.length) {
    const idx = Math.floor(rng() * frontier.length);
    const { x, y } = frontier.splice(idx, 1)[0];
    const conn = DIRS.filter(d => {
      const nx = x + MX[d], ny = y + MY[d];
      return nx >= 0 && nx < cols && ny >= 0 && ny < rows && inMaze[ny][nx] === 1;
    });
    if (conn.length) {
      const d = conn[Math.floor(rng() * conn.length)];
      const nx = x + MX[d], ny = y + MY[d];
      cell[y][x].add(d);
      cell[ny][nx].add(OPP[d]);
    }
    inMaze[y][x] = 1;
    addFrontier(x, y);
  }
  return cell;
}

// Braid: remove a fraction of dead-ends by knocking out a wall to a neighbor.
function braid(cell: Maze, frac: number, rng: PRNG): Maze {
  const rows = cell.length, cols = cell[0].length;
  const deadEnds: { x: number; y: number }[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (cell[y][x].size === 1) deadEnds.push({ x, y });
    }
  }
  for (let i = deadEnds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deadEnds[i], deadEnds[j]] = [deadEnds[j], deadEnds[i]];
  }
  const target = Math.floor(deadEnds.length * frac);
  for (let i = 0; i < target; i++) {
    const { x, y } = deadEnds[i];
    if (cell[y][x].size !== 1) continue;
    const cands = DIRS.filter(d => {
      const nx = x + MX[d], ny = y + MY[d];
      return nx >= 0 && nx < cols && ny >= 0 && ny < rows && !cell[y][x].has(d);
    });
    if (!cands.length) continue;
    const preferred = cands.filter(d => {
      const nx = x + MX[d], ny = y + MY[d];
      return cell[ny][nx].size === 1;
    });
    const pool = preferred.length ? preferred : cands;
    const d = pool[Math.floor(rng() * pool.length)];
    const nx = x + MX[d], ny = y + MY[d];
    cell[y][x].add(d);
    cell[ny][nx].add(OPP[d]);
  }
  return cell;
}

const MOVE_DX: Record<Dir, number> = { n: 0, s: 0, e: 1, w: -1 };
const MOVE_DY: Record<Dir, number> = { n: -1, s: 1, e: 0, w: 0 };

export function levelSize(lvl: number): number { return 10 + (lvl - 1) * 3; }

export interface LevelConfig {
  cols: number;
  algo: 'dfs' | 'prim';
  braid: number;
  fog: number;
}

export function levelConfig(lvl: number): LevelConfig {
  const cols = levelSize(lvl);
  const algo: 'dfs' | 'prim' = lvl >= 3 ? 'prim' : 'dfs';
  const braid = lvl >= 5 ? Math.min(0.5, 0.15 + (lvl - 5) * 0.06) : 0;
  const fog = lvl >= 7 ? Math.max(4, Math.round(cols * 0.55 - (lvl - 7) * 0.8)) : 0;
  return { cols, algo, braid, fog };
}

function buildMaze(lvl: number, rng: PRNG): Maze {
  const { cols, algo, braid: b } = levelConfig(lvl);
  const maze = algo === 'prim'
    ? buildMazePrim(cols, cols, rng)
    : buildMazeDFS(cols, cols, rng);
  if (b > 0) braid(maze, b, rng);
  return maze;
}

// ── Persistence ───────────────────────────────────────────────────────────
interface SavedState {
  date?: string;
  level?: number;
  streak?: number;
  longest?: number;
  lastDate?: string | null;
  bests?: Record<number, number>;
}

const SK = 'maze_toys_v5';
const loadSt = (): SavedState => {
  try { return JSON.parse(localStorage.getItem(SK) || '') || {}; }
  catch { return {}; }
};
const saveSt = (d: SavedState) => localStorage.setItem(SK, JSON.stringify(d));

const today = new Date();
const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
const DS = dateSeed(today);

// ── Audio ─────────────────────────────────────────────────────────────────
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

function useAudio() {
  const acRef = useRef<AudioContext | null>(null);
  const getAC = useCallback((): AudioContext => {
    if (!acRef.current) {
      const w = window as WindowWithWebkit;
      const Ctor = window.AudioContext || w.webkitAudioContext!;
      acRef.current = new Ctor();
    }
    return acRef.current;
  }, []);

  const tone = useCallback((freq: number, dur: number, vol = 0.1, type: OscillatorType = 'square', delay = 0) => {
    try {
      const a = getAC();
      const o = a.createOscillator();
      const g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.type = type;
      o.frequency.setValueAtTime(freq, a.currentTime + delay);
      g.gain.setValueAtTime(vol, a.currentTime + delay);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + delay + dur);
      o.start(a.currentTime + delay);
      o.stop(a.currentTime + delay + dur);
    } catch (_) {}
  }, [getAC]);

  return {
    move: useCallback(() => tone(220, 0.04, 0.05, 'square'), [tone]),
    wall: useCallback(() => tone(95, 0.07, 0.04, 'sawtooth'), [tone]),
    win:  useCallback(() => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 0.16, 'sine', i * 0.09)), [tone]),
  };
}

// ── Game state ────────────────────────────────────────────────────────────
export interface GameState {
  level: number;
  maze: Maze | null;
  px: number;
  py: number;
  visited: Set<string>;
  moveCount: number;
  levelSolved: boolean;
  timerStart: number | null;
  timerElapsed: number;
  timerTick: ReturnType<typeof setInterval> | null;
  streak: number;
  longest: number;
  lastDate: string | null;
  bests: Record<number, number>;
}

export interface Display {
  level: number;
  cols: number;
  moveCount: number;
  timerElapsed: number;
  streak: number;
  bests: Record<number, number>;
  levelSolved: boolean;
}

export type { Dir };

// ── Main hook ─────────────────────────────────────────────────────────────
export function useMazeGame() {
  const savedSt = useRef<SavedState>(loadSt()).current;
  const sfx = useAudio();

  const [display, setDisplay] = useState<Display>(() => {
    const lvl = (savedSt.date === todayKey) ? (savedSt.level || 1) : 1;
    return {
      level:        lvl,
      cols:         levelSize(lvl),
      moveCount:    0,
      timerElapsed: 0,
      streak:       savedSt.streak  || 0,
      bests:        (savedSt.date === todayKey) ? (savedSt.bests || {}) : {},
      levelSolved:  false,
    };
  });

  const g = useRef<GameState>({
    level:        (savedSt.date === todayKey) ? (savedSt.level || 1) : 1,
    maze:         null,
    px:           0,
    py:           0,
    visited:      new Set(['0,0']),
    moveCount:    0,
    levelSolved:  false,
    timerStart:   null,
    timerElapsed: 0,
    timerTick:    null,
    streak:       savedSt.streak  || 0,
    longest:      savedSt.longest || 0,
    lastDate:     savedSt.lastDate || null,
    bests:        (savedSt.date === todayKey) ? (savedSt.bests || {}) : {},
  });

  const syncDisplay = useCallback(() => {
    const s = g.current;
    setDisplay({
      level:        s.level,
      cols:         levelSize(s.level),
      moveCount:    s.moveCount,
      timerElapsed: s.timerElapsed,
      streak:       s.streak,
      bests:        { ...s.bests },
      levelSolved:  s.levelSolved,
    });
  }, []);

  const startTimer = useCallback(() => {
    const s = g.current;
    s.timerStart   = Date.now();
    s.timerElapsed = 0;
    s.timerTick    = setInterval(() => {
      s.timerElapsed = Date.now() - (s.timerStart as number);
      setDisplay(d => ({ ...d, timerElapsed: s.timerElapsed }));
    }, 200);
  }, []);

  const stopTimer = useCallback(() => {
    const s = g.current;
    if (s.timerTick) clearInterval(s.timerTick);
    s.timerTick = null;
    if (s.timerStart) s.timerElapsed = Date.now() - s.timerStart;
  }, []);

  const startLevel = useCallback((lvl: number) => {
    const s = g.current;
    if (s.timerTick) clearInterval(s.timerTick);
    s.timerTick    = null;
    s.level        = lvl;
    s.maze         = buildMaze(lvl, makePRNG(DS * 100 + lvl));
    s.px           = 0;
    s.py           = 0;
    s.visited      = new Set(['0,0']);
    s.moveCount    = 0;
    s.levelSolved  = false;
    s.timerStart   = null;
    s.timerElapsed = 0;
    syncDisplay();
  }, [syncDisplay]);

  const onWin = useCallback(() => {
    const s = g.current;
    s.levelSolved = true;
    stopTimer();
    sfx.win();

    if (s.lastDate !== todayKey) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
      s.streak  = (s.lastDate === yKey) ? s.streak + 1 : 1;
      if (s.streak > s.longest) s.longest = s.streak;
      s.lastDate = todayKey;
    }

    if (!s.bests[s.level] || s.timerElapsed < s.bests[s.level]) {
      s.bests[s.level] = s.timerElapsed;
    }

    saveSt({
      date:     todayKey,
      level:    s.level + 1,
      streak:   s.streak,
      longest:  s.longest,
      lastDate: s.lastDate,
      bests:    { ...s.bests },
    });

    syncDisplay();
  }, [stopTimer, sfx, syncDisplay]);

  const move = useCallback((dir: Dir) => {
    const s = g.current;
    if (s.levelSolved || !s.maze) return;
    if (!s.maze[s.py][s.px].has(dir)) { sfx.wall(); return; }
    if (!s.timerStart) startTimer();

    s.px += MOVE_DX[dir];
    s.py += MOVE_DY[dir];
    s.moveCount++;
    sfx.move();

    const key = `${s.px},${s.py}`;
    if (s.visited.has(key)) s.visited.delete(key);
    s.visited.add(key);

    const cols = levelSize(s.level);
    if (s.px === cols - 1 && s.py === cols - 1) {
      setTimeout(onWin, 160);
    }
    syncDisplay();
  }, [sfx, startTimer, onWin, syncDisplay]);

  const reset = useCallback(() => {
    const s = g.current;
    if (s.timerTick) clearInterval(s.timerTick);
    s.timerTick    = null;
    s.px           = 0;
    s.py           = 0;
    s.visited      = new Set(['0,0']);
    s.moveCount    = 0;
    s.levelSolved  = false;
    s.timerStart   = null;
    s.timerElapsed = 0;
    syncDisplay();
  }, [syncDisplay]);

  const advance = useCallback(() => {
    if (!g.current.levelSolved) return;
    startLevel(g.current.level + 1);
  }, [startLevel]);

  useEffect(() => {
    startLevel(g.current.level);
    return () => {
      if (g.current.timerTick) clearInterval(g.current.timerTick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { display, gameRef: g, move, reset, advance };
}
