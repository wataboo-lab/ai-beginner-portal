/**
 * UI管理クラス
 * ユーザーインターフェースの操作と状態管理
 */
class UI {
    static animations = {
        duration: 300,
        easing: 'ease-in-out'
    };

    static modals = new Map();
    static activeToasts = new Set();

    /**
     * 章の開閉切り替え
     */
    static toggleChapter(chapterNum) {
        const content = document.getElementById(`chapter${chapterNum}-content`);
        const arrow = document.getElementById(`chapter${chapterNum}-arrow`);
        
        if (!content || !arrow) return;

        const isActive = content.classList.contains('active');
        
        if (isActive) {
            // 閉じる
            content.style.maxHeight = content.scrollHeight + 'px';
            requestAnimationFrame(() => {
                content.style.maxHeight = '0';
                content.classList.remove('active');
                arrow.textContent = '▶';
                arrow.style.transform = 'rotate(0deg)';
            });
        } else {
            // 開く
            content.classList.add('active');
            content.style.maxHeight = content.scrollHeight + 'px';
            arrow.textContent = '▼';
            arrow.style.transform = 'rotate(90deg)';
            
            // アニメーション完了後にmax-heightをクリア
            setTimeout(() => {
                if (content.classList.contains('active')) {
                    content.style.maxHeight = 'none';
                }
            }, this.animations.duration);
        }

        // 他の章を閉じる（アコーディオン動作）
        this.closeOtherChapters(chapterNum);
    }

    /**
     * 他の章を閉じる
     */
    static closeOtherChapters(currentChapter) {
        for (let i = 1; i <= 9; i++) {
            if (i !== currentChapter) {
                const content = document.getElementById(`chapter${i}-content`);
                const arrow = document.getElementById(`chapter${i}-arrow`);
                
                if (content && content.classList.contains('active')) {
                    content.style.maxHeight = '0';
                    content.classList.remove('active');
                    if (arrow) {
                        arrow.textContent = '▶';
                        arrow.style.transform = 'rotate(0deg)';
                    }
                }
            }
        }
    }

    /**
     * 検索機能の表示切り替え
     */
    static toggleSearch() {
        const searchContainer = document.getElementById('lesson-search');
        const searchInput = document.getElementById('lesson-search-input');
        
        if (!searchContainer) return;

        const isActive = searchContainer.classList.contains('active');
        
        if (isActive) {
            // 検索を非表示
            searchContainer.classList.remove('active');
            if (searchInput) {
                searchInput.blur();
            }
        } else {
            // 検索を表示
            searchContainer.classList.add('active');
            setTimeout(() => {
                if (searchInput) {
                    searchInput.focus();
                }
            }, this.animations.duration);
        }
    }

    /**
     * メモセクションの表示切り替え
     */
    static toggleNotes() {
        const notesSection = document.getElementById('notes-section');
        const textarea = document.getElementById('lesson-memo');
        
        if (!notesSection) return;

        const isActive = notesSection.classList.contains('active');
        
        if (isActive) {
            notesSection.classList.remove('active');
        } else {
            notesSection.classList.add('active');
            
            // メモの内容を読み込み
            if (textarea && App.currentLesson) {
                const savedNote = StorageManager.getNote(App.currentLesson);
                textarea.value = savedNote;
            }
            
            setTimeout(() => {
                if (textarea) {
                    textarea.focus();
                }
            }, this.animations.duration);
        }
    }

    /**
     * FAQ項目の開閉切り替え
     */
    static toggleFAQ(faqNum) {
        const answer = document.getElementById(`faq${faqNum}-answer`);
        const arrow = document.getElementById(`faq${faqNum}-arrow`);
        
        if (!answer || !arrow) return;

        const isActive = answer.classList.contains('active');
        
        if (isActive) {
            answer.classList.remove('active');
            arrow.textContent = '▼';
        } else {
            answer.classList.add('active');
            arrow.textContent = '▲';
        }
    }

