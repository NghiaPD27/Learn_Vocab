export interface VocabWord {
  id: string;
  word: string;
  vietnamese: string;
  definition: string;
  partOfSpeech: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'idiom' | 'conjunction' | 'preposition';
  example: string;
  exampleTranslation: string;
  category: string;
}

export type ActiveView = 'dashboard' | 'flashcards' | 'multiple-choice' | 'spelling' | 'match' | 'dictionary';

export interface UserProgress {
  mastered: string[]; // List of word IDs marked as mastered
  learning: string[];  // List of word IDs marked as learning
  quizHighScores: {
    'multiple-choice': number;
    'spelling': number;
    'match': number;
  };
}

export interface QuizConfig {
  categories: string[];
  wordCount: number;
  questionDirection: 'en-to-vn' | 'vn-to-en';
}
