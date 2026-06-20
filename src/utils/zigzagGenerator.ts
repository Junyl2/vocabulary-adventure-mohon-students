import type { VocabularyItem } from '../types/vocabulary';

export type GridPoint = { row: number; col: number };

export type ZigzagPlacement = {
  word: string;
  path: GridPoint[];
};

export type ZigzagPuzzle = {
  grid: string[][];
  placements: ZigzagPlacement[];
  unplacedWords: string[];
};

const filler = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
] as const;

export function generateZigzagPuzzle(items: VocabularyItem[]): ZigzagPuzzle {
  const words = items.map((item) => item.word).filter(Boolean).sort((a, b) => b.length - a.length);
  const longest = Math.max(...words.map((word) => word.length), 8);
  const rows = Math.min(18, Math.max(10, Math.ceil(longest * 0.9) + 3));
  const cols = Math.min(18, Math.max(10, longest + 2));
  const grid: (string | null)[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));
  const placements: ZigzagPlacement[] = [];
  const unplacedWords: string[] = [];

  words.forEach((word, wordIndex) => {
    const path = findPathForWord(word, grid, wordIndex);
    if (!path) {
      unplacedWords.push(word);
      return;
    }
    path.forEach((point, letterIndex) => {
      grid[point.row][point.col] = word[letterIndex];
    });
    placements.push({ word, path });
  });

  return {
    grid: grid.map((row, rowIndex) =>
      row.map((letter, colIndex) => letter ?? filler[(rowIndex * 7 + colIndex * 11 + words.length) % filler.length]),
    ),
    placements,
    unplacedWords,
  };
}

function findPathForWord(word: string, grid: (string | null)[][], wordIndex: number): GridPoint[] | null {
  const rows = grid.length;
  const cols = grid[0].length;
  const starts: GridPoint[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      starts.push({ row, col });
    }
  }

  const orderedStarts = starts.sort((a, b) => ((a.row * 13 + a.col * 17 + wordIndex * 19) % 97) - ((b.row * 13 + b.col * 17 + wordIndex * 19) % 97));
  for (const start of orderedStarts) {
    const path = walk(word, grid, start, [{ row: start.row, col: start.col }], wordIndex);
    if (path) return path;
  }
  return null;
}

// Depth-first search keeps each placed word connected in a true zigzag path.
function walk(word: string, grid: (string | null)[][], point: GridPoint, path: GridPoint[], wordIndex: number): GridPoint[] | null {
  const letterIndex = path.length - 1;
  const existing = grid[point.row][point.col];
  if (existing && existing !== word[letterIndex]) return null;
  if (letterIndex === word.length - 1) return path;

  const used = new Set(path.map((cell) => `${cell.row}-${cell.col}`));
  const options = directions
    .map(([rowDelta, colDelta], index) => ({ row: point.row + rowDelta, col: point.col + colDelta, score: (index * 23 + wordIndex * 7 + letterIndex * 5) % 31 }))
    .filter((next) => next.row >= 0 && next.col >= 0 && next.row < grid.length && next.col < grid[0].length && !used.has(`${next.row}-${next.col}`))
    .filter((next) => !grid[next.row][next.col] || grid[next.row][next.col] === word[letterIndex + 1])
    .sort((a, b) => a.score - b.score);

  for (const next of options) {
    const found = walk(word, grid, next, [...path, { row: next.row, col: next.col }], wordIndex);
    if (found) return found;
  }
  return null;
}

export function areAdjacent(a: GridPoint, b: GridPoint) {
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1 && !(a.row === b.row && a.col === b.col);
}

export function pointKey(point: GridPoint) {
  return `${point.row}-${point.col}`;
}
