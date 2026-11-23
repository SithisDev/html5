(function () {
    'use strict';

    // TMDB network IDs used by discover/tv. Each service is displayed as its
    // own Top category in the Lampa main menu.
    var SERVICES = [
        { name: 'Netflix', network: '213', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 551.111 1000"><defs><linearGradient id="netflix-left" x1="78.234" x2="221.663" y1="423.767" y2="365.092" gradientUnits="userSpaceOnUse"><stop stop-color="#b1060f"/><stop offset=".546" stop-color="#7b010c"/><stop offset="1" stop-color="#e50914" stop-opacity="0"/></linearGradient><linearGradient id="netflix-right" x1="456.365" x2="309.676" y1="521.56" y2="583.495" gradientUnits="userSpaceOnUse"><stop stop-color="#b1060f"/><stop offset=".625" stop-color="#7b010c"/><stop offset="1" stop-color="#b1060f" stop-opacity="0"/></linearGradient></defs><path d="M-1.152-1.152 2.305 1002.67c73.273-14.111 130.892-12.569 195.924-18.44V0Z" fill="url(#netflix-left)"/><path d="M353.816 0h199.381l2.305 1000.365-202.839-33.422z" fill="url(#netflix-right)"/><path d="M1.152 0c4.61 11.525 345.749 981.925 345.749 981.925 56.056-.4 131.219 8.754 205.144 17.288L197.077 0Z" fill="#e50914"/></svg>' },
        { name: 'Apple TV', network: '2552', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 814 1000" fill="#fff"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>' },
        { name: 'Prime Video', network: '1024', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4605.7 2723.6" fill="#0779ff"><path d="M2246 2723.1a2591.3 2591.3 0 0 1-591.4-83.5 2159.7 2159.7 0 0 1-516.8-208.3A1728.5 1728.5 0 0 1 679.1 2060c-55.6-63.6-86-106.3-101-141.4a93 93 0 0 1-9-35.5c-1.2-22.7 6-36.6 23.6-45.2 6.3-3.2 7-3.3 18.6-3.3a51 51 0 0 1 19 2.3c20.3 6.6 46.1 22.7 79.5 49.4a2069.6 2069.6 0 0 0 372.5 240.3c147.7 74.5 292.3 128.2 473.7 176a3157 3157 0 0 0 627.8 98.4c72.8 4.1 93.8 4.6 189.5 4.6 105.9 0 154.2-1.5 242-7.5 361.5-24.8 718.7-108.9 984.8-231.8a2156 2156 0 0 0 63-31c45.1-22.7 57-28.2 75.7-35 26.3-9.4 44.4-6.3 59.7 10.2a50.4 50.4 0 0 1 14.8 38.5c-5.1 41.5-59 100.4-163.7 179.3-249.6 188-594.4 319.3-974.8 371.2a2718 2718 0 0 1-263.5 22.6 3806 3806 0 0 1-165.4 1zm1615-239.4a51.1 51.1 0 0 1-26.8-24c-7.7-16.8-5.3-31.5 10.4-64.1a572 572 0 0 1 31.9-56.5c41.2-68.3 82.6-159.4 102.1-224.6 19.6-65.4 22-102.6 8-123.8-12-18.2-50.5-29.6-113.2-33.7-24.5-1.6-103.2-.6-126.7 1.5-52.5 4.9-89 10.2-138 20.1-35 7.1-41.8 8-66.5 8-23.9 0-28.8-.7-38.5-5.5a41 41 0 0 1-21-41.6c2.5-13.7 11.4-26.6 27.8-40.3 41.9-35 107.4-69 178.7-92.6a654.9 654.9 0 0 1 232.5-33.3 596 596 0 0 1 133 19.4c71.2 18.4 114.3 42 129.3 71 11.5 22.3 15.8 44.9 15.7 83.6a617 617 0 0 1-33.6 195.2 608 608 0 0 1-156.5 249.2c-53 52.3-89.7 80-119.5 90a57.3 57.3 0 0 1-29 2zM22.4 1754.7a39.2 39.2 0 0 1-19.9-17.9l-2.3-4.2-.2-656.5c-.2-594.8-.1-657 1.3-661.9 2-6.9 10.3-16 18.3-19.8l5.6-2.8h181l4.7 2.2a34.4 34.4 0 0 1 16.7 17.1c3.6 7.7 4.7 12.9 19.3 84.5l10.3 50.7h10l4.5-9.7a318.5 318.5 0 0 1 38.7-63.3 322 322 0 0 1 65.6-59.3 278.7 278.7 0 0 1 218.2-40.6c76.2 16.7 145 67.4 195 143.7 48.3 73.8 82.2 179.6 93 290.7 3.2 33 3.7 42.2 4.2 89.7a905 905 0 0 1-6.7 140.3c-16 127.7-59.3 238.2-122 311a470 470 0 0 1-46 44.7 285.6 285.6 0 0 1-137 60c-19.6 3-66.8 3.3-85.5.5-72.7-10.9-127.5-44.7-175.8-108.5a491.5 491.5 0 0 1-36-56.4c-2.7-4.7-2.8-4.8-7.7-4.8h-5l-.2 224.3-.3 224.2-3 5.3a40.6 40.6 0 0 1-18.1 16.6c-4.2 1.4-16 1.6-110.8 1.6-86.6 0-106.8-.3-109.9-1.4m443.6-523.7c38-7.3 68.2-28.8 92-65.5 30-46 47.6-113 52.9-201.8 1.6-26.5.7-105.1-1.5-127.7-4.6-48-12.1-87-23-118.7-25.2-73.5-64.5-114.7-120.4-126a222 222 0 0 0-57.3 0c-45.8 9.2-80.6 38.3-106.3 88.7a346 346 0 0 0-31 94c-12.9 65.2-15.2 163.8-5.5 239.4 8.2 64.1 25.4 116.1 50.7 153.6 27 39.7 60.5 60.9 104.7 66 10.8 1.3 32.9.3 44.7-2"/></svg>' },
        { name: 'HBO', network: '49', icon: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="#FFFFFF"><path d="M7.042 16.896H4.414v-3.754H2.708v3.754H.01L0 7.22h2.708v3.6h1.706v-3.6h2.628zm12.043.046C21.795 16.94 24 14.689 24 11.978a4.89 4.89 0 0 0-4.915-4.92c-2.707-.002-4.09 1.991-4.432 2.795.003-1.207-1.187-2.632-2.58-2.634H7.59v9.674l4.181.001c1.686 0 2.886-1.46 2.888-2.713.385.788 1.72 2.762 4.427 2.76zm-7.665-3.936c.387 0 .692.382.692.817 0 .435-.305.817-.692.817h-1.33v-1.634zm.005-3.633c.387 0 .692.382.692.817 0 .436-.305.818-.692.818h-1.33V9.373zm1.77 2.607c.305-.039.813-.387.992-.61-.063.276-.068 1.074.006 1.35-.204-.314-.688-.701-.998-.74zm3.43 0a2.462 2.462 0 1 1 4.924 0 2.462 2.462 0 0 1-4.925 0zm2.462 1.936a1.936 1.936 0 1 0 0-3.872 1.936 1.936 0 0 0 0 3.872Z"/></svg>' },
        { name: 'AMC', network: '174', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#fff"><text x="50" y="68" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="700">AMC</text></svg>' },
        { name: 'tvN KR', network: '866', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="4" y="18" width="92" height="64" rx="13" fill="#e83948"/><text x="50" y="61" text-anchor="middle" font-family="Arial,sans-serif" font-size=" thirty" font-weight="700" fill="#fff">tvN</text></svg>' },
        { name: 'Disney+', network: '2739', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="#fff"><text x="50" y="59" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" font-weight="700">Disney</text><path d="M73 68h14M80 61v14" stroke="#fff" stroke-width="3"/></svg>' }
    ];

    var icon = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M4 4h16v3H4zm0 6h16v3H4zm0 6h16v3H4z"/></svg>';

    function addMenuItems() {
        var style = document.createElement('style');
        style.textContent = '.menu .selector:hover svg,.menu .selector.focus svg,.menu .selector:focus svg{filter:brightness(0)!important}.menu .selector:hover svg *,.menu .selector.focus svg *,.menu .selector:focus svg *{transition:filter .15s}';
        document.head.appendChild(style);

        SERVICES.forEach(function (service) {
            Lampa.Menu.addButton(service.icon || icon, service.name, function () {
                Lampa.Activity.push({
                    url: 'discover/tv',
                    title: 'Top ' + service.name,
                    component: 'category_full',
                    networks: service.network,
                    sort_by: 'popularity.desc',
                    source: 'tmdb',
                    card_type: true,
                    page: 1
                });
            });
        });
    }

    function start() {
        if (!window.Lampa || !Lampa.Menu || !Lampa.Activity) return;
        Lampa.Manifest.plugins = {
            type: 'other',
            version: '1.0.0',
            name: 'Top Streaming Services',
            description: 'Top TV series by streaming service',
            component: 'top_streaming'
        };
        addMenuItems();
    }

    if (window.appready) {
        start();
    } else if (window.Lampa && Lampa.Listener) {
        Lampa.Listener.follow('app', function (event) {
            if (event.type === 'ready') start();
        });
    }
})();
