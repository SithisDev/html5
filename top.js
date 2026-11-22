// Плагин «Топ рейтинги» для Lampa.
// Читаемая версия исходного плагина.

(function () {
    'use strict';

    Lampa.Platform.tv();

    // Настройки
    var RATINGS_API_URL = 'http://94.156.115.58:841/lampa/ratings';
    var RECENT_YEARS = 5;

    // Создание SVG data URI
    function svgDataUri(svg) {
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    function categoryIcon(content) {
        return svgDataUri(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">' +
                '<g transform="translate(12,12) scale(0.6) translate(-12,-12)">' +
                    content +
                '</g>' +
            '</svg>'
        );
    }

    // Категории рейтингов
    var TOP_CATEGORIES = [
        {
            title: 'Топ',
            img: categoryIcon(
                '<path fill="#FFD700" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
            ),
            type: 'all'
        },
        {
            title: 'Топ Фильмы',
            img: categoryIcon(
                '<path fill="#E50914" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>'
            ),
            type: 'movies'
        },
        {
            title: 'Топ Сериалы',
            img: categoryIcon(
                '<path fill="#4285F4" d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V7h18v10z"/>'
            ),
            type: 'tv'
        },
        {
            title: 'Топ New',
            img: categoryIcon(
                '<circle fill="#33C758" cx="12" cy="12" r="10"/>' +
                '<text x="12" y="16" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="Arial, sans-serif">NEW</text>'
            ),
            type: 'new'
        },
        {
            title: 'Топ New Фильмы',
            img: categoryIcon(
                '<path fill="#E50914" d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z"/>' +
                '<circle fill="#33C758" cx="18" cy="6" r="5"/>' +
                '<text x="18" y="9" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="Arial, sans-serif">NEW</text>'
            ),
            type: 'new_movies'
        },
        {
            title: 'Топ New Сериалы',
            img: categoryIcon(
                '<path fill="#4285F4" d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V7h18v10z"/>' +
                '<circle fill="#33C758" cx="18" cy="6" r="5"/>' +
                '<text x="18" y="9" text-anchor="middle" fill="white" font-size="8" font-weight="bold" font-family="Arial, sans-serif">NEW</text>'
            ),
            type: 'new_tv'
        },
        {
            title: 'Рандомный Топ',
            img: categoryIcon(
                '<rect x="3" y="3" width="18" height="18" rx="3" fill="#9C27B0"/>' +
                '<circle fill="white" cx="8" cy="8" r="1.8"/>' +
                '<circle fill="white" cx="16" cy="16" r="1.8"/>' +
                '<circle fill="white" cx="12" cy="12" r="1.8"/>'
            ),
            type: 'random'
        }
    ];

    // Иконка пункта главного меню
    var MENU_STAR_ICON =
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
            '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" ' +
                'd="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/>' +
        '</svg>';

    // Состояние плагина
    var categoryCache = {};
    var currentCategory = null;
    var onCategoryLoaded = null;
    var onRequestError = null;
    var resolvedItems = [];
    var resolvedCount = 0;
    var totalItemsToResolve = 0;
    var originalItems = [];

    // Перемешивание массива
    function shuffleArray(items) {
        for (var index = items.length - 1; index > 0; index--) {
            var randomIndex = Math.floor(Math.random() * (index + 1));
            var temporaryItem = items[index];

            items[index] = items[randomIndex];
            items[randomIndex] = temporaryItem;
        }

        return items;
    }

    // Сортировка по дате выхода
    function sortByReleaseDate(items) {
        return items.sort(function (currentItem, nextItem) {
            var currentDate = currentItem.release_date || currentItem.first_air_date || '';
            var nextDate = nextItem.release_date || nextItem.first_air_date || '';

            if (!currentDate) return 1;
            if (!nextDate) return -1;

            return nextDate.localeCompare(currentDate);
        });
    }

    // Фильтрация новинок за последние пять лет
    function filterRecentItems(items) {
        var cutoffDate = new Date();

        cutoffDate.setFullYear(
            cutoffDate.getFullYear() - RECENT_YEARS
        );

        var cutoffDateString = cutoffDate.toISOString().split('T')[0];

        return items.filter(function (item) {
            var releaseDate = item.release_date || item.first_air_date || '';

            return releaseDate && releaseDate >= cutoffDateString;
        });
    }

    // Получение адреса API
    function getCategoryApiUrl(categoryType) {
        switch (categoryType) {
            case 'movies':
            case 'new_movies':
                return RATINGS_API_URL + '/top/movie/200';

            case 'tv':
            case 'new_tv':
                return RATINGS_API_URL + '/top/tv/200';

            case 'all':
            case 'new':
            case 'random':
            default:
                return RATINGS_API_URL + '/top/200';
        }
    }

    // Завершение загрузки категории
    function finishCategoryLoading() {
        resolvedCount++;

        if (resolvedCount < totalItemsToResolve) {
            return;
        }

        var results = [];

        // Сохраняем исходный порядок рейтинга
        if (
            currentCategory.type === 'all' ||
            currentCategory.type === 'movies' ||
            currentCategory.type === 'tv'
        ) {
            for (
                var originalIndex = 0;
                originalIndex < originalItems.length;
                originalIndex++
            ) {
                var originalItem = originalItems[originalIndex];
                var originalContentKey = originalItem.contentKey;

                for (
                    var resolvedIndex = 0;
                    resolvedIndex < resolvedItems.length;
                    resolvedIndex++
                ) {
                    var resolvedItem = resolvedItems[resolvedIndex];

                    if (
                        resolvedItem &&
                        resolvedItem._contentKey === originalContentKey
                    ) {
                        results.push(resolvedItem);
                        break;
                    }
                }
            }
        } else {
            results = resolvedItems;
        }

        // Обработка новинок
        if (
            currentCategory.type === 'new' ||
            currentCategory.type === 'new_movies' ||
            currentCategory.type === 'new_tv'
        ) {
            results = filterRecentItems(results);
            results = sortByReleaseDate(results);
        } else if (currentCategory.type === 'random') {
            results = shuffleArray(results);
        }

        var categoryResult = {
            results: results,
            title: currentCategory.title
        };

        categoryCache[currentCategory.type] = categoryResult;

        if (onCategoryLoaded) {
            onCategoryLoaded(categoryResult);
        }

        // Сброс состояния
        currentCategory = null;
        onCategoryLoaded = null;
        onRequestError = null;

        resolvedItems = [];
        resolvedCount = 0;
        totalItemsToResolve = 0;
        originalItems = [];
    }

    // Получение полной информации о фильме или сериале из TMDB
    function resolveItemDetails(item, request) {
        if (!item || !item.contentKey) {
            finishCategoryLoading();
            return;
        }

        var contentKeyParts = item.contentKey.split('_');

        if (contentKeyParts.length < 2) {
            finishCategoryLoading();
            return;
        }

        var mediaType = contentKeyParts[0];
        var tmdbId = contentKeyParts[1];

        // Фильтрация по типу контента
        if (
            (
                currentCategory.type === 'movies' ||
                currentCategory.type === 'new_movies'
            ) &&
            mediaType !== 'movie'
        ) {
            finishCategoryLoading();
            return;
        }

        if (
            (
                currentCategory.type === 'tv' ||
                currentCategory.type === 'new_tv'
            ) &&
            mediaType !== 'tv'
        ) {
            finishCategoryLoading();
            return;
        }

        var apiRequest = Lampa.TMDB.api(
            mediaType + '/' + tmdbId +
            '?api_key=' + Lampa.TMDB.key() +
            '&language=' + Lampa.Storage.get('tmdb_lang', 'ru')
        );

        request.silent(
            apiRequest,

            function (details) {
                if (details) {
                    details.media_type = mediaType;
                    details._contentKey = item.contentKey;

                    resolvedItems.push(details);
                }

                finishCategoryLoading();
            },

            function () {
                finishCategoryLoading();
            }
        );
    }

    // Получение списка категорий
    function getCategoryList(categoryData, success) {
        var payload = {
            collection: true,
            total_pages: 1,

            results: TOP_CATEGORIES.map(function (category) {
                return {
                    title: category.title,
                    img: category.img,
                    type: category.type
                };
            })
        };

        success(payload);
    }

    // Получение фильмов и сериалов выбранной категории
    function getCategoryItems(category, success, error) {
        var request = new Lampa.Reguest();
        var categoryType = category.type;

        // Используем кэш
        if (categoryCache[categoryType]) {
            var cachedCategoryData = categoryCache[categoryType];

            if (categoryType === 'random') {
                cachedCategoryData = {
                    results: shuffleArray(
                        cachedCategoryData.results.slice()
                    ),
                    title: category.title
                };
            } else if (
                categoryType === 'new' ||
                categoryType === 'new_movies' ||
                categoryType === 'new_tv'
            ) {
                var recentItems = filterRecentItems(
                    cachedCategoryData.results.slice()
                );

                cachedCategoryData = {
                    results: sortByReleaseDate(recentItems),
                    title: category.title
                };
            }

            success(cachedCategoryData);
            return;
        }

        var apiUrl = getCategoryApiUrl(categoryType);

        request.silent(
            apiUrl,

            function (items) {
                if (!items || !Array.isArray(items)) {
                    error();
                    return;
                }

                originalItems = items.slice();

                currentCategory = category;
                onCategoryLoaded = success;
                onRequestError = error;

                resolvedItems = [];
                resolvedCount = 0;

                totalItemsToResolve = items.length;

                if (totalItemsToResolve === 0) {
                    success({
                        results: [],
                        title: category.title
                    });

                    return;
                }

                for (var index = 0; index < items.length; index++) {
                    resolveItemDetails(items[index], request);
                }
            },

            error
        );
    }

    // Очистка кэша
    function clearCategoryCache() {
        categoryCache = {};
    }

    // Источник данных категорий
    var categoryDataSource = {
        main: getCategoryList,
        full: getCategoryItems,
        clear: clearCategoryCache
    };

    // Создание главного экрана рейтингов
    function createTopRatingsMenu(categoryData) {
        var categoryComponent = Lampa.Maker.make(
            'Category',
            categoryData
        );

        return categoryComponent.use({
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

                    $('.card', menu.body).css(
                        'text-align',
                        'center'
                    );
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

    // Создание экрана выбранной категории
    function createTopRatingsCategory(categoryData) {
        var categoryComponent = Lampa.Maker.make(
            'Category',
            categoryData
        );

        return categoryComponent.use({
            onCreate: function () {
                var category = this;

                this.activity.loader(true);

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

                this.activity.loader(true);

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

        // Проверки источника сборки больше нет.
        // Плагин может регистрироваться в разных сборках Lampa.

        // Защита от повторной регистрации
        if (window.top_ratings_plugin) {
            return;
        }

        window.top_ratings_plugin = true;

        var pluginManifest = {
            type: 'video',
            version: '1.0.0',
            name: 'Топ',
            description: 'Топ рейтинги фильмов и сериалов',
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

        // Пункт главного меню
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

    // Ожидание готовности Lampa
    if (window.appready) {
        initializePlugin();
    } else {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') {
                initializePlugin();
            }
        });
    }

})();