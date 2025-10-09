(function () {
    'use strict';
    console.log("🚫 Блокировка рекламы активирована");

    // 1. НЕМЕДЛЕННО подменяем проверку подписки
    window.Account = window.Account || {};
    window.Account.hasPremium = () => true;

    // 2. РАННИЙ перехват создания элементов
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        if (tagName.toLowerCase() === 'video') {
            console.log("📹 Перехватываем создание видео-элемента");
            
            const fakeVideo = originalCreateElement.call(this, tagName);
            
            // Более надежная блокировка воспроизведения
            const originalPlay = fakeVideo.play;
            fakeVideo.play = function() {
                console.log("🎬 Блокируем воспроизведение рекламы");
                
                // Немедленно эмулируем завершение
                Promise.resolve().then(() => {
                    fakeVideo.currentTime = fakeVideo.duration || 100;
                    fakeVideo.dispatchEvent(new Event('timeupdate'));
                    fakeVideo.dispatchEvent(new Event('ended'));
                });
                
                return Promise.reject(new Error("Блокировка рекламы"));
            };
            
            return fakeVideo;
        }
        return originalCreateElement.call(this, tagName);
    };

    // 3. Более безопасная очистка рекламных таймеров
    function safeClearAdTimers() {
        console.log("⏰ Очищаем рекламные таймеры...");
        
        // Сохраняем системные таймеры
        const safeTimers = new Set();
        
        // Перехватываем создание новых таймеров
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        
        window.setTimeout = function(fn, delay, ...args) {
            const timerId = originalSetTimeout.call(this, fn, delay, ...args);
            
            // Анализируем функцию на предмет рекламы
            const fnString = fn.toString().toLowerCase();
            const isAdTimer = fnString.includes('ad') || 
                            fnString.includes('reklam') || 
                            fnString.includes('video') ||
                            fnString.includes('ads');
            
            if (isAdTimer) {
                console.log("🚫 Блокируем рекламный таймер:", fnString.slice(0, 100));
                clearTimeout(timerId);
            } else {
                safeTimers.add(timerId);
            }
            
            return timerId;
        };
        
        window.setInterval = function(fn, delay, ...args) {
            const timerId = originalSetInterval.call(this, fn, delay, ...args);
            
            const fnString = fn.toString().toLowerCase();
            const isAdTimer = fnString.includes('ad') || 
                            fnString.includes('reklam') || 
                            fnString.includes('video');
            
            if (isAdTimer) {
                console.log("🚫 Блокируем рекламный интервал:", fnString.slice(0, 100));
                clearInterval(timerId);
            } else {
                safeTimers.add(timerId);
            }
            
            return timerId;
        };
    }

    // 4. Запускаем НЕМЕДЛЕННО, не ждем DOMContentLoaded
    safeClearAdTimers();
    
    // 5. Дополнительная защита после полной загрузки
    window.addEventListener('load', function() {
        console.log("✅ Страница полностью загружена, активируем финальную защиту");
        
        // Удаляем рекламные контейнеры
        const adSelectors = [
            '[class*="ad"]', 
            '[id*="ad"]', 
            '[class*="reklam"]',
            '.ad-container',
            '.video-ad'
        ];
        
        adSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (element.innerHTML.toLowerCase().includes('ad') || 
                    element.innerHTML.toLowerCase().includes('reklam')) {
                    element.remove();
                    console.log("🗑️ Удален рекламный элемент:", selector);
                }
            });
        });
    });

})();
