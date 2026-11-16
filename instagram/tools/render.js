// Генерирует картинки для Instagram: скриншоты портфолио, слайды каруселей, обложки Highlights.
// Запуск: node instagram/tools/render.js  (нужен Playwright)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'images');
const PRICES = { landing: '20 000', card: '35 000', shop: '80 000' };
const ACCENT = '#2f5bff';

for (const d of ['portfolio', 'posts', 'highlights']) fs.mkdirSync(path.join(OUT, d), { recursive: true });

const fileUrl = (p) => 'file://' + p;
const dataUrl = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');

// ---------- общий шаблон слайда ----------
const base = `
* { box-sizing:border-box; margin:0; }
body { width:1080px; height:1350px; font-family:Inter, "Noto Color Emoji", sans-serif; overflow:hidden; }
.s { width:1080px; height:1350px; padding:96px 88px 150px; display:flex; flex-direction:column; justify-content:center; position:relative; }
.light { background:#f6f4ef; color:#141414; }
.dark { background:#141414; color:#f6f4ef; }
.blue { background:${ACCENT}; color:#fff; }
.kicker { font-size:30px; font-weight:600; opacity:.6; letter-spacing:1px; text-transform:uppercase; }
h1 { font-family:"Inter Display", Inter; font-size:104px; line-height:1.0; letter-spacing:-3px; font-weight:800; margin-top:28px; }
h2 { font-family:"Inter Display", Inter; font-size:76px; line-height:1.05; letter-spacing:-2px; font-weight:800; }
p, li { font-size:40px; line-height:1.4; }
.num { font-family:"Inter Display"; font-size:200px; font-weight:900; color:${ACCENT}; line-height:1; margin-bottom:24px; }
.dark .num, .blue .num { color:#fff; opacity:.35; }
.mark { background:${ACCENT}; color:#fff; padding:0 14px; border-radius:12px; }
.foot { position:absolute; left:88px; right:88px; bottom:64px; display:flex; justify-content:space-between; font-size:28px; font-weight:600; opacity:.55; }
.grow { flex:1; }
ul { padding-left:0; list-style:none; margin-top:40px; }
li { margin-bottom:22px; padding-left:56px; position:relative; }
li::before { content:"→"; position:absolute; left:0; color:${ACCENT}; font-weight:700; }
.blue li::before, .dark li::before { color:#fff; }
.cta { margin-top:48px; display:inline-block; background:#141414; color:#fff; font-size:40px; font-weight:700; padding:28px 40px; border-radius:24px; align-self:flex-start; }
.blue .cta { background:#fff; color:${ACCENT}; }
.dark .cta { background:${ACCENT}; }
.card { background:#fff; border-radius:28px; padding:34px 40px; margin-bottom:22px; display:flex; justify-content:space-between; align-items:center; }
.card b { font-size:44px; } .card span { font-size:40px; font-weight:800; color:${ACCENT}; white-space:nowrap; }
.card small { display:block; font-size:28px; opacity:.6; margin-top:6px; font-weight:500; }
`;

