/**
 * ユーティリティ関数集
 * 汎用的な機能を提供
 */

/**
 * メモ管理クラス
 */
class NotesManager {
    /**
     * メモの保存
     */
    static save() {
        const textarea = document.getElementById('lesson-memo');
        if (!textarea || !App.currentLesson) return false;

        const noteContent = textarea.value.trim();
        const success = StorageManager.saveNote(App.currentLesson, noteContent);
        
        if (success) {
            UI.showToast('📝 メモを保存しました', 'success', 2000);
            return true;
        } else {
            UI.showToast('❌ メモの保存に失敗しました', 'error', 3000);
            return false;
        }
    }

    /**
     * メモの読み込み
     */
    static loadNotes(lessonId) {
        const textarea = document.getElementById('lesson-memo');
        if (!textarea) return;

        const noteContent = StorageManager.getNote(lessonId);
        textarea.value = noteContent;
    }

    /**
     * メモのクリア
     */
    static clear() {
        UI.showConfirm(
            'メモの内容を削除しますか？この操作は取り消せません。',
            {
                title: 'メモの削除',
                confirmText: '削除',
                cancelText: 'キャンセル'
            }
        ).then(result => {
            if (result) {
                const textarea = document.getElementById('lesson-memo');
                if (textarea) {
                    textarea.value = '';
                    this.save();
                }
            }
        });
    }

