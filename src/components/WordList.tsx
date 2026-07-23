import React, { useState, useMemo } from 'react';
import type { UserProgress } from '../types';
import { getCategories, vocabData } from '../data/vocabData';

interface WordListProps {
  progress: UserProgress;
  updateProgress: (newProgress: UserProgress) => void;
}

export const WordList: React.FC<WordListProps> = ({
  progress,
  updateProgress,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unstarted' | 'learning' | 'mastered'>('all');
  
  const [speakingWordId, setSpeakingWordId] = useState<string | null>(null);

  const categories = getCategories();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const speakWord = (wordText: string, wordId: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(wordText);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      
      utterance.onstart = () => setSpeakingWordId(wordId);
      utterance.onend = () => setSpeakingWordId(null);
      utterance.onerror = () => setSpeakingWordId(null);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleMastery = (wordId: string) => {
    let newMastered = [...progress.mastered];
    let newLearning = [...progress.learning];

    if (newMastered.includes(wordId)) {
      // Move to learning
      newMastered = newMastered.filter(id => id !== wordId);
      newLearning.push(wordId);
    } else if (newLearning.includes(wordId)) {
      // Move to unstarted
      newLearning = newLearning.filter(id => id !== wordId);
    } else {
      // Mark as mastered
      newMastered.push(wordId);
    }

    updateProgress({
      ...progress,
      mastered: newMastered,
      learning: newLearning,
    });
  };

  const toggleLearning = (wordId: string) => {
    let newMastered = [...progress.mastered];
    let newLearning = [...progress.learning];

    if (newLearning.includes(wordId)) {
      newLearning = newLearning.filter(id => id !== wordId);
    } else {
      newMastered = newMastered.filter(id => id !== wordId);
      newLearning.push(wordId);
    }

    updateProgress({
      ...progress,
      mastered: newMastered,
      learning: newLearning,
    });
  };

  // Filter words based on search, category and status
  const filteredWords = useMemo(() => {
    return vocabData.filter(word => {
      const matchesSearch = 
        word.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
        word.vietnamese.toLowerCase().includes(searchTerm.toLowerCase()) ||
        word.definition.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !selectedCategory || word.category === selectedCategory;
      
      let matchesStatus = true;
      if (statusFilter === 'unstarted') {
        matchesStatus = !progress.mastered.includes(word.id) && !progress.learning.includes(word.id);
      } else if (statusFilter === 'learning') {
        matchesStatus = progress.learning.includes(word.id);
      } else if (statusFilter === 'mastered') {
        matchesStatus = progress.mastered.includes(word.id);
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, selectedCategory, statusFilter, progress]);

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', flexGrow: 1 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Tra cứu Từ vựng 📖</h1>
        <p style={{ color: 'var(--text-muted)' }}>Xem danh sách toàn bộ từ vựng, quản lý trạng thái học tập của bạn.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search */}
        <div style={{ flexGrow: 1, minWidth: '260px' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo từ tiếng Anh, tiếng Việt, định nghĩa..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--panel-border)',
              background: 'var(--bg-app)',
              color: '#fff',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Category Dropdown */}
          <select 
            value={selectedCategory || ''} 
            onChange={(e) => setSelectedCategory(e.target.value ? e.target.value : null)}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--panel-border)',
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            <option value="">Tất cả chủ đề</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: '0.65rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--panel-border)',
              background: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontWeight: 500,
              fontSize: '0.9rem'
            }}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="unstarted">Chưa học</option>
            <option value="learning">Đang học</option>
            <option value="mastered">Đã thành thạo</option>
          </select>
        </div>
      </div>

      {/* Results stats */}
      <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
        Tìm thấy <strong>{filteredWords.length}</strong> từ vựng phù hợp.
      </div>

      {/* Dictionary List */}
      {filteredWords.length > 0 ? (
        <div className="glass-panel dict-table-container">
          <table className="dict-table">
            <thead>
              <tr>
                <th className="dict-th" style={{ width: '22%' }}>Từ vựng</th>
                <th className="dict-th" style={{ width: '23%' }}>Nghĩa tiếng Việt</th>
                <th className="dict-th" style={{ width: '40%' }}>Định nghĩa & Ví dụ</th>
                <th className="dict-th" style={{ width: '15%', textAlign: 'center' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.map((word) => {
                const isMastered = progress.mastered.includes(word.id);
                const isLearning = progress.learning.includes(word.id);

                return (
                  <tr key={word.id} className="dict-tr">
                    <td className="dict-td">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '1.05rem', color: '#fff', wordBreak: 'break-all' }}>{word.word}</strong>
                          <button 
                            onClick={() => speakWord(word.word, word.id)}
                            style={{ 
                              background: 'rgba(139, 92, 246, 0.1)', 
                              color: 'var(--color-primary)', 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem'
                            }}
                            title="Phát âm"
                          >
                            {speakingWordId === word.id ? '⏳' : '🔊'}
                          </button>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>({word.partOfSpeech})</span>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: 'rgba(255,255,255,0.05)', 
                          color: 'var(--text-muted)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          alignSelf: 'flex-start',
                          fontWeight: 600
                        }}>
                          {word.category}
                        </span>
                      </div>
                    </td>
                    
                    <td className="dict-td">
                      <strong style={{ color: 'var(--color-secondary)', fontSize: '1rem' }}>{word.vietnamese}</strong>
                    </td>
                    
                    <td className="dict-td">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{word.definition}</div>
                        <div style={{ borderLeft: '2px solid var(--panel-border)', paddingLeft: '0.5rem', fontSize: '0.85rem' }}>
                          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>"{word.example}"</span>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '0.1rem' }}>→ {word.exampleTranslation}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="dict-td" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                          onClick={() => toggleMastery(word.id)}
                          style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '6px',
                            border: '1px solid var(--panel-border)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            width: '110px',
                            background: isMastered ? 'var(--color-success)' : 'transparent',
                            color: isMastered ? '#fff' : 'var(--text-primary)',
                            borderColor: isMastered ? 'var(--color-success)' : undefined
                          }}
                        >
                          {isMastered ? '✓ Thành thạo' : 'Đánh dấu đã học'}
                        </button>
                        
                        {!isMastered && (
                          <button
                            onClick={() => toggleLearning(word.id)}
                            style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid var(--panel-border)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              width: '110px',
                              background: isLearning ? 'var(--color-secondary)' : 'transparent',
                              color: isLearning ? '#fff' : 'var(--text-muted)'
                            }}
                          >
                            {isLearning ? '📖 Đang học' : 'Đánh dấu đang học'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h3>Không tìm thấy kết quả từ vựng nào</h3>
          <p style={{ marginTop: '0.5rem' }}>Vui lòng thay đổi từ khóa hoặc bộ lọc của bạn.</p>
        </div>
      )}
    </div>
  );
};
