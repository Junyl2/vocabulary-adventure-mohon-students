import type { VocabularyItem } from '../types/vocabulary';

export type CrosswordDirection = 'across' | 'down';

export type CrosswordEntry = {
  id: number;
  word: string;
  clue: string;
  definition: string;
  row: number;
  col: number;
  direction: CrosswordDirection;
};

export type CrosswordCell = {
  solution: string;
  entries: number[];
  number?: number;
};

export type CrosswordPuzzle = {
  grid: (CrosswordCell | null)[][];
  entries: CrosswordEntry[];
  extraPractice: VocabularyItem[];
  rows: number;
  cols: number;
};

type Placement = CrosswordEntry;
type Coord = { row: number; col: number };

export function generateCrosswordPuzzle(items: VocabularyItem[]): CrosswordPuzzle {
  const sorted = [...items].filter((item) => item.word).sort((a, b) => b.word.length - a.word.length);
  const placements: Placement[] = [];
  const extraPractice: VocabularyItem[] = [];

  sorted.forEach((item, index) => {
    if (index === 0) {
      placements.push(toPlacement(item, 1, 0, 0, 'across'));
      return;
    }
    const next = findPlacement(item, placements);
    if (next) placements.push(toPlacement(item, placements.length + 1, next.row, next.col, next.direction));
    else extraPractice.push(item);
  });

  const normalized = normalizePlacements(placements);
  const grid = buildGrid(normalized);
  return {
    grid,
    entries: normalized,
    extraPractice,
    rows: grid.length,
    cols: grid[0]?.length ?? 0,
  };
}

function toPlacement(item: VocabularyItem, id: number, row: number, col: number, direction: CrosswordDirection): Placement {
  return { id, word: item.word, clue: item.clue, definition: item.definition, row, col, direction };
}

function findPlacement(item: VocabularyItem, placements: Placement[]): { row: number; col: number; direction: CrosswordDirection } | null {
  for (const placed of placements) {
    for (let placedIndex = 0; placedIndex < placed.word.length; placedIndex += 1) {
      for (let wordIndex = 0; wordIndex < item.word.length; wordIndex += 1) {
        if (placed.word[placedIndex] !== item.word[wordIndex]) continue;
        const direction: CrosswordDirection = placed.direction === 'across' ? 'down' : 'across';
        const intersection = coordinateFor(placed, placedIndex);
        const row = direction === 'down' ? intersection.row - wordIndex : intersection.row;
        const col = direction === 'across' ? intersection.col - wordIndex : intersection.col;
        const candidate = toPlacement(item, placements.length + 1, row, col, direction);
        if (canPlace(candidate, placements)) return { row, col, direction };
      }
    }
  }
  return null;
}

function coordinateFor(entry: Pick<Placement, 'row' | 'col' | 'direction'>, index: number): Coord {
  return {
    row: entry.row + (entry.direction === 'down' ? index : 0),
    col: entry.col + (entry.direction === 'across' ? index : 0),
  };
}

function canPlace(candidate: Placement, placements: Placement[]) {
  const occupied = buildOccupiedMap(placements);
  const cells = cellsForEntry(candidate);
  let intersections = 0;

  for (let index = 0; index < cells.length; index += 1) {
    const cell = cells[index];
    const key = `${cell.row}-${cell.col}`;
    const existing = occupied.get(key);
    if (existing) {
      if (existing.letter !== candidate.word[index]) return false;
      if (existing.direction === candidate.direction) return false;
      intersections += 1;
      continue;
    }

    const sideA = candidate.direction === 'across' ? `${cell.row - 1}-${cell.col}` : `${cell.row}-${cell.col - 1}`;
    const sideB = candidate.direction === 'across' ? `${cell.row + 1}-${cell.col}` : `${cell.row}-${cell.col + 1}`;
    if (occupied.has(sideA) || occupied.has(sideB)) return false;
  }

  const before = coordinateFor(candidate, -1);
  const after = coordinateFor(candidate, candidate.word.length);
  if (occupied.has(`${before.row}-${before.col}`) || occupied.has(`${after.row}-${after.col}`)) return false;
  return intersections > 0;
}

function buildOccupiedMap(placements: Placement[]) {
  const map = new Map<string, { letter: string; direction: CrosswordDirection }>();
  placements.forEach((entry) => {
    cellsForEntry(entry).forEach((cell, index) => {
      map.set(`${cell.row}-${cell.col}`, { letter: entry.word[index], direction: entry.direction });
    });
  });
  return map;
}

export function cellsForEntry(entry: Pick<CrosswordEntry, 'word' | 'row' | 'col' | 'direction'>) {
  return entry.word.split('').map((_, index) => coordinateFor(entry, index));
}

function normalizePlacements(placements: Placement[]): Placement[] {
  const coords = placements.flatMap(cellsForEntry);
  const minRow = Math.min(...coords.map((coord) => coord.row), 0);
  const minCol = Math.min(...coords.map((coord) => coord.col), 0);
  return placements.map((entry) => ({ ...entry, row: entry.row - minRow, col: entry.col - minCol }));
}

function buildGrid(entries: CrosswordEntry[]) {
  const coords = entries.flatMap(cellsForEntry);
  const rows = Math.max(...coords.map((coord) => coord.row), 0) + 1;
  const cols = Math.max(...coords.map((coord) => coord.col), 0) + 1;
  const grid: (CrosswordCell | null)[][] = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

  entries.forEach((entry) => {
    cellsForEntry(entry).forEach((cell, index) => {
      const current = grid[cell.row][cell.col];
      grid[cell.row][cell.col] = {
        solution: entry.word[index],
        entries: current ? [...current.entries, entry.id] : [entry.id],
        number: index === 0 ? entry.id : current?.number,
      };
    });
  });

  return grid;
}
