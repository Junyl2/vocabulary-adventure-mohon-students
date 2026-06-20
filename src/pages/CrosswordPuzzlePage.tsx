import { useMemo, useState } from 'react';
import { FeedbackBox } from '../components/FeedbackBox';
import { ProgressBar } from '../components/ProgressBar';
import type { Page, StudentProgress, VocabularySet } from '../types/vocabulary';
import { cellsForEntry, generateCrosswordPuzzle, type CrosswordEntry } from '../utils/crosswordGenerator';

type CrosswordProps = {
  vocabularySet: VocabularySet;
  progress: StudentProgress;
  updateProgress: (updater: (progress: StudentProgress) => StudentProgress) => void;
  setPage: (page: Page) => void;
};

export function CrosswordPuzzlePage({ vocabularySet, progress, updateProgress, setPage }: CrosswordProps) {
  const crosswordItems = vocabularySet.crosswordItems;
  const puzzle = useMemo(() => generateCrosswordPuzzle(crosswordItems), [crosswordItems]);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(puzzle.entries[0]?.id ?? null);
  const [message, setMessage] = useState('Choose a clue, then type the answer in the puzzle.');
  const [tone, setTone] = useState<'info' | 'good' | 'try'>('info');
  const answers = progress.crosswordAnswers;
  const activeEntry = puzzle.entries.find((entry) => entry.id === activeEntryId) ?? puzzle.entries[0];
  const completeWords = getCompleteWords(puzzle.entries, answers);
  const allDone = crosswordItems.length > 0 && completeWords.length === crosswordItems.length;
  const activeKeys = new Set(activeEntry ? cellsForEntry(activeEntry).map(cellKey) : []);

  const writeCell = (row: number, col: number, value: string) => {
    const letter = value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1);
    updateProgress((current) => ({
      ...current,
      crosswordAnswers: { ...current.crosswordAnswers, [cellKey({ row, col })]: letter },
    }));
  };

  const handleCellFocus = (entryIds: number[]) => {
    if (!activeEntry || !entryIds.includes(activeEntry.id)) setActiveEntryId(entryIds[0]);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (answers[cellKey({ row, col })]) {
        writeCell(row, col, '');
        return;
      }
      const previous = getRelativeCell(row, col, -1);
      if (previous) {
        writeCell(previous.row, previous.col, '');
        focusCell(previous.row, previous.col);
      }
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const previous = getRelativeCell(row, col, -1);
      if (previous) focusCell(previous.row, previous.col);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const next = getRelativeCell(row, col, 1);
      if (next) focusCell(next.row, next.col);
      return;
    }
    if (/^[a-zA-Z]$/.test(event.key)) {
      event.preventDefault();
      writeCell(row, col, event.key);
      focusNext(row, col);
    }
  };

  const getRelativeCell = (row: number, col: number, offset: -1 | 1) => {
    if (!activeEntry) return null;
    const cells = cellsForEntry(activeEntry);
    const index = cells.findIndex((cell) => cell.row === row && cell.col === col);
    return cells[index + offset] ?? null;
  };

  const focusCell = (row: number, col: number) => {
    document.getElementById(inputId(row, col))?.focus();
  };

  const focusNext = (row: number, col: number) => {
    const next = getRelativeCell(row, col, 1);
    if (next) focusCell(next.row, next.col);
  };

  const checkAnswers = () => {
    const nextComplete = getCompleteWords(puzzle.entries, answers);
    updateProgress((current) => ({ ...current, crosswordCompleteWords: nextComplete }));
    if (nextComplete.length === puzzle.entries.length) {
      setTone('good');
      setMessage('Wonderful crossword work! Every placed word is correct.');
    } else if (nextComplete.length > progress.crosswordCompleteWords.length) {
      setTone('good');
      setMessage(`Nice! ${nextComplete.length} word${nextComplete.length === 1 ? '' : 's'} are correct so far.`);
    } else {
      setTone('try');
      setMessage('Some letters need another look. Try a clue or use a hint.');
    }
  };

  const giveHint = () => {
    const entry = activeEntry ?? puzzle.entries.find((next) => !completeWords.includes(next.word));
    if (!entry) return;
    const emptyOrWrong = cellsForEntry(entry).find((cell, index) => answers[cellKey(cell)] !== entry.word[index]);
    if (!emptyOrWrong) return;
    const letterIndex = cellsForEntry(entry).findIndex((cell) => cell.row === emptyOrWrong.row && cell.col === emptyOrWrong.col);
    writeCell(emptyOrWrong.row, emptyOrWrong.col, entry.word[letterIndex]);
    setTone('info');
    setMessage(`Hint added for ${entry.word}. Keep going!`);
  };

  const resetCrossword = () => {
    updateProgress((current) => ({ ...current, crosswordAnswers: {}, crosswordCompleteWords: [] }));
    setActiveEntryId(puzzle.entries[0]?.id ?? null);
    setTone('info');
    setMessage('Fresh crossword! Start with any clue you like.');
  };

  if (!crosswordItems.length) {
    return (
      <section className="panel text-center">
        <h2 className="text-4xl font-black">Crossword Puzzle</h2>
        <p className="mt-3 text-lg font-bold text-slate-700">Ask your teacher to add vocabulary words before playing.</p>
        <button className="game-button mt-5" onClick={() => setPage('home')}>🏠 Back Home</button>
      </section>
    );
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-4xl font-black">Crossword Puzzle</h2>
            <p className="mt-2 text-lg font-bold text-slate-700">Use the clues to type each vocabulary word into the crossword.</p>
          </div>
          <div className="rounded-3xl bg-amber-100 px-5 py-3 text-xl font-black text-amber-950">{completeWords.length} of {crosswordItems.length} words complete</div>
        </div>

        <div className="mt-5 pb-2">
          <div className="grid w-full gap-1 rounded-3xl bg-slate-200 p-2 sm:p-3" style={{ gridTemplateColumns: `repeat(${puzzle.cols}, minmax(0, 1fr))` }}>
            {puzzle.grid.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const key = cellKey({ row: rowIndex, col: colIndex });
                if (!cell) return <div key={key} className="aspect-square min-w-0 rounded-md bg-slate-300 sm:rounded-lg" />;
                const value = answers[key] ?? '';
                const checked = progress.crosswordCompleteWords.length > 0 || completeWords.length > 0;
                const correct = value === cell.solution;
                return (
                  <label
                    key={key}
                    className={`relative grid aspect-square min-w-0 place-items-center rounded-md border-2 bg-white sm:rounded-lg ${
                      activeKeys.has(key) ? 'border-amber-500 ring-4 ring-amber-100' : 'border-white'
                    } ${checked && value ? (correct ? 'text-emerald-900' : 'text-slate-900') : 'text-slate-900'}`}
                  >
                    {cell.number && <span className="absolute left-0.5 top-0 text-[clamp(0.42rem,1.4vw,0.65rem)] font-black text-slate-500 sm:left-1 sm:top-0.5">{cell.number}</span>}
                    <input
                      id={inputId(rowIndex, colIndex)}
                      className={`h-full w-full rounded-md bg-transparent text-center text-[clamp(0.65rem,2.8vw,1.25rem)] font-black uppercase outline-none sm:rounded-lg ${correct && value ? 'bg-emerald-100' : ''}`}
                      maxLength={1}
                      value={value}
                      onFocus={() => handleCellFocus(cell.entries)}
                      onChange={(event) => writeCell(rowIndex, colIndex, event.target.value)}
                      onKeyDown={(event) => handleKeyDown(event, rowIndex, colIndex)}
                      aria-label={`Crossword cell ${rowIndex + 1}, ${colIndex + 1}`}
                    />
                  </label>
                );
              }),
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          <FeedbackBox message={message} tone={tone} />
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button className="game-button" onClick={checkAnswers}>✅ Check Answers</button>
            <button className="secondary-button" onClick={giveHint}>💡 Hint</button>
            <button className="secondary-button" onClick={resetCrossword}>↻ Reset Crossword</button>
            <button className="secondary-button" onClick={() => setPage('home')}>🏠 Back Home</button>
          </div>
        </div>

        {allDone && <div className="mt-5 rounded-[2rem] bg-gradient-to-r from-amber-100 to-emerald-100 p-5 text-center text-3xl font-black text-emerald-950">Fantastic! The crossword is complete!</div>}
      </div>

      <aside className="flex flex-col gap-4">
        <section className="panel">
          <h3 className="text-2xl font-black">Clues</h3>
          <ProgressBar label="Crossword Progress" value={completeWords.length} total={crosswordItems.length} />
          <ClueList title="Across" entries={puzzle.entries.filter((entry) => entry.direction === 'across')} activeEntryId={activeEntry?.id} completeWords={completeWords} setActiveEntryId={setActiveEntryId} />
          <ClueList title="Down" entries={puzzle.entries.filter((entry) => entry.direction === 'down')} activeEntryId={activeEntry?.id} completeWords={completeWords} setActiveEntryId={setActiveEntryId} />
        </section>

        {puzzle.extraPractice.length > 0 && (
          <section className="panel">
            <h3 className="text-xl font-black">Extra Practice Words</h3>
            <p className="mt-1 font-bold text-slate-700">These words did not fit the crossword, but they are still part of the set.</p>
            <div className="mt-3 grid gap-2">
              {puzzle.extraPractice.map((item) => (
                <div key={item.id} className="rounded-2xl bg-white p-3 shadow">
                  <p className="font-black">{item.word}</p>
                  <p className="text-sm font-bold text-slate-700">{item.clue}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </aside>
    </section>
  );
}

function ClueList({ title, entries, activeEntryId, completeWords, setActiveEntryId }: { title: string; entries: CrosswordEntry[]; activeEntryId?: number; completeWords: string[]; setActiveEntryId: (id: number) => void }) {
  if (!entries.length) return null;
  return (
    <div className="mt-4">
      <h4 className="text-lg font-black text-cyan-800">{title}</h4>
      <div className="mt-2 grid gap-2">
        {entries.map((entry) => (
          <button
            key={entry.id}
            className={`rounded-2xl p-3 text-left font-bold transition ${
              activeEntryId === entry.id ? 'bg-amber-100 text-amber-950 ring-4 ring-amber-200' : completeWords.includes(entry.word) ? 'bg-emerald-100 text-emerald-950' : 'bg-white shadow hover:bg-sky-50'
            }`}
            onClick={() => setActiveEntryId(entry.id)}
          >
            <span className="font-black">{entry.id}. {completeWords.includes(entry.word) ? '✓ ' : ''}</span>
            {entry.clue}
          </button>
        ))}
      </div>
    </div>
  );
}

function getCompleteWords(entries: CrosswordEntry[], answers: Record<string, string>) {
  return entries
    .filter((entry) => cellsForEntry(entry).every((cell, index) => answers[cellKey(cell)] === entry.word[index]))
    .map((entry) => entry.word);
}

function cellKey({ row, col }: { row: number; col: number }) {
  return `${row}-${col}`;
}

function inputId(row: number, col: number) {
  return `crossword-${row}-${col}`;
}
