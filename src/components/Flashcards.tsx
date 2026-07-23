import React, { useState, useEffect } from 'react';
import type { UserProgress, VocabWord } from '../types';
import { getCategories, vocabData } from '../data/vocabData';

interface FlashcardsProps {
  progress: UserProgress;
  updateProgress: (newProgress: UserProgress) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  progress,
  updateProgress,
  selectedCategory,
  setSelectedCategory,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'unstarted' | 'learning' | 'mastered'>('all');
  const [words, setWords] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter and populate words
  useEffect(() => {
    let filtered = [...vocabData];
    if (selectedCategory) {
      filtered = filtered.filter(w => w.category === selectedCategory);
    }
    
    if (filterType === 'unstarted') {
      filtered = filtered.filter(w => !progress.mastered.includes(w.id) && !progress.learning.includes(w.id));
    } else if (filterType === 'learning') {
      filtered = filtered.filter(w => progress.learning.includes(w.id));
    } else if (filterType === 'mastered') {
      filtered = filtered.filter(w => progress.mastered.includes(w.id));
    }
    
    setWords(filtered);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [selectedCategory, filterType, progress]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (words.length === 0) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.code === 'ArrowRight') {
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [words, currentIndex]);

  const handleNext = () => {
    if (words.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % words.length);
    }, 150);
  };

  const handlePrev = () => {
    if (words.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + words.length) % words.length);
    }, 150);
  };

  const handleShuffle = () => {
    if (words.length === 0) return;
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const speakWord = (wordText: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop card flip
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const setStatus = (status: 'learning' | 'mastered' | 'none', e: React.MouseEvent) => {
    e.stopPropagation();
    if (words.length === 0) return;
    const currentWord = words[currentIndex];
    
    let newMastered = [...progress.mastered];
    let newLearning = [...progress.learning];
    
    // Remove from all first
    newMastered = newMastered.filter(id => id !== currentWord.id);
    newLearning = newLearning.filter(id => id !== currentWord.id);
    
    if (status === 'mastered') {
      newMastered.push(currentWord.id);
    } else if (status === 'learning') {
      newLearning.push(currentWord.id);
    }
    
    updateProgress({
      ...progress,
      mastered: newMastered,
      learning: newLearning,
    });
  };

  const currentWord = words[currentIndex];
  const categories = getCategories();

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flexGrow: 1 }}>
      {/* Header View */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Flashcards 🃏</h1>
        <p style={{ color: 'var(--text-muted)' }}>Lật thẻ để xem định nghĩa, phát âm và ví dụ thực tế.</p>
      </div>

      {/* Filters and Controls Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1.25rem', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Category Filter */}
          <select 
            value={selectedCategory || ''} 
            onChange={(e) => setSelectedCategory(e.target.value ? e.target.value : null)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--panel-border)',
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontWeight: 500
            }}
          >
            <option value="">Tất cả chủ đề</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <div style={{ display: 'flex', border: '1px solid var(--panel-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            {(['all', 'unstarted', 'learning', 'mastered'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: filterType === type ? 'var(--color-primary)' : 'transparent',
                  color: filterType === type ? '#fff' : 'var(--text-muted)'
                }}
              >
                {type === 'all' && 'Tất cả'}
                {type === 'unstarted' && 'Chưa học'}
                {type === 'learning' && 'Đang học'}
                {type === 'mastered' && 'Thành thạo'}
              </button>
            ))}
          </div>
        </div>

        {/* Reset / Shuffle */}
        <button 
          onClick={handleShuffle}
          disabled={words.length <= 1}
          style={{
            padding: '0.6rem 1.2rem',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--panel-border)',
            color: 'var(--text-primary)',
            fontWeight: 500,
            opacity: words.length <= 1 ? 0.5 : 1
          }}
        >
          🔀 Xáo trộn
        </button>
      </div>

      {/* Main Flashcard Interface */}
      {words.length > 0 ? (
        <div className="flashcard-container">
          {/* Card Counter */}
          <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>
            Thẻ {currentIndex + 1} / {words.length}
          </div>

          {/* Flippable Card wrapper */}
          <div className="flashcard-wrapper" onClick={() => setIsFlipped(prev => !prev)}>
            <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
              {/* Front Face */}
              <div className="flashcard-face flashcard-front">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--text-secondary)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                    {currentWord.category}
                  </span>
                  
                  {/* Status Indicator Badge */}
                  {progress.mastered.includes(currentWord.id) ? (
                    <span style={{ color: 'var(--color-success)', fontWeight: 'bold', fontSize: '0.85rem' }}>✓ Thành thạo</span>
                  ) : progress.learning.includes(currentWord.id) ? (
                    <span style={{ color: 'var(--color-secondary)', fontWeight: 'bold', fontSize: '0.85rem' }}>📖 Đang học</span>
                  ) : null}
                </div>

                <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', fontFamily: 'var(--font-display)', wordBreak: 'break-word' }}>
                    {currentWord.word}
                  </h2>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', fontWeight: 500 }}>
                    ({currentWord.partOfSpeech})
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={(e) => speakWord(currentWord.word, e)} 
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: 'var(--color-primary)',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.9rem'
                    }}
                  >
                    {isSpeaking ? '🔊 Đang đọc...' : '🔊 Phát âm'}
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Nhấn vào thẻ để lật 🔁</span>
                </div>
              </div>

              {/* Back Face */}
              <div className="flashcard-face flashcard-back">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-secondary)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                    Định nghĩa & Bản dịch
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lật lại 🔁</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '4px', margin: '1rem 0' }}>
                  <div>
                    <h3 style={{ fontSize: '1.35rem', color: 'var(--color-success)', fontWeight: 700, marginBottom: '0.25rem' }}>
                      {currentWord.vietnamese}
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                      {currentWord.definition}
                    </p>
                  </div>

                  <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Ví dụ sử dụng</div>
                    <p style={{ fontSize: '0.9rem', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '0.25rem' }}>
                      "{currentWord.example}"
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      → {currentWord.exampleTranslation}
                    </p>
                  </div>
                </div>

                {/* Card footer actions */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', width: '100%' }}>
                  <button 
                    onClick={(e) => setStatus('learning', e)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: progress.learning.includes(currentWord.id) ? 'var(--color-secondary)' : 'transparent',
                      color: progress.learning.includes(currentWord.id) ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    📖 Đang học
                  </button>
                  
                  <button 
                    onClick={(e) => setStatus('mastered', e)}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: progress.mastered.includes(currentWord.id) ? 'var(--color-success)' : 'transparent',
                      color: progress.mastered.includes(currentWord.id) ? '#fff' : 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    ✓ Thành thạo
                  </button>

                  <button 
                    onClick={(e) => setStatus('none', e)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <button 
              onClick={handlePrev}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--panel-border)',
                color: 'var(--text-primary)',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ←
            </button>
            
            <button 
              onClick={handleNext}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--panel-border)',
                color: 'var(--text-primary)',
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              →
            </button>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <span>⌨️ Phím tắt:</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>Space</kbd> Lật thẻ</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>←</kbd> / <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>→</kbd> Di chuyển</span>
          </div>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
          <h3>Không tìm thấy từ nào phù hợp với bộ lọc</h3>
          <p style={{ marginTop: '0.5rem' }}>Hãy đổi sang bộ lọc "Tất cả" hoặc chọn chủ đề khác.</p>
        </div>
      )}
    </div>
  );
};
