import { useMemo, useState } from 'react';
import { FeedbackBox } from '../components/FeedbackBox';
import { ProgressBar } from '../components/ProgressBar';
import type { Page, StudentProgress, VocabularySet } from '../types/vocabulary';
import { areAdjacent, generateZigzagPuzzle, pointKey, type GridPoint } from '../utils/zigzagGenerator';

type ZigzagProps = {
  vocabularySet: VocabularySet;
  progress: StudentProgress;
  updateProgress: (updater: (progress: StudentProgress) => StudentProgress) => void;
  setPage: (page: Page) => void;
};

export function ZigzagPuzzlePage({ vocabularySet, progress, updateProgress, setPage }: ZigzagProps) {
  const puzzle = useMemo(() => generateZigzagPuzzle(vocabularySet.items), [vocabularySet]);
  const [selected, setSelected] = useState<GridPoint[]>([]);
  const [message, setMessage] = useState('Choose a word from the bank, then tap the letters that spell it.');
  const [tone, setTone] = useState<'info' | 'good' | 'try'>('info');
  const found = progress.zigzagFoundWords.filter((word) => vocabularySet.items.some((item) => item.word === word));
  const selectedKeys = new Set(selected.map(pointKey));
  const selectedWord = selected.map((point) => puzzle.grid[point.row][point.col]).join('');
  const foundKeys = new Set(
    puzzle.placements
      .filter((placement) => found.includes(placement.word))
      .flatMap((placement) => placement.path.map(pointKey)),
  );
  const allDone = vocabularySet.items.length > 0 && found.length === vocabularySet.items.length;

  const chooseCell = (point: GridPoint) => {
    if (foundKeys.has(pointKey(point))) return;
    if (selectedKeys.has(pointKey(point))) {
      const selectedIndex = selected.findIndex((cell) => cell.row === point.row && cell.col === point.col);
      setSelected((current) => current.slice(0, selectedIndex));
      setTone('info');
      setMessage('Letter removed. Keep building your word.');
      return;
    }
    if (selected.length > 0 && !areAdjacent(selected[selected.length - 1], point)) {
      setTone('try');
      setMessage('Almost! The next letter needs to touch the last letter you picked.');
      return;
    }
    setSelected((current) => [...current, point]);
  };

  const checkWord = () => {
    if (!selected.length) {
      setTone('info');
      setMessage('Tap a few letters first, then check your word.');
      return;
    }
    const match = puzzle.placements.find((placement) => placement.word === selectedWord && samePath(placement.path, selected));
    if (!match) {
      setTone('try');
      setMessage(`${selectedWord} is not a hidden word yet. Try a new path.`);
      return;
    }
    if (found.includes(match.word)) {
      setTone('info');
      setMessage(`${match.word} is already finished. Pick a new word.`);
      setSelected([]);
      return;
    }
    const nextFound = [...found, match.word];
    updateProgress((current) => ({ ...current, zigzagFoundWords: nextFound }));
    setSelected([]);
    setTone('good');
    setMessage(nextFound.length === vocabularySet.items.length ? 'Amazing! You found every zigzag word!' : `Great job! You found ${match.word}.`);
  };

  const giveHint = () => {
    const next = puzzle.placements.find((placement) => !found.includes(placement.word));
    if (!next) return;
    const item = vocabularySet.items.find((word) => word.word === next.word);
    setSelected([next.path[0]]);
    setTone('info');
    setMessage(`Hint: ${next.word} starts with ${next.word[0]}. ${item?.definition ?? 'Use the word bank to help.'}`);
  };

  const resetPuzzle = () => {
    updateProgress((current) => ({ ...current, zigzagFoundWords: [] }));
    setSelected([]);
    setTone('info');
    setMessage('Fresh start! Pick any word from the word bank.');
  };

  if (!vocabularySet.items.length) {
    return (
      <section className="panel text-center">
        <h2 className="text-4xl font-black">Zigzag Word Puzzle</h2>
        <p className="mt-3 text-lg font-bold text-slate-700">Ask your teacher to add vocabulary words before playing.</p>
        <button className="game-button mt-5" onClick={() => setPage('home')}>🏠 Back Home</button>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-4xl font-black">Zigzag Word Puzzle</h2>
            <p className="mt-2 text-lg font-bold text-slate-700">Choose a word from the bank, then tap the letters that spell it.</p>
          </div>
          <div className="rounded-3xl bg-emerald-100 px-5 py-3 text-xl font-black text-emerald-950">{found.length} of {vocabularySet.items.length} words found</div>
        </div>

        <div className="mt-5 pb-2">
          <div className="grid w-full gap-1 rounded-3xl bg-cyan-100 p-2 sm:p-3" style={{ gridTemplateColumns: `repeat(${puzzle.grid[0]?.length ?? 0}, minmax(0, 1fr))` }}>
            {puzzle.grid.map((row, rowIndex) =>
              row.map((letter, colIndex) => {
                const point = { row: rowIndex, col: colIndex };
                const key = pointKey(point);
                const selectedCell = selectedKeys.has(key);
                const foundCell = foundKeys.has(key);
                return (
                  <button
                    key={key}
                    className={`grid aspect-square min-w-0 place-items-center rounded-lg border-2 text-[clamp(0.65rem,2.7vw,1.15rem)] font-black shadow-sm transition sm:rounded-xl ${
                      foundCell
                        ? 'border-emerald-500 bg-emerald-200 text-emerald-950'
                        : selectedCell
                          ? 'border-amber-500 bg-amber-200 text-amber-950 scale-105'
                          : 'border-white bg-white text-slate-900 hover:-translate-y-0.5 hover:bg-sky-50'
                    }`}
                    onClick={() => chooseCell(point)}
                    aria-label={`Letter ${letter}`}
                  >
                    {letter}
                  </button>
                );
              }),
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <FeedbackBox message={message} tone={tone} />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button className="game-button" onClick={checkWord}>✅ Check Word</button>
            <button className="secondary-button" onClick={() => setSelected([])}>🧽 Clear Selection</button>
            <button className="secondary-button" onClick={giveHint}>💡 Hint</button>
            <button className="secondary-button" onClick={resetPuzzle}>↻ Reset Puzzle</button>
            <button className="secondary-button" onClick={() => setPage('home')}>🏠 Back Home</button>
          </div>
        </div>

        {allDone && <div className="mt-5 rounded-[2rem] bg-gradient-to-r from-amber-100 to-emerald-100 p-5 text-center text-3xl font-black text-emerald-950">You did it! Every word has been discovered!</div>}
      </div>

      <aside className="flex flex-col gap-4">
        <section className="panel">
          <h3 className="text-2xl font-black">Word Bank</h3>
          <ProgressBar label="Zigzag Progress" value={found.length} total={vocabularySet.items.length} />
          <div className="mt-4 grid gap-2">
            {vocabularySet.items.map((item) => (
              <div key={item.id} className={`rounded-2xl p-3 ${found.includes(item.word) ? 'bg-emerald-100 text-emerald-950' : 'bg-white shadow'}`}>
                <p className="text-lg font-black">{found.includes(item.word) ? '✓ ' : ''}{item.word}</p>
                <p className="text-sm font-bold text-slate-700">{item.definition}</p>
              </div>
            ))}
          </div>
        </section>
        {puzzle.unplacedWords.length > 0 && (
          <section className="panel">
            <h3 className="text-xl font-black">Practice Later</h3>
            <p className="mt-2 font-bold text-slate-700">These words did not fit in this grid: {puzzle.unplacedWords.join(', ')}.</p>
          </section>
        )}
      </aside>
    </section>
  );
}

function samePath(a: GridPoint[], b: GridPoint[]) {
  return a.length === b.length && a.every((point, index) => point.row === b[index].row && point.col === b[index].col);
}