    /**
     * モーダルの表示
     */
    static showModal(id, content, options = {}) {
        const defaultOptions = {
            closable: true,
            backdrop: true,
            size: 'medium',
            animation: 'fadeIn'
        };
        
        const config = { ...defaultOptions, ...options };
        
        // 既存のモーダルをチェック
        if (this.modals.has(id)) {
            this.hideModal(id);
        }

        // モーダル要素の作成
        const modalOverlay = document.createElement('div');
        modalOverlay.className = `modal-overlay modal-${config.size}`;
        modalOverlay.id = `modal-${id}`;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        
        if (typeof content === 'string') {
            modalContent.innerHTML = content;
        } else {
            modalContent.appendChild(content);
        }
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // バックドロップクリックで閉じる
        if (config.backdrop && config.closable) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideModal(id);
                }
            });
        }
        
        // ESCキーで閉じる
        if (config.closable) {
            const escHandler = (e) => {
                if (e.key === 'Escape') {
                    this.hideModal(id);
                    document.removeEventListener('keydown', escHandler);
                }
            };
            document.addEventListener('keydown', escHandler);
            this.modals.set(id, { element: modalOverlay, escHandler });
        } else {
            this.modals.set(id, { element: modalOverlay });
        }
        
        // アニメーション
        requestAnimationFrame(() => {
            modalOverlay.classList.add('show');
        });
        
        return modalOverlay;
    }

    /**
     * モーダルの非表示
     */
    static hideModal(id) {
        const modalData = this.modals.get(id);
        if (!modalData) return;

        const { element, escHandler } = modalData;
        
        element.classList.remove('show');
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            if (escHandler) {
                document.removeEventListener('keydown', escHandler);
            }
            this.modals.delete(id);
        }, this.animations.duration);
    }

    /**
     * 確認ダイアログの表示
     */
    static showConfirm(message, options = {}) {
        return new Promise((resolve) => {
            const config = {
                title: '確認',
                confirmText: 'はい',
                cancelText: 'いいえ',
                type: 'confirm',
                ...options
            };

            const content = `
                <div class="confirm-dialog">
                    <div class="confirm-header">
                        <h3>${config.title}</h3>
                    </div>
                    <div class="confirm-body">
                        <p>${message}</p>
                    </div>
                    <div class="confirm-actions">
                        <button class="btn btn-outline" onclick="UI.handleConfirm('${Math.random()}', false)">
                            ${config.cancelText}
                        </button>
                        <button class="btn btn-primary" onclick="UI.handleConfirm('${Math.random()}', true)">
                            ${config.confirmText}
                        </button>
                    </div>
                </div>
            `;

            const modalId = 'confirm-' + Date.now();
            this.showModal(modalId, content, { closable: false });
            
            // 結果を保存して後で参照できるようにする
            this.confirmResolvers = this.confirmResolvers || new Map();
            this.confirmResolvers.set(modalId, resolve);
        });
    }

    /**
     * 確認ダイアログの結果処理
     */
    static handleConfirm(modalId, result) {
        const fullModalId = modalId.startsWith('confirm-') ? modalId : `confirm-${modalId}`;
        
        if (this.confirmResolvers && this.confirmResolvers.has(fullModalId)) {
            const resolve = this.confirmResolvers.get(fullModalId);
            resolve(result);
            this.confirmResolvers.delete(fullModalId);
        }
        
        this.hideModal(fullModalId);
    }

    /**
     * アラートダイアログの表示
     */
    static showAlert(message, options = {}) {
        const config = {
            title: 'お知らせ',
            buttonText: 'OK',
            type: 'info',
            ...options
        };

        const iconMap = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };

        const content = `
            <div class="alert-dialog alert-${config.type}">
                <div class="alert-header">
                    <span class="alert-icon">${iconMap[config.type] || iconMap.info}</span>
                    <h3>${config.title}</h3>
                </div>
                <div class="alert-body">
                    <p>${message}</p>
                </div>
                <div class="alert-actions">
                    <button class="btn btn-primary" onclick="UI.hideModal('alert-${Date.now()}')">
                        ${config.buttonText}
                    </button>
                </div>
            </div>
        `;

        const modalId = 'alert-' + Date.now();
        this.showModal(modalId, content);
    }

    /**
     * ローディングスピナーの表示
     */
    static showLoading(message = '読み込み中...', options = {}) {
        const config = {
            backdrop: true,
            closable: false,
            ...options
        };

        const content = `
            <div class="loading-dialog">
                <div class="loading-spinner">🌸</div>
                <p class="loading-message">${message}</p>
            </div>
        `;

        const modalId = 'loading-' + Date.now();
        this.showModal(modalId, content, config);
        return modalId;
    }

    /**
     * ローディングスピナーの非表示
     */
    static hideLoading(loadingId) {
        if (loadingId) {
            this.hideModal(loadingId);
        } else {
            // 全てのローディングモーダルを閉じる
            this.modals.forEach((modalData, id) => {
                if (id.startsWith('loading-')) {
                    this.hideModal(id);
                }
            });
        }
    }

    /**
     * トーストメッセージの表示
     */
    static showToast(message, type = 'info', duration = 3000) {
        const toastId = 'toast-' + Date.now() + '-' + Math.random();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.id = toastId;
        
        const iconMap = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${iconMap[type] || iconMap.info}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="UI.hideToast('${toastId}')">×</button>
            </div>
        `;

        const container = document.getElementById('toast-container') || this.createToastContainer();
        container.appendChild(toast);
        
        this.activeToasts.add(toastId);

        // アニメーション
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // 自動削除
        if (duration > 0) {
            setTimeout(() => {
                this.hideToast(toastId);
            }, duration);
        }

        return toastId;
    }

    /**
     * トーストコンテナの作成
     */
    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    }

    /**
     * トーストメッセージの非表示
     */
    static hideToast(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        toast.classList.remove('show');
        this.activeToasts.delete(toastId);

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, this.animations.duration);
    }

    /**
     * 全てのトーストを非表示
     */
    static hideAllToasts() {
        this.activeToasts.forEach(toastId => {
            this.hideToast(toastId);
        });
    }

    /**
     * プログレスバーの更新
     */
    static updateProgressBar(selector, percentage, animated = true) {
        const progressBar = document.querySelector(selector);
        if (!progressBar) return;

        if (animated) {
            progressBar.style.transition = `width ${this.animations.duration}ms ${this.animations.easing}`;
        }
        
        progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }

    /**
     * 円形プログレスの更新
     */
    static updateCircularProgress(selector, percentage, animated = true) {
        const circle = document.querySelector(selector);
        if (!circle) return;

        const radius = 45; // SVG circle radius
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        if (animated) {
            circle.style.transition = `stroke-dashoffset ${this.animations.duration * 2}ms ${this.animations.easing}`;
        }

        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = offset;
    }

    /**
     * カウンターアニメーション
     */
    static animateCounter(element, start, end, duration = 1000) {
        if (!element) return;

        const startTime = performance.now();
        const range = end - start;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // イージング関数（ease-out）
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            
            const currentValue = Math.round(start + (range * easedProgress));
            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    /**
     * 要素の表示アニメーション
     */
    static animateIn(element, animation = 'fadeIn', delay = 0) {
        if (!element) return;

        const animations = {
            fadeIn: 'animate-fade-in',
            slideUp: 'animate-slide-up',
            slideDown: 'animate-slide-down',
            slideLeft: 'animate-slide-left',
            slideRight: 'animate-slide-right',
            scale: 'animate-scale',
            bounce: 'animate-bounce'
        };

        const animationClass = animations[animation] || animations.fadeIn;
        
        setTimeout(() => {
            element.classList.add(animationClass);
        }, delay);
    }

    /**
     * 要素の非表示アニメーション
     */
    static animateOut(element, animation = 'fadeOut', callback = null) {
        if (!element) return;

        const animations = {
            fadeOut: 'animate-fade-out',
            slideUp: 'animate-slide-up-out',
            slideDown: 'animate-slide-down-out',
            slideLeft: 'animate-slide-left-out',
            slideRight: 'animate-slide-right-out',
            scale: 'animate-scale-out'
        };

        const animationClass = animations[animation] || animations.fadeOut;
        element.classList.add(animationClass);

        setTimeout(() => {
            if (callback) callback();
        }, this.animations.duration);
    }

    /**
     * スクロールアニメーションの初期化
     */
    static initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animation = element.getAttribute('data-animate') || 'fadeIn';
                    const delay = parseInt(element.getAttribute('data-delay')) || 0;
                    
                    this.animateIn(element, animation, delay);
                    observer.unobserve(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // アニメーション対象要素を監視
        document.querySelectorAll('[data-animate]').forEach(el => {
            observer.observe(el);
        });
    }

    /**
     * パララックス効果
     */
    static initParallax() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        if (parallaxElements.length === 0) return;

        const handleScroll = () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const rate = scrolled * (parseFloat(element.getAttribute('data-parallax')) || 0.5);
                element.style.transform = `translateY(${rate}px)`;
            });
        };

        window.addEventListener('scroll', this.throttle(handleScroll, 16));
    }

    /**
     * タブ切り替え
     */
    static switchTab(tabGroup, activeTab) {
        // タブボタンの状態更新
        const tabButtons = document.querySelectorAll(`[data-tab-group="${tabGroup}"] .tab-btn`);
        tabButtons.forEach(btn => {
            if (btn.getAttribute('data-tab') === activeTab) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // タブコンテンツの表示切り替え
        const tabContents = document.querySelectorAll(`[data-tab-group="${tabGroup}"] .tab-content`);
        tabContents.forEach(content => {
            if (content.getAttribute('data-tab') === activeTab) {
                content.classList.add('active');
                this.animateIn(content, 'fadeIn');
            } else {
                content.classList.remove('active');
            }
        });
    }

    /**
     * アコーディオンの初期化
     */
    static initAccordion(selector) {
        const accordions = document.querySelectorAll(selector);
        
        accordions.forEach(accordion => {
            const header = accordion.querySelector('.accordion-header');
            const content = accordion.querySelector('.accordion-content');
            
            if (header && content) {
                header.addEventListener('click', () => {
                    const isActive = accordion.classList.contains('active');
                    
                    if (isActive) {
                        accordion.classList.remove('active');
                        content.style.maxHeight = '0';
                    } else {
                        accordion.classList.add('active');
                        content.style.maxHeight = content.scrollHeight + 'px';
                    }
                });
            }
        });
    }

    /**
     * ツールチップの表示
     */
    static showTooltip(element, message, position = 'top') {
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = message;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let left, top;
        
        switch (position) {
            case 'top':
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                top = rect.top - tooltipRect.height - 8;
                break;
            case 'bottom':
                left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
                top = rect.bottom + 8;
                break;
            case 'left':
                left = rect.left - tooltipRect.width - 8;
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
            case 'right':
                left = rect.right + 8;
                top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
                break;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
        
        setTimeout(() => tooltip.classList.add('show'), 10);
        
        return tooltip;
    }

    /**
     * ツールチップの非表示
     */
    static hideTooltip(tooltip) {
        if (!tooltip) return;
        
        tooltip.classList.remove('show');
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, this.animations.duration);
    }

    /**
     * コンテキストメニューの表示
     */
    static showContextMenu(x, y, items) {
        // 既存のコンテキストメニューを削除
        this.hideContextMenu();
        
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.id = 'context-menu';
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            
            if (item.separator) {
                menuItem.className = 'context-menu-separator';
            } else {
                menuItem.innerHTML = `
                    <span class="menu-icon">${item.icon || ''}</span>
                    <span class="menu-text">${item.text}</span>
                `;
                
                if (item.disabled) {
                    menuItem.classList.add('disabled');
                } else {
                    menuItem.addEventListener('click', () => {
                        if (item.action) item.action();
                        this.hideContextMenu();
                    });
                }
            }
            
            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        
        // 位置調整
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = x;
        let top = y;
        
        if (left + rect.width > viewportWidth) {
            left = viewportWidth - rect.width - 10;
        }
        
        if (top + rect.height > viewportHeight) {
            top = viewportHeight - rect.height - 10;
        }
        
        menu.style.left = `${left}px`;
        menu.style.top = `${top}px`;
        
        setTimeout(() => menu.classList.add('show'), 10);
        
        // 外部クリックで閉じる
        const closeHandler = (e) => {
            if (!menu.contains(e.target)) {
                this.hideContextMenu();
                document.removeEventListener('click', closeHandler);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeHandler);
        }, 100);
    }

    /**
     * コンテキストメニューの非表示
     */
    static hideContextMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.classList.remove('show');
            setTimeout(() => {
                if (menu.parentNode) {
                    menu.parentNode.removeChild(menu);
                }
            }, this.animations.duration);
        }
    }

    /**
     * リップル効果
     */
    static addRipple(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        ripple.classList.add('ripple');
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    /**
     * スムーススクロール
     */
    static smoothScrollTo(target, duration = 1000) {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;

        const targetPosition = targetElement.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // イージング関数
            const ease = progress < 0.5 
                ? 2 * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    /**
     * フィードバック振動
     */
    static vibrate(pattern = [200]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    /**
     * スロットル関数
     */
    static throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay - (currentTime - lastExecTime));
            }
        };
    }

    /**
     * UIの初期化
     */
    static init() {
        this.initScrollAnimations();
        this.initParallax();
        this.initAccordion('.accordion');
        
        // リップル効果の初期化
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('ripple-effect')) {
                this.addRipple(e.target, e);
            }
        });
        
        // ESCキーでモーダルを閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllToasts();
                this.hideContextMenu();
            }
        });
    }
}