(function () {
    console.log("Блокировка рекламы активирована");

    // Подменяем проверку подписки (премиум аккаунт)
    window.Account = window.Account || {};
    window.Account.hasPremium = () => true;

    // Ломаем создание <video> для рекламы
    document.createElement = new Proxy(document.createElement, {
        apply(target, thisArg, args) {
            if (args[0] === "video") {
                console.log("Перехватываем создание <video> для рекламы!");

                let fakeVideo = target.apply(thisArg, args);

                // Улучшенная система блокировки с проверками
                const blockAdVideo = function () {
                    console.log("Рекламное видео заблокировано!");
                    
                    // Множественные проверки готовности видео
                    const tryCompleteVideo = (attempt = 0) => {
                        if (attempt > 10) { // Максимум 10 попыток
                            console.log("Не удалось завершить видео после 10 попыток");
                            return;
                        }

                        console.log(`Попытка завершения видео #${attempt + 1}`);
                        
                        // Эмулируем завершение видео
                        fakeVideo.ended = true;
                        fakeVideo.currentTime = fakeVideo.duration || 100;
                        
                        // Запускаем все возможные события завершения
                        const events = ['ended', 'complete', 'load', 'canplaythrough'];
                        events.forEach(eventName => {
                            try {
                                fakeVideo.dispatchEvent(new Event(eventName));
                            } catch (e) {}
                        });

                        // Проверяем, нужно ли еще раз попробовать
                        setTimeout(() => {
                            if (!fakeVideo.ended || fakeVideo.currentTime < (fakeVideo.duration || 1)) {
                                tryCompleteVideo(attempt + 1);
                            } else {
                                console.log("Видео успешно завершено!");
                            }
                        }, 300 + (attempt * 100)); // Увеличиваем задержку с каждой попыткой
                    };

                    // Запускаем процесс завершения
                    tryCompleteVideo();
                    
                    return Promise.resolve(); // Возвращаем успешный Promise для async/await
                };

                // Подменяем методы воспроизведения
                fakeVideo.play = blockAdVideo;
                fakeVideo.load = blockAdVideo;
                
                // Блокируем установку источников
                const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src')?.set;
                if (originalSrcSetter) {
                    Object.defineProperty(fakeVideo, 'src', {
                        set: function(value) {
                            console.log("Блокируем установку источника видео:", value);
                            // Позволяем установить src, но все равно блокируем воспроизведение
                            originalSrcSetter.call(this, value);
                        },
                        get: function() {
                            return originalSrcSetter.get?.call(this);
                        }
                    });
                }

                return fakeVideo;
            }
            return target.apply(thisArg, args);
        }
    });

    // Улучшенная очистка таймеров - только рекламных
    function clearAdTimers() {
        console.log("Поиск и очистка рекламных таймеров...");
        
        // Сохраняем оригинальные функции
        const originalSetTimeout = window.setTimeout;
        const originalSetInterval = window.setInterval;
        
        let blockedTimers = 0;
        
        // Перехватываем создание новых таймеров
        window.setTimeout = function(fn, delay, ...args) {
            const fnString = fn.toString().toLowerCase();
            const adKeywords = ['ad', 'ads', 'advert', 'commercial', 'preroll', 'postroll', 'midroll'];
            
            if (adKeywords.some(keyword => fnString.includes(keyword))) {
                console.log("Блокируем рекламный setTimeout");
                blockedTimers++;
                return null; // Не создаем таймер
            }
            
            return originalSetTimeout.call(this, fn, delay, ...args);
        };
        
        window.setInterval = function(fn, delay, ...args) {
            const fnString = fn.toString().toLowerCase();
            const adKeywords = ['ad', 'ads', 'advert', 'commercial', 'preroll', 'postroll', 'midroll'];
            
            if (adKeywords.some(keyword => fnString.includes(keyword))) {
                console.log("Блокируем рекламный setInterval");
                blockedTimers++;
                return null; // Не создаем таймер
            }
            
            return originalSetInterval.call(this, fn, delay, ...args);
        };
        
        console.log(`Заблокировано рекламных таймеров: ${blockedTimers}`);
    }

    // Дополнительный наблюдатель за изменениями DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'VIDEO') {
                    console.log("Обнаружено новое видео в DOM, блокируем...");
                    blockVideoElement(node);
                }
                
                // Ищем видео внутри добавленных элементов
                if (node.querySelectorAll) {
                    const videos = node.querySelectorAll('video');
                    videos.forEach(video => {
                        console.log("Обнаружено вложенное видео, блокируем...");
                        blockVideoElement(video);
                    });
                }
            });
        });
    });

    // Функция блокировки существующих видео элементов
    function blockVideoElement(videoElement) {
        const originalPlay = videoElement.play;
        videoElement.play = function() {
            console.log("Блокируем воспроизведение существующего видео");
            videoElement.ended = true;
            videoElement.currentTime = videoElement.duration || 100;
            
            // Запускаем события завершения
            setTimeout(() => {
                const events = ['ended', 'complete', 'load'];
                events.forEach(eventName => {
                    try {
                        videoElement.dispatchEvent(new Event(eventName));
                    } catch (e) {}
                });
            }, 100);
            
            return Promise.resolve();
        };
    }

    // Запускаем все системы блокировки
    document.addEventListener("DOMContentLoaded", function() {
        console.log("DOM загружен, активируем системы блокировки...");
        clearAdTimers();
        
        // Блокируем уже существующие видео
        document.querySelectorAll('video').forEach(blockVideoElement);
        
        // Запускаем наблюдатель
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });

    // Дополнительная проверка через 2 секунды на случай поздней загрузки
    setTimeout(() => {
        console.log("Проверка поздней загрузки видео...");
        document.querySelectorAll('video').forEach(blockVideoElement);
    }, 2000);

})();
