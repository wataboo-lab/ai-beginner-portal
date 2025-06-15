/**
 * レッスン管理クラス
 * レッスンデータの管理と操作
 */
class LessonManager {
    static lessonsData = null;
    static currentFilter = 'all';
    static searchQuery = '';

    /**
     * レッスンデータの初期化
     */
    static init() {
        this.lessonsData = this.getLessonsData();
        this.initializeFilters();
        this.initializeSearch();
    }

    /**
     * レッスンデータの取得
     */
    static getLessonsData() {
        return {
            chapters: [
                {
                    id: 1,
                    title: 'オリエンテーション',
                    description: 'AIスクールの基本的な使い方を学びます',
                    totalLessons: 5,
                    lessons: [
                        {
                            id: '1-1',
                            title: 'ようこそAIスクールへ',
                            description: 'AIスクールの概要と学習方法について',
                            duration: 300, // 秒
                            difficulty: 'beginner',
                            videoId: 'demo1',
                            learningGoals: ['AIスクールの全体像を理解する', '学習の進め方を知る'],
                            prerequisites: []
                        },
                        {
                            id: '1-2',
                            title: '学習の進め方',
                            description: '効果的な学習方法とコツ',
                            duration: 480,
                            difficulty: 'beginner',
                            videoId: 'demo2',
                            learningGoals: ['効果的な学習方法を身につける', '継続のコツを知る'],
                            prerequisites: ['1-1']
                        },
                        {
                            id: '1-3',
                            title: 'AI基礎用語集',
                            description: 'AIに関する基本的な用語を学習',
                            duration: 720,
                            difficulty: 'beginner',
                            videoId: 'demo3',
                            learningGoals: ['AI関連の基本用語を理解する'],
                            prerequisites: ['1-1', '1-2']
                        },
                        {
                            id: '1-4',
                            title: '実践前の準備',
                            description: 'AI活用の準備と心構え',
                            duration: 420,
                            difficulty: 'beginner',
                            videoId: 'demo4',
                            learningGoals: ['AI活用の準備ができる', '実践への心構えを持つ'],
                            prerequisites: ['1-3']
                        },
                        {
                            id: '1-5',
                            title: '質問の仕方',
                            description: '効果的な質問方法とサポートの利用',
                            duration: 360,
                            difficulty: 'beginner',
                            videoId: 'demo5',
                            learningGoals: ['効果的な質問ができる', 'サポートを活用できる'],
                            prerequisites: ['1-4']
                        }
                    ]
                },
                {
                    id: 2,
                    title: 'AI基礎知識',
                    description: 'AIの基本概念と仕組みを理解します',
                    totalLessons: 8,
                    lessons: [
                        {
                            id: '2-1',
                            title: 'AIとは何か',
                            description: '人工知能の基本概念',
                            duration: 600,
                            difficulty: 'beginner',
                            videoId: 'demo6',
                            learningGoals: ['AIの基本概念を理解する'],
                            prerequisites: ['1-5']
                        },
                        {
                            id: '2-2',
                            title: 'ChatGPTの基本',
                            description: 'ChatGPTの仕組みと基本的な使い方',
                            duration: 900,
                            difficulty: 'beginner',
                            videoId: 'demo7',
                            learningGoals: ['ChatGPTの基本操作ができる'],
                            prerequisites: ['2-1']
                        }
                        // 他のレッスンは省略...
                    ]
                }
                // 他の章は省略...
            ]
        };
    }

    /**
     * レッスン一覧の生成
     */
    static generateLessonList() {
        const container = document.getElementById('lessons-container');
        if (!container) return;

        container.innerHTML = '';

        this.lessonsData.chapters.forEach(chapter => {
            const chapterElement = this.createChapterElement(chapter);
            container.appendChild(chapterElement);
        });

        // フィルターとサーチの適用
        this.applyFiltersAndSearch();
    }

