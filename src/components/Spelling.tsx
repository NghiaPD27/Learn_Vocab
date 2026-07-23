import React, { useState, useEffect, useRef } from 'react';
import type { UserProgress, VocabWord } from '../types';
import { getCategories, vocabData } from '../data/vocabData';

interface SpellingProps {
  progress: UserProgress;
  updateProgress: (newProgress: UserProgress) => void;
}

export const Spelling: React.FC<SpellingProps> = ({
  progress,
  updateProgress,
}) => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'results'>('setup');
  const [categories, setCategories] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [direction, setDirection] = useState<'vn-to-en' | 'en-to-vn'>('vn-to-en');
  
  const [questions, setQuestions] = useState<VocabWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>('');
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  
  // Hint system
  const [revealedChars, setRevealedChars] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [answersLog, setAnswersLog] = useState<{ word: VocabWord; userInput: string; hintsUsed: number; isCorrect: boolean }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const allCategories = getCategories();

  useEffect(() => {
    if (gameState === 'playing' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [gameState, currentIndex, isAnswered]);

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const startSpelling = () => {
    let pool = [...vocabData];
    if (categories.length > 0) {
      pool = pool.filter(w => categories.includes(w.category));
    }

    if (pool.length < 1) {
      alert("Vui lòng chọn ít nhất một chủ đề có chứa từ vựng.");
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(numQuestions, pool.length));

    setQuestions(chosen);
    setCurrentIndex(0);
    setUserInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setRevealedChars(0);
    setScore(0);
    setAnswersLog([]);
    setGameState('playing');
  };

  // Accent removal helper for Vietnamese matching
  const removeAccents = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const cleanString = (str: string) => {
    return str.trim().toLowerCase().replace(/’/g, "'").replace(/–/g, '-');
  };

  // Compare Vietnamese answers robustly
  const checkVietnameseAnswer = (user: string, target: string) => {
    const userClean = cleanString(user);
    const userNoAccent = removeAccents(userClean);
    
    // Split correct answer by commas or slashes
    const parts = target.split(/[,\/;]/);
    
    return parts.some(part => {
      // Remove parentheses contents (e.g. "miễn, từ bỏ (phí, quyền lợi)" -> "miễn, từ bỏ")
      let cleanPart = part.replace(/\(.*?\)/g, '').trim().toLowerCase();
      cleanPart = cleanString(cleanPart);
      const cleanPartNoAccent = removeAccents(cleanPart);
      
      // Match with accent or without accent
      if (userClean === cleanPart || userNoAccent === cleanPartNoAccent) return true;
      
      // Also allow matching if the user wrote a significant substring
      if (userNoAccent.length >= 3 && cleanPartNoAccent.includes(userNoAccent)) return true;
      if (cleanPartNoAccent.length >= 3 && userNoAccent.includes(cleanPartNoAccent)) return true;
      
      return false;
    });
  };

  const checkAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered) return;

    const currentWord = questions[currentIndex];
    let correct = false;

    if (direction === 'vn-to-en') {
      const userClean = cleanString(userInput);
      const targetClean = cleanString(currentWord.word);
      correct = userClean === targetClean;
    } else {
      // English to Vietnamese
      correct = checkVietnameseAnswer(userInput, currentWord.vietnamese);
    }

    setIsCorrect(correct);
    setIsAnswered(true);

    if (correct) {
      const pointsEarned = Math.max(2, 10 - revealedChars);
      setScore(prev => prev + pointsEarned);
    }

    setAnswersLog(prev => [
      ...prev,
      {
        word: currentWord,
        userInput,
        hintsUsed: revealedChars,
        isCorrect: correct
      }
    ]);
  };

  const showHint = () => {
    const currentWord = questions[currentIndex];
    const targetText = direction === 'vn-to-en' ? currentWord.word : currentWord.vietnamese;
    
    if (revealedChars < targetText.length) {
      const nextCharCount = revealedChars + 1;
      setRevealedChars(nextCharCount);
      setUserInput(targetText.slice(0, nextCharCount));
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setIsAnswered(false);
      setIsCorrect(false);
      setRevealedChars(0);
    } else {
      const finalScore = score;
      let newHighScores = { ...progress.quizHighScores };
      
      if (finalScore > progress.quizHighScores['spelling']) {
        newHighScores['spelling'] = finalScore;
      }
      
      updateProgress({
        ...progress,
        quizHighScores: newHighScores
      });
      
      setGameState('results');
    }
  };

  const speakWord = () => {
    const currentWord = questions[currentIndex];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentWord.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '750px', margin: '0 auto', width: '100%' }}>
      {/* 1. SETUP SCREEN */}
      {gameState === 'setup' && (
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Chính tả & Luyện viết ✍️</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Thử thách khả năng ghi nhớ cách viết của từ vựng theo cả hai chiều Anh-Việt.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Direction selection */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Chọn hướng dịch</h3>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setDirection('vn-to-en')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--panel-border)',
                    background: direction === 'vn-to-en' ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                    color: direction === 'vn-to-en' ? '#fff' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🇬🇧</span>
                  <span>Ghi từ Tiếng Anh</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: direction === 'vn-to-en' ? '#eef' : 'var(--text-muted)' }}>Cho nghĩa Tiếng Việt</span>
                </button>
                
                <button
                  onClick={() => setDirection('en-to-vn')}
                  style={{
                    flex: 1,
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--panel-border)',
                    background: direction === 'en-to-vn' ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                    color: direction === 'en-to-vn' ? '#fff' : 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>🇻🇳</span>
                  <span>Ghi nghĩa Tiếng Việt</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: direction === 'en-to-vn' ? '#eef' : 'var(--text-muted)' }}>Cho từ Tiếng Anh</span>
                </button>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Chọn chủ đề học tập</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {allCategories.map(cat => (
                  <label 
                    key={cat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: categories.includes(cat) ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={categories.includes(cat)}
                      onChange={() => toggleCategory(cat)}
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setCategories(allCategories)}
                  style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}
                >
                  Chọn tất cả
                </button>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <button 
                  onClick={() => setCategories([])}
                  style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>

            {/* Questions count selection */}
            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Số lượng câu hỏi</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[10, 15, 20, 30].map(count => (
                  <button
                    key={count}
                    onClick={() => setNumQuestions(count)}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: numQuestions === count ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                      color: numQuestions === count ? '#fff' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    {count} câu
                  </button>
                ))}
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startSpelling}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                marginTop: '1.5rem'
              }}
            >
              Bắt đầu viết 🏁
            </button>
          </div>
        </div>
      )}

      {/* 2. PLAYING SCREEN */}
      {gameState === 'playing' && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Progress Bar */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Câu {currentIndex + 1} / {questions.length}</span>
              <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '3px' }}></div>
              </div>
            </div>
            
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Điểm: <strong style={{ color: 'var(--color-secondary)', fontSize: '1.1rem' }}>{score}</strong>
            </div>
          </div>

          {/* Prompt card */}
          <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '280px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--text-secondary)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                {questions[currentIndex].category}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                ({questions[currentIndex].partOfSpeech})
              </span>
            </div>

            {/* Prompt details depending on Direction */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {direction === 'vn-to-en' ? (
                <>
                  <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                    {questions[currentIndex].vietnamese}
                  </h2>
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    <strong>Định nghĩa:</strong> {questions[currentIndex].definition}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', wordBreak: 'break-word' }}>
                      {questions[currentIndex].word}
                    </h2>
                    <button
                      type="button"
                      onClick={speakWord}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: 'var(--color-primary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      🔊 Nghe phát âm
                    </button>
                  </div>
                  <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.4, marginTop: '0.5rem' }}>
                    <strong>Định nghĩa:</strong> {questions[currentIndex].definition}
                  </p>
                </>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={checkAnswer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={direction === 'vn-to-en' ? "Gõ từ vựng tiếng Anh..." : "Gõ nghĩa tiếng Việt..."}
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  disabled={isAnswered}
                  style={{
                    flexGrow: 1,
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid var(--panel-border)',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#fff',
                    fontSize: '1.1rem',
                    outline: 'none',
                    fontWeight: 500,
                    letterSpacing: '0.02em'
                  }}
                />
                
                {direction === 'vn-to-en' && (
                  <button
                    type="button"
                    onClick={speakWord}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--text-primary)',
                      fontSize: '1.25rem'
                    }}
                    title="Phát âm từ vựng"
                  >
                    🔊
                  </button>
                )}
              </div>

              {/* Action buttons during editing */}
              {!isAnswered && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      padding: '0.8rem',
                      borderRadius: '8px',
                      background: 'var(--color-primary)',
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: '0.95rem'
                    }}
                  >
                    Kiểm tra (Enter) ✓
                  </button>
                  
                  <button
                    type="button"
                    onClick={showHint}
                    disabled={revealedChars >= (direction === 'vn-to-en' ? questions[currentIndex].word.length : questions[currentIndex].vietnamese.length)}
                    style={{
                      flex: 1,
                      padding: '0.8rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--panel-border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      opacity: revealedChars >= (direction === 'vn-to-en' ? questions[currentIndex].word.length : questions[currentIndex].vietnamese.length) ? 0.5 : 1
                    }}
                  >
                    💡 Gợi ý ({revealedChars}/{direction === 'vn-to-en' ? questions[currentIndex].word.length : questions[currentIndex].vietnamese.length})
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setUserInput(direction === 'vn-to-en' ? questions[currentIndex].word : questions[currentIndex].vietnamese);
                      setIsAnswered(true);
                      setIsCorrect(false);
                      setAnswersLog(prev => [
                        ...prev,
                        { word: questions[currentIndex], userInput: '[BỎ QUA]', hintsUsed: 0, isCorrect: false }
                      ]);
                    }}
                    style={{
                      padding: '0.8rem 1rem',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'var(--color-danger)',
                      fontSize: '0.9rem',
                      fontWeight: 500
                    }}
                  >
                    Bỏ qua 🏳️
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Feedback Card after submitting */}
          {isAnswered && (
            <div className="glass-panel animate-slide-up" style={{ padding: '1.5rem', borderLeft: `4px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {isCorrect ? 'Tuyệt vời! Trả lời đúng rồi! 🎉' : 'Đáp án chính xác là:'}
                  </h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div>
                      Từ tiếng Anh: <strong style={{ fontSize: '1.15rem', color: 'var(--color-secondary)' }}>{questions[currentIndex].word}</strong>
                    </div>
                    <div>
                      Nghĩa tiếng Việt: <strong style={{ fontSize: '1.15rem', color: 'var(--color-success)' }}>{questions[currentIndex].vietnamese}</strong>
                    </div>
                  </div>
                  
                  {!isCorrect && (
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                      Bạn đã viết: <span style={{ textDecoration: 'line-through', color: 'var(--color-danger)' }}>{userInput || '[Trống]'}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  style={{
                    padding: '0.6rem 1.5rem',
                    borderRadius: '8px',
                    background: 'var(--color-primary)',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.95rem'
                  }}
                >
                  {currentIndex === questions.length - 1 ? 'Xem kết quả 🏁' : 'Câu tiếp theo (Enter) →'}
                </button>
              </div>

              {/* Example sentence */}
              <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div><strong>Ví dụ sử dụng:</strong></div>
                <div style={{ fontStyle: 'italic' }}>"{questions[currentIndex].example}"</div>
                <div style={{ color: 'var(--text-secondary)' }}>→ {questions[currentIndex].exampleTranslation}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. RESULTS SCREEN */}
      {gameState === 'results' && (
        <div className="glass-panel animate-slide-up" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🏆</div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Kết quả luyện viết</h1>
            <p style={{ color: 'var(--text-muted)' }}>Bạn đã hoàn thành phần kiểm tra.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Điểm số</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{score}</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Độ chính xác</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>
                {Math.round((answersLog.filter(a => a.isCorrect).length / questions.length) * 100)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {answersLog.filter(a => a.isCorrect).length} / {questions.length} từ
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Điểm cao nhất</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning)' }}>
                {progress.quizHighScores['spelling']}
              </div>
            </div>
          </div>

          {/* Detailed breakdown */}
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Xem lại chi tiết</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
              {answersLog.map((log, idx) => (
                <div 
                  key={idx} 
                  className="glass-panel" 
                  style={{ 
                    padding: '1rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    gap: '1rem',
                    borderLeft: `3px solid ${log.isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}` 
                  }}
                >
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ color: 'var(--color-secondary)' }}>{log.word.word}</span>
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                      <span style={{ color: 'var(--color-success)' }}>{log.word.vietnamese}</span>
                      <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>({log.word.partOfSpeech})</span>
                    </div>
                    {!log.isCorrect && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-danger)', marginTop: '0.25rem' }}>
                        Bạn viết: {log.userInput || '[Trống]'}
                      </div>
                    )}
                    {log.hintsUsed > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)' }}>
                        💡 Sử dụng {log.hintsUsed} gợi ý
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '1.25rem' }}>
                    {log.isCorrect ? '✅' : '❌'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setGameState('setup')}
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
              Luyện tiếp 🔄
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
              Cấu hình khác ⚙️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
