/**
 * ストレージ管理クラス
 * LocalStorageを使用したデータの永続化
 */
class StorageManager {
    static KEYS = {
        PROGRESS: 'ai_school_progress',
        CURRENT_LESSON: 'ai_school_current_lesson',
        CURRENT_SESSION: 'ai_school_current_session',
        ACCESS_LOG: 'ai_school_access_log',
        NOTES: 'ai_school_notes',
        BOOKMARKS: 'ai_school_bookmarks',
        SETTINGS: 'ai_school_settings',
        COMPLETION_TIMES: 'ai_school_completion_times'
    };

    /**
     * 進捗データの取得
     */
    static getProgress() {
        try {
            const data = localStorage.getItem(this.KEYS.PROGRESS);
            if (data) {
                const progress = JSON.parse(data);
                // データのバリデーション
                return this.validateProgressData(progress);
            }
            return null;
        } catch (error) {
            console.error('進捗データの取得に失敗:', error);
            return null;
        }
    }

    /**
     * 進捗データの保存
     */
    static saveProgress(progressData) {
        try {
            // 最終更新日時を追加
            progressData.lastUpdated = new Date().toISOString();
            
            const dataString = JSON.stringify(progressData);
            localStorage.setItem(this.KEYS.PROGRESS, dataString);
            
            console.log('進捗データを保存しました');
            return true;
        } catch (error) {
            console.error('進捗データの保存に失敗:', error);
            return false;
        }
    }

