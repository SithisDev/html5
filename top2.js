// Плагин «Топ рейтинги» для Lampa.
// Версия без зависимости от отдельного внешнего сервера рейтингов.
// Загрузка непосредственно через штатный TMDB API Lampa.

(function () {
    'use strict';

    Lampa.Platform.tv();

    var RECENT_YEARS = 5;
    var MAX_PAGES = 10;

    function svgDataUri(svg) {
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function categoryIcon(content) {
        return svgDataUri(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">' +
                '<g transform="translate(12,12) scale(0.6) translate(-12,-12)">' + content + '</g>' +
            '</svg>'
        );
    }

    var TOP_CATEGORIES = [
        {
            title: 'Топ',
            img: categoryIcon('<path fill="#FFD700" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'),
            type: 'all'
        },
        {
            title: 'Топ Фильмы',
            img: categoryIcon('<path fill="#E50914" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>'),
            type: 'movies'
        },
        {
            title: 'Топ Сериалы',
            img: categoryIcon('<path fill="#4285F4" d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V7h18v10z"/>'),
            type: 'tv'
        },
        {
            title: 'Топ New',
            img: categoryIcon('<circle fill="#33C758" cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="Arial, sans-serif">NEW</text>'),
            type: 'new'
        },
        {
            title: 'Топ New Фильмы',
            img: categoryIcon('<path fill="#E50914" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/><circle fill="#33C758" cx="18" cy="6" r="5"/><text x="18" y="9" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="Arial, sans-serif">NEW</text>'),
            type: 'new_movies'
        },
        {
            title: 'Топ New Сериалы',
            img: categoryIcon('<path fill="#4285F4" d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V7h18v10z"/><circle fill="#33C758" cx="18" cy="6" r="5"/><text x="18" y="9" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="Arial, sans-serif">NEW</text>'),
            type: 'new_tv'
        },
        {
            title: 'Рандомный Топ',
            img: categoryIcon('<rect x="3" y="3" width="18" height="18" rx="3" fill="#9C27B0"/><circle fill="white" cx="8" cy="8" r="1.8"/><circle fill="white" cx="16" cy="16" r="1.8"/><circle fill="white" cx="12" cy="12" r="1.8"/>'),
            type: 'random'
        }
    ];

    var MENU_STAR_ICON =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
            '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/>' +
        '</svg>';

    var categoryCache = {};

    // Получение даты пятилетней давности
    function getCutoffDate() {
        var date = new Date();

        date.setFullYear(date.getFullYear() - RECENT_YEARS);

        return date.toISOString().split('T')[0];
    }

    // Перемешивание массива
    function shuffleArray(items) {
        for (var i = items.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));

            var temp = items[i];
            items[i] = items[j];
            items[j] = temp;
        }

        return items;
    }

    // Сортировка по дате выхода
    function sortByReleaseDate(items) {
        return items.sort(function (a, b) {
            var dateA = a.release_date || a.first_air_date || '';
            var dateB = b.release_date || b.first_air_date || '';

            if (!dateA) return 1;
            if (!dateB) return -1;

            return dateB.localeCompare(dateA);
        });
    }

    // Фильтрация новинок
    function filterRecentItems(items) {
        var cutoff = getCutoffDate();

        return items.filter(function (item) {
            var releaseDate = item.release_date || item.first_air_date || '';

            return releaseDate && releaseDate >= cutoff;
        });
    }

    // Выбор нужного TMDB API
    function getTmdbPath(categoryType) {
        var cutoff = getCutoffDate();

        switch (categoryType) {

            case 'movies':
                return {
                    path: 'movie/top_rated',
                    mediaType: 'movie'
                };

            case 'tv':
                return {
                    path: 'tv/top_rated',
                    mediaType: 'tv'
                };

            case 'new_movies':
                return {
                    path: 'discover/movie?sort_by=primary_release_date.desc&primary_release_date.gte=' + encodeURIComponent(cutoff),
                    mediaType: 'movie'
                };

            case 'new_tv':
                return {
                    path: 'discover/tv?sort_by=first_air_date.desc&first_air_date.gte=' + encodeURIComponent(cutoff),
                    mediaType: 'tv'
                };

            case 'all':
            case 'new':
            case 'random':
            default:
                return {
                    path: 'trending/all/week',
                    mediaType: 'all'
                };
        }
    }

    // Формирование URL запроса
    function makeTmdbUrl(path, page) {
        var separator = path.indexOf('?') >= 0 ? '&' : '?';

        var language = Lampa.Storage.get('tmdb_lang', 'ru') || 'ru';

        var query =
            'api_key=' + encodeURIComponent(Lampa.TMDB.key()) +
            '&language=' + encodeURIComponent(language) +
            '&page=' + page;

        return Lampa.TMDB.api(path + separator + query);
    }

    // Загрузка рейтингов из TMDB
    function loadTmdbPages(category, success, error) {

        var request = new Lampa.Reguest();

        var endpoint = getTmdbPath(category.type);

        var results = [];
        var page = 1;
        var lastPage = MAX_PAGES;
        var finished = false;

        if (typeof request.timeout === 'function') {
            request.timeout(20000);
        }

        // Завершение загрузки
        function finish() {
            if (finished) return;

            finished = true;

            results = results.filter(function (item) {
                return item && item.id;
            });

            results.forEach(function (item) {
                item.media_type = item.media_type || endpoint.mediaType;
                item.source = 'tmdb';
            });

            // Обработка новинок
            if (category.type === 'new') {
                results = sortByReleaseDate(filterRecentItems(results));
            }
            else if (
                category.type === 'new_movies' ||
                category.type === 'new_tv'
            ) {
                results = sortByReleaseDate(filterRecentItems(results));
            }
            else if (category.type === 'random') {
                results = shuffleArray(results);
            }

            success({
                results: results,
                title: category.title
            });
        }

        // Обработка ошибки
        function fail() {
            if (results.length) {
                finish();
            }
            else {
                if (error) error();
            }
        }

        // Загрузка следующей страницы
        function loadNextPage() {

            var url;

            try {
                url = makeTmdbUrl(endpoint.path, page);
            }
            catch (e) {
                fail();
                return;
            }

            request.silent(
                url,

                function (response) {

                    if (!response || !Array.isArray(response.results)) {
                        fail();
                        return;
                    }

                    for (var i = 0; i < response.results.length; i++) {
                        results.push(response.results[i]);
                    }

                    var totalPages = parseInt(response.total_pages, 10) || 1;

                    lastPage = Math.min(MAX_PAGES, totalPages);

                    if (page < lastPage && response.results.length) {
                        page++;
                        loadNextPage();
                    }
                    else {
                        finish();
                    }
                },

                function () {
                    fail();
                }
            );
        }

        loadNextPage();
    }

    // Главный список категорий
    function getCategoryList(categoryData, success) {

        success({
            collection: true,
            total_pages: 1,

            results: TOP_CATEGORIES.map(function (category) {
                return {
                    title: category.title,
                    img: category.img,
                    type: category.type
                };
            })
        });
    }

    // Получение карточек выбранной категории
    function getCategoryItems(category, success, error) {

        var categoryType = category.type;

        // Проверка кэша
        if (categoryCache[categoryType]) {

            var cached = categoryCache[categoryType];

            var result = {
                results: cached.results.slice(),
                title: category.title
            };

            if (categoryType === 'random') {
                result.results = shuffleArray(result.results);
            }

            success(result);
            return;
        }

        // Загрузка из TMDB
        loadTmdbPages(
            category,

            function (data) {

                categoryCache[categoryType] = {
                    results: data.results.slice(),
                    title: data.title
                };

                success(data);
            },

            function () {

                if (Lampa.Noty && Lampa.Noty.show) {
                    Lampa.Noty.show(
                        'Не удалось подключиться к TMDB. Проверьте соединение или настройки прокси TMDB.'
                    );
                }

                if (error) error();
            }
        );
    }

    // Очистка кэша
    function clearCategoryCache() {
        categoryCache = {};
    }

    var categoryDataSource = {
        main: getCategoryList,
        full: getCategoryItems,
        clear: clearCategoryCache
    };

    // Главный экран рейтингов
    function createTopRatingsMenu(categoryData) {

        var component = Lampa.Maker.make('Category', categoryData);

        return component.use({

            onCreate: function () {

                var menu = this;

                this.body.addClass('mapping--grid');
                this.body.addClass('cols--5');

                setTimeout(function () {

                    var payload = {
                        results: TOP_CATEGORIES.map(function (category) {

                            return {
                                title: category.title,
                                img: category.img,

                                params: {
                                    style: {
                                        name: 'collection'
                                    },

                                    module: Lampa.Maker
                                        .module('Card')
                                        .only('Card', 'Callback', 'Style')
                                },

                                data: {
                                    title: category.title,
                                    component: 'top_ratings_full',
                                    type: category.type,
                                    page: 1
                                }
                            };
                        })
                    };

                    menu.build(payload);

                    $('.card', menu.body).css('text-align', 'center');

                }, 100);
            },

            onInstance: function (card, data) {

                card.use({

                    onEnter: function () {

                        if (data && data.data) {
                            Lampa.Activity.push(data.data);
                        }
                    }
                });
            }
        });
    }

    // Экран выбранной категории
    function createTopRatingsCategory(categoryData) {

        var component = Lampa.Maker.make('Category', categoryData);

        return component.use({

            onCreate: function () {

                var category = this;

                category.activity.loader(true);

                categoryDataSource.full(
                    categoryData,

                    function (data) {

                        category.build(data);
                        category.activity.loader(false);
                    },

                    function () {

                        category.empty();
                        category.activity.loader(false);
                    }
                );
            },

            onUpdate: function (updatedCategoryData) {

                var category = this;

                category.activity.loader(true);

                categoryDataSource.full(
                    updatedCategoryData,

                    function (data) {

                        category.build(data);
                        category.activity.loader(false);
                    },

                    function () {

                        category.empty();
                        category.activity.loader(false);
                    }
                );
            },

            onInstance: function (card) {

                card.use({

                    onEnter: function (event, cardData) {

                        Lampa.Activity.push({
                            url: '',
                            component: 'full',
                            id: cardData.id,
                            method: cardData.media_type,
                            card: cardData
                        });
                    }
                });
            }
        });
    }

    // Регистрация плагина
    function initializePlugin() {

        // Проверка адреса или сборки Lampa не выполняется.
        if (window.top_ratings_plugin) return;

        window.top_ratings_plugin = true;

        var pluginManifest = {
            type: 'video',
            version: '1.1.0',
            name: 'Топ',
            description: 'Топ рейтинги фильмов и сериалов (через TMDB)',
            component: 'top_ratings'
        };

        if (!Lampa.Manifest.plugins) {
            Lampa.Manifest.plugins = {};
        }

        Lampa.Manifest.plugins.top_ratings = pluginManifest;

        // Регистрация компонентов
        Lampa.Component.add(
            'top_ratings',
            createTopRatingsMenu
        );

        Lampa.Component.add(
            'top_ratings_full',
            createTopRatingsCategory
        );

        // Добавление пункта меню
        var menuItem = $(
            '<li class="menu__item selector">' +
                '<div class="menu__ico">' +
                    MENU_STAR_ICON +
                '</div>' +
                '<div class="menu__text">' +
                    pluginManifest.name +
                '</div>' +
            '</li>'
        );

        menuItem.on('hover:enter', function () {

            Lampa.Activity.push({
                url: '',
                title: pluginManifest.name,
                component: 'top_ratings',
                page: 1
            });
        });

        $('.menu .menu__list')
            .eq(0)
            .append(menuItem);
    }

    // Запуск после готовности Lampa
    if (window.appready) {
        initializePlugin();
    }
    else {
        Lampa.Listener.follow('app', function (event) {

            if (event.type === 'ready') {
                initializePlugin();
            }
        });
    }

})();