    /**
     * 章要素の作成
     */
    static createChapterElement(chapter) {
        const progress = StorageManager.getProgress();
        const completedInChapter = progress ? 
            progress.completedLessons.filter(id => id.startsWith(`${chapter.id}-`)).length : 0;
        const progressPercentage = Math.round((completedInChapter / chapter.totalLessons) * 100);

        const chapterDiv = document.createElement('div');
        chapterDiv.className = 'chapter-accordion';
        chapterDiv.setAttribute('data-chapter', chapter.id);

        chapterDiv.innerHTML = `
            <div class="chapter-header" onclick="UI.toggleChapter(${chapter.id})">
                <div class="chapter-info">
                    <h3 class="chapter-title">第${chapter.id}章 ${chapter.title}</h3>
                    <div class="chapter-progress">
                        <span class="progress-text">${completedInChapter}/${chapter.totalLessons}本完了</span>
                        <div class="mini-progress-bar">
                            <div class="mini-progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                </div>
                <div class="chapter-toggle">
                    <span class="chapter-arrow" id="chapter${chapter.id}-arrow">▶</span>
                </div>
            </div>
            <div class="chapter-content" id="chapter${chapter.id}-content">
                ${chapter.lessons.map(lesson => this.createLessonHTML(lesson, progress)).join('')}
            </div>
        `;

        return chapterDiv;
    }

    /**
     * レッスンHTMLの作成
     */
    static createLessonHTML(lesson, progress) {
        const isCompleted = progress && progress.completedLessons.includes(lesson.id);
        const isCurrent = progress && progress.currentLesson === lesson.id;
        const isBookmarked = StorageManager.getBookmarks().includes(lesson.id);

        let statusIcon = '⚪'; // 未完了
        let lessonClass = '';

        if (isCompleted) {
            statusIcon = '✅';
            lessonClass = 'completed';
        } else if (isCurrent) {
            statusIcon = '📍';
            lessonClass = 'current';
        }

        const durationFormatted = this.formatDuration(lesson.duration);
        const difficultyClass = `difficulty-${lesson.difficulty}`;

        return `
            <div class="lesson-item ${lessonClass}" 
                 data-lesson="${lesson.id}" 
                 data-completed="${isCompleted}"
                 data-difficulty="${lesson.difficulty}"
                 onclick="App.showLesson('${lesson.id}')">
                <div class="lesson-status">
                    <span class="status-icon ${isCurrent ? 'current-icon' : ''}">${statusIcon}</span>
                </div>
                <div class="lesson-info">
                    <h4 class="lesson-title">
                        ${lesson.title}
                        ${isCurrent ? '<span class="next-lesson">← 次はココ!</span>' : ''}
                        ${isBookmarked ? '<span class="bookmark-indicator">🔖</span>' : ''}
                    </h4>
                    <div class="lesson-meta">
                        <span class="lesson-duration">${durationFormatted}</span>
                        <span class="lesson-difficulty ${difficultyClass}">${this.getDifficultyLabel(lesson.difficulty)}</span>
                    </div>
                </div>
                <div class="lesson-actions">
                    <button class="play-btn ${isCurrent ? 'primary' : ''}" 
                            onclick="event.stopPropagation(); App.showLesson('${lesson.id}')"
                            title="レッスンを開始">
                        ▶️
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 時間のフォーマット
     */
    static formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes}分`;
    }

    /**
     * 難易度ラベルの取得
     */
    static getDifficultyLabel(difficulty) {
        const labels = {
            'beginner': '初級',
            'intermediate': '中級',
            'advanced': '上級'
        };
        return labels[difficulty] || '初級';
    }

    /**
     * レッスン情報の取得
     */
    static getLessonById(lessonId) {
        for (const chapter of this.lessonsData.chapters) {
            const lesson = chapter.lessons.find(l => l.id === lessonId);
            if (lesson) {
                return {
                    ...lesson,
                    chapterTitle: chapter.title,
                    chapterNumber: chapter.id
                };
            }
        }
        return null;
    }

