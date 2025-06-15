/**
 * 動画プレーヤー管理クラス
 * YouTube埋め込み動画の制御と状態管理
 */
class VideoPlayer {
    static player = null;
    static currentLesson = null;
    static isPlaying = false;
    static currentTime = 0;
    static duration = 0;
    static playbackRate = 1.0;
    static volume = 1.0;
    static isFullscreen = false;
    static watchStartTime = null;
    static totalWatchTime = 0;

    /**
     * プレーヤーの初期化
     */
    static initialize(lessonId) {
        this.currentLesson = lessonId;
        this.loadYouTubeAPI();
        this.setupControls();
        this.loadPlayerState();
        this.watchStartTime = Date.now();
    }

    /**
     * YouTube API の読み込み
     */
    static loadYouTubeAPI() {
        // YouTube IFrame API が既に読み込まれているかチェック
        if (window.YT && window.YT.Player) {
            this.createPlayer();
            return;
        }

        // YouTube IFrame API スクリプトを動的に読み込み
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const script = document.createElement('script');
            script.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(script);
        }

        // API 準備完了のコールバック
        window.onYouTubeIframeAPIReady = () => {
            this.createPlayer();
        };
    }

    /**
     * YouTube プレーヤーの作成
     */
    static createPlayer() {
        const lessonData = LessonManager.getLessonById(this.currentLesson);
        if (!lessonData) return;

        const playerContainer = document.getElementById('video-player');
        if (!playerContainer) return;

        // プレースホルダーをクリア
        playerContainer.innerHTML = '';

        try {
            this.player = new YT.Player(playerContainer, {
                height: '100%',
                width: '100%',
                videoId: lessonData.videoId || 'dQw4w9WgXcQ', // デモ用のビデオID
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    disablekb: 0,
                    enablejsapi: 1,
                    fs: 1,
                    iv_load_policy: 3,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0
                },
                events: {
                    onReady: (event) => this.onPlayerReady(event),
                    onStateChange: (event) => this.onPlayerStateChange(event),
                    onError: (event) => this.onPlayerError(event)
                }
            });
        } catch (error) {
            console.error('YouTube プレーヤーの作成に失敗:', error);
            this.showVideoError('動画の読み込みに失敗しました');
        }
    }

    /**
     * プレーヤー準備完了時の処理
     */
    static onPlayerReady(event) {
        console.log('動画プレーヤーが準備完了');
        
        this.duration = this.player.getDuration();
        this.updatePlayerInfo();
        
        // 保存された再生位置から開始
        const savedPosition = this.getSavedPosition();
        if (savedPosition > 0) {
            this.player.seekTo(savedPosition, true);
            
            // 続きから再生するか確認
            if (savedPosition > 30) { // 30秒以上の場合のみ確認
                UI.showConfirm(
                    `前回の続き（${this.formatTime(savedPosition)}）から再生しますか？`,
                    {
                        title: '続きから再生',
                        confirmText: 'はい',
                        cancelText: '最初から'
                    }
                ).then(result => {
                    if (!result) {
                        this.player.seekTo(0, true);
                    }
                });
            }
        }

        // 設定された再生速度を適用
        const settings = StorageManager.getSettings();
        this.setPlaybackRate(settings.speed || 1.0);
        
        // 自動再生の設定
        if (settings.autoplay) {
            setTimeout(() => {
                this.play();
            }, 1000);
        }

        // プレーヤーイベントの設定
        this.setupPlayerEvents();
    }

    /**
     * プレーヤー状態変更時の処理
     */
    static onPlayerStateChange(event) {
        const states = {
            [-1]: 'unstarted',
            [0]: 'ended',
            [1]: 'playing',
            [2]: 'paused',
            [3]: 'buffering',
            [5]: 'cued'
        };

        const stateName = states[event.data] || 'unknown';
        console.log('プレーヤー状態変更:', stateName);

        switch (event.data) {
            case YT.PlayerState.PLAYING:
                this.onPlay();
                break;
            case YT.PlayerState.PAUSED:
                this.onPause();
                break;
            case YT.PlayerState.ENDED:
                this.onEnded();
                break;
            case YT.PlayerState.BUFFERING:
                this.onBuffering();
                break;
        }

        this.updateControls();
    }

    /**
     * プレーヤーエラー時の処理
     */
    static onPlayerError(event) {
        const errorMessages = {
            2: '動画IDが無効です',
            5: 'HTML5 プレーヤーでエラーが発生しました',
            100: '動画が見つかりません',
            101: '動画の所有者により埋め込みが禁止されています',
            150: '動画の所有者により埋め込みが禁止されています'
        };

        const message = errorMessages[event.data] || '動画の読み込みでエラーが発生しました';
        console.error('YouTube プレーヤーエラー:', event.data, message);
        
        this.showVideoError(message);
    }

    /**
     * エラー表示
     */
    static showVideoError(message) {
        const playerContainer = document.getElementById('video-player');
        if (playerContainer) {
            playerContainer.innerHTML = `
                <div class="video-error">
                    <div class="error-icon">⚠️</div>
                    <h3>動画を読み込めません</h3>
                    <p>${message}</p>
                    <div class="error-actions">
                        <button class="btn btn-outline" onclick="VideoPlayer.reload()">
                            再読み込み
                        </button>
                        <button class="btn btn-outline" onclick="App.showPage('lessons')">
                            レッスン一覧に戻る
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * プレーヤーの再読み込み
     */
    static reload() {
        this.destroy();
        setTimeout(() => {
            this.initialize(this.currentLesson);
        }, 1000);
    }

    /**
     * 再生開始時の処理
     */
    static onPlay() {
        this.isPlaying = true;
        this.watchStartTime = Date.now();
        
        // 再生状態を保存
        this.savePlayerState();
        
        // UI更新
        this.updateControls();
        
        // 学習時間の記録開始
        this.startTimeTracking();
    }

    /**
     * 一時停止時の処理
     */
    static onPause() {
        this.isPlaying = false;
        this.recordWatchTime();
        
        // 現在位置を保存
        this.saveCurrentPosition();
        
        // UI更新
        this.updateControls();
    }

    /**
     * 再生終了時の処理
     */
    static onEnded() {
        this.isPlaying = false;
        this.recordWatchTime();
        
        // 視聴完了として記録
        this.recordCompletion();
        
        // 次のレッスンを提案
        this.suggestNextLesson();
        
        UI.updateControls();
    }

    /**
     * バッファリング時の処理
     */
    static onBuffering() {
        // バッファリング中のUI表示
        this.showBuffering();
    }

    /**
     * バッファリング表示
     */
    static showBuffering() {
        // 簡易的なバッファリング表示
        console.log('動画をバッファリング中...');
    }

    /**
     * 時間追跡の開始
     */
    static startTimeTracking() {
        if (this.timeTrackingInterval) {
            clearInterval(this.timeTrackingInterval);
        }

        this.timeTrackingInterval = setInterval(() => {
            if (this.isPlaying && this.player) {
                this.currentTime = this.player.getCurrentTime();
                this.saveCurrentPosition();
                this.updateProgressBar();
            }
        }, 1000);
    }

    /**
     * 視聴時間の記録
     */
    static recordWatchTime() {
        if (this.watchStartTime) {
            const sessionTime = (Date.now() - this.watchStartTime) / 1000;
            this.totalWatchTime += sessionTime;
            
            // 進捗データに学習時間を追加
            const progress = StorageManager.getProgress();
            if (progress) {
                progress.totalStudyTime += sessionTime;
                StorageManager.saveProgress(progress);
            }
            
            this.watchStartTime = null;
        }
    }

    /**
     * 視聴完了の記録
     */
    static recordCompletion() {
        if (this.currentLesson) {
            // 80%以上視聴した場合は完了とみなす
            const completionThreshold = 0.8;
            const watchedPercentage = this.currentTime / this.duration;
            
            if (watchedPercentage >= completionThreshold) {
                LessonManager.markComplete(this.currentLesson);
                
                UI.showToast(
                    '🎉 レッスンが完了しました！お疲れさまでした。',
                    'success',
                    4000
                );
            }
        }
    }

    /**
     * 次のレッスンの提案
     */
    static suggestNextLesson() {
        const nextLessonId = LessonManager.getNextLesson(this.currentLesson);
        
        if (nextLessonId) {
            const nextLesson = LessonManager.getLessonById(nextLessonId);
            
            UI.showConfirm(
                `次のレッスン「${nextLesson.title}」を続けて視聴しますか？`,
                {
                    title: '次のレッスン',
                    confirmText: '続ける',
                    cancelText: '後で'
                }
            ).then(result => {
                if (result) {
                    App.showLesson(nextLessonId);
                }
            });
        }
    }

    /**
     * 再生/一時停止の切り替え
     */
    /**
     * 再生/一時停止の切り替え
     */
    static togglePlay() {
        if (!this.player) return;

        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * 再生開始
     */
    static play() {
        if (this.player && typeof this.player.playVideo === 'function') {
            this.player.playVideo();
        }
    }

    /**
     * 一時停止
     */
    static pause() {
        if (this.player && typeof this.player.pauseVideo === 'function') {
            this.player.pauseVideo();
        }
    }

    /**
     * 再生位置の設定
     */
    static seekTo(seconds) {
        if (this.player && typeof this.player.seekTo === 'function') {
            this.player.seekTo(seconds, true);
            this.currentTime = seconds;
        }
    }

    /**
     * 再生速度の設定
     */
    static setPlaybackRate(rate) {
        if (this.player && typeof this.player.setPlaybackRate === 'function') {
            this.player.setPlaybackRate(rate);
            this.playbackRate = rate;
            
            // 設定を保存
            const settings = StorageManager.getSettings();
            settings.speed = rate;
            StorageManager.saveSettings(settings);
            
            // UI更新
            this.updateSpeedIndicator();
        }
    }

    /**
     * 再生速度の切り替え
     */
    static toggleSpeed() {
        const speeds = [0.75, 1.0, 1.25, 1.5, 2.0];
        const currentIndex = speeds.indexOf(this.playbackRate);
        const nextIndex = (currentIndex + 1) % speeds.length;
        
        this.setPlaybackRate(speeds[nextIndex]);
        
        UI.showToast(
            `再生速度を${speeds[nextIndex]}倍に変更しました`,
            'info',
            2000
        );
    }

    /**
     * 音量の設定
     */
    static setVolume(volume) {
        if (this.player && typeof this.player.setVolume === 'function') {
            this.player.setVolume(Math.max(0, Math.min(100, volume * 100)));
            this.volume = volume;
        }
    }

    /**
     * ミュート切り替え
     */
    static toggleMute() {
        if (!this.player) return;

        if (this.player.isMuted()) {
            this.player.unMute();
        } else {
            this.player.mute();
        }
    }

    /**
     * フルスクリーン切り替え
     */
    static toggleFullscreen() {
        const playerContainer = document.getElementById('video-player');
        if (!playerContainer) return;

        if (!this.isFullscreen) {
            // フルスクリーン開始
            if (playerContainer.requestFullscreen) {
                playerContainer.requestFullscreen();
            } else if (playerContainer.webkitRequestFullscreen) {
                playerContainer.webkitRequestFullscreen();
            } else if (playerContainer.mozRequestFullScreen) {
                playerContainer.mozRequestFullScreen();
            } else if (playerContainer.msRequestFullscreen) {
                playerContainer.msRequestFullscreen();
            }
        } else {
            // フルスクリーン終了
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    /**
     * 字幕の切り替え
     */
    static toggleSubtitles() {
        // YouTube APIの字幕制御は制限があるため、
        // ユーザーに手動での操作を促す
        UI.showToast(
            '字幕の切り替えは動画プレーヤーの「CC」ボタンから行えます',
            'info',
            3000
        );
    }

    /**
     * プレーヤー情報の更新
     */
    static updatePlayerInfo() {
        if (!this.player) return;

        try {
            this.duration = this.player.getDuration();
            this.currentTime = this.player.getCurrentTime();
            
            // レッスン情報の表示更新
            this.updateLessonInfo();
            
        } catch (error) {
            console.error('プレーヤー情報の更新に失敗:', error);
        }
    }

    /**
     * レッスン情報の表示更新
     */
    static updateLessonInfo() {
        const lessonData = LessonManager.getLessonById(this.currentLesson);
        if (!lessonData) return;

        // レッスンタイトルの更新
        const titleElement = document.getElementById('current-lesson-title');
        if (titleElement) {
            titleElement.textContent = lessonData.title;
        }

        // 動画時間の表示
        const durationText = this.formatTime(this.duration);
        // 必要に応じて時間表示を更新
    }

    /**
     * コントロールの更新
     */
    static updateControls() {
        this.updateSpeedIndicator();
        this.updateProgressBar();
    }

    /**
     * 速度インジケーターの更新
     */
    static updateSpeedIndicator() {
        const speedElement = document.getElementById('speed-indicator');
        if (speedElement) {
            speedElement.textContent = `${this.playbackRate}x`;
        }
    }

    /**
     * プログレスバーの更新
     */
    static updateProgressBar() {
        if (!this.player || this.duration === 0) return;

        const progress = (this.currentTime / this.duration) * 100;
        
        // 動画内のプログレスバー更新
        const progressBar = document.querySelector('.video-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        // 時間表示の更新
        const currentTimeElement = document.querySelector('.current-time');
        const totalTimeElement = document.querySelector('.total-time');
        
        if (currentTimeElement) {
            currentTimeElement.textContent = this.formatTime(this.currentTime);
        }
        
        if (totalTimeElement) {
            totalTimeElement.textContent = this.formatTime(this.duration);
        }
    }

    /**
     * 時間のフォーマット
     */
    static formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    /**
     * プレーヤーイベントの設定
     */
    static setupPlayerEvents() {
        // フルスクリーン変更の監視
        document.addEventListener('fullscreenchange', () => {
            this.isFullscreen = !!document.fullscreenElement;
        });

        // ページの可視性変更時の処理
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isPlaying) {
                // ページが非表示になった時は一時停止
                this.pause();
            }
        });

        // ウィンドウのフォーカス変更
        window.addEventListener('blur', () => {
            if (this.isPlaying) {
                this.recordWatchTime();
            }
        });

        window.addEventListener('focus', () => {
            if (this.isPlaying) {
                this.watchStartTime = Date.now();
            }
        });
    }

    /**
     * カスタムコントロールの設定
     */
    static setupControls() {
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (App.currentPage !== 'lesson-detail') return;
            
            switch (e.key) {
                case ' ':
                    e.preventDefault();
                    this.togglePlay();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.seekTo(Math.max(0, this.currentTime - 10));
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.seekTo(Math.min(this.duration, this.currentTime + 10));
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.setVolume(Math.min(1, this.volume + 0.1));
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.setVolume(Math.max(0, this.volume - 0.1));
                    break;
                case 'f':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'm':
                    e.preventDefault();
                    this.toggleMute();
                    break;
            }
        });
    }

    /**
     * プレーヤー状態の保存
     */
    static savePlayerState() {
        const state = {
            lessonId: this.currentLesson,
            currentTime: this.currentTime,
            playbackRate: this.playbackRate,
            volume: this.volume,
            totalWatchTime: this.totalWatchTime,
            lastSaved: Date.now()
        };

        localStorage.setItem('video_player_state', JSON.stringify(state));
    }

    /**
     * プレーヤー状態の読み込み
     */
    static loadPlayerState() {
        try {
            const stateData = localStorage.getItem('video_player_state');
            if (stateData) {
                const state = JSON.parse(stateData);
                
                if (state.lessonId === this.currentLesson) {
                    this.currentTime = state.currentTime || 0;
                    this.playbackRate = state.playbackRate || 1.0;
                    this.volume = state.volume || 1.0;
                    this.totalWatchTime = state.totalWatchTime || 0;
                }
            }
        } catch (error) {
            console.error('プレーヤー状態の読み込みに失敗:', error);
        }
    }

    /**
     * 現在位置の保存
     */
    static saveCurrentPosition() {
        if (this.currentLesson && this.currentTime > 0) {
            const key = `video_position_${this.currentLesson}`;
            localStorage.setItem(key, this.currentTime.toString());
        }
    }

    /**
     * 保存された位置の取得
     */
    static getSavedPosition() {
        if (!this.currentLesson) return 0;
        
        try {
            const key = `video_position_${this.currentLesson}`;
            const savedPosition = localStorage.getItem(key);
            return savedPosition ? parseFloat(savedPosition) : 0;
        } catch (error) {
            console.error('保存された位置の取得に失敗:', error);
            return 0;
        }
    }

    /**
     * 視聴データの分析
     */
    static getWatchAnalytics() {
        const analytics = {
            lessonId: this.currentLesson,
            totalWatchTime: this.totalWatchTime,
            currentPosition: this.currentTime,
            duration: this.duration,
            completionPercentage: this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0,
            averageSpeed: this.playbackRate,
            watchSessions: this.getWatchSessions()
        };

        return analytics;
    }

    /**
     * 視聴セッションの取得
     */
    static getWatchSessions() {
        try {
            const key = `watch_sessions_${this.currentLesson}`;
            const sessionsData = localStorage.getItem(key);
            return sessionsData ? JSON.parse(sessionsData) : [];
        } catch (error) {
            console.error('視聴セッションの取得に失敗:', error);
            return [];
        }
    }

    /**
     * 視聴セッションの記録
     */
    static recordWatchSession() {
        if (!this.currentLesson) return;

        try {
            const sessions = this.getWatchSessions();
            const session = {
                startTime: this.watchStartTime,
                endTime: Date.now(),
                watchDuration: this.totalWatchTime,
                startPosition: 0, // 簡略化
                endPosition: this.currentTime,
                playbackRate: this.playbackRate
            };

            sessions.push(session);
            
            // 最新20セッションのみ保持
            if (sessions.length > 20) {
                sessions.splice(0, sessions.length - 20);
            }

            const key = `watch_sessions_${this.currentLesson}`;
            localStorage.setItem(key, JSON.stringify(sessions));
        } catch (error) {
            console.error('視聴セッションの記録に失敗:', error);
        }
    }

    /**
     * プレーヤーの破棄
     */
    static destroy() {
        // 時間追跡の停止
        if (this.timeTrackingInterval) {
            clearInterval(this.timeTrackingInterval);
            this.timeTrackingInterval = null;
        }

        // 視聴時間の記録
        this.recordWatchTime();
        this.recordWatchSession();

        // プレーヤー状態の保存
        this.savePlayerState();

        // YouTube プレーヤーの破棄
        if (this.player && typeof this.player.destroy === 'function') {
            try {
                this.player.destroy();
            } catch (error) {
                console.error('プレーヤーの破棄に失敗:', error);
            }
        }

        // 状態のリセット
        this.player = null;
        this.isPlaying = false;
        this.currentTime = 0;
        this.duration = 0;
        this.watchStartTime = null;
    }

    /**
     * デバッグ情報の表示
     */
    static getDebugInfo() {
        return {
            currentLesson: this.currentLesson,
            isPlaying: this.isPlaying,
            currentTime: this.currentTime,
            duration: this.duration,
            playbackRate: this.playbackRate,
            volume: this.volume,
            totalWatchTime: this.totalWatchTime,
            playerState: this.player ? this.player.getPlayerState() : 'No player',
            videoId: this.player ? this.player.getVideoData().video_id : 'Unknown'
        };
    }

    /**
     * プレーヤーの状態チェック
     */
    static healthCheck() {
        const issues = [];

        if (!this.player) {
            issues.push('プレーヤーが初期化されていません');
        }

        if (this.duration === 0) {
            issues.push('動画の長さが取得できません');
        }

        if (this.currentLesson && !LessonManager.getLessonById(this.currentLesson)) {
            issues.push('無効なレッスンIDです');
        }

        return {
            healthy: issues.length === 0,
            issues: issues,
            debugInfo: this.getDebugInfo()
        };
    }
}

// YouTube IFrame API のグローバルコールバック
window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube IFrame API が準備完了');
    if (VideoPlayer.currentLesson) {
        VideoPlayer.createPlayer();
    }
};