    /**
     * 全メモのエクスポート
     */
    static export() {
        const notes = StorageManager.getNotes();
        const exportData = {
            exportDate: new Date().toISOString(),
            notes: notes
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `ai-school-notes-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        UI.showToast('📄 メモをダウンロードしました', 'success');
    }
}

/**
 * デバイス検出ユーティリティ
 */
class DeviceUtils {
    /**
     * モバイルデバイスの判定
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * タッチデバイスの判定
     */
    static isTouch() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    /**
     * iOS デバイスの判定
     */
    static isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    /**
     * Android デバイスの判定
     */
    static isAndroid() {
        return /Android/.test(navigator.userAgent);
    }

    /**
     * デバイス情報の取得
     */
    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            isMobile: this.isMobile(),
            isTouch: this.isTouch(),
            isIOS: this.isIOS(),
            isAndroid: this.isAndroid(),
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown'
        };
    }

    /**
     * ネットワーク情報の取得
     */
    static getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        if (connection) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt,
                saveData: connection.saveData
            };
        }
        
        return null;
    }
}

/**
 * 日付・時間ユーティリティ
 */
class DateUtils {
    /**
     * 相対時間の表示
     */
    static getRelativeTime(date) {
        const now = new Date();
        const targetDate = new Date(date);
        const diffMs = now - targetDate;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return 'たった今';
        } else if (diffMin < 60) {
            return `${diffMin}分前`;
        } else if (diffHour < 24) {
            return `${diffHour}時間前`;
        } else if (diffDay < 7) {
            return `${diffDay}日前`;
        } else {
            return targetDate.toLocaleDateString('ja-JP');
        }
    }

    /**
     * 学習時間のフォーマット
     */
    static formatStudyTime(seconds) {
        if (seconds < 60) {
            return `${Math.floor(seconds)}秒`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes}分`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}時間${minutes}分`;
        }
    }

    /**
     * 日本語の曜日取得
     */
    static getJapaneseWeekday(date) {
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        return weekdays[new Date(date).getDay()];
    }

    /**
     * 学習カレンダー用のデータ生成
     */
    static generateStudyCalendar(completionTimes, days = 30) {
        const calendar = [];
        const today = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dateStr = date.toDateString();
            const studyCount = Object.values(completionTimes).filter(
                time => new Date(time).toDateString() === dateStr
            ).length;
            
            calendar.push({
                date: date,
                dateStr: dateStr,
                dayOfWeek: this.getJapaneseWeekday(date),
                studyCount: studyCount,
                hasStudy: studyCount > 0
            });
        }
        
        return calendar;
    }
}

/**
 * 文字列ユーティリティ
 */
class StringUtils {
    /**
     * 文字列の切り詰め
     */
    static truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length - suffix.length) + suffix;
    }

    /**
     * HTMLエスケープ
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 検索ハイライト
     */
    static highlightSearch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    /**
     * 正規表現のエスケープ
     */
    static escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * カナをひらがなに変換
     */
    static katakanaToHiragana(str) {
        return str.replace(/[\u30a1-\u30f6]/g, function(match) {
            const chr = match.charCodeAt(0) - 0x60;
            return String.fromCharCode(chr);
        });
    }

    /**
     * 全角英数字を半角に変換
     */
    static zenkakuToHankaku(str) {
        return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function(s) {
            return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
        });
    }
}

/**
 * バリデーションユーティリティ
 */
class ValidationUtils {
    /**
     * メールアドレスの検証
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * URLの検証
     */
    static isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * レッスンIDの検証
     */
    static isValidLessonId(lessonId) {
        const lessonIdRegex = /^\d+-\d+$/;
        return lessonIdRegex.test(lessonId);
    }

    /**
     * 入力値のサニタイズ
     */
    static sanitizeInput(input) {
        return input
            .trim()
            .replace(/[<>]/g, '') // 基本的なXSS対策
            .substring(0, 1000); // 長さ制限
    }
}

/**
 * パフォーマンス測定ユーティリティ
 */
class PerformanceUtils {
    static timers = new Map();

    /**
     * 時間測定開始
     */
    static startTimer(name) {
        this.timers.set(name, performance.now());
    }

    /**
     * 時間測定終了
     */
    static endTimer(name) {
        const startTime = this.timers.get(name);
        if (startTime) {
            const duration = performance.now() - startTime;
            this.timers.delete(name);
            return duration;
        }
        return null;
    }

    /**
     * メモリ使用量の取得
     */
    static getMemoryUsage() {
        if (performance.memory) {
            return {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
        }
        return null;
    }

    /**
     * ページロード時間の取得
     */
    static getPageLoadTime() {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            return {
                domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.navigationStart),
                loadComplete: Math.round(navigation.loadEventEnd - navigation.navigationStart),
                firstPaint: this.getFirstPaint()
            };
        }
        return null;
    }

    /**
     * First Paint の取得
     */
    static getFirstPaint() {
        const paintEntries = performance.getEntriesByType('paint');
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? Math.round(firstPaint.startTime) : null;
    }
}

/**
 * アニメーションユーティリティ
 */
class AnimationUtils {
    /**
     * イージング関数
     */
    static easing = {
        linear: t => t,
        easeInQuad: t => t * t,
        easeOutQuad: t => t * (2 - t),
        easeInOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        easeInCubic: t => t * t * t,
        easeOutCubic: t => (--t) * t * t + 1,
        easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    };

    /**
     * 数値のアニメーション
     */
    /**
     * 数値のアニメーション
     */
    static animateNumber(from, to, duration, callback, easingName = 'easeOutQuad') {
        const startTime = performance.now();
        const change = to - from;
        const easing = this.easing[easingName] || this.easing.linear;

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easing(progress);
            const currentValue = from + (change * easedProgress);

            callback(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 要素のフェードイン
     */
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';

        this.animateNumber(0, 1, duration, (opacity) => {
            element.style.opacity = opacity;
        });
    }

    /**
     * 要素のフェードアウト
     */
    static fadeOut(element, duration = 300, callback = null) {
        this.animateNumber(1, 0, duration, (opacity) => {
            element.style.opacity = opacity;
        });

        setTimeout(() => {
            element.style.display = 'none';
            if (callback) callback();
        }, duration);
    }

    /**
     * スライドアニメーション
     */
    static slideToggle(element, duration = 300) {
        const isVisible = element.style.display !== 'none';
        
        if (isVisible) {
            this.slideUp(element, duration);
        } else {
            this.slideDown(element, duration);
        }
    }

    /**
     * スライドダウン
     */
    static slideDown(element, duration = 300) {
        element.style.display = 'block';
        const targetHeight = element.scrollHeight;
        element.style.height = '0px';
        element.style.overflow = 'hidden';

        this.animateNumber(0, targetHeight, duration, (height) => {
            element.style.height = height + 'px';
        });

        setTimeout(() => {
            element.style.height = '';
            element.style.overflow = '';
        }, duration);
    }

    /**
     * スライドアップ
     */
    static slideUp(element, duration = 300) {
        const startHeight = element.scrollHeight;
        element.style.height = startHeight + 'px';
        element.style.overflow = 'hidden';

        this.animateNumber(startHeight, 0, duration, (height) => {
            element.style.height = height + 'px';
        });

        setTimeout(() => {
            element.style.display = 'none';
            element.style.height = '';
            element.style.overflow = '';
        }, duration);
    }
}

/**
 * ファイルユーティリティ
 */
class FileUtils {
    /**
     * ファイルサイズのフォーマット
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * ファイルのダウンロード
     */
    static downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * 画像ファイルの読み込み
     */
    static loadImage(file) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                reject(new Error('画像ファイルではありません'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * CSVファイルの解析
     */
    static parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(header => header.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(value => value.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index] || '';
                });
                data.push(row);
            }
        }

        return { headers, data };
    }
}

/**
 * 通知ユーティリティ
 */
class NotificationUtils {
    static permission = null;

    /**
     * 通知許可の要求
     */
    static async requestPermission() {
        if (!('Notification' in window)) {
            return 'unsupported';
        }

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            return 'granted';
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            this.permission = permission;
            return permission;
        }

        this.permission = 'denied';
        return 'denied';
    }

    /**
     * 通知の表示
     */
    static async showNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            const permission = await this.requestPermission();
            if (permission !== 'granted') {
                return null;
            }
        }

        const defaultOptions = {
            icon: '/assets/icons/favicon-32x32.png',
            badge: '/assets/icons/favicon-16x16.png',
            tag: 'ai-school-notification',
            requireInteraction: false,
            silent: false
        };

        const notification = new Notification(title, { ...defaultOptions, ...options });
        
        // 自動で閉じる
        if (options.autoClose !== false) {
            setTimeout(() => {
                notification.close();
            }, options.duration || 5000);
        }

        return notification;
    }

    /**
     * 学習リマインダー通知
     */
    static showStudyReminder() {
        const messages = [
            '今日の学習はいかがですか？📚',
            '新しいレッスンが待っています！✨',
            '少しずつでも継続が大切です🌱',
            'AIの世界を一緒に探索しましょう🤖'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        
        return this.showNotification('AIオンラインスクール', {
            body: randomMessage,
            tag: 'study-reminder',
            actions: [
                { action: 'continue', title: '学習を続ける' },
                { action: 'later', title: '後で' }
            ]
        });
    }

    /**
     * 成果通知
     */
    static showAchievementNotification(achievement) {
        return this.showNotification('🎉 おめでとうございます！', {
            body: achievement,
            tag: 'achievement',
            requireInteraction: true,
            duration: 8000
        });
    }
}

/**
 * URL ユーティリティ
 */
class URLUtils {
    /**
     * URLパラメータの取得
     */
    static getQueryParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    /**
     * URLパラメータの設定
     */
    static setQueryParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    }

    /**
     * URLパラメータの削除
     */
    static removeQueryParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    }

    /**
     * ディープリンクの生成
     */
    static createDeepLink(page, params = {}) {
        const url = new URL(window.location.origin);
        url.searchParams.set('page', page);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
        
        return url.toString();
    }

    /**
     * LINEディープリンクの生成
     */
    static createLineDeepLink(message = '') {
        const lineId = '@schoolsupport'; // 実際のLINE ID
        const encodedMessage = encodeURIComponent(message);
        return `line://ti/p/${lineId}?message=${encodedMessage}`;
    }
}