    /**
     * 進捗データのバリデーション
     */
    static validateProgressData(data) {
        const defaultProgress = {
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

        // 必須フィールドの確認と補完
        return {
            ...defaultProgress,
            ...data,
            settings: {
                ...defaultProgress.settings,
                ...data.settings
            }
        };
    }

    /**
     * 現在のレッスンの取得
     */
    static getCurrentLesson() {
        try {
            return localStorage.getItem(this.KEYS.CURRENT_LESSON) || '1-1';
        } catch (error) {
            console.error('現在のレッスンの取得に失敗:', error);
            return '1-1';
        }
    }

    /**
     * 現在のレッスンの設定
     */
    static setCurrentLesson(lessonId) {
        try {
            localStorage.setItem(this.KEYS.CURRENT_LESSON, lessonId);
            
            // 進捗データも更新
            const progress = this.getProgress();
            if (progress) {
                progress.currentLesson = lessonId;
                progress.lastAccessDate = new Date().toISOString();
                this.saveProgress(progress);
            }
            
            return true;
        } catch (error) {
            console.error('現在のレッスンの設定に失敗:', error);
            return false;
        }
    }

    /**
     * レッスン完了の記録
     */
    static markLessonComplete(lessonId) {
        try {
            const progress = this.getProgress();
            if (!progress) return false;

            // 既に完了済みでない場合のみ追加
            if (!progress.completedLessons.includes(lessonId)) {
                progress.completedLessons.push(lessonId);
                
                // 完了時刻を記録
                this.recordCompletionTime(lessonId);
                
                // 章の進捗を更新
                const chapterNum = parseInt(lessonId.split('-')[0]);
                if (chapterNum > progress.currentChapter) {
                    progress.currentChapter = chapterNum;
                }
                
                this.saveProgress(progress);
                console.log(`レッスン ${lessonId} を完了としてマークしました`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('レッスン完了の記録に失敗:', error);
            return false;
        }
    }

    /**
     * レッスン完了の取り消し
     */
    static unmarkLessonComplete(lessonId) {
        try {
            const progress = this.getProgress();
            if (!progress) return false;

            const index = progress.completedLessons.indexOf(lessonId);
            if (index > -1) {
                progress.completedLessons.splice(index, 1);
                this.saveProgress(progress);
                console.log(`レッスン ${lessonId} の完了をキャンセルしました`);
                return true;
            }
            return false;
        } catch (error) {
            console.error('レッスン完了の取り消しに失敗:', error);
            return false;
        }
    }

    /**
     * 完了時刻の記録
     */
    static recordCompletionTime(lessonId) {
        try {
            const completionTimes = this.getCompletionTimes();
            completionTimes[lessonId] = new Date().toISOString();
            localStorage.setItem(this.KEYS.COMPLETION_TIMES, JSON.stringify(completionTimes));
        } catch (error) {
            console.error('完了時刻の記録に失敗:', error);
        }
    }

    /**
     * 完了時刻の取得
     */
    static getCompletionTimes() {
        try {
            const data = localStorage.getItem(this.KEYS.COMPLETION_TIMES);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('完了時刻の取得に失敗:', error);
            return {};
        }
    }

    /**
     * メモの保存
     */
    static saveNote(lessonId, note) {
        try {
            const notes = this.getNotes();
            notes[lessonId] = {
                content: note,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(this.KEYS.NOTES, JSON.stringify(notes));
            return true;
        } catch (error) {
            console.error('メモの保存に失敗:', error);
            return false;
        }
    }

    /**
     * メモの取得
     */
    static getNote(lessonId) {
        try {
            const notes = this.getNotes();
            return notes[lessonId]?.content || '';
        } catch (error) {
            console.error('メモの取得に失敗:', error);
            return '';
        }
    }

    /**
     * 全メモの取得
     */
    static getNotes() {
        try {
            const data = localStorage.getItem(this.KEYS.NOTES);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('メモデータの取得に失敗:', error);
            return {};
        }
    }

    /**
     * ブックマークの追加/削除
     */
    static toggleBookmark(lessonId) {
        try {
            const bookmarks = this.getBookmarks();
            const index = bookmarks.indexOf(lessonId);
            
            if (index > -1) {
                bookmarks.splice(index, 1);
            } else {
                bookmarks.push(lessonId);
            }
            
            localStorage.setItem(this.KEYS.BOOKMARKS, JSON.stringify(bookmarks));
            return index === -1; // 追加された場合true
        } catch (error) {
            console.error('ブックマークの操作に失敗:', error);
            return false;
        }
    }

    /**
     * ブックマーク一覧の取得
     */
    static getBookmarks() {
        try {
            const data = localStorage.getItem(this.KEYS.BOOKMARKS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('ブックマークの取得に失敗:', error);
            return [];
        }
    }

    /**
     * 設定の保存
     */
    static saveSettings(settings) {
        try {
            const currentSettings = this.getSettings();
            const newSettings = { ...currentSettings, ...settings };
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(newSettings));
            return true;
        } catch (error) {
            console.error('設定の保存に失敗:', error);
            return false;
        }
    }

    /**
     * 設定の取得
     */
    static getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            const defaultSettings = {
                notifications: true,
                autoplay: false,
                speed: 1.0,
                theme: 'light',
                language: 'ja'
            };
            
            return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
        } catch (error) {
            console.error('設定の取得に失敗:', error);
            return {
                notifications: true,
                autoplay: false,
                speed: 1.0,
                theme: 'light',
                language: 'ja'
            };
        }
    }

    /**
     * 現在のセッション情報の設定
     */
    static setCurrentSession(sessionData) {
        try {
            localStorage.setItem(this.KEYS.CURRENT_SESSION, JSON.stringify(sessionData));
            return true;
        } catch (error) {
            console.error('セッション情報の設定に失敗:', error);
            return false;
        }
    }

    /**
     * 現在のセッション情報の取得
     */
    static getCurrentSession() {
        try {
            const data = localStorage.getItem(this.KEYS.CURRENT_SESSION);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('セッション情報の取得に失敗:', error);
            return null;
        }
    }

    /**
     * アクセスログの保存
     */
    static saveAccessLog(logData) {
        try {
            localStorage.setItem(this.KEYS.ACCESS_LOG, JSON.stringify(logData));
            return true;
        } catch (error) {
            console.error('アクセスログの保存に失敗:', error);
            return false;
        }
    }

    /**
     * アクセスログの取得
     */
    static getAccessLog() {
        try {
            const data = localStorage.getItem(this.KEYS.ACCESS_LOG);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('アクセスログの取得に失敗:', error);
            return [];
        }
    }

    /**
     * 学習統計の計算
     */
    static getStudyStatistics() {
        try {
            const progress = this.getProgress();
            const completionTimes = this.getCompletionTimes();
            
            if (!progress) return null;

            const startDate = new Date(progress.startDate);
            const today = new Date();
            const studyDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));
            
            // 完了率の計算
            const completionRate = (progress.completedLessons.length / progress.totalLessons) * 100;
            
            // 平均学習時間の計算
            const avgTimePerLesson = progress.completedLessons.length > 0 
                ? progress.totalStudyTime / progress.completedLessons.length 
                : 0;

            // 章別の進捗
            const chapterProgress = this.calculateChapterProgress(progress);

            return {
                totalLessons: progress.totalLessons,
                completedLessons: progress.completedLessons.length,
                completionRate: Math.round(completionRate),
                studyDays,
                totalStudyTime: progress.totalStudyTime,
                avgTimePerLesson,
                currentStreak: this.calculateCurrentStreak(completionTimes),
                chapterProgress
            };
        } catch (error) {
            console.error('学習統計の計算に失敗:', error);
            return null;
        }
    }