const slide = (cls, inner, i, n) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head>
<body><div class="s ${cls}">${inner}<div class="foot"><span>Сайты, которые приносят заявки</span><span>${i}/${n}${i < n ? ' · листайте →' : ''}</span></div></div></body></html>`;

// ---------- содержимое постов ----------
// Скриншоты для кейсов подставляются после рендера сайтов.
function posts(shots) {
  const mock = (name, title, sub) => `
    <div class="kicker">${sub}</div>
    <h2 style="margin:24px 0 40px">${title}</h2>
    <div style="position:relative; flex:1">
      <img src="${shots[name].desktop}" style="width:100%; border-radius:20px; box-shadow:0 30px 60px rgba(0,0,0,.18)">
      <img src="${shots[name].mobile}" style="position:absolute; right:-20px; bottom:40px; width:250px; border-radius:36px; border:10px solid #141414; box-shadow:0 30px 60px rgba(0,0,0,.3)">
    </div>`;
  return {
    'post1-intro': [
      ['blue', `<div class="kicker">Давайте знакомиться</div><h1>Привет! Я делаю сайты для малого бизнеса 👋</h1><div class="grow"></div><p>Лендинги, сайты-визитки и интернет-магазины, которые приводят клиентов.</p>`],
      ['light', `<h2>Ко мне приходят, когда:</h2><ul><li>клиенты ищут вас в интернете, а находят конкурентов</li><li>реклама есть, а заявок с сайта нет</li><li>старый сайт стыдно показывать</li></ul>`],
      ['light', `<h2>Что здесь будет</h2><ul><li>разборы сайтов: что мешает получать заявки</li><li>кейсы с цифрами</li><li>честно о ценах и сроках</li></ul>`],
      ['dark', `<h2>Напишите в комментариях, чем вы занимаетесь</h2><p style="margin-top:40px; opacity:.8">Подскажу, с чего начать сайт именно в вашей сфере</p><div class="cta">Пишите 👇</div>`],
    ],
    'post2-5-mistakes': [
      ['dark', `<div class="kicker">Проверьте свой сайт</div><h1>5 ошибок, из-за которых сайт <span class="mark">не приносит</span> заявки</h1>`],
      ['light', `<div class="num">01</div><h2>Непонятно, что вы предлагаете</h2><p style="margin-top:32px">У посетителя 3 секунды. Если за это время не ясно «что, для кого и почему вы», он уходит.</p>`],
      ['light', `<div class="num">02</div><h2>Нет кнопки на первом экране</h2><p style="margin-top:32px">Человек готов написать, но не находит как. Кнопка «Написать» или «Записаться» должна быть видна сразу.</p>`],
      ['light', `<div class="num">03</div><h2>Неудобно с телефона</h2><p style="margin-top:32px">70–80% посетителей приходят со смартфона. Мелкий текст и съехавшие блоки = потерянные заявки.</p>`],
      ['light', `<div class="num">04</div><h2>Нет цен и отзывов</h2><p style="margin-top:32px">Без них нет доверия. Хотя бы «от …» и 3 живых отзыва уже меняют картину.</p>`],
      ['light', `<div class="num">05</div><h2>Долго грузится</h2><p style="margin-top:32px">Больше 3 секунд, и до половины посетителей закрывают страницу, не дождавшись.</p>`],
      ['blue', `<h2>Узнали свой сайт?</h2><p style="margin-top:32px">Сделаю бесплатный видеоразбор: что исправить, чтобы пошли заявки.</p><div class="cta">Напишите «РАЗБОР» в Direct</div>`],
    ],
    'post3-case-coffee': [
      ['light', mock('coffee', 'Сайт для кофейни с онлайн-заказом', 'Кейс · концепт')],
      ['light', `<h2>Задача</h2><p style="margin-top:32px">Кофейня принимает заказы только у стойки. Утром очередь, часть гостей уходит к конкурентам.</p>`],
      ['light', `<h2>Решение</h2><ul><li>кнопка «Заказать с собой» на первом экране</li><li>меню с ценами и фото</li><li>промокод на первый заказ</li><li>адаптив под телефон</li></ul>`],
      ['blue', `<h2>Хотите такой же для своего бизнеса?</h2><div class="cta">Напишите «САЙТ» в Direct</div>`],
    ],
    'post4-price': [
      ['dark', `<div class="kicker">Честно о деньгах</div><h1>Сколько стоит сайт в 2026 году?</h1>`],
      ['light', `<h2>Конструктор своими руками</h2><p style="margin-top:32px">Почти бесплатно, но 20–40 часов вашего времени. Результат часто «как у всех».</p>`],
      ['light', `<h2>Фрилансер</h2><p style="margin-top:32px">Лендинг обычно от 5 до 50 тыс. ₽. Смотрите на портфолио и договор, а не только на цену.</p>`],
      ['light', `<h2>Студия</h2><p style="margin-top:32px">Корпоративный сайт от 100 тыс. ₽ и выше: дороже за счёт команды и менеджеров.</p>`],
      ['light', `<h2 style="margin-bottom:40px">Мои цены</h2>
        <div class="card"><div><b>Лендинг</b><small>7–10 дней</small></div><span>от ${PRICES.landing} ₽</span></div>
        <div class="card"><div><b>Сайт-визитка</b><small>10–14 дней</small></div><span>от ${PRICES.card} ₽</span></div>
        <div class="card"><div><b>Магазин</b><small>от 3 недель</small></div><span>от ${PRICES.shop} ₽</span></div>`],
      ['blue', `<h2>Назову точную цену вашего проекта за 10 минут</h2><div class="cta">Напишите «СТОИМОСТЬ»</div>`],
    ],
    'post5-about': [
      ['dark', `<div class="kicker">Как я работаю</div><h1>3 правила, которые я не нарушаю</h1>`],
      ['light', `<div class="num">1</div><h2>Фиксированная цена и срок в договоре</h2><p style="margin-top:28px">Никаких «ой, тут ещё доплатить».</p>`],
      ['light', `<div class="num">2</div><h2>Вы видите результат на каждом этапе</h2><p style="margin-top:28px">Прототип → дизайн → готовая версия.</p>`],
      ['light', `<div class="num">3</div><h2>Сайт полностью ваш</h2><p style="margin-top:28px">Домен, хостинг и все доступы оформлены на вас.</p>`],
      ['blue', `<h2>А какой у вас был опыт с разработчиками?</h2><div class="cta">Расскажите 👇</div>`],
    ],
    'post6-first-screen': [
      ['blue', `<div class="kicker">Шпаргалка</div><h1>Что должно быть на первом экране сайта</h1>`],
      ['light', `<h2>Чек-лист</h2><ul><li>заголовок-выгода: что получит клиент</li><li>подзаголовок: для кого и почему вы</li><li>кнопка действия</li><li>живое фото или видео</li><li>рейтинг или отзывы</li><li>телефон и мессенджер</li></ul>`],
      ['light', mock('dental', 'Пример: всё на первом экране', 'Разбор')],
      ['dark', `<h2>Сохраните, чтобы проверить свой сайт 🔖</h2><div class="cta">Нужен разбор? «РАЗБОР»</div>`],
    ],
    'post7-case-barber': [
      ['dark', mock('barber', 'Сайт для барбершопа с онлайн-записью', 'Кейс · концепт')],
      ['light', `<h2>Задача</h2><p style="margin-top:32px">Запись только по телефону: администратор не успевает, клиенты не дозваниваются.</p>`],
      ['light', `<h2>Решение</h2><ul><li>запись онлайн за 20 секунд</li><li>цены и мастера на одной странице</li><li>рейтинг и цифры для доверия</li><li>стиль, который отражает характер бренда</li></ul>`],
      ['blue', `<h2>Хотите онлайн-запись для своего бизнеса?</h2><div class="cta">Напишите «САЙТ»</div>`],
    ],
    'post8-process': [
      ['light', `<div class="kicker">Без сюрпризов</div><h1>Как проходит работа над сайтом</h1>`],
      ['light', `<h2>7 шагов</h2><ul><li>созвон 15 минут</li><li>бриф и договор</li><li>прототип</li><li>дизайн</li><li>вёрстка и тексты</li><li>запуск и обучение</li><li>месяц поддержки</li></ul>`],
      ['blue', `<h2>От вас: около 2 часов за весь проект</h2><p style="margin-top:32px">Остальное делаю я.</p><div class="cta">Обсудить проект</div>`],
    ],
    'post9-offer': [
      ['blue', `<div class="kicker">Бесплатно</div><h1>Разбор вашего сайта за 24 часа</h1>`],
      ['light', `<h2>Что получите</h2><ul><li>видео на 5–10 минут</li><li>главные ошибки, которые мешают заявкам</li><li>что исправить в первую очередь</li></ul>`],
      ['light', `<h2>Для кого</h2><ul><li>малый бизнес</li><li>эксперты и мастера</li><li>у кого сайта пока нет: разберу идею</li></ul>`],
      ['dark', `<h2>Беру 5 разборов в неделю</h2><div class="cta">Напишите «РАЗБОР» в Direct</div>`],
    ],
  };
}

// ---------- обложки Highlights ----------
const icons = {
  'Кейсы': '<rect x="12" y="22" width="56" height="42" rx="6"/><path d="M28 22v-6h24v6"/><path d="M12 40h56"/>',
  'Цены': '<path d="M14 40 40 14h26v26L40 66z"/><circle cx="54" cy="26" r="4"/>',
  'Отзывы': '<path d="M40 12l8 17 18 2-13 13 4 18-17-9-17 9 4-18-13-13 18-2z"/>',
  'Этапы': '<circle cx="18" cy="60" r="6"/><circle cx="62" cy="20" r="6"/><path d="M24 58c20-4 10-30 32-36"/>',
  'Обо мне': '<circle cx="40" cy="28" r="12"/><path d="M16 66c2-14 12-20 24-20s22 6 24 20"/>',
  'FAQ': '<circle cx="40" cy="40" r="28"/><path d="M32 32c0-6 4-9 8-9s8 3 8 8c0 6-8 7-8 13"/><circle cx="40" cy="55" r="1.5"/>',
};
const hl = (name) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{margin:0;width:1080px;height:1920px;background:${ACCENT};display:flex;align-items:center;justify-content:center;flex-direction:column;font-family:Inter}
svg{width:420px;height:420px} span{color:#fff;font-size:72px;font-weight:700;margin-top:40px;opacity:.9}
</style></head><body><svg viewBox="0 0 80 80" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg><span>${name}</span></body></html>`;

