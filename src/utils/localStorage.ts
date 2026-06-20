import { defaultVocabularySet } from '../data/defaultVocabulary';
import type { StudentProgress, VocabularySet } from '../types/vocabulary';

const VOCAB_KEY = 'vocabulary-adventure-custom-set';
const PROGRESS_KEY = 'vocabulary-adventure-student-progress';

export function getVocabularySetKey(set: VocabularySet) {
  const zigzagKey = set.zigzagItems.map((item) => `${item.word}:${item.clue}:${item.definition}`).join('|');
  const crosswordKey = set.crosswordItems.map((item) => `${item.word}:${item.clue}:${item.definition}`).join('|');
  return `${set.title}|zigzag:${zigzagKey}|crossword:${crosswordKey}`;
}

export function emptyProgress(set: VocabularySet): StudentProgress {
  return {
    setKey: getVocabularySetKey(set),
    zigzagFoundWords: [],
    crosswordAnswers: {},
    crosswordCompleteWords: [],
  };
}

export function loadVocabularySet(): VocabularySet {
  try {
    const raw = localStorage.getItem(VOCAB_KEY);
    if (!raw) return defaultVocabularySet;
    return normalizeVocabularySet(JSON.parse(raw));
  } catch {
    return defaultVocabularySet;
  }
}

export function saveVocabularySet(set: VocabularySet) {
  localStorage.setItem(VOCAB_KEY, JSON.stringify({ ...set, updatedAt: Date.now() }));
}

export function clearVocabularySet() {
  localStorage.removeItem(VOCAB_KEY);
}

export function loadProgress(set: VocabularySet): StudentProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return emptyProgress(set);
    const parsed = JSON.parse(raw) as StudentProgress;
    return parsed.setKey === getVocabularySetKey(set) ? parsed : emptyProgress(set);
  } catch {
    return emptyProgress(set);
  }
}

export function saveProgress(progress: StudentProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

export function normalizeWord(word: string) {
  return word.toUpperCase().replace(/[^A-Z]/g, '');
}

export function makeItemId(word: string) {
  return `${normalizeWord(word).toLowerCase()}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

export function normalizeVocabularySet(value: unknown): VocabularySet {
  const maybeSet = value as Partial<VocabularySet> & { items?: unknown };
  const legacyItems = Array.isArray(maybeSet.items) ? maybeSet.items : undefined;
  const zigzagItems = normalizeItems(Array.isArray(maybeSet.zigzagItems) ? maybeSet.zigzagItems : legacyItems ?? defaultVocabularySet.zigzagItems, 'zigzag');
  const crosswordItems = normalizeItems(Array.isArray(maybeSet.crosswordItems) ? maybeSet.crosswordItems : legacyItems ?? defaultVocabularySet.crosswordItems, 'crossword');

  return {
    title: String(maybeSet.title ?? defaultVocabularySet.title).trim() || defaultVocabularySet.title,
    updatedAt: Number(maybeSet.updatedAt ?? Date.now()),
    zigzagItems,
    crosswordItems,
  };
}

function normalizeItems(items: unknown[], prefix: string) {
  return items
    .map((item, index) => {
      const maybeItem = item as { id?: unknown; word?: unknown; definition?: unknown; clue?: unknown };
      const word = normalizeWord(String(maybeItem.word ?? ''));
      return {
        id: String(maybeItem.id ?? `${prefix}-${word.toLowerCase()}-${index}`),
        word,
        definition: String(maybeItem.definition ?? '').trim(),
        clue: String(maybeItem.clue ?? '').trim(),
      };
    })
    .filter((item) => item.word || item.definition || item.clue);
}
