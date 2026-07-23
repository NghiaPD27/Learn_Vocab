import React, { useState } from 'react';
import type { UserProgress, VocabWord } from '../types';
import { getCategories, vocabData } from '../data/vocabData';

interface MultipleChoiceProps {
  progress: UserProgress;
  updateProgress: (newProgress: UserProgress) => void;
}

interface Question {
  word: VocabWord;
  options: string[];
  correctAnswer: string;
}

export const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  progress,
  updateProgress,
}) => {
  // Quiz states
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'results'>('setup');
  const [categories, setCategories] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [direction, setDirection] = useState<'en-to-vn' | 'vn-to-en'>('en-to-vn');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [answersLog, setAnswersLog] = useState<{ question: Question; userChoice: string; isCorrect: boolean }[]>([]);

  const allCategories = getCategories();

  // Handle checking/unchecking categories
  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter(c => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const startQuiz = () => {
    // Filter words by categories
    let pool = [...vocabData];
    if (categories.length > 0) {
      pool = pool.filter(w => categories.includes(w.category));
    }

    if (pool.length < 4) {
      alert("Vui lòng chọn nhiều chủ đề hơn (cần ít nhất 4 từ để tạo quiz).");
      return;
    }

    // Shuffle pool and select questions
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const chosenWords = shuffledPool.slice(0, Math.min(numQuestions, pool.length));

    // Generate questions with distractors
    const generatedQuestions: Question[] = chosenWords.map(word => {
      // Find decoy answers from the overall pool
      const sameCategoryDecoys = pool
        .filter(w => w.id !== word.id && w.category === word.category)
        .sort(() => Math.random() - 0.5);
      
      const generalDecoys = pool
        .filter(w => w.id !== word.id && w.category !== word.category)
        .sort(() => Math.random() - 0.5);
      
      // Combine decoys, prioritizing same category
      const combinedDecoys = [...sameCategoryDecoys, ...generalDecoys];
      const selectedDecoys = combinedDecoys.slice(0, 3);

      const correctAnswer = direction === 'en-to-vn' ? word.vietnamese : word.word;
      const decoyAnswers = selectedDecoys.map(d => direction === 'en-to-vn' ? d.vietnamese : d.word);
      
      // Shuffle correct + decoys
      const options = [correctAnswer, ...decoyAnswers].sort(() => Math.random() - 0.5);

      return {
        word,
        options,
        correctAnswer
      };
    });

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setStreak(0);
    setAnswersLog([]);
    setGameState('playing');
  };

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer !== null) return; // Prevent double answer selection
    
    setSelectedAnswer(option);
    const currentQuestion = questions[currentIndex];
    const correct = option === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setScore(prev => prev + 10 + Math.min(streak, 5) * 2); // Points with streak bonus
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    setAnswersLog(prev => [
      ...prev,
      {
        question: currentQuestion,
        userChoice: option,
        isCorrect: correct
      }
    ]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      // End game, check high score
      const finalScore = score;
      let newHighScores = { ...progress.quizHighScores };
      
      if (finalScore > progress.quizHighScores['multiple-choice']) {
        newHighScores['multiple-choice'] = finalScore;
      }
      
      updateProgress({
        ...progress,
        quizHighScores: newHighScores
      });
      
      setGameState('results');
    }
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* 1. SETUP SCREEN */}
      {gameState === 'setup' && (
        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Cấu hình Quiz ⚡</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Kiểm tra khả năng phản xạ và ghi nhớ từ vựng với các câu hỏi trắc nghiệm.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
                  style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              {/* Question Count */}
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

              {/* Direction selector */}
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Hình thức câu hỏi</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setDirection('en-to-vn')}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: direction === 'en-to-vn' ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                      color: direction === 'en-to-vn' ? '#fff' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    Anh → Việt
                  </button>
                  <button
                    onClick={() => setDirection('vn-to-en')}
                    style={{
                      flex: 1,
                      padding: '0.6rem',
                      borderRadius: '8px',
                      border: '1px solid var(--panel-border)',
                      background: direction === 'vn-to-en' ? 'var(--color-primary)' : 'rgba(255,255,255,0.02)',
                      color: direction === 'vn-to-en' ? '#fff' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    Việt → Anh
                  </button>
                </div>
              </div>
            </div>

            {/* Start button */}
            <button
              onClick={startQuiz}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                marginTop: '1rem'
              }}
            >
              Bắt đầu kiểm tra 🚀
            </button>
          </div>
        </div>
      )}

      {/* 2. PLAYING SCREEN */}
      {gameState === 'playing' && questions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Progress & Score Bar */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Câu {currentIndex + 1} / {questions.length}</span>
              <div style={{ width: '120px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '3px', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Điểm: <strong style={{ color: 'var(--color-secondary)', fontSize: '1.1rem' }}>{score}</strong>
              </div>
              {streak > 1 && (
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  🔥 Chuỗi {streak}
                </div>
              )}
            </div>
          </div>

          {/* Question Card */}
          <div className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', minHeight: '320px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--text-secondary)', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
              {questions[currentIndex].word.category}
            </span>

            {/* The Question Text */}
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '0.5rem', wordBreak: 'break-word' }}>
                {direction === 'en-to-vn' 
                  ? questions[currentIndex].word.word 
                  : questions[currentIndex].word.vietnamese
                }
              </h2>
              {direction === 'en-to-vn' && (
                <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>({questions[currentIndex].word.partOfSpeech})</span>
              )}
            </div>

            {/* Answer Options Grid */}
            <div className="options-grid">
              {questions[currentIndex].options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === questions[currentIndex].correctAnswer;
                
                let optionClass = '';
                if (selectedAnswer !== null) {
                  if (isCorrectOption) optionClass = 'correct';
                  else if (isSelected) optionClass = 'incorrect';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={selectedAnswer !== null}
                    className={`option-btn ${optionClass}`}
                  >
                    <span>{option}</span>
                    {selectedAnswer !== null && isCorrectOption && <span>✓</span>}
                    {selectedAnswer !== null && isSelected && !isCorrectOption && <span>✗</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question feedback / Context explanation (Visible after answering) */}
          {selectedAnswer !== null && (
            <div className="glass-panel animate-slide-up" style={{ padding: '1.5rem', borderLeft: `4px solid ${isCorrect ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h4 style={{ color: isCorrect ? 'var(--color-success)' : 'var(--color-danger)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                    {isCorrect ? 'Chính xác! 🎉' : 'Chưa đúng rồi 😢'}
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <strong>{questions[currentIndex].word.word}</strong> ({questions[currentIndex].word.partOfSpeech}): {questions[currentIndex].word.vietnamese}
                  </p>
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
                  {currentIndex === questions.length - 1 ? 'Xem kết quả 🏁' : 'Câu tiếp theo →'}
                </button>
              </div>

              {/* Definition & Example Sentence */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
                <div><strong>Định nghĩa:</strong> {questions[currentIndex].word.definition}</div>
                <div>
                  <strong>Ví dụ:</strong> <em>"{questions[currentIndex].word.example}"</em>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>→ {questions[currentIndex].word.exampleTranslation}</span>
                </div>
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
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Hoàn thành bài kiểm tra!</h1>
            <p style={{ color: 'var(--text-muted)' }}>Tuyệt vời! Bạn đã kết thúc đợt kiểm tra này.</p>
          </div>

          {/* Results Summary Box */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Điểm số</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-secondary)' }}>{score}</div>
            </div>
            
            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Chính xác</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>
                {Math.round((answersLog.filter(a => a.isCorrect).length / questions.length) * 100)}%
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {answersLog.filter(a => a.isCorrect).length} / {questions.length} câu
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Điểm cao nhất</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning)' }}>
                {progress.quizHighScores['multiple-choice']}
              </div>
            </div>
          </div>

          {/* Detailed Question Review List */}
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
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {log.question.word.word} <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--text-muted)' }}>({log.question.word.partOfSpeech})</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Đáp án đúng: <span style={{ color: 'var(--color-success)' }}>{log.question.correctAnswer}</span>
                    </div>
                    {!log.isCorrect && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Bạn chọn: <span style={{ color: 'var(--color-danger)' }}>{log.userChoice}</span>
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

          {/* Action buttons */}
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
              Chơi lại 🔄
            </button>
            
            <button
              onClick={() => {
                setGameState('setup');
                // Auto focus to dictionary or dashboard
              }}
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
