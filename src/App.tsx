import { useState, useEffect } from 'react';
import './App.css';
import type { ActiveView, UserProgress } from './types';
import { Dashboard } from './components/Dashboard';
import { Flashcards } from './components/Flashcards';
import { MultipleChoice } from './components/MultipleChoice';
import { Spelling } from './components/Spelling';
import { MatchingGame } from './components/MatchingGame';
import { WordList } from './components/WordList';
import { vocabData } from './data/vocabData';

const DEFAULT_PROGRESS: UserProgress = {
  mastered: [],
  learning: [],
  quizHighScores: {
    'multiple-choice': 0,
    'spelling': 0,
    'match': 0,
  }
};

function App() {
  const [view, setView] = useState<ActiveView>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);

  // Load progress and theme from LocalStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('vocab_app_progress');
    if (savedProgress) {
      try {
        setProgress(JSON.parse(savedProgress));
      } catch (e) {
        console.error("Error parsing progress from localStorage:", e);
      }
    }

    const savedTheme = localStorage.getItem('vocab_app_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const updateProgress = (newProgress: UserProgress) => {
    setProgress(newProgress);
    localStorage.setItem('vocab_app_progress', JSON.stringify(newProgress));
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('vocab_app_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Close sidebar on navigate (mostly for mobile layout)
  const navigateTo = (newView: ActiveView) => {
    setView(newView);
    setIsSidebarOpen(false);
  };

  const totalWords = vocabData.length;
  const masteredCount = progress.mastered.length;
  const masteredPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  return (
    <div className="app-container">
      {/* Mobile Top Bar */}
      <div className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}
          >
            ☰
          </button>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>VocabQuiz</span>
        </div>
        <button 
          onClick={toggleTheme} 
          style={{ fontSize: '1.25rem' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div>
          {/* Brand */}
          <div className="brand-section">
            <div className="brand-logo-icon">V</div>
            <h1 className="brand-name">VocabQuiz</h1>
          </div>

          {/* Nav items */}
          <nav className="nav-menu">
            <button 
              onClick={() => navigateTo('dashboard')} 
              className={`nav-item ${view === 'dashboard' ? 'active' : ''}`}
            >
              <span>📊</span> Dashboard
            </button>
            <button 
              onClick={() => navigateTo('flashcards')} 
              className={`nav-item ${view === 'flashcards' ? 'active' : ''}`}
            >
              <span>🃏</span> Flashcards
            </button>
            <button 
              onClick={() => navigateTo('multiple-choice')} 
              className={`nav-item ${view === 'multiple-choice' ? 'active' : ''}`}
            >
              <span>⚡</span> Multiple Choice
            </button>
            <button 
              onClick={() => navigateTo('spelling')} 
              className={`nav-item ${view === 'spelling' ? 'active' : ''}`}
            >
              <span>✍️</span> Spelling Test
            </button>
            <button 
              onClick={() => navigateTo('match')} 
              className={`nav-item ${view === 'match' ? 'active' : ''}`}
            >
              <span>🧩</span> Matching Game
            </button>
            <button 
              onClick={() => navigateTo('dictionary')} 
              className={`nav-item ${view === 'dictionary' ? 'active' : ''}`}
            >
              <span>📖</span> Tra cứu từ vựng
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* Quick Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
              <span>Tiến độ tổng</span>
              <span>{masteredCount}/{totalWords} từ</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${masteredPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: '3px' }}></div>
            </div>
          </div>

          {/* Theme switcher */}
          <button onClick={toggleTheme} className="theme-toggle-btn">
            {theme === 'dark' ? (
              <><span>☀️</span> Chế độ sáng</>
            ) : (
              <><span>🌙</span> Chế độ tối</>
            )}
          </button>
        </div>
      </div>

      {/* Backdrop overlay for mobile menu */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 5,
            backdropFilter: 'blur(4px)'
          }}
        ></div>
      )}

      {/* Main Viewport */}
      <main className="main-viewport">
        {view === 'dashboard' && (
          <Dashboard 
            progress={progress} 
            setView={setView} 
            setSelectedCategory={setSelectedCategory}
          />
        )}
        
        {view === 'flashcards' && (
          <Flashcards 
            progress={progress} 
            updateProgress={updateProgress}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          />
        )}
        
        {view === 'multiple-choice' && (
          <MultipleChoice 
            progress={progress} 
            updateProgress={updateProgress}
          />
        )}
        
        {view === 'spelling' && (
          <Spelling 
            progress={progress} 
            updateProgress={updateProgress}
          />
        )}
        
        {view === 'match' && (
          <MatchingGame 
            progress={progress} 
            updateProgress={updateProgress}
          />
        )}
        
        {view === 'dictionary' && (
          <WordList 
            progress={progress} 
            updateProgress={updateProgress}
          />
        )}
      </main>
    </div>
  );
}

export default App;