    /**
     * 前のレッスンIDの取得
     */
    static getPreviousLesson(currentLessonId) {
        const allLessons = this.getAllLessonsFlat();
        const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
        
        if (currentIndex > 0) {
            return allLessons[currentIndex - 1].id;
        }
        return null;
    }

    /**
     * 次のレッスンIDの取得
     */
    static getNextLesson(currentLessonId) {
        const allLessons = this.getAllLessonsFlat();
        const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId);
        
        if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
            return allLessons[currentIndex + 1].id;
        }
        return null;
    }

    /**
     * 全レッスンのフラット配列取得
     */
    /**
     * 全レッスンのフラット配列取得
     */
    static getAllLessonsFlat() {
        const allLessons = [];
        this.lessonsData.chapters.forEach(chapter => {
            allLessons.push(...chapter.lessons);
        });
        return allLessons;
    }

    /**
     * 章データの取得
     */
    static getChapterData() {
        return this.lessonsData.chapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            totalLessons: chapter.totalLessons,
            description: chapter.description
        }));
    }

    /**
     * フィルターの初期化
     */
    static initializeFilters() {
        this.updateFilterCounts();
        this.bindFilterEvents();
    }

    /**
     * フィルターイベントのバインド
     */
    static bindFilterEvents() {
        const filterTabs = document.querySelectorAll('.filter-tabs .tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.setActiveFilter(filter);
            });
        });
    }

    /**
     * フィルターカウントの更新
     */
    static updateFilterCounts() {
        const progress = StorageManager.getProgress();
        const allLessons = this.getAllLessonsFlat();
        
        const completedCount = progress ? progress.completedLessons.length : 0;
        const incompleteCount = allLessons.length - completedCount;

        // カウント表示の更新
        const incompleteElement = document.getElementById('incomplete-count');
        const completeElement = document.getElementById('complete-count');
        
        if (incompleteElement) incompleteElement.textContent = incompleteCount;
        if (completeElement) completeElement.textContent = completedCount;
    }

    /**
     * アクティブフィルターの設定
     */
    static setActiveFilter(filter) {
        this.currentFilter = filter;
        
        // タブのアクティブ状態を更新
        const tabs = document.querySelectorAll('.filter-tabs .tab');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-filter') === filter) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // フィルターを適用
        this.applyFiltersAndSearch();
    }

    /**
     * レッスンフィルタリング
     */
    static filterLessons(filter) {
        this.setActiveFilter(filter);
    }

    /**
     * 検索機能の初期化
     */
    static initializeSearch() {
        const searchInput = document.getElementById('lesson-search-input');
        const searchContainer = document.getElementById('lesson-search');
        
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchQuery = e.target.value.trim();
                this.applyFiltersAndSearch();
            }, 300));
        }
    }

    /**
     * レッスン検索
     */
    static searchLessons() {
        const searchInput = document.getElementById('lesson-search-input');
        if (searchInput) {
            this.searchQuery = searchInput.value.trim();
            this.applyFiltersAndSearch();
        }
    }

    /**
     * 検索クリア
     */
    static clearSearch() {
        const searchInput = document.getElementById('lesson-search-input');
        if (searchInput) {
            searchInput.value = '';
            this.searchQuery = '';
            this.applyFiltersAndSearch();
        }
    }

    /**
     * フィルターと検索の適用
     */
    static applyFiltersAndSearch() {
        const progress = StorageManager.getProgress();
        const lessonItems = document.querySelectorAll('.lesson-item');
        const chapters = document.querySelectorAll('.chapter-accordion');

        lessonItems.forEach(item => {
            const lessonId = item.getAttribute('data-lesson');
            const isCompleted = item.getAttribute('data-completed') === 'true';
            const lessonData = this.getLessonById(lessonId);
            
            let shouldShow = true;

            // フィルター適用
            if (this.currentFilter === 'complete' && !isCompleted) {
                shouldShow = false;
            } else if (this.currentFilter === 'incomplete' && isCompleted) {
                shouldShow = false;
            }

            // 検索適用
            if (this.searchQuery && lessonData) {
                const searchTerms = this.searchQuery.toLowerCase();
                const searchableText = `
                    ${lessonData.title} 
                    ${lessonData.description} 
                    ${lessonData.chapterTitle}
                `.toLowerCase();
                
                if (!searchableText.includes(searchTerms)) {
                    shouldShow = false;
                }
            }

            // 表示/非表示の切り替え
            item.style.display = shouldShow ? 'flex' : 'none';
        });

        // 章の表示/非表示（章内に表示されるレッスンがない場合は非表示）
        chapters.forEach(chapter => {
            const visibleLessons = chapter.querySelectorAll('.lesson-item[style*="flex"], .lesson-item:not([style*="none"])');
            chapter.style.display = visibleLessons.length > 0 ? 'block' : 'none';
        });

        // 検索結果の統計表示
        this.updateSearchResults();
    }

    /**
     * 検索結果の統計更新
     */
    static updateSearchResults() {
        const visibleItems = document.querySelectorAll('.lesson-item[style*="flex"], .lesson-item:not([style*="none"])');
        const totalItems = document.querySelectorAll('.lesson-item');
        
        // 検索結果のメッセージ表示（必要に応じて）
        if (this.searchQuery && visibleItems.length === 0) {
            this.showNoResultsMessage();
        } else {
            this.hideNoResultsMessage();
        }
    }

    /**
     * 検索結果なしメッセージの表示
     */
    static showNoResultsMessage() {
        let noResultsDiv = document.getElementById('no-search-results');
        if (!noResultsDiv) {
            noResultsDiv = document.createElement('div');
            noResultsDiv.id = 'no-search-results';
            noResultsDiv.className = 'no-results-message';
            noResultsDiv.innerHTML = `
                <div class="no-results-content">
                    <span class="no-results-icon">🔍</span>
                    <h3>検索結果が見つかりません</h3>
                    <p>「${this.searchQuery}」に一致するレッスンはありません。</p>
                    <button onclick="LessonManager.clearSearch()" class="btn btn-outline btn-small">
                        検索をクリア
                    </button>
                </div>
            `;
            
            const container = document.getElementById('lessons-container');
            if (container) {
                container.appendChild(noResultsDiv);
            }
        }
    }

    /**
     * 検索結果なしメッセージの非表示
     */
    static hideNoResultsMessage() {
        const noResultsDiv = document.getElementById('no-search-results');
        if (noResultsDiv) {
            noResultsDiv.remove();
        }
    }

    /**
     * レッスン完了のマーク
     */
    static markComplete(lessonId = null) {
        const targetLessonId = lessonId || App.currentLesson;
        if (!targetLessonId) return false;

        const success = StorageManager.markLessonComplete(targetLessonId);
        
        if (success) {
            // UI の更新
            this.updateLessonItemStatus(targetLessonId, true);
            this.updateFilterCounts();
            
            // 進捗の更新をアプリに通知
            if (App && App.updateProgress) {
                App.updateProgress();
            }
            
            // 次のレッスンを提案
            this.suggestNextLesson(targetLessonId);
            
            return true;
        }
        
        return false;
    }

    /**
     * レッスン完了の取り消し
     */
    static unmarkComplete(lessonId) {
        const success = StorageManager.unmarkLessonComplete(lessonId);
        
        if (success) {
            this.updateLessonItemStatus(lessonId, false);
            this.updateFilterCounts();
            
            if (App && App.updateProgress) {
                App.updateProgress();
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * レッスンアイテムの状態更新
     */
    static updateLessonItemStatus(lessonId, isCompleted) {
        const lessonItem = document.querySelector(`[data-lesson="${lessonId}"]`);
        if (!lessonItem) return;

        const statusIcon = lessonItem.querySelector('.status-icon');
        const playBtn = lessonItem.querySelector('.play-btn');
        
        if (isCompleted) {
            lessonItem.classList.add('completed');
            lessonItem.classList.remove('current');
            lessonItem.setAttribute('data-completed', 'true');
            
            if (statusIcon) statusIcon.textContent = '✅';
            if (playBtn) playBtn.classList.remove('primary');
        } else {
            lessonItem.classList.remove('completed');
            lessonItem.setAttribute('data-completed', 'false');
            
            if (statusIcon) statusIcon.textContent = '⚪';
        }
    }

    /**
     * 次のレッスンの提案
     */
    static suggestNextLesson(completedLessonId) {
        const nextLessonId = this.getNextLesson(completedLessonId);
        
        if (nextLessonId) {
            const nextLesson = this.getLessonById(nextLessonId);
            
            if (App && App.showToast) {
                App.showToast(
                    `🎉 お疲れさまでした！次は「${nextLesson.title}」はいかがですか？`,
                    'success',
                    5000
                );
            }
            
            // 現在のレッスンを更新
            StorageManager.setCurrentLesson(nextLessonId);
            this.updateCurrentLessonIndicator(nextLessonId);
        } else {
            // 全レッスン完了
            if (App && App.showToast) {
                App.showToast(
                    '🎊 おめでとうございます！全てのレッスンが完了しました！',
                    'success',
                    8000
                );
            }
        }
    }

    /**
     * 現在のレッスンインジケーターの更新
     */
    static updateCurrentLessonIndicator(newCurrentLessonId) {
        // 既存の current クラスを削除
        document.querySelectorAll('.lesson-item.current').forEach(item => {
            item.classList.remove('current');
            const statusIcon = item.querySelector('.status-icon');
            if (statusIcon && !item.classList.contains('completed')) {
                statusIcon.textContent = '⚪';
                statusIcon.classList.remove('current-icon');
            }
            
            // "次はココ" テキストを削除
            const nextText = item.querySelector('.next-lesson');
            if (nextText) nextText.remove();
        });

        // 新しい current レッスンにマーク
        const newCurrentItem = document.querySelector(`[data-lesson="${newCurrentLessonId}"]`);
        if (newCurrentItem && !newCurrentItem.classList.contains('completed')) {
            newCurrentItem.classList.add('current');
            
            const statusIcon = newCurrentItem.querySelector('.status-icon');
            if (statusIcon) {
                statusIcon.textContent = '📍';
                statusIcon.classList.add('current-icon');
            }
            
            // "次はココ" テキストを追加
            const titleElement = newCurrentItem.querySelector('.lesson-title');
            if (titleElement && !titleElement.querySelector('.next-lesson')) {
                const nextSpan = document.createElement('span');
                nextSpan.className = 'next-lesson';
                nextSpan.textContent = ' ← 次はココ!';
                titleElement.appendChild(nextSpan);
            }
            
            const playBtn = newCurrentItem.querySelector('.play-btn');
            if (playBtn) playBtn.classList.add('primary');
        }
    }

    /**
     * ブックマークの切り替え
     */
    static toggleBookmark(lessonId = null) {
        const targetLessonId = lessonId || App.currentLesson;
        if (!targetLessonId) return false;

        const isBookmarked = StorageManager.toggleBookmark(targetLessonId);
        
        // UI の更新
        this.updateBookmarkUI(targetLessonId, isBookmarked);
        
        return isBookmarked;
    }

    /**
     * ブックマークUIの更新
     */
    static updateBookmarkUI(lessonId, isBookmarked) {
        // レッスン一覧のブックマーク表示
        const lessonItem = document.querySelector(`[data-lesson="${lessonId}"]`);
        if (lessonItem) {
            const existingIndicator = lessonItem.querySelector('.bookmark-indicator');
            
            if (isBookmarked && !existingIndicator) {
                const indicator = document.createElement('span');
                indicator.className = 'bookmark-indicator';
                indicator.textContent = '🔖';
                
                const titleElement = lessonItem.querySelector('.lesson-title');
                if (titleElement) {
                    titleElement.appendChild(indicator);
                }
            } else if (!isBookmarked && existingIndicator) {
                existingIndicator.remove();
            }
        }

        // レッスン詳細ページのブックマークボタン
        const bookmarkBtn = document.getElementById('bookmark-icon');
        if (bookmarkBtn) {
            bookmarkBtn.textContent = isBookmarked ? '❤️' : '🤍';
        }
    }

    /**
     * 推奨レッスンの取得
     */
    static getRecommendedLessons(count = 3) {
        const progress = StorageManager.getProgress();
        if (!progress) return [];

        const allLessons = this.getAllLessonsFlat();
        const incomplete = allLessons.filter(lesson => 
            !progress.completedLessons.includes(lesson.id)
        );

        // 前提条件を満たしているレッスンを優先
        const available = incomplete.filter(lesson => {
            return lesson.prerequisites.every(prereq => 
                progress.completedLessons.includes(prereq)
            );
        });

        return available.slice(0, count);
    }

    /**
     * 学習進捗の分析
     */
    static analyzeProgress() {
        const progress = StorageManager.getProgress();
        if (!progress) return null;

        const stats = StorageManager.getStudyStatistics();
        const recommendations = this.getRecommendedLessons(5);
        
        return {
            ...stats,
            recommendations,
            nextMilestone: this.getNextMilestone(progress),
            strengths: this.identifyStrengths(progress),
            suggestions: this.generateSuggestions(progress)
        };
    }

    /**
     * 次のマイルストーンの取得
     */
    static getNextMilestone(progress) {
        const completedCount = progress.completedLessons.length;
        const milestones = [10, 25, 50, 75, 91];
        
        for (const milestone of milestones) {
            if (completedCount < milestone) {
                return {
                    target: milestone,
                    remaining: milestone - completedCount,
                    percentage: Math.round((completedCount / milestone) * 100)
                };
            }
        }
        
        return null; // 全て完了
    }

    /**
     * 強みの特定
     */
    static identifyStrengths(progress) {
        const strengths = [];
        
        // 継続性の評価
        const completionTimes = StorageManager.getCompletionTimes();
        const streak = StorageManager.calculateCurrentStreak(completionTimes);
        
        if (streak >= 3) {
            strengths.push({
                type: 'consistency',
                title: '継続力',
                description: `${streak}日連続で学習を続けています！`
            });
        }
        
        // 完了率の評価
        const completionRate = (progress.completedLessons.length / progress.totalLessons) * 100;
        if (completionRate >= 50) {
            strengths.push({
                type: 'completion',
                title: '着実な進歩',
                description: `${Math.round(completionRate)}%のレッスンを完了しています！`
            });
        }
        
        return strengths;
    }

    /**
     * 学習提案の生成
     */
    static generateSuggestions(progress) {
        const suggestions = [];
        const stats = StorageManager.getStudyStatistics();
        
        // 学習ペースの提案
        if (stats.studyDays > 7 && stats.completedLessons < 10) {
            suggestions.push({
                type: 'pace',
                title: '学習ペースアップ',
                description: '1日1レッスンペースで進めると、より効果的です',
                action: '今日のレッスンを開始'
            });
        }
        
        // 復習の提案
        if (progress.completedLessons.length > 10) {
            suggestions.push({
                type: 'review',
                title: '復習のすすめ',
                description: '完了したレッスンを振り返ってみましょう',
                action: 'ブックマークを確認'
            });
        }
        
        return suggestions;
    }

    /**
     * エクスポート用データの準備
     */
    static prepareExportData() {
        const progress = StorageManager.getProgress();
        const notes = StorageManager.getNotes();
        const bookmarks = StorageManager.getBookmarks();
        const stats = this.analyzeProgress();
        
        return {
            export_date: new Date().toISOString(),
            user_progress: progress,
            user_notes: notes,
            bookmarks: bookmarks,
            statistics: stats,
            lesson_data: this.lessonsData
        };
    }
}

// ユーティリティ関数
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}