(async () => {
  const browser = await chromium.launch();

  // 1. Скриншоты сайтов портфолио
  const shots = {};
  for (const name of ['coffee', 'barber', 'dental']) {
    const url = fileUrl(path.join(ROOT, 'portfolio', name, 'index.html'));
    const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await d.goto(url); const dp = path.join(OUT, 'portfolio', `${name}-desktop.png`);
    await d.screenshot({ path: dp }); await d.close();
    const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await m.goto(url); const mp = path.join(OUT, 'portfolio', `${name}-mobile.png`);
    await m.screenshot({ path: mp }); await m.close();
    shots[name] = { desktop: dataUrl(dp), mobile: dataUrl(mp) };
  }

  // 2. Карусели
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  for (const [post, slides] of Object.entries(posts(shots))) {
    const dir = path.join(OUT, 'posts', post); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < slides.length; i++) {
      await page.setContent(slide(slides[i][0], slides[i][1], i + 1, slides.length));
      await page.screenshot({ path: path.join(dir, `${String(i + 1).padStart(2, '0')}.png`) });
    }
  }

  // 3. Highlights
  await page.setViewportSize({ width: 1080, height: 1920 });
  const slug = { 'Кейсы': 'cases', 'Цены': 'prices', 'Отзывы': 'reviews', 'Этапы': 'process', 'Обо мне': 'about', 'FAQ': 'faq' };
  for (const name of Object.keys(icons)) {
    await page.setContent(hl(name));
    await page.screenshot({ path: path.join(OUT, 'highlights', `${slug[name]}.png`) });
  }
  await browser.close();
  console.log('done');
})();
