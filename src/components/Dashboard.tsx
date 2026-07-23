import React from 'react';
import type { UserProgress } from '../types';
import { getCategories, vocabData } from '../data/vocabData';

interface DashboardProps {
  progress: UserProgress;
  setView: (view: any) => void;
  setSelectedCategory: (cat: string | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  progress,
  setView,
  setSelectedCategory,
}) => {
  const totalWords = vocabData.length;
  const masteredCount = progress.mastered.length;
  const learningCount = progress.learning.length;
  const unstartedCount = totalWords - masteredCount - learningCount;
  
  const overallPercentage = totalWords > 0 
    ? Math.round((masteredCount / totalWords) * 100) 
    : 0;

  const categories = getCategories();

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setView('flashcards');
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Header Greeting */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '0.5rem' }}>Xin chào! 👋</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sẵn sàng nâng cao vốn từ vựng của bạn ngày hôm nay chứ?</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🔥</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Mastery Rate</div>
            <div style={{ color: 'var(--color-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>{overallPercentage}% Hoàn thành</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Thống kê tổng quan</h2>
        <div className="dashboard-stats">
          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-primary)' }}>🏆</div>
            <div className="stat-info">
              <div className="stat-value">{masteredCount}</div>
              <div className="stat-label">Đã thành thạo</div>
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-secondary)' }}>📖</div>
            <div className="stat-info">
              <div className="stat-value">{learningCount}</div>
              <div className="stat-label">Đang học</div>
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-icon" style={{ background: 'rgba(109, 91, 151, 0.15)', color: 'var(--text-muted)' }}>⏳</div>
            <div className="stat-info">
              <div className="stat-value">{unstartedCount}</div>
              <div className="stat-label">Chưa học</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Categories & High Scores */}
      <div className="dashboard-grid">
        {/* Left Side: Categories */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Học theo chủ đề</h2>
          <div className="category-list">
            {categories.map((category) => {
              const catWords = vocabData.filter(w => w.category === category);
              const catWordsCount = catWords.length;
              const catMasteredCount = catWords.filter(w => progress.mastered.includes(w.id)).length;
              const catPercentage = catWordsCount > 0 
                ? Math.round((catMasteredCount / catWordsCount) * 100) 
                : 0;

              return (
                <div 
                  key={category} 
                  className="glass-panel category-card"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div>
                    <h3 className="category-title" style={{ color: 'var(--text-primary)' }}>{category}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{catWordsCount} từ vựng</p>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <span>Tiến độ</span>
                      <span>{catPercentage}%</span>
                    </div>
                    <div className="category-progress-bar">
                      <div className="category-progress-fill" style={{ width: `${catPercentage}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Quiz High Scores & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* High Scores */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Điểm cao Quiz ⚡</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: '0.9rem' }}>Multiple Choice</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>{progress.quizHighScores['multiple-choice']} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--panel-border)' }}>
                <span style={{ fontSize: '0.9rem' }}>Spelling Test</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{progress.quizHighScores['spelling']} pts</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Matching Game</span>
                <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>
                  {progress.quizHighScores['match'] === 0 ? '---' : `${progress.quizHighScores['match']}s`}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Study Tips */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(6, 182, 212, 0.1))' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💡 Mẹo học tập
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Luyện tập với <strong>Matching Game</strong> hàng ngày giúp bạn tăng tốc độ phản xạ nhận diện từ vựng. Đối với các từ khó, hãy sử dụng <strong>Flashcards</strong> và đánh dấu "Đang học" để ôn tập nhiều hơn!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
