(function () {
    console.log("🎯 Блокировка рекламы активирована");

    // Подменяем проверку подписки (премиум аккаунт)
    console.log("🔧 Начинаем подмену проверки премиум-аккаунта...");
    window.Account = window.Account || {};
    const originalHasPremium = window.Account.hasPremium;
    window.Account.hasPremium = () => {
        console.log("✅ Подмена Account.hasPremium() - возвращаем true");
        return true;
    };
    console.log("🎉 Проверка премиум-аккаунта успешно подменена");

    // Сохраняем оригинальный createElement для логирования
    const originalCreateElement = document.createElement;

    // Ломаем создание <video> для рекламы
    console.log("🎬 Устанавливаем перехватчик для document.createElement...");
    document.createElement = new Proxy(document.createElement, {
        apply(target, thisArg, args) {
            const tagName = args[0]?.toLowerCase();
            console.log(`📝 Вызов document.createElement("${tagName}")`);

            if (tagName === "video") {
                console.log("🚫 Обнаружено создание <video> элемента - блокируем рекламу!");

                let fakeVideo = target.apply(thisArg, args);
                
                // Сохраняем оригинальные методы для логирования
                const originalPlay = fakeVideo.play;
                const originalLoad = fakeVideo.load;
                const originalPause = fakeVideo.pause;

                // Запрещаем рекламе воспроизводиться
                fakeVideo.play = function () {
                    console.log("⏸️ Перехвачен вызов video.play() - блокируем воспроизведение");
                    console.log("🎭 Эмулируем быстрое завершение рекламы...");
                    
                    setTimeout(() => {
                        fakeVideo.ended = true;
                        fakeVideo.currentTime = fakeVideo.duration || 10;
                        console.log("✅ Рекламное видео принудительно завершено");
                        fakeVideo.dispatchEvent(new Event("ended"));
                        fakeVideo.dispatchEvent(new Event("timeupdate"));
                    }, 100);
                    
                    return Promise.resolve();
                };

                // Перехватываем другие методы video
                fakeVideo.load = function () {
                    console.log("🔄 Перехвачен video.load() - блокируем загрузку рекламы");
                    return originalLoad.apply(this, arguments);
                };

                fakeVideo.pause = function () {
                    console.log("⏸️ Перехвачен video.pause()");
                    return originalPause.apply(this, arguments);
                };

                // Перехватываем установку src
                Object.defineProperty(fakeVideo, 'src', {
                    set: function(value) {
                        console.log(`📹 Попытка установить источник видео: ${value}`);
                        if (value && value.includes('ad') || value.includes('ads') || value.includes('advertisement')) {
                            console.log("🚫 Обнаружен рекламный источник - блокируем!");
                            return;
                        }
                        originalSetSrc.call(this, value);
                    },
                    get: function() {
                        return originalGetSrc.call(this);
                    }
                });

                const originalSetSrc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src').set;
                const originalGetSrc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src').get;

                console.log("🛡️ <video> элемент полностью защищен от рекламы");
                return fakeVideo;
            }

            if (tagName === 'iframe' || tagName === 'div' || tagName === 'script') {
                console.log(`🔍 Создан ${tagName} элемент - мониторим на рекламу`);
            }

            return target.apply(thisArg, args);
        }
    });
    console.log("✅ Перехватчик document.createElement установлен");

    // Очищаем таймеры рекламы
    function clearAdTimers() {
        console.log("⏰ Начинаем очистку рекламных таймеров...");
        let adTimerCount = 0;
        
        // Получаем все активные таймеры
        const highestTimeout = setTimeout(() => {}, 0);
        console.log(`🔍 Проверяем ${highestTimeout} возможных таймеров...`);
        
        for (let i = 0; i <= highestTimeout; i++) {
            try {
                clearTimeout(i);
                clearInterval(i);
                adTimerCount++;
            } catch(e) {
                // Игнорируем ошибки от несуществующих таймеров
            }
        }
        
        console.log(`🧹 Очищено ${adTimerCount} таймеров и интервалов`);
    }

    // Блокируем рекламные запросы
    console.log("🌐 Устанавливаем перехватчик fetch запросов...");
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        console.log(`📡 Fetch запрос: ${url}`);
        
        if (typeof url === 'string' && (
            url.includes('ads.') || 
            url.includes('adserver.') || 
            url.includes('doubleclick.net') ||
            url.includes('googleads') ||
            url.includes('advertising') ||
            url.match(/ad[0-9]*\./)
        )) {
            console.log("🚫 Блокируем рекламный fetch запрос!");
            return Promise.reject(new Error("Блокировка рекламы"));
        }
        
        return originalFetch.apply(this, args);
    };

    // Блокируем XMLHttpRequest
    console.log("🔧 Устанавливаем перехватчик XMLHttpRequest...");
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = class extends originalXHR {
        open(method, url, async, user, password) {
            console.log(`📡 XHR запрос: ${method} ${url}`);
            
            if (typeof url === 'string' && (
                url.includes('ads.') || 
                url.includes('adserver.') || 
                url.includes('doubleclick.net') ||
                url.includes('googleads')
            )) {
                console.log("🚫 Блокируем рекламный XHR запрос!");
                this._blocked = true;
                return;
            }
            
            super.open(method, url, async, user, password);
        }
        
        send(body) {
            if (this._blocked) {
                console.log("✅ Рекламный XHR запрос успешно заблокирован");
                this.dispatchEvent(new Event('error'));
                return;
            }
            super.send(body);
        }
    };

    // Убираем рекламу после загрузки страницы
    console.log("📄 Ожидаем загрузки DOM...");
    document.addEventListener("DOMContentLoaded", function() {
        console.log("🎉 DOM полностью загружен, запускаем очистку...");
        clearAdTimers();
        
        // Дополнительная очистка рекламных элементов
        setTimeout(() => {
            console.log("🔍 Начинаем поиск и удаление рекламных элементов...");
            const adSelectors = [
                '[class*="ad"]',
                '[id*="ad"]',
                '[class*="ads"]',
                '[id*="ads"]',
                'iframe[src*="ad"]',
                'div[data-ad]'
            ];
            
            adSelectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    console.log(`🗑️ Удаляем ${elements.length} элементов по селектору: ${selector}`);
                    elements.forEach(el => {
                        if (el.parentNode) {
                            el.parentNode.removeChild(el);
                            console.log(`✅ Удален рекламный элемент: ${selector}`);
                        }
                    });
                }
            });
            
            console.log("🎊 Очистка рекламы завершена!");
        }, 1000);
    });

    // Защита от повторного выполнения
    console.log("🛡️ Устанавливаем защиту от повторного выполнения...");
    if (window.adBlockerExecuted) {
        console.log("⚠️ Блокировщик уже был выполнен, пропускаем...");
        return;
    }
    window.adBlockerExecuted = true;

    console.log("🚀 Блокировщик рекламы успешно инициализирован и готов к работе!");
})();
