import { useMemo, useState } from 'react';
import { defaultVocabularySet } from '../data/defaultVocabulary';
import type { VocabularyItem, VocabularySet } from '../types/vocabulary';
import { clearProgress, makeItemId, normalizeVocabularySet, normalizeWord, saveVocabularySet } from '../utils/localStorage';

type TeacherSetupProps = {
  vocabularySet: VocabularySet;
  onVocabularyChange: (set: VocabularySet) => void;
  onProgressReset: () => void;
};

export function TeacherSetupPage({ vocabularySet, onVocabularyChange, onProgressReset }: TeacherSetupProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [draft, setDraft] = useState<VocabularySet>(vocabularySet);
  const [message, setMessage] = useState('Enter the teacher passcode to edit the vocabulary challenge.');
  const [jsonText, setJsonText] = useState('');
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

  const updateItem = (id: string, patch: Partial<VocabularyItem>) => {
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => item.id === id ? { ...item, ...patch, word: patch.word !== undefined ? normalizeWord(patch.word) : item.word } : item),
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
    onProgressReset();
    setMessage('Saved! Students will now play with this vocabulary set.');
  };

  const resetSample = () => {
    setDraft(defaultVocabularySet);
    saveVocabularySet(defaultVocabularySet);
    clearProgress();
    onVocabularyChange(defaultVocabularySet);
    onProgressReset();
    setMessage('Reset to the default Water Cycle Words set.');
  };

  const clearAll = () => {
    clearProgress();
    const emptySet = { title: 'My Vocabulary Words', updatedAt: Date.now(), items: [] };
    saveVocabularySet(emptySet);
    setDraft(emptySet);
    onVocabularyChange(emptySet);
    onProgressReset();
    setMessage('All saved vocabulary and student progress were cleared.');
  };

  const exportJson = async () => {
    const text = JSON.stringify(draft, null, 2);
    setJsonText(text);
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Export JSON is ready and copied to the clipboard.');
    } catch {
      setMessage('Export JSON is ready below.');
    }
  };

  const importJson = () => {
    try {
      const next = normalizeVocabularySet(JSON.parse(jsonText));
      setDraft(next);
      setMessage('Imported JSON. Review it, then click Save Vocabulary Set.');
    } catch {
      setMessage('Import did not work. Please paste valid JSON.');
    }
  };

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-4xl font-black">Teacher Setup</h2>
            <p className="mt-2 font-bold text-slate-700">Create words, definitions, and crossword clues. Words are converted to uppercase automatically.</p>
          </div>
          <button className="game-button" onClick={save}>💾 Save Vocabulary Set</button>
        </div>

        <label className="mt-6 block">
          <span className="text-sm font-black uppercase tracking-wide text-cyan-700">Vocabulary Set Title</span>
          <input className="mt-2 w-full rounded-2xl border-4 border-cyan-200 p-4 text-2xl font-black" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
        </label>

        <div className="mt-6 grid gap-4">
          {draft.items.map((item, index) => {
            const itemErrors = validateItem(item);
            return (
              <div key={item.id} className={`rounded-3xl border-4 bg-white p-4 shadow ${itemErrors.length ? 'border-amber-300' : 'border-cyan-100'}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-black">Word {index + 1}</h3>
                  <button className="secondary-button border-rose-400 text-rose-700 hover:bg-rose-50" onClick={() => setDraft((current) => ({ ...current, items: current.items.filter((next) => next.id !== item.id) }))}>Delete</button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Field label="Word" value={item.word} onChange={(value) => updateItem(item.id, { word: value })} placeholder="WATER" />
                  <Field label="Definition" value={item.definition} onChange={(value) => updateItem(item.id, { definition: value })} placeholder="Simple meaning" />
                  <Field label="Crossword Clue" value={item.clue} onChange={(value) => updateItem(item.id, { clue: value })} placeholder="Student clue" />
                </div>
                {itemErrors.length > 0 && <p className="mt-2 font-black text-amber-800">{itemErrors.join(' ')}</p>}
              </div>
            );
          })}
        </div>

        <button className="secondary-button mt-5" onClick={() => setDraft((current) => ({ ...current, items: [...current.items, { id: makeItemId('word'), word: '', definition: '', clue: '' }] }))}>➕ Add Vocabulary Word</button>
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
            <button className="secondary-button" onClick={exportJson}>Export JSON</button>
            <button className="game-button" onClick={importJson}>Import JSON</button>
          </div>
          <textarea className="mt-3 min-h-40 w-full rounded-2xl border-4 border-cyan-100 p-3 font-mono text-sm" value={jsonText} onChange={(event) => setJsonText(event.target.value)} placeholder="Export appears here. Paste JSON here to import." />
        </section>

        <section className="panel">
          <h3 className="text-2xl font-black">Preview</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.items.map((item) => <span key={item.id} className="rounded-full bg-cyan-100 px-3 py-2 font-black text-cyan-950">{item.word || 'NEW WORD'}</span>)}
          </div>
        </section>
      </aside>
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

function validateSet(set: VocabularySet) {
  const errors: string[] = [];
  if (!set.title.trim()) errors.push('Set title cannot be empty.');
  if (!set.items.length) errors.push('Add at least one vocabulary word.');
  const duplicates = set.items.map((item) => item.word).filter((word, index, words) => word && words.indexOf(word) !== index);
  if (duplicates.length) errors.push('Each word should be unique.');
  set.items.forEach((item, index) => validateItem(item).forEach((error) => errors.push(`Word ${index + 1}: ${error}`)));
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
