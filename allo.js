(function () {
    console.log("Блокировка рекламы активирована");

    // Подменяем проверку подписки (премиум аккаунт)
    window.Account = window.Account || {};
    window.Account.hasPremium = () => true;

    let attemptCount = 0;
    const maxAttempts = 3;
    const attemptDelay = 500;

    // Ломаем создание <video> для рекламы
    document.createElement = new Proxy(document.createElement, {
        apply(target, thisArg, args) {
            const element = target.apply(thisArg, args);
            
            if (args[0] === "video") {
                console.log("Перехватываем создание <video> для рекламы!");

                // Запрещаем рекламе воспроизводиться
                element.play = function () {
                    console.log("Рекламное видео заблокировано!");
                    setTimeout(() => {
                        element.ended = true;
                        element.dispatchEvent(new Event("ended")); // Эмулируем завершение рекламы
                    }, 500);
                    return Promise.resolve();
                };

                // Добавляем дополнительные методы для надежности
                element.load = function () {
                    console.log("Блокируем загрузку рекламного видео");
                    return undefined;
                };

                element.addEventListener = new Proxy(element.addEventListener, {
                    apply: function(target, thisArg, args) {
                        // Блокируем некоторые события рекламы
                        if (args[0] === 'load' || args[0] === 'canplay') {
                            console.log(`Блокируем обработчик события: ${args[0]}`);
                            return;
                        }
                        return target.apply(thisArg, args);
                    }
                });

            } else if (attemptCount < maxAttempts) {
                console.log(`<video> не найдено! Повторная попытка через ${attemptDelay}мс (${attemptCount + 1}/${maxAttempts})`);
                attemptCount++;
                
                // Планируем повторную проверку
                setTimeout(() => {
                    scanForVideoElements();
                }, attemptDelay);
            }

            return element;
        }
    });

    // Функция для поиска и блокировки существующих video элементов
    function scanForVideoElements() {
        console.log("Сканируем страницу на наличие video элементов...");
        
        const videos = document.querySelectorAll('video');
        if (videos.length > 0) {
            console.log(`Найдено ${videos.length} video элементов, блокируем...`);
            
            videos.forEach((video, index) => {
                if (!video.hasAttribute('data-ad-blocked')) {
                    video.setAttribute('data-ad-blocked', 'true');
                    blockVideoElement(video);
                    console.log(`Заблокирован video элемент #${index + 1}`);
                }
            });
        } else {
            console.log("Video элементы не найдены");
        }
    }

    // Функция блокировки конкретного video элемента
    function blockVideoElement(video) {
        // Сохраняем оригинальные методы
        const originalPlay = video.play;
        const originalLoad = video.load;
        
        // Переопределяем методы
        video.play = function () {
            console.log("Блокируем воспроизведение существующего рекламного видео!");
            setTimeout(() => {
                video.ended = true;
                video.dispatchEvent(new Event("ended"));
            }, 500);
            return Promise.resolve();
        };

        video.load = function () {
            console.log("Блокируем загрузку существующего рекламного видео");
            return undefined;
        };

        // Блокируем сетевые запросы если это возможно
        if (video.src) {
            console.log("Убираем источник видео:", video.src);
            video.src = '';
            video.srcObject = null;
        }
    }

    // Очищаем таймеры рекламы
    function clearAdTimers() {
        console.log("Очищаем рекламные таймеры...");
        let highestTimeout = setTimeout(() => {}, 0);
        for (let i = 0; i <= highestTimeout; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        
        // Дополнительная очистка через requestAnimationFrame
        cancelAnimationFrame(1);
    }

    // Убираем рекламу после загрузки страницы
    document.addEventListener("DOMContentLoaded", function() {
        clearAdTimers();
        
        // Запускаем первоначальное сканирование
        setTimeout(() => {
            scanForVideoElements();
        }, 1000);
        
        // Периодическая проверка на новые video элементы
        setInterval(scanForVideoElements, 3000);
    });

    // Также запускаем при полной загрузке страницы
    window.addEventListener('load', function() {
        setTimeout(() => {
            scanForVideoElements();
        }, 2000);
    });

    // Мониторинг изменений DOM для обнаружения новых video элементов
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeName === 'VIDEO') {
                    console.log("Обнаружен новый video элемент через MutationObserver");
                    setTimeout(() => {
                        blockVideoElement(node);
                    }, 100);
                } else if (node.querySelectorAll) {
                    const videos = node.querySelectorAll('video');
                    videos.forEach(video => {
                        if (!video.hasAttribute('data-ad-blocked')) {
                            console.log("Обнаружен вложенный video элемент");
                            setTimeout(() => {
                                blockVideoElement(video);
                            }, 100);
                        }
                    });
                }
            });
        });
    });

    // Запускаем наблюдение
    setTimeout(() => {
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        console.log("MutationObserver запущен для отслеживания новых video элементов");
    }, 3000);

})();