/**
 * キャッシュユーティリティ
 */
class CacheUtils {
    static cache = new Map();
    static maxSize = 100;
    static ttl = 5 * 60 * 1000; // 5分

    /**
     * キャッシュに保存
     */
    static set(key, value, customTTL = null) {
        // サイズ制限チェック
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        const expiresAt = Date.now() + (customTTL || this.ttl);
        this.cache.set(key, { value, expiresAt });
    }

    /**
     * キャッシュから取得
     */
    static get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            return null;
        }

        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    /**
     * キャッシュから削除
     */
    static delete(key) {
        return this.cache.delete(key);
    }

    /**
     * キャッシュをクリア
     */
    static clear() {
        this.cache.clear();
    }

    /**
     * 期限切れアイテムの削除
     */
    static cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}

/**
 * 色ユーティリティ
 */
class ColorUtils {
    /**
     * HEXからRGBに変換
     */
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * RGBからHEXに変換
     */
    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    /**
     * 色の明度計算
     */
    static getLuminance(hex) {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 0;

        const { r, g, b } = rgb;
        return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    }

    /**
     * コントラスト比の計算
     */
    static getContrastRatio(color1, color2) {
        const lum1 = this.getLuminance(color1);
        const lum2 = this.getLuminance(color2);
        
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        
        return (brightest + 0.05) / (darkest + 0.05);
    }

    /**
     * 進捗に応じた色の生成
     */
    static getProgressColor(percentage) {
        if (percentage < 25) return '#ff6b6b'; // 赤
        if (percentage < 50) return '#ffa726'; // オレンジ
        if (percentage < 75) return '#ffca28'; // 黄
        return '#66bb6a'; // 緑
    }
}

