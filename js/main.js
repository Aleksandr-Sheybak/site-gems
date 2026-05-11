const API_URL = 'https://script.google.com/macros/s/AKfycbxid7p2qdp7qaCPQ7MevszgHIohE-RuoDvOutmNLhfGgAVKTwptK9Rn4wA38i5fb2Igpw/exec';
let allNewsData = [];

// ========== РОУТЕР ==========
function loadSection(sectionId) {
    const main = document.getElementById('content');
    main.innerHTML = '<p style="text-align:center; padding:40px;">Загрузка...</p>';
    const basePath = window.location.pathname.replace(/\/[^/]*$/, '/');
    fetch(`${basePath}sections/${sectionId}.html`)
        .then(response => {
            if (!response.ok) throw new Error('Раздел не найден');
            return response.text();
        })
        .then(html => {
            main.innerHTML = html;
            if (sectionId === 'contacts') initMap();
            if (sectionId === 'news') loadInitialNews();
        })
        .catch(() => {
            main.innerHTML = '<p style="text-align:center; padding:40px; color:red;">Не удалось загрузить раздел</p>';
        });
}

// Обработка навигации
document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
        e.preventDefault();
        const sectionId = link.getAttribute('href').substring(1);
        loadSection(sectionId);
        document.querySelector('.nav-links')?.classList.remove('open');
    }
});

// ========== ТЁМНАЯ ТЕМА ==========
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
    themeToggle.addEventListener('click', () => {
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

// ========== НОВОСТИ (JSONP) ==========
function jsonp(url, callback) {
    const cbName = 'jsonp_' + Date.now() + '_' + Math.random().toString(36).substr(2);
    window[cbName] = function(data) {
        delete window[cbName];
        const script = document.getElementById(cbName);
        if (script) script.remove();
        callback(data);
    };
    const script = document.createElement('script');
    script.id = cbName;
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + cbName;
    document.body.appendChild(script);
}

function loadInitialNews() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;">Загрузка...</p>';
    jsonp(API_URL + '?action=news', data => {
        if (!data.news || !data.news.length) {
            container.innerHTML = '<p style="text-align:center;">Новостей пока нет.</p>';
            return;
        }
        allNewsData = data.news;
        renderNews(allNewsData.slice(0, 3));
    });
}

function renderNews(newsArray) {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    if (!newsArray || newsArray.length === 0) {
        container.innerHTML = '<p style="text-align:center;">Новостей нет.</p>';
        return;
    }
    container.innerHTML = newsArray.map(n => {
        const dateStr = n.publishDate ? new Date(n.publishDate).toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' }) : '';
        return `<div class="news-card">
            ${n.images && n.images.length ? `<img src="${n.images[0]}" onerror="this.style.display='none'" style="height:180px; object-fit:cover;">` : ''}
            ${dateStr ? `<div class="news-date">${dateStr}</div>` : ''}
            <div class="news-title">${n.title}</div>
            <button class="read-more-btn" onclick="openNewsDetail('${n.id}')">Читать далее</button>
        </div>`;
    }).join('');
}

function renderAllNews() {
    if (allNewsData.length > 0) renderNews(allNewsData);
    else loadInitialNews();
}

function openNewsDetail(newsId) {
    const item = allNewsData.find(n => n.id === newsId);
    if (!item) return alert('Новость не найдена');
    document.getElementById('newsDetailTitle').textContent = item.title;
    document.getElementById('newsDetailDate').textContent = item.publishDate ? new Date(item.publishDate).toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' }) : '';
    const imgContainer = document.getElementById('newsDetailImages');
    if (item.images && item.images.length) {
        imgContainer.innerHTML = item.images.map(url => `<img src="${url}" onerror="this.style.display='none'">`).join('');
    } else {
        imgContainer.innerHTML = '<p>Нет изображений</p>';
    }
    document.getElementById('newsDetailContent').innerHTML = item.content;
    document.getElementById('newsDetailModal').classList.add('active');
}

function closeNewsDetailModal() { document.getElementById('newsDetailModal').classList.remove('active'); }

// ========== МОДАЛЬНЫЕ ОКНА ==========
function openVenueModal() { document.getElementById('venueModal').classList.add('active'); }
function closeVenueModal() { document.getElementById('venueModal').classList.remove('active'); }
function openGiftModal() { document.getElementById('giftModal').classList.add('active'); }
function closeGiftModal() { document.getElementById('giftModal').classList.remove('active'); }

// ========== FAQ АККОРДЕОН (делегирование) ==========
document.addEventListener('click', e => {
    const btn = e.target.closest('.faq-question');
    if (btn) {
        const answer = btn.nextElementSibling;
        const icon = btn.querySelector('i.fa-chevron-down, i.fa-chevron-up');
        if (answer) {
            answer.classList.toggle('open');
            if (icon) {
                icon.classList.toggle('fa-chevron-down');
                icon.classList.toggle('fa-chevron-up');
            }
        }
    }
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
    }
});

// ========== КНОПКА "НАВЕРХ" ==========
window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTopBtn');
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
});

// ========== КАРТА ==========
function initMap() {
    if (typeof ymaps === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://api-maps.yandex.ru/2.1/?apikey=ВАШ_API_КЛЮЧ_ЯНДЕКС&lang=ru_RU';
        script.onload = () => createMap();
        document.body.appendChild(script);
    } else {
        ymaps.ready(createMap);
    }
    function createMap() {
        const map = new ymaps.Map('map', { center: [56.505210, 60.815588], zoom: 16 });
        map.geoObjects.add(new ymaps.Placemark([56.505210, 60.815588], { hintContent: 'Студия Самоцветы', balloonContent: 'ул. Коммуны, 36' }));
    }
}

// ========== ПЕРВЫЙ ЗАПУСК ==========
(function() {
    const hash = window.location.hash.substring(1);
    if (hash) loadSection(hash);
    else loadSection('about');
})();
