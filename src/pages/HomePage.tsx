import { ProgressBar } from '../components/ProgressBar';
import type { Page, StudentProgress, VocabularySet } from '../types/vocabulary';

export function HomePage({ setPage, vocabularySet, progress }: { setPage: (page: Page) => void; vocabularySet: VocabularySet; progress: StudentProgress }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="panel">
        <div className="max-w-3xl">
          <p className="text-lg font-black text-cyan-700">Hello, word explorer!</p>
          <h2 className="mt-2 text-4xl font-black sm:text-6xl">Vocabulary Adventure By, Ma'am Patiluna</h2>
          <p className="mt-4 text-lg font-bold text-slate-700">
            Practice your teacher's vocabulary words by finding them in a zigzag puzzle and solving a friendly crossword.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button className="min-h-44 rounded-[2rem] border-4 border-white bg-gradient-to-br from-cyan-100 to-sky-200 p-6 text-left shadow-pop transition hover:-translate-y-1" onClick={() => setPage('zigzag')}>
            <span className="text-5xl">🌀</span>
            <span className="mt-4 block text-3xl font-black">Play Zigzag Puzzle</span>
            <span className="mt-2 block font-bold text-slate-700">Click letters in order to find each word.</span>
          </button>
          <button className="min-h-44 rounded-[2rem] border-4 border-white bg-gradient-to-br from-amber-100 to-orange-200 p-6 text-left shadow-pop transition hover:-translate-y-1" onClick={() => setPage('crossword')}>
            <span className="text-5xl">✏️</span>
            <span className="mt-4 block text-3xl font-black">Play Crossword Puzzle</span>
            <span className="mt-2 block font-bold text-slate-700">Use clues and type the missing words.</span>
          </button>
        </div>
        <button className="secondary-button mt-6" onClick={() => setPage('teacher')}>🔒 Teacher Setup</button>
      </div>

      <aside className="flex flex-col gap-4">
        <section className="panel">
          <h3 className="text-2xl font-black">Current Vocabulary Set</h3>
          <p className="mt-2 rounded-3xl bg-cyan-100 p-4 text-2xl font-black text-cyan-950">{vocabularySet.title}</p>
          <p className="mt-3 font-bold text-slate-700">{vocabularySet.zigzagItems.length} Zigzag words and {vocabularySet.crosswordItems.length} Crossword words ready to play.</p>
        </section>
        <section className="panel">
          <h3 className="text-2xl font-black">Student Progress</h3>
          <div className="mt-4 grid gap-4">
            <ProgressBar label="Zigzag Puzzle" value={progress.zigzagFoundWords.length} total={vocabularySet.zigzagItems.length} />
            <ProgressBar label="Crossword Puzzle" value={progress.crosswordCompleteWords.length} total={vocabularySet.crosswordItems.length} />
          </div>
        </section>
      </aside>
    </section>
  );
}
