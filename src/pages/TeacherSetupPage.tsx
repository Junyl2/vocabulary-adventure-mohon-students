import { useMemo, useState } from 'react';
import { defaultVocabularySet } from '../data/defaultVocabulary';
import type { VocabularyItem, VocabularySet } from '../types/vocabulary';
import { clearProgress, makeItemId, normalizeVocabularySet, normalizeWord, saveVocabularySet } from '../utils/localStorage';

type TeacherSetupProps = {
  vocabularySet: VocabularySet;
  onVocabularyChange: (set: VocabularySet) => void;
};

type PuzzleList = 'zigzagItems' | 'crosswordItems';

export function TeacherSetupPage({ vocabularySet, onVocabularyChange }: TeacherSetupProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [draft, setDraft] = useState<VocabularySet>(vocabularySet);
  const [message, setMessage] = useState('Enter the teacher passcode to edit the vocabulary challenge.');
  const [backupText, setBackupText] = useState('');
  const errors = useMemo(() => validateSet(draft), [draft]);

  if (!unlocked) {
    return (
      <section className="panel mx-auto max-w-xl">
        <h2 className="text-4xl font-black">Teacher Setup</h2>
        <p className="mt-2 font-bold text-slate-700">{message}</p>
        <input className="mt-5 w-full rounded-2xl border-4 border-cyan-200 p-4 text-xl font-black" type="password" value={passcode} onChange={(event) => setPasscode(event.target.value)} placeholder="Passcode" />
        <button className="game-button mt-4 w-full" onClick={() => passcode === 'teacher123' ? setUnlocked(true) : setMessage('That passcode did not work. Please try again.')}>Unlock Teacher Setup</button>
      </section>
    );
  }

  const updateItem = (list: PuzzleList, id: string, patch: Partial<VocabularyItem>) => {
    setDraft((current) => ({
      ...current,
      [list]: current[list].map((item) => item.id === id ? { ...item, ...patch, word: patch.word !== undefined ? normalizeWord(patch.word) : item.word } : item),
    }));
  };

  const addItem = (list: PuzzleList) => {
    setDraft((current) => ({
      ...current,
      [list]: [...current[list], { id: makeItemId(list), word: '', definition: '', clue: '' }],
    }));
  };

  const deleteItem = (list: PuzzleList, id: string) => {
    setDraft((current) => ({
      ...current,
      [list]: current[list].filter((item) => item.id !== id),
    }));
  };

  const save = () => {
    if (errors.length) {
      setMessage('Please fix the highlighted items before saving.');
      return;
    }
    const next = { ...draft, updatedAt: Date.now() };
    saveVocabularySet(next);
    clearProgress();
    onVocabularyChange(next);
    setMessage('Saved! Zigzag and Crossword will now use their own word lists.');
  };

  const resetSample = () => {
    setDraft(defaultVocabularySet);
    saveVocabularySet(defaultVocabularySet);
    clearProgress();
    onVocabularyChange(defaultVocabularySet);
    setMessage('Reset to the default Water Cycle Words set for both puzzles.');
  };

  const clearAll = () => {
    clearProgress();
    const emptySet = { title: 'My Vocabulary Words', updatedAt: Date.now(), zigzagItems: [], crosswordItems: [] };
    saveVocabularySet(emptySet);
    setDraft(emptySet);
    onVocabularyChange(emptySet);
    setMessage('All saved vocabulary and student progress were cleared.');
  };

  const saveBackup = async () => {
    const text = JSON.stringify(draft, null, 2);
    setBackupText(text);
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Backup is ready and copied. Save this text if you want to use the same word lists on another laptop.');
    } catch {
      setMessage('Backup is ready below. Save this text if you want to use the same word lists on another laptop.');
    }
  };

  const loadBackup = () => {
    try {
      const next = normalizeVocabularySet(JSON.parse(backupText));
      setDraft(next);
      setMessage('Backup loaded. Review both puzzle lists, then click Save Vocabulary Set.');
    } catch {
      setMessage('Backup could not be loaded. Please paste the full backup text and try again.');
    }
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-4xl font-black">Teacher Setup</h2>
            <p className="mt-2 font-bold text-slate-700">Create separate vocabulary lists for Zigzag and Crossword. Saved words are placed into the puzzles so students can solve them.</p>
          </div>
          <button className="game-button" onClick={save}>💾 Save Vocabulary Set</button>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-black uppercase tracking-wide text-cyan-700">Vocabulary Set Title</span>
          <input className="mt-2 w-full rounded-2xl border-4 border-cyan-200 p-4 text-2xl font-black" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </label>

        <WordEditor
          title="Zigzag Puzzle Words"
          description="These words appear in the clickable zigzag letter grid."
          items={draft.zigzagItems}
          list="zigzagItems"
          onAdd={addItem}
          onDelete={deleteItem}
          onUpdate={updateItem}
        />

        <WordEditor
          title="Crossword Puzzle Words"
          description="These words appear in the crossword with their clues."
          items={draft.crosswordItems}
          list="crosswordItems"
          onAdd={addItem}
          onDelete={deleteItem}
          onUpdate={updateItem}
        />
      </div>

      <aside className="flex flex-col gap-4">
        <section className="panel">
          <h3 className="text-2xl font-black">Teacher Tools</h3>
          <p className="mt-2 font-bold text-slate-700">{message}</p>
          {errors.length > 0 && (
            <div className="mt-3 rounded-2xl bg-amber-100 p-3 font-black text-amber-900">
              {errors.map((error) => <p key={error}>{error}</p>)}
            </div>
          )}
          <div className="mt-4 grid gap-2">
            <button className="secondary-button" onClick={resetSample}>Reset to Sample Set</button>
            <button className="secondary-button border-rose-400 text-rose-700 hover:bg-rose-50" onClick={clearAll}>Clear All Data</button>
            <button className="secondary-button" onClick={saveBackup}>Save Backup</button>
            <button className="game-button" onClick={loadBackup}>Load Backup</button>
          </div>
          <p className="mt-4 rounded-2xl bg-cyan-50 p-3 text-sm font-bold text-cyan-950">
            Backups help you move both puzzle word lists to another laptop or save a copy before clearing data.
          </p>
          <textarea className="mt-3 min-h-40 w-full rounded-2xl border-4 border-cyan-100 p-3 font-mono text-sm" value={backupText} onChange={(event) => setBackupText(event.target.value)} placeholder="Backup text appears here. Paste backup text here to load it." />
        </section>

        <section className="panel">
          <h3 className="text-2xl font-black">Preview</h3>
          <PreviewList title="Zigzag" items={draft.zigzagItems} />
          <PreviewList title="Crossword" items={draft.crosswordItems} />
        </section>
      </aside>
    </section>
  );
}

