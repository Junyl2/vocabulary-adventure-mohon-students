export type VocabularyItem = {
  id: string;
  word: string;
  definition: string;
  clue: string;
};

export type VocabularySet = {
  title: string;
  items: VocabularyItem[];
  updatedAt: number;
};

export type StudentProgress = {
  setKey: string;
  zigzagFoundWords: string[];
  crosswordAnswers: Record<string, string>;
  crosswordCompleteWords: string[];
};

export type Page = 'home' | 'teacher' | 'zigzag' | 'crossword';
