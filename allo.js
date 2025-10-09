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

                // Запрещаем рекламе воспроизводиться
                fakeVideo.play = function () {
                    console.log("Рекламное видео заблокировано!");
                    setTimeout(() => {
                        fakeVideo.ended = true;
                        fakeVideo.dispatchEvent(new Event("ended")); // Эмулируем завершение рекламы
                        console.log("Эмулируем завершение рекламы 500мс");
                    }, 500);
                    setTimeout(() => {
                        fakeVideo.ended = true;
                        fakeVideo.dispatchEvent(new Event("ended")); // Эмулируем завершение рекламы
                        console.log("Эмулируем завершение рекламы 1000мс");
                    }, 1000);
                };

                return fakeVideo;
            }
            return target.apply(thisArg, args);
        }
    });

    // Функция для замены текста в рекламных блоках
    function replaceAdText() {
        const adTextElements = document.querySelectorAll('.ad-preroll__text');
        adTextElements.forEach(element => {
            if (element.textContent.includes('Реклама')) {
                element.textContent = "Нет рекламы ;)";
                console.log("Текст рекламы заменен на: Нет рекламы ;)");
            }
        });
    }

    // Очищаем таймеры рекламы
    function clearAdTimers() {
        console.log("Очищаем рекламные таймеры...");
        let highestTimeout = setTimeout(() => {}, 0);
        for (let i = 0; i <= highestTimeout; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
        
        // Также заменяем текст рекламы
        replaceAdText();
    }

    // Убираем рекламу после загрузки страницы
    document.addEventListener("DOMContentLoaded", function() {
        clearAdTimers();
        replaceAdText();
    });

    // Также запускаем замену текста при полной загрузке страницы
    window.addEventListener('load', replaceAdText);

    // Периодическая проверка на случай динамической загрузки
    setInterval(replaceAdText, 1000);
})();