function WordEditor({ title, description, items, list, onAdd, onDelete, onUpdate }: { title: string; description: string; items: VocabularyItem[]; list: PuzzleList; onAdd: (list: PuzzleList) => void; onDelete: (list: PuzzleList, id: string) => void; onUpdate: (list: PuzzleList, id: string, patch: Partial<VocabularyItem>) => void }) {
  return (
    <section className="mt-7 rounded-[2rem] border-4 border-cyan-100 bg-cyan-50/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-black">{title}</h3>
          <p className="font-bold text-slate-700">{description}</p>
        </div>
        <button className="secondary-button" onClick={() => onAdd(list)}>➕ Add Word</button>
      </div>

      <div className="mt-4 grid gap-4">
        {items.map((item, index) => {
          const itemErrors = validateItem(item);
          return (
            <div key={item.id} className={`rounded-3xl border-4 bg-white p-4 shadow ${itemErrors.length ? 'border-amber-300' : 'border-cyan-100'}`}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h4 className="text-xl font-black">Word {index + 1}</h4>
                <button className="secondary-button border-rose-400 text-rose-700 hover:bg-rose-50" onClick={() => onDelete(list, item.id)}>Delete</button>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Word" value={item.word} onChange={(value) => onUpdate(list, item.id, { word: value })} placeholder="WATER" />
                <Field label="Definition" value={item.definition} onChange={(value) => onUpdate(list, item.id, { definition: value })} placeholder="Simple meaning" />
                <Field label="Crossword Clue" value={item.clue} onChange={(value) => onUpdate(list, item.id, { clue: value })} placeholder="Student clue" />
              </div>
              {itemErrors.length > 0 && <p className="mt-2 font-black text-amber-800">{itemErrors.join(' ')}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="text-sm font-black text-slate-700">{label}</span>
      <input className="mt-1 w-full rounded-2xl border-2 border-slate-200 p-3 font-bold" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function PreviewList({ title, items }: { title: string; items: VocabularyItem[] }) {
  return (
    <div className="mt-4">
      <p className="font-black text-cyan-800">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => <span key={item.id} className="rounded-full bg-cyan-100 px-3 py-2 font-black text-cyan-950">{item.word || 'NEW WORD'}</span>)}
      </div>
    </div>
  );
}

function validateSet(set: VocabularySet) {
  const errors: string[] = [];
  if (!set.title.trim()) errors.push('Set title cannot be empty.');
  errors.push(...validateList('Zigzag', set.zigzagItems));
  errors.push(...validateList('Crossword', set.crosswordItems));
  return errors;
}

function validateList(label: string, items: VocabularyItem[]) {
  const errors: string[] = [];
  if (!items.length) errors.push(`${label}: Add at least one vocabulary word.`);
  const duplicates = items.map((item) => item.word).filter((word, index, words) => word && words.indexOf(word) !== index);
  if (duplicates.length) errors.push(`${label}: Each word should be unique.`);
  items.forEach((item, index) => validateItem(item).forEach((error) => errors.push(`${label} word ${index + 1}: ${error}`)));
  return errors;
}

function validateItem(item: VocabularyItem) {
  const errors: string[] = [];
  if (!item.word.trim()) errors.push('Word cannot be empty.');
  if (item.word && !/^[A-Z]+$/.test(item.word)) errors.push('Word should use letters only.');
  if (!item.definition.trim()) errors.push('Definition cannot be empty.');
  if (!item.clue.trim()) errors.push('Clue cannot be empty.');
  return errors;
}
