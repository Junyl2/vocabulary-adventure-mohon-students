import type { Page, StudentProgress, VocabularySet } from '../types/vocabulary';

type LayoutProps = {
  page: Page;
  setPage: (page: Page) => void;
  vocabularySet: VocabularySet;
  progress: StudentProgress;
  children: React.ReactNode;
};

export function Layout({ page, setPage, vocabularySet, progress, children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#bae6fd_0,#e0f2fe_28%,transparent_45%),linear-gradient(135deg,#f0fdfa_0%,#eff6ff_48%,#fff7ed_100%)] text-slate-900">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button onClick={() => setPage('home')} className="text-left">
            <p className="text-sm font-black uppercase tracking-wide text-cyan-700">Vocabulary Adventure By,</p>
            <h1 className="text-2xl font-black sm:text-4xl">Ma'am Patiluna</h1>
          </button>
          <nav className="flex flex-wrap gap-2">
            <NavButton active={page === 'home'} onClick={() => setPage('home')}>🏠 Home</NavButton>
            <NavButton active={page === 'zigzag'} onClick={() => setPage('zigzag')}>🌀 Zigzag</NavButton>
            <NavButton active={page === 'crossword'} onClick={() => setPage('crossword')}>✏️ Crossword</NavButton>
            <NavButton active={page === 'teacher'} onClick={() => setPage('teacher')}>🔒 Teacher</NavButton>
          </nav>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <StatusPill label="Vocabulary Set" value={vocabularySet.title} tone="cyan" />
          <StatusPill label="Zigzag Found" value={`${progress.zigzagFoundWords.length}/${vocabularySet.items.length}`} tone="emerald" />
          <StatusPill label="Crossword Done" value={`${progress.crosswordCompleteWords.length}/${vocabularySet.items.length}`} tone="amber" />
        </section>

        {children}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={active ? 'game-button' : 'secondary-button'} onClick={onClick}>
      {children}
    </button>
  );
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: 'cyan' | 'emerald' | 'amber' }) {
  const colors = {
    cyan: 'bg-cyan-100 text-cyan-950',
    emerald: 'bg-emerald-100 text-emerald-950',
    amber: 'bg-amber-100 text-amber-950',
  };
  return (
    <div className={`rounded-3xl px-5 py-4 shadow ${colors[tone]}`}>
      <p className="text-sm font-black uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