/**
 * エラーハンドリングユーティリティ
 */
class ErrorUtils {
    static errorLog = [];
    static maxLogSize = 50;

    /**
     * エラーの記録
     */
    static logError(error, context = '') {
        const errorInfo = {
            timestamp: new Date().toISOString(),
            message: error.message || 'Unknown error',
            stack: error.stack || '',
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.errorLog.push(errorInfo);
        
        // ログサイズ制限
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // コンソールにも出力
        console.error('Error logged:', errorInfo);
        
        return errorInfo;
    }

    /**
     * ユーザーフレンドリーなエラーメッセージの生成
     */
    static getFriendlyErrorMessage(error) {
        const friendlyMessages = {
            'NetworkError': 'インターネット接続を確認してください',
            'TypeError': 'アプリケーションエラーが発生しました',
            'ReferenceError': 'アプリケーションエラーが発生しました',
            'SyntaxError': 'データの形式に問題があります',
            'QuotaExceededError': 'ストレージの容量が不足しています'
        };

        const errorName = error.name || error.constructor.name;
        return friendlyMessages[errorName] || '予期しないエラーが発生しました';
    }

    /**
     * グローバルエラーハンドラーの設定
     */
    static setupGlobalErrorHandler() {
        window.addEventListener('error', (event) => {
            this.logError(event.error, 'Global error handler');
            
            UI.showToast(
                this.getFriendlyErrorMessage(event.error),
                'error',
                5000
            );
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason, 'Unhandled promise rejection');
            
            UI.showToast(
                'データの処理中にエラーが発生しました',
                'error',
                5000
            );
        });
    }

    /**
     * エラーログのエクスポート
     */
    static exportErrorLog() {
        const exportData = {
            exportDate: new Date().toISOString(),
            deviceInfo: DeviceUtils.getDeviceInfo(),
            errors: this.errorLog
        };

        FileUtils.downloadFile(
            JSON.stringify(exportData, null, 2),
            `error-log-${new Date().toISOString().split('T')[0]}.json`,
            'application/json'
        );
    }
}

/**
 * A/B テストユーティリティ
 */
class ABTestUtils {
    static tests = new Map();

    /**
     * テストの設定
     */
    static setupTest(testName, variants, weights = null) {
        if (!weights) {
            weights = new Array(variants.length).fill(1 / variants.length);
        }

        const userId = this.getUserId();
        const hash = this.hashString(userId + testName);
        const normalizedHash = (hash % 10000) / 10000;

        let cumulativeWeight = 0;
        for (let i = 0; i < variants.length; i++) {
            cumulativeWeight += weights[i];
            if (normalizedHash <= cumulativeWeight) {
                this.tests.set(testName, variants[i]);
                return variants[i];
            }
        }

        // フォールバック
        const fallback = variants[0];
        this.tests.set(testName, fallback);
        return fallback;
    }

    /**
     * テスト結果の取得
     */
    static getVariant(testName) {
        return this.tests.get(testName);
    }

    /**
     * ユーザーIDの生成/取得
     */
    static getUserId() {
        let userId = localStorage.getItem('ab_test_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ab_test_user_id', userId);
        }
        return userId;
    }

    /**
     * 文字列のハッシュ化
     */
    static hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit整数に変換
        }
        return Math.abs(hash);
    }
}

// デバッグ用のグローバル関数
window.DebugUtils = {
    getAppState: () => ({
        currentPage: App?.currentPage,
        currentLesson: App?.currentLesson,
        progress: StorageManager.getProgress(),
        settings: StorageManager.getSettings(),
        deviceInfo: DeviceUtils.getDeviceInfo(),
        performance: PerformanceUtils.getPageLoadTime(),
        memory: PerformanceUtils.getMemoryUsage(),
        errors: ErrorUtils.errorLog
    }),
    
    clearAllData: () => {
        if (confirm('全てのデータを削除しますか？この操作は取り消せません。')) {
            StorageManager.clearAllData();
            location.reload();
        }
    },
    
    simulateError: () => {
        throw new Error('テスト用エラー');
    }
};

// グローバルエラーハンドラーの初期化
ErrorUtils.setupGlobalErrorHandler();

// 定期的なキャッシュクリーンアップ
setInterval(() => {
    CacheUtils.cleanup();
}, 5 * 60 * 1000); // 5分ごと