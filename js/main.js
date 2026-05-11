// ========== КОНФИГУРАЦИЯ ==========
var API_URL = 'https://script.google.com/macros/s/AKfycbxid7p2qdp7qaCPQ7MevszgHIohE-RuoDvOutmNLhfGgAVKTwptK9Rn4wA38i5fb2Igpw/exec';

// ========== РОУТЕР (ПОДГРУЗКА РАЗДЕЛОВ) ==========
function loadSection(sectionId) {
    var main = document.getElementById('content');
    main.innerHTML = '<p style="text-align:center; padding:40px;">Загрузка...</p>';
    var url = window.location.origin + window.location.pathname.replace('index.html','') + 'sections/' + sectionId + '.html';
    fetch(url)
        .then(function(response) {
            if (!response.ok) throw new Error('Раздел не найден');
            return response.text();
        })
        .then(function(html) {
            main.innerHTML = html;
            // Инициализация после загрузки раздела
            if (sectionId === 'contacts') initMap();
            if (sectionId === 'news') { loadInitialNews(); }
            // Аккордеоны FAQ работают через делегирование событий
        })
        .catch(function() {
            main.innerHTML = '<p style="text-align:center; padding:40px; color:red;">Не удалось загрузить раздел</p>';
        });
}

// Обработка навигации
document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href^="#"]');
    if (link) {
        e.preventDefault();
        var sectionId = link.getAttribute('href').substring(1);
        loadSection(sectionId);
        // Закрываем меню, если мобильное
        var nav = document.querySelector('.nav-links');
        if (nav) nav.classList.remove('open');
    }
});

// ========== ТЁМНАЯ ТЕМА ==========
var themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    var icon = themeToggle.querySelector('i');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark');
        if (document.body.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
        } else {
            localStorage.setItem('theme', 'light');
            icon.classList.replace('fa-sun', 'fa-moon');
        }
    });
}

// ========== КАРТА (загружается при необходимости) ==========
function initMap() {
    if (typeof ymaps === 'undefined') {
        var script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=ВАШ_API_КЛЮЧ_ЯНДЕКС&lang=ru_RU';
        script.onload = function() {
            ymaps.ready(function() {
                var map = new ymaps.Map('map', { center: [56.505210, 60.815588], zoom: 16 });
                map.geoObjects.add(new ymaps.Placemark([56.505210, 60.815588], { hintContent: 'Студия Самоцветы', balloonContent: 'ул. Коммуны, 36' }));
            });
        };
        document.body.appendChild(script);
    } else {
        ymaps.ready(function() {
            var map = new ymaps.Map('map', { center: [56.505210, 60.815588], zoom: 16 });
            map.geoObjects.add(new ymaps.Placemark([56.505210, 60.815588], { hintContent: 'Студия Самоцветы', balloonContent: 'ул. Коммуны, 36' }));
        });
    }
}

// ========== НОВОСТИ (JSONP) ==========
var allNewsData = [];

function jsonp(url, callback) {
    var cbName = 'jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2);
    window[cbName] = function(data) {
        delete window[cbName];
        var script = document.getElementById(cbName);
        if (script) script.remove();
        callback(data);
    };
    var script = document.createElement('script');
    script.id = cbName;
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + cbName;
    document.body.appendChild(script);
}

function loadInitialNews() {
    var container = document.getElementById('newsContainer');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;">Загрузка...</p>';
    jsonp(API_URL + '?action=news', function(data) {
        if (!data.news || !data.news.length) {
            container.innerHTML = '<p style="text-align:center;">Новостей пока нет.</p>';
            return;
        }
        allNewsData = data.news;
        renderNews(allNewsData.slice(0, 3));
    });
}

function renderNews(newsArray) {
    var container = document.getElementById('newsContainer');
    if (!container) return;
    if (!newsArray || newsArray.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Новостей нет.</p>';
        return;
    }
    container.innerHTML = newsArray.map(function(n) {
        var dateStr = n.publishDate ? new Date(n.publishDate).toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' }) : '';
        return '<div class="news-card">' +
            (n.images && n.images.length ? '<img src="' + n.images[0] + '" onerror="this.style.display=\'none\'" style="height:180px; object-fit:cover;">' : '') +
            (dateStr ? '<div class="news-date">' + dateStr + '</div>' : '') +
            '<div class="news-title">' + n.title + '</div>' +
            '<button class="read-more-btn" onclick="openNewsDetail(\'' + n.id + '\')">Читать далее</button>' +
        '</div>';
    }).join('');
}

function renderAllNews() {
    if (allNewsData.length > 0) renderNews(allNewsData);
    else loadInitialNews();
}

function openNewsDetail(newsId) {
    var item = allNewsData.find(function(n) { return n.id === newsId; });
    if (!item) return alert('Новость не найдена');
    document.getElementById('newsDetailTitle').textContent = item.title;
    document.getElementById('newsDetailDate').textContent = item.publishDate ? new Date(item.publishDate).toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' }) : '';
    var imgContainer = document.getElementById('newsDetailImages');
    if (item.images && item.images.length) {
        imgContainer.innerHTML = item.images.map(function(url) { return '<img src="' + url + '" onerror="this.style.display=\'none\'">'; }).join('');
    } else {
        imgContainer.innerHTML = '<p>Нет изображений</p>';
    }
    document.getElementById('newsDetailContent').innerHTML = item.content;
    document.getElementById('newsDetailModal').classList.add('active');
}

function closeNewsDetailModal() {
    document.getElementById('newsDetailModal').classList.remove('active');
}

// ========== МОДАЛЬНЫЕ ОКНА ==========
function openVenueModal() { document.getElementById('venueModal').classList.add('active'); }
function closeVenueModal() { document.getElementById('venueModal').classList.remove('active'); }
function openGiftModal() { document.getElementById('giftModal').classList.add('active'); }
function closeGiftModal() { document.getElementById('giftModal').classList.remove('active'); }

// ========== FAQ АККОРДЕОН (делегирование) ==========
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('faq-question') || e.target.closest('.faq-question')) {
        var btn = e.target.classList.contains('faq-question') ? e.target : e.target.closest('.faq-question');
        var answer = btn.nextElementSibling;
        var icon = btn.querySelector('i.fa-chevron-down, i.fa-chevron-up');
        if (answer) {
            answer.classList.toggle('open');
            if (icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
        }
    }
    // Закрытие модальных окон при клике на фон
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
    }
});

// ========== КНОПКА "НАВЕРХ" ==========
window.addEventListener('scroll', function() {
    var btn = document.getElementById('scrollTopBtn');
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
});

// ========== ПЕРВЫЙ ЗАПУСК ==========
(function() {
    var hash = window.location.hash.substring(1);
    if (hash) loadSection(hash);
    else loadSection('about');
})();
