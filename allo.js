(function () {
    console.log("Блокировка рекламы активирована");

    // Подменяем проверку подписки (премиум аккаунт)
    window.Account = window.Account || {};
    window.Account.hasPremium = () => true;

    // Переменная для отслеживания состояния блокировки
    let adBlockCompleted = false;

    // Ломаем создание <video> для рекламы
    document.createElement = new Proxy(document.createElement, {
        apply(target, thisArg, args) {
            if (args[0] === "video") {
                console.log("Перехватываем создание <video> для рекламы!");

                let fakeVideo = target.apply(thisArg, args);

                // Улучшенная система блокировки с проверками
                const blockAdVideo = function () {
                    if (adBlockCompleted) {
                        console.log("Реклама уже завершена, пропускаем");
                        return Promise.resolve();
                    }

                    console.log("Рекламное видео заблокировано!");
                    adBlockCompleted = true;
                    
                    // Немедленно помечаем видео как завершенное
                    fakeVideo.ended = true;
                    fakeVideo.currentTime = 100;
                    fakeVideo.duration = 100;
                    
                    // Эмулируем все необходимые события
                    const completeAd = () => {
                        console.log("Завершаем рекламу...");
                        
                        const events = ['ended', 'complete', 'load', 'canplaythrough', 'loadeddata'];
                        events.forEach(eventName => {
                            try {
                                fakeVideo.dispatchEvent(new Event(eventName));
                            } catch (e) {}
                        });

                        // Также запускаем события на самом видео элементе
                        if (fakeVideo.dispatchEvent) {
                            events.forEach(eventName => {
                                try {
                                    const event = new Event(eventName, { bubbles: true });
                                    fakeVideo.dispatchEvent(event);
                                } catch (e) {}
                            });
                        }

                        // Вызываем callback если есть
                        if (fakeVideo.onended) {
                            try {
                                fakeVideo.onended();
                            } catch (e) {}
                        }

                        console.log("Реклама успешно завершена!");
                    };

                    // Запускаем немедленно
                    completeAd();
                    
                    // Дополнительная проверка через короткое время
                    setTimeout(completeAd, 50);
                    
                    return Promise.resolve();
                };

                // Подменяем методы воспроизведения
                fakeVideo.play = blockAdVideo;
                fakeVideo.load = blockAdVideo;

                // Добавляем свойства для обмана проверок
                Object.defineProperty(fakeVideo, 'readyState', {
                    get: function() { return 4; } // HAVE_ENOUGH_DATA
                });

                Object.defineProperty(fakeVideo, 'videoWidth', {
                    get: function() { return 1920; }
                });

                Object.defineProperty(fakeVideo, 'videoHeight', {
                    get: function() { return 1080; }
                });

                Object.defineProperty(fakeVideo, 'duration', {
                    get: function() { return 100; },
                    set: function(value) {} // игнорируем установку длительности
                });

                Object.defineProperty(fakeVideo, 'currentTime', {
                    get: function() { return 100; },
                    set: function(value) {} // игнорируем установку времени
                });

                Object.defineProperty(fakeVideo, 'ended', {
                    get: function() { return true; },
                    set: function(value) {}
                });

                // Блокируем установку источников
                const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src')?.set;
                if (originalSrcSetter) {
                    Object.defineProperty(fakeVideo, 'src', {
                        set: function(value) {
                            console.log("Блокируем установку источника видео:", value);
                            // Разрешаем установить src, но блокируем воспроизведение
                            originalSrcSetter.call(this, value);
                            // Немедленно завершаем рекламу
                            setTimeout(blockAdVideo, 10);
                        },
                        get: function() {
                            return originalSrcSetter.get?.call(this);
                        },
                        configurable: true
                    });
                }

                // Также перехватываем addEventListener
                const originalAddEventListener = fakeVideo.addEventListener;
                fakeVideo.addEventListener = function(type, listener, options) {
                    console.log(`Перехватываем добавление слушателя: ${type}`);
                    
                    // Для событий завершения сразу вызываем listener
                    if (type === 'ended' || type === 'complete' || type === 'load') {
                        console.log(`Немедленно вызываем слушатель для события: ${type}`);
                        setTimeout(() => {
                            try {
                                if (typeof listener === 'function') {
                                    listener.call(this, new Event(type));
                                }
                            } catch (e) {}
                        }, 20);
                        return;
                    }
                    
                    return originalAddEventListener.call(this, type, listener, options);
                };

                return fakeVideo;
            }
            return target.apply(thisArg, args);
        }
    });

    // Перехватываем XMLHttpRequest для блокировки рекламных запросов
    const originalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;

        xhr.open = function(method, url, ...args) {
            this._url = url;
            return originalOpen.call(this, method, url, ...args);
        };

        xhr.send = function(data) {
            // Блокируем запросы к рекламным сетям
            if (this._url && (
                this._url.includes('ads.') || 
                this._url.includes('ad.') ||
                this._url.includes('betweendigital.com') ||
                this._url.includes('adv.') ||
                this._url.includes('advert.')
            )) {
                console.log("Блокируем рекламный запрос:", this._url);
                // Эмулируем успешный ответ с пустыми данными
                setTimeout(() => {
                    if (this.onreadystatechange) {
                        this.readyState = 4;
                        this.status = 200;
                        this.responseText = '';
                        this.onreadystatechange();
                    }
                }, 10);
                return;
            }

            return originalSend.call(this, data);
        };

        return xhr;
    };

    // Функция для немедленного завершения всех видео
    function completeAllVideos() {
        console.log("Принудительное завершение всех видео элементов");
        document.querySelectorAll('video').forEach(video => {
            try {
                video.ended = true;
                video.dispatchEvent(new Event('ended', { bubbles: true }));
                if (video.onended) video.onended();
            } catch (e) {}
        });
    }

    // Запускаем системы блокировки
    document.addEventListener("DOMContentLoaded", function() {
        console.log("DOM загружен, активируем системы блокировки...");
        
        // Немедленно завершаем любые существующие видео
        setTimeout(completeAllVideos, 100);
        
        // Дополнительная проверка через 1 секунду
        setTimeout(completeAllVideos, 1000);
    });

    // Также запускаем при полной загрузке страницы
    window.addEventListener('load', function() {
        console.log("Страница полностью загружена, завершаем рекламу...");
        setTimeout(completeAllVideos, 200);
    });

})();
