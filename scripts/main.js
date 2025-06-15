/**
 * AIオンラインスクール - メインアプリケーション
 * 主婦向けAI学習プラットフォーム
 */

class AISchoolApp {
    constructor() {
        this.currentPage = 'home';
        this.currentLesson = null;
        this.isInitialized = false;
        this.progressData = null;
        
        // イベントリスナーの設定
        this.setupEventListeners();
        
        // アプリケーションの初期化
        this.init();
    }

    /**
     * アプリケーションの初期化
     */
    async init() {
        try {
            // ローディング画面を表示
            this.showLoading();
            
            // データの読み込み
            await this.loadData();
            
            // UIの初期化
            this.initializeUI();
            
            // 進捗の更新
            this.updateProgress();
            
            // アニメーションの開始
            this.startAnimations();
            
            // ローディング画面を非表示
            this.hideLoading();
            
            this.isInitialized = true;
            
            // 初期化完了のトースト表示
            this.showToast('💖 AIスクールへようこそ！', 'success');
            
        } catch (error) {
            console.error('アプリケーションの初期化に失敗:', error);
            this.showToast('❌ 読み込みに失敗しました', 'error');
        }
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ページの読み込み完了
        document.addEventListener('DOMContentLoaded', () => {
            this.onDOMLoaded();
        });

        // ページの可視性変更
        document.addEventListener('visibilitychange', () => {
            this.onVisibilityChange();
        });

        // オンライン/オフライン状態の変更
        window.addEventListener('online', () => {
            this.showToast('🌐 インターネットに接続しました', 'success');
        });

        window.addEventListener('offline', () => {
            this.showToast('📡 オフラインモードです', 'warning');
        });

        // ウィンドウサイズの変更
        window.addEventListener('resize', () => {
            this.onResize();
        });

        // スクロールイベント
        window.addEventListener('scroll', throttle(() => {
            this.onScroll();
        }, 16));

        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });

        // タッチイベント（スワイプ対応）
        this.setupTouchEvents();
    }

    /**
     * タッチイベントの設定
     */
    setupTouchEvents() {
        let startX = 0;
        let startY = 0;
        let isScrolling = false;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isScrolling = false;
        });

        document.addEventListener('touchmove', (e) => {
            if (!isScrolling) {
                const deltaX = Math.abs(e.touches[0].clientX - startX);
                const deltaY = Math.abs(e.touches[0].clientY - startY);
                isScrolling = deltaY > deltaX;
            }
        });

        document.addEventListener('touchend', (e) => {
            if (!isScrolling) {
                const deltaX = e.changedTouches[0].clientX - startX;
                const threshold = 50;

                if (Math.abs(deltaX) > threshold) {
                    this.handleSwipe(deltaX > 0 ? 'right' : 'left');
                }
            }
        });
    }

    /**
     * データの読み込み
     */
    async loadData() {
        // LocalStorageからデータを読み込み
        this.progressData = StorageManager.getProgress();
        this.currentLesson = StorageManager.getCurrentLesson();
        
        // 学習データがない場合は初期化
        if (!this.progressData) {
            this.progressData = this.createInitialProgress();
            StorageManager.saveProgress(this.progressData);
        }
        
        // 外部データの読み込み（将来的にAPI連携時）
        // await this.loadExternalData();
    }

    /**
     * 初期進捗データの作成
     */
    createInitialProgress() {
        return {
            totalLessons: 91,
            completedLessons: [],
            currentChapter: 1,
            currentLesson: '1-1',
            startDate: new Date().toISOString(),
            lastAccessDate: new Date().toISOString(),
            totalStudyTime: 0,
            settings: {
                notifications: true,
                autoplay: false,
                speed: 1.0,
                theme: 'light'
            }
        };
    }

    /**
     * UIの初期化
     */
    initializeUI() {
        // ページ要素の参照を取得
        this.elements = {
            pages: document.querySelectorAll('.page'),
            navItems: document.querySelectorAll('.nav-item'),
            progressText: document.getElementById('progress-text'),
            progressFill: document.getElementById('global-progress-fill'),
            toastContainer: document.getElementById('toast-container'),
            modalOverlay: document.getElementById('modal-overlay'),
            fab: document.getElementById('continue-fab')
        };

        // 初期ページの表示
        this.showPage(this.currentPage, false);
        
        // プルトゥリフレッシュの設定
        this.setupPullToRefresh();
    }

    /**
     * プルトゥリフレッシュの設定
     */
    setupPullToRefresh() {
        let startY = 0;
        let isPulling = false;
        const threshold = 100;

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0) {
                const currentY = e.touches[0].clientY;
                const pullDistance = currentY - startY;

                if (pullDistance > threshold && !isPulling) {
                    isPulling = true;
                    this.handlePullToRefresh();
                }
            }
        });

        document.addEventListener('touchend', () => {
            isPulling = false;
        });
    }

    /**
     * プルトゥリフレッシュの処理
     */
    async handlePullToRefresh() {
        this.showToast('🔄 データを更新中...', 'info');
        
        try {
            // データの再読み込み
            await this.loadData();
            this.updateProgress();
            
            this.showToast('✅ 更新完了！', 'success');
        } catch (error) {
            this.showToast('❌ 更新に失敗しました', 'error');
        }
    }

    /**
     * ページ表示
     */
    /**
     * ページ表示
     */
    showPage(pageId, animate = true) {
        if (!this.isInitialized && pageId !== 'home') {
            return;
        }

        // 現在のページを非表示
        this.elements.pages.forEach(page => {
            page.classList.remove('active');
        });

        // 指定されたページを表示
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            if (animate) {
                // アニメーション付きで表示
                setTimeout(() => {
                    targetPage.classList.add('active');
                    this.triggerPageAnimations(pageId);
                }, 150);
            } else {
                targetPage.classList.add('active');
            }

            this.currentPage = pageId;
            
            // ナビゲーションの更新
            this.updateNavigation(pageId);
            
            // ページ固有の初期化
            this.initializePage(pageId);
            
            // スクロールを上部に戻す
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            // アクセス履歴を記録
            this.recordPageAccess(pageId);
        }
    }

    /**
     * ナビゲーションの更新
     */
    updateNavigation(activePageId) {
        this.elements.navItems.forEach(item => {
            const pageId = item.getAttribute('data-page');
            if (pageId === activePageId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * ページ固有の初期化
     */
    initializePage(pageId) {
        switch (pageId) {
            case 'home':
                this.initializeHomePage();
                break;
            case 'lessons':
                this.initializeLessonsPage();
                break;
            case 'lesson-detail':
                this.initializeLessonDetailPage();
                break;
            case 'progress':
                this.initializeProgressPage();
                break;
            case 'faq':
                this.initializeFAQPage();
                break;
        }
    }

    /**
     * ホームページの初期化
     */
    initializeHomePage() {
        // 進捗円グラフの更新
        this.updateProgressCircle();
        
        // 学習統計の更新
        this.updateStudyStats();
        
        // 学習フローの更新
        this.updateLearningFlow();
    }

    /**
     * レッスンページの初期化
     */
    initializeLessonsPage() {
        // レッスン一覧の生成
        LessonManager.generateLessonList();
        
        // フィルターの初期化
        LessonManager.initializeFilters();
        
        // 検索機能の初期化
        LessonManager.initializeSearch();
    }

    /**
     * レッスン詳細ページの初期化
     */
    initializeLessonDetailPage() {
        if (this.currentLesson) {
            // レッスン情報の更新
            this.updateLessonDetail(this.currentLesson);
            
            // 動画プレーヤーの初期化
            VideoPlayer.initialize(this.currentLesson);
            
            // メモの読み込み
            NotesManager.loadNotes(this.currentLesson);
        }
    }

    /**
     * レッスン表示
     */
    showLesson(lessonId) {
        this.currentLesson = lessonId;
        StorageManager.setCurrentLesson(lessonId);
        
        // レッスン詳細ページを表示
        this.showPage('lesson-detail');
        
        // 学習開始の記録
        this.recordLessonStart(lessonId);
    }

    /**
     * 学習継続
     */
    continueLesson() {
        const lastLesson = StorageManager.getCurrentLesson() || '1-4';
        this.showLesson(lastLesson);
    }

    /**
     * 前のレッスンに移動
     */
    prevLesson() {
        const prevId = LessonManager.getPreviousLesson(this.currentLesson);
        if (prevId) {
            this.showLesson(prevId);
            this.showToast('📚 前のレッスンに移動しました', 'info');
        } else {
            this.showToast('これが最初のレッスンです', 'info');
        }
    }

    /**
     * 次のレッスンに移動
     */
    nextLesson() {
        const nextId = LessonManager.getNextLesson(this.currentLesson);
        if (nextId) {
            this.showLesson(nextId);
            this.showToast('📚 次のレッスンに移動しました', 'info');
        } else {
            this.showToast('🎉 お疲れさまでした！全てのレッスンが完了です', 'success');
        }
    }

    /**
     * 進捗更新
     */
    updateProgress() {
        const progress = StorageManager.getProgress();
        if (!progress) return;

        const completedCount = progress.completedLessons.length;
        const totalCount = progress.totalLessons;
        const percentage = Math.round((completedCount / totalCount) * 100);

        // ヘッダーの進捗表示
        if (this.elements.progressText) {
            this.elements.progressText.textContent = `${completedCount}/${totalCount}本完了`;
        }

        // グローバル進捗バー
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percentage}%`;
        }

        // ホームページの進捗円グラフ
        this.updateProgressCircle(percentage);

        // 章別進捗の更新
        this.updateChapterProgress();
    }

    /**
     * 進捗円グラフの更新
     */
    updateProgressCircle(percentage = null) {
        if (!percentage) {
            const progress = StorageManager.getProgress();
            percentage = Math.round((progress.completedLessons.length / progress.totalLessons) * 100);
        }

        const circle = document.getElementById('home-progress-circle');
        const text = document.getElementById('home-progress-text');
        
        if (circle && text) {
            const circumference = 2 * Math.PI * 45; // r=45
            const offset = circumference - (percentage / 100) * circumference;
            
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
            text.textContent = `${percentage}%`;
        }
    }

    /**
     * 章別進捗の更新
     */
    updateChapterProgress() {
        const progress = StorageManager.getProgress();
        const chapters = LessonManager.getChapterData();
        
        chapters.forEach((chapter, index) => {
            const chapterElement = document.querySelector(`[data-chapter="${index + 1}"]`);
            if (chapterElement) {
                const completedInChapter = progress.completedLessons.filter(
                    lessonId => lessonId.startsWith(`${index + 1}-`)
                ).length;
                
                const progressText = chapterElement.querySelector('.progress-text');
                const progressBar = chapterElement.querySelector('.mini-progress-fill');
                
                if (progressText) {
                    progressText.textContent = `${completedInChapter}/${chapter.totalLessons}本完了`;
                }
                
                if (progressBar) {
                    const chapterPercentage = (completedInChapter / chapter.totalLessons) * 100;
                    progressBar.style.width = `${chapterPercentage}%`;
                }
            }
        });
    }

    /**
     * 学習統計の更新
     */
    updateStudyStats() {
        const progress = StorageManager.getProgress();
        const startDate = new Date(progress.startDate);
        const today = new Date();
        const studyDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
        
        // 学習日数の更新
        const studyDaysElement = document.getElementById('study-days');
        if (studyDaysElement) {
            studyDaysElement.textContent = studyDays;
        }
        
        // 学習時間の更新
        const studyTimeElement = document.getElementById('study-time');
        if (studyTimeElement) {
            const totalMinutes = Math.round(progress.totalStudyTime / 60);
            studyTimeElement.textContent = totalMinutes;
        }
    }

    /**
     * アニメーションの開始
     */
    startAnimations() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        // アニメーション対象要素を監視
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * ページ固有のアニメーションをトリガー
     */
    triggerPageAnimations(pageId) {
        const page = document.getElementById(pageId);
        const animateElements = page.querySelectorAll('[data-animate]');
        
        animateElements.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('animate-in');
            }, index * 100);
        });
    }

    /**
     * スワイプハンドラ
     */
    handleSwipe(direction) {
        if (this.currentPage === 'lesson-detail') {
            if (direction === 'left') {
                this.nextLesson();
            } else if (direction === 'right') {
                this.prevLesson();
            }
        }
    }

    /**
     * キーボードハンドラ
     */
    handleKeyboard(e) {
        // ショートカットキー
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'h':
                    e.preventDefault();
                    this.showPage('home');
                    break;
                case 'l':
                    e.preventDefault();
                    this.showPage('lessons');
                    break;
                case 'p':
                    e.preventDefault();
                    this.showPage('progress');
                    break;
            }
        }
        
        // レッスン詳細ページでの操作
        if (this.currentPage === 'lesson-detail') {
            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.prevLesson();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextLesson();
                    break;
                case ' ':
                    e.preventDefault();
                    VideoPlayer.togglePlay();
                    break;
            }
        }
    }

    /**
     * スクロールハンドラ
     */
    onScroll() {
        const scrollY = window.scrollY;
        
        // ヘッダーの背景透明度調整
        const header = document.getElementById('main-header');
        if (header) {
            const opacity = Math.min(scrollY / 100, 1);
            header.style.backgroundColor = `rgba(255, 255, 255, ${0.9 + opacity * 0.1})`;
        }
        
        // FABの表示/非表示
        const fab = this.elements.fab;
        if (fab) {
            if (scrollY > 200) {
                fab.style.transform = 'scale(1)';
                fab.style.opacity = '1';
            } else {
                fab.style.transform = 'scale(0.8)';
                fab.style.opacity = '0.7';
            }
        }
    }

    /**
     * リサイズハンドラ
     */
    onResize() {
        // モバイル表示の調整
        if (window.innerWidth > 768) {
            document.body.style.maxWidth = '425px';
            document.body.style.margin = '0 auto';
        } else {
            document.body.style.maxWidth = '';
            document.body.style.margin = '';
        }
    }

    /**
     * 可視性変更ハンドラ
     */
    onVisibilityChange() {
        if (document.hidden) {
            // ページが非表示になった時の処理
            this.recordSessionEnd();
        } else {
            // ページが表示された時の処理
            this.recordSessionStart();
        }
    }

    /**
     * DOMロード完了ハンドラ
     */
    onDOMLoaded() {
        // 初期テーマの設定
        this.applyTheme();
        
        // パフォーマンス測定
        this.measurePerformance();
    }

    /**
     * テーマの適用
     */
    applyTheme() {
        const progress = StorageManager.getProgress();
        const theme = progress?.settings?.theme || 'light';
        
        document.body.setAttribute('data-theme', theme);
    }

    /**
     * パフォーマンス測定
     */
    measurePerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                const loadTime = performance.now();
                console.log(`アプリケーション読み込み時間: ${loadTime.toFixed(2)}ms`);
                
                // 遅い場合は最適化のヒントを表示
                if (loadTime > 3000) {
                    this.showToast('⚡ 読み込みが遅い場合はWi-Fi接続をご確認ください', 'info');
                }
            });
        }
    }

    /**
     * ローディング画面の表示
     */
    showLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    /**
     * ローディング画面の非表示
     */
    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 1000);
        }
    }

    /**
     * トースト通知の表示
     */
    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // アニメーション
        setTimeout(() => toast.classList.add('show'), 100);
        
        // 自動削除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    /**
     * モーダルの表示
     */
    showModal(content, options = {}) {
        const modal = this.elements.modalOverlay;
        const modalContent = document.getElementById('modal-content');
        
        modalContent.innerHTML = content;
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 100);
        
        // 閉じるボタンの処理
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal();
            }
        });
    }

    /**
     * モーダルの非表示
     */
    hideModal() {
        const modal = this.elements.modalOverlay;
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }

    /**
     * LINEサポートを開く
     */
    openLineSupport() {
        // 実際の実装では LINE deeplink を使用
        const lineUrl = 'line://ti/p/@schoolsupport';
        
        // システム情報を含むメッセージを準備
        const systemInfo = this.getSystemInfo();
        const message = encodeURIComponent(`お疲れさまです！\n\n【システム情報】\n${systemInfo}`);
        
        // LINEアプリで開く試行
        const fallbackUrl = `https://line.me/ti/p/@schoolsupport?message=${message}`;
        
        try {
            window.location.href = lineUrl;
            // フォールバック
            setTimeout(() => {
                window.open(fallbackUrl, '_blank');
            }, 1000);
        } catch (error) {
            window.open(fallbackUrl, '_blank');
        }
    }

    /**
     * システム情報の取得
     */
    getSystemInfo() {
        const progress = StorageManager.getProgress();
        return `
ブラウザ: ${navigator.userAgent.split(' ').pop()}
デバイス: ${/Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}
進捗: ${progress.completedLessons.length}/${progress.totalLessons}本完了
現在のレッスン: ${this.currentLesson || '未選択'}
最終アクセス: ${new Date().toLocaleString()}
        `.trim();
    }

    /**
     * アクセス履歴の記録
     */
    recordPageAccess(pageId) {
        const accessLog = StorageManager.getAccessLog() || [];
        accessLog.push({
            page: pageId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
        
        // 直近100件のみ保持
        if (accessLog.length > 100) {
            accessLog.splice(0, accessLog.length - 100);
        }
        
        StorageManager.saveAccessLog(accessLog);
    }

    /**
     * レッスン開始の記録
     */
    recordLessonStart(lessonId) {
        const sessionData = {
            lessonId,
            startTime: new Date().toISOString(),
            userAgent: navigator.userAgent
        };
        
        StorageManager.setCurrentSession(sessionData);
    }

    /**
     * セッション開始の記録
     */
    recordSessionStart() {
        const progress = StorageManager.getProgress();
        progress.lastAccessDate = new Date().toISOString();
        StorageManager.saveProgress(progress);
    }

    /**
     * セッション終了の記録
     */
    recordSessionEnd() {
        const session = StorageManager.getCurrentSession();
        if (session) {
            const endTime = new Date();
            const startTime = new Date(session.startTime);
            const duration = endTime - startTime;
            
            // 学習時間を累積
            const progress = StorageManager.getProgress();
            progress.totalStudyTime += duration / 1000; // 秒単位
            StorageManager.saveProgress(progress);
        }
    }
}

// ユーティリティ関数
function throttle(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

// グローバルアプリケーションインスタンス
let App;

// アプリケーションの開始
document.addEventListener('DOMContentLoaded', () => {
    App = new AISchoolApp();
});

// サービスワーカーの登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}