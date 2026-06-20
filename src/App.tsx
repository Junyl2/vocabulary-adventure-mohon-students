import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { TeacherSetupPage } from './pages/TeacherSetupPage';
import { CrosswordPuzzlePage } from './pages/CrosswordPuzzlePage';
import { ZigzagPuzzlePage } from './pages/ZigzagPuzzlePage';
import type { Page, StudentProgress, VocabularySet } from './types/vocabulary';
import { emptyProgress, loadProgress, loadVocabularySet, saveProgress } from './utils/localStorage';

function App() {
  const [page, setPage] = useState<Page>('home');
  const [vocabularySet, setVocabularySet] = useState<VocabularySet>(() => loadVocabularySet());
  const [progress, setProgress] = useState<StudentProgress>(() => loadProgress(loadVocabularySet()));

  useEffect(() => {
    setProgress((current) => (current.setKey ? loadProgress(vocabularySet) : emptyProgress(vocabularySet)));
  }, [vocabularySet]);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const updateProgress = (updater: (progress: StudentProgress) => StudentProgress) => {
    setProgress((current) => updater(current));
  };

  const resetProgressForSet = () => setProgress(emptyProgress(vocabularySet));

  return (
    <Layout page={page} setPage={setPage} vocabularySet={vocabularySet} progress={progress}>
      {page === 'home' && <HomePage setPage={setPage} vocabularySet={vocabularySet} progress={progress} />}
      {page === 'teacher' && (
        <TeacherSetupPage
          vocabularySet={vocabularySet}
          onVocabularyChange={(next) => {
            setVocabularySet(next);
            setPage('home');
          }}
          onProgressReset={resetProgressForSet}
        />
      )}
      {page === 'zigzag' && <ZigzagPuzzlePage vocabularySet={vocabularySet} progress={progress} updateProgress={updateProgress} setPage={setPage} />}
      {page === 'crossword' && <CrosswordPuzzlePage vocabularySet={vocabularySet} progress={progress} updateProgress={updateProgress} setPage={setPage} />}
    </Layout>
  );
}

export default App;
