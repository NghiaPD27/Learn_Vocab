import React, { useState, useEffect, useRef } from 'react';
import type { UserProgress } from '../types';
import { getCategories, vocabData } from '../data/vocabData';

interface MatchingGameProps {
  progress: UserProgress;
  updateProgress: (newProgress: UserProgress) => void;
}

interface MatchCard {
  id: string; // word ID + type
  wordId: string; // links the matching pairs
  text: string;
  type: 'en' | 'vn';
  isMatched: boolean;
}

export const MatchingGame: React.FC<MatchingGameProps> = ({
  progress,
  updateProgress,
}) => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'results'>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [wrongMatchIds, setWrongMatchIds] = useState<string[]>([]);
  
  // Timer & High Score
  const [timer, setTimer] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [bestTime, setBestTime] = useState<number>(progress.quizHighScores['match']);
  
  const timerRef = useRef<any>(null);
  const allCategories = getCategories();

  // Timer effect
  useEffect(() => {
    if (isTimerActive) {
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setTimer(Math.round((Date.now() - startTime) / 100) / 10);
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerActive]);

  const initGame = () => {
    let pool = [...vocabData];
    if (selectedCategory) {
      pool = pool.filter(w => w.category === selectedCategory);
    }

    if (pool.length < 5) {
      alert("Vui lòng chọn chủ đề khác (cần ít nhất 5 từ để chơi game).");
      return;
    }

    // Select 5 random words
    const chosenWords = [...pool].sort(() => Math.random() - 0.5).slice(0, 5);

    // Create cards: 5 English, 5 Vietnamese
    const enCards: MatchCard[] = chosenWords.map(w => ({
      id: `${w.id}-en`,
      wordId: w.id,
      text: w.word,
      type: 'en',
      isMatched: false,
    }));

    const vnCards: MatchCard[] = chosenWords.map(w => ({
      id: `${w.id}-vn`,
      wordId: w.id,
      text: w.vietnamese,
      type: 'vn',
      isMatched: false,
    }));

    // Shuffle cards together
    const combined = [...enCards, ...vnCards].sort(() => Math.random() - 0.5);

    setCards(combined);
    setSelectedCards([]);
    setWrongMatchIds([]);
    setTimer(0);
    setIsTimerActive(true);
    setGameState('playing');
  };

  const handleCardClick = (card: MatchCard) => {
    if (card.isMatched || selectedCards.some(c => c.id === card.id) || wrongMatchIds.length > 0) return;

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      
      if (first.wordId === second.wordId && first.type !== second.type) {
        // Correct match!
        setTimeout(() => {
          setCards(prev => prev.map(c => {
            if (c.wordId === first.wordId) {
              return { ...c, isMatched: true };
            }
            return c;
          }));
          setSelectedCards([]);
        }, 300);
      } else {
        // Wrong match
        setWrongMatchIds([first.id, second.id]);
        setTimeout(() => {
          setSelectedCards([]);
          setWrongMatchIds([]);
        }, 1000);
      }
    }
  };

  // Check win condition
  useEffect(() => {
    if (gameState === 'playing' && cards.length > 0 && cards.every(c => c.isMatched)) {
      setIsTimerActive(false);
      setGameState('results');
      
      // Update high score if better (smaller time is better)
      const currentScoreTime = timer;
      let newHighScores = { ...progress.quizHighScores };
      
      if (bestTime === 0 || currentScoreTime < bestTime) {
        newHighScores['match'] = currentScoreTime;
        setBestTime(currentScoreTime);
        updateProgress({
          ...progress,
          quizHighScores: newHighScores,
        });
      }
    }
  }, [cards, gameState]);

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* 1. SETUP SCREEN */}
      {gameState === 'setup' && (
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>🔗</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Trò chơi Ghép cặp 🧩</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '550px', margin: '0 auto 2rem auto' }}>
            Nhiệm vụ của bạn là ghép đúng các cặp từ tiếng Anh với nghĩa tiếng Việt tương ứng trong thời gian nhanh nhất có thể.
          </p>

          <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
            {/* Category selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Chọn chủ đề</label>
              <select 
                value={selectedCategory || ''} 
                onChange={(e) => setSelectedCategory(e.target.value ? e.target.value : null)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--panel-border)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}
              >
                <option value="">Tất cả chủ đề</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Best Record */}
            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Kỷ lục cá nhân:</span>
              <strong style={{ color: 'var(--color-warning)', fontSize: '1.1rem' }}>
                {bestTime === 0 ? 'Chưa có kỷ lục' : `${bestTime}s`}
              </strong>
            </div>

            <button
              onClick={initGame}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                marginTop: '0.5rem',
                textAlign: 'center'
              }}
            >
              Bắt đầu ghép ⚡
            </button>
          </div>
        </div>
      )}

      {/* 2. PLAYING SCREEN */}
      {gameState === 'playing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header Stats */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              Chủ đề: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{selectedCategory || 'Tất cả'}</span>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                Thời gian: <strong style={{ color: 'var(--color-secondary)', fontSize: '1.25rem', fontFamily: 'monospace' }}>{timer.toFixed(1)}s</strong>
              </div>
              
              <button 
                onClick={() => {
                  setIsTimerActive(false);
                  setGameState('setup');
                }}
                style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 600 }}
              >
                Dừng chơi 🏳️
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="match-grid">
            {cards.map(card => {
              const isSelected = selectedCards.some(c => c.id === card.id);
              const isWrong = wrongMatchIds.includes(card.id);
              
              let cardClass = '';
              if (card.isMatched) cardClass = 'matched';
              else if (isSelected) cardClass = 'selected';
              else if (isWrong) cardClass = 'selected animate-shake';

              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  className={`glass-panel match-card ${cardClass}`}
                  style={{
                    borderWidth: isWrong ? '2px' : '1px',
                    borderColor: isWrong ? 'var(--color-danger)' : undefined,
                    color: isWrong ? 'var(--color-danger)' : undefined,
                    cursor: card.isMatched ? 'default' : 'pointer'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', wordBreak: 'break-word', userSelect: 'none' }}>
                    {card.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hint panel */}
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>
            💡 Nhấp vào một từ tiếng Anh và dịch nghĩa tương ứng của nó để xóa cặp từ đó khỏi bảng!
          </div>
        </div>
      )}

      {/* 3. RESULTS SCREEN */}
      {gameState === 'results' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Hoàn thành xuất sắc!</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Bạn đã ghép đúng tất cả các thẻ từ vựng.</p>

          <div style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Thời gian hoàn thành:</span>
              <strong style={{ fontSize: '1.5rem', color: 'var(--color-success)' }}>{timer} giây</strong>
            </div>

            {timer <= bestTime && bestTime !== 0 && (
              <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--color-warning)', color: 'var(--color-warning)', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                ⭐ Kỷ lục mới thiết lập! ⭐
              </div>
            )}

            <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Kỷ lục tốt nhất:</span>
              <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>{bestTime} giây</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', maxWidth: '400px', margin: '0 auto' }}>
            <button
              onClick={initGame}
              style={{
                flex: 1,
                padding: '0.9rem',
                borderRadius: '10px',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              Chơi lại 🔄
            </button>
            <button
              onClick={() => setGameState('setup')}
              style={{
                flex: 1,
                padding: '0.9rem',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--panel-border)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              Chọn chủ đề khác ⚙️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