    /**
     * 章別進捗の計算
     */
    static calculateChapterProgress(progress) {
        const chapters = Array.from({length: 9}, (_, i) => ({
            chapter: i + 1,
            completed: 0,
            total: 0
        }));

        // 各章のレッスン数を設定（実際のデータに基づく）
        const chapterLessonCounts = [5, 8, 12, 6, 10, 8, 9, 7, 6]; // 例
        
        chapters.forEach((chapter, index) => {
            chapter.total = chapterLessonCounts[index];
            chapter.completed = progress.completedLessons.filter(
                lessonId => lessonId.startsWith(`${chapter.chapter}-`)
            ).length;
            chapter.percentage = Math.round((chapter.completed / chapter.total) * 100);
        });

        return chapters;
    }

    /**
     * 現在の連続学習日数の計算
     */
    static calculateCurrentStreak(completionTimes) {
        try {
            const dates = Object.values(completionTimes)
                .map(time => new Date(time).toDateString())
                .filter((date, index, array) => array.indexOf(date) === index)
                .sort()
                .reverse();

            let streak = 0;
            const today = new Date().toDateString();
            
            for (let i = 0; i < dates.length; i++) {
                const date = new Date(dates[i]);
                const expectedDate = new Date();
                expectedDate.setDate(expectedDate.getDate() - i);
                
                if (date.toDateString() === expectedDate.toDateString()) {
                    streak++;
                } else {
                    break;
                }
            }

            return streak;
        } catch (error) {
            console.error('連続学習日数の計算に失敗:', error);
            return 0;
        }
    }

    /**
     * データのエクスポート
     */
    static exportData() {
        try {
            const exportData = {
                progress: this.getProgress(),
                notes: this.getNotes(),
                bookmarks: this.getBookmarks(),
                settings: this.getSettings(),
                completionTimes: this.getCompletionTimes(),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            return JSON.stringify(exportData, null, 2);
        } catch (error) {
            console.error('データのエクスポートに失敗:', error);
            return null;
        }
    }

    /**
     * データのインポート
     */
    static importData(dataString) {
        try {
            const importData = JSON.parse(dataString);
            
            // データの妥当性チェック
            if (!importData.version || !importData.progress) {
                throw new Error('無効なデータ形式です');
            }

            // 各データの復元
            if (importData.progress) this.saveProgress(importData.progress);
            if (importData.notes) localStorage.setItem(this.KEYS.NOTES, JSON.stringify(importData.notes));
            if (importData.bookmarks) localStorage.setItem(this.KEYS.BOOKMARKS, JSON.stringify(importData.bookmarks));
            if (importData.settings) localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(importData.settings));
            if (importData.completionTimes) localStorage.setItem(this.KEYS.COMPLETION_TIMES, JSON.stringify(importData.completionTimes));

            console.log('データのインポートが完了しました');
            return true;
        } catch (error) {
            console.error('データのインポートに失敗:', error);
            return false;
        }
    }

    /**
     * 全データの削除
     */
    static clearAllData() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            console.log('全データを削除しました');
            return true;
        } catch (error) {
            console.error('データの削除に失敗:', error);
            return false;
        }
    }

    /**
     * ストレージ使用量の取得
     */
    static getStorageUsage() {
        try {
            let totalSize = 0;
            const usage = {};

            Object.entries(this.KEYS).forEach(([name, key]) => {
                const data = localStorage.getItem(key);
                const size = data ? new Blob([data]).size : 0;
                usage[name] = {
                    size,
                    sizeFormatted: this.formatBytes(size)
                };
                totalSize += size;
            });

            return {
                total: totalSize,
                totalFormatted: this.formatBytes(totalSize),
                breakdown: usage
            };
        } catch (error) {
            console.error('ストレージ使用量の取得に失敗:', error);
            return null;
        }
    }

    /**
     * バイト数をフォーマット
     */
    static formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}