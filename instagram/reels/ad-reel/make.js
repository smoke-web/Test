// Рекламный Reels 1080×1920, 18 с, 30 fps. Тёмный премиальный стиль.
// Запуск: node instagram/reels/ad-reel/make.js   (нужны Playwright и ffmpeg)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const IG = path.resolve(DIR, '..', '..');
const FRAMES = path.join(DIR, 'frames');
const FPS = 30, DURATION = 28.5;
const SITES = [
  { key: 'barber', label: 'Барбершоп' },
  { key: 'coffee', label: 'Кофейня' },
  { key: 'dental', label: 'Стоматология' },
];

const scene = (shots) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Cormorant"; src: url("${IG}/tools/fonts/CormorantGaramond-Medium.ttf"); font-weight: 500; }
@font-face { font-family: "Cormorant"; src: url("${IG}/tools/fonts/CormorantGaramond-MediumItalic.ttf"); font-style: italic; font-weight: 500; }
* { margin:0; box-sizing:border-box; }
body { width:1080px; height:1920px; overflow:hidden; background:#0b0b0c; color:#ede8df; font-family:Inter, sans-serif; }
.abs { position:absolute; left:0; right:0; text-align:center; will-change:opacity, transform; }
.serif { font-family:"Cormorant", serif; font-weight:500; letter-spacing:-1px; }
.gold { color:#c9a45c; }
.cap { font-size:30px; letter-spacing:10px; text-transform:uppercase; font-weight:500; }
#glow { position:absolute; width:1400px; height:1400px; left:-160px; top:260px; border-radius:50%;
  background:radial-gradient(circle, rgba(201,164,92,.16), rgba(201,164,92,0) 60%); }
.line { font-size:124px; line-height:1.0; }
#phone { position:absolute; left:50%; top:430px; width:560px; height:1160px; margin-left:-280px; border-radius:76px;
  background:#000; padding:18px; box-shadow:0 0 0 2px #2a2a2c, 0 60px 120px rgba(0,0,0,.6), 0 0 120px rgba(201,164,92,.12); }
#screen { width:100%; height:100%; border-radius:60px; overflow:hidden; position:relative; background:#111; }
#screen img { position:absolute; left:0; top:0; width:100%; }
#notch { position:absolute; top:34px; left:50%; width:150px; height:40px; margin-left:-75px; background:#000; border-radius:20px; z-index:2; }
#bar { height:2px; background:#c9a45c; margin:70px auto 0; }
</style></head><body>
<div id="glow"></div>

<div id="s1" class="abs" style="top:620px">
  <div class="serif line" id="h1a">Ваш сайт</div>
  <div class="serif line" id="h1b">выглядит дешевле,</div>
  <div class="serif line gold" id="h1c"><i>чем ваш бизнес?</i></div>
</div>

<div id="s2" class="abs" style="top:700px">
  <div class="serif line" id="h2a">Клиенты замечают это</div>
  <div class="serif line gold" id="h2b"><i>за 5 секунд.</i></div>
</div>

<div id="s3">
  <div id="lbl" class="abs cap gold" style="top:300px"></div>
  <div id="phone"><div id="notch"></div><div id="screen">
    ${shots.map((s, i) => `<img id="img${i}" src="${s}">`).join('')}
  </div></div>
</div>

<div id="s4" class="abs" style="top:640px">
  <div class="serif line" id="h4a">Индивидуальный</div>
  <div class="serif line" id="h4b">дизайн.</div>
  <div class="serif line gold" id="h4c"><i>Без шаблонов.</i></div>
  <div class="cap" id="h4d" style="margin-top:70px; color:#8a857c">Запуск от 14 дней</div>
</div>

<div id="s5x" class="abs" style="top:740px">
  <div class="serif line" id="h5x">Беру всего</div>
  <div class="serif line gold" id="h5y"><i>3 проекта в месяц.</i></div>
</div>

<div id="s5" class="abs" style="top:560px">
  <div class="cap gold" id="h5a">Запись на новые проекты</div>
  <div class="serif line" id="h5b" style="margin-top:70px">Напишите</div>
  <div class="serif line gold" id="h5c"><i>«ПРОЕКТ»</i></div>
  <div class="serif line" id="h5d">в Direct</div>
  <div id="bar"></div>
  <div class="cap" id="h5e" style="margin-top:60px">@sdelay.sayt</div>
</div>

<script>
const $ = (id) => document.getElementById(id);
const clamp = (x) => Math.max(0, Math.min(1, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = (x) => 1 - Math.pow(1 - x, 3);
const inOut = (x) => x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3) / 2;
// появление снизу + исчезновение
function show(el, t, tin, tout, dy = 40) {
  const a = ease(seg(t, tin, tin + .6));
  const b = tout ? seg(t, tout, tout + .4) : 0;
  el.style.opacity = a * (1 - b);
  el.style.transform = 'translateY(' + ((1 - a) * dy - b * 20) + 'px)';
}
const SCROLL = ${JSON.stringify(shots.length)};
window.render = (t) => {
  $('glow').style.transform = 'translateY(' + Math.sin(t / 3) * 60 + 'px)';
  // 1. Крючок (голос: «Ваш сайт выглядит дешевле, чем ваш бизнес?»)
  show($('h1a'), t, 0.2, 4.0); show($('h1b'), t, 0.8, 4.0); show($('h1c'), t, 1.6, 4.0);
  // 2. Боль («Клиенты замечают это за пять секунд.»)
  show($('h2a'), t, 4.5, 7.3); show($('h2b'), t, 5.4, 7.3);
  // 3. Портфолио в телефоне: 3 сайта по 2.6 с («Я создаю сайты, которым доверяют с первого взгляда.»)
  const S = 7.8, L = 2.6;
  const p = $('phone');
  const pin = ease(seg(t, S - 0.1, S + 0.6)), pout = seg(t, S + 3 * L - 0.2, S + 3 * L + 0.2);
  p.style.opacity = pin * (1 - pout);
  p.style.transform = 'translateY(' + ((1 - pin) * 300 - pout * 80) + 'px) scale(' + (0.92 + 0.08 * pin) + ')';
  const labels = ${JSON.stringify(SITES.map((s) => s.label))};
  const active = Math.min(2, Math.max(0, Math.floor((t - S) / L)));
  for (let i = 0; i < 3; i++) {
    const img = $('img' + i), st = S + i * L;
    const fin = i === 0 ? 1 : seg(t, st - 0.2, st + 0.1);
    const fout = i === 2 ? 0 : seg(t, st + L - 0.2, st + L + 0.1);
    img.style.opacity = fin * (1 - fout);
    const maxScroll = img.naturalHeight * (524 / img.naturalWidth) - 1124;
    img.style.transform = 'translateY(' + (-inOut(seg(t, st + 0.4, st + L - 0.2)) * Math.max(0, Math.min(maxScroll, 1400))) + 'px)';
  }
  const lbl = $('lbl'); lbl.textContent = 'Проект 0' + (active + 1) + ' · ' + labels[active];
  const lt = (t - S) - active * L;
  lbl.style.opacity = (t < S || t > S + 3 * L + 0.2) ? 0 : ease(clamp(lt / .4)) * (1 - clamp((lt - (L - 0.3)) / .3) * (active < 2 ? 1 : 0)) * (1 - pout);
  // 4. Ценность («Индивидуальный дизайн, без шаблонов. Запуск от четырнадцати дней.»)
  show($('h4a'), t, 15.9, 21.0); show($('h4b'), t, 16.4, 21.0); show($('h4c'), t, 17.4, 21.0); show($('h4d'), t, 19.0, 21.0);
  // 5. Призыв («Я беру всего три проекта в месяц. Напишите слово „проект“ в директ.»)
  show($('h5x'), t, 21.6, 23.6); show($('h5y'), t, 22.1, 23.6);
  show($('h5a'), t, 24.0); show($('h5b'), t, 24.0); show($('h5c'), t, 24.5); show($('h5d'), t, 25.0);
  const w = ease(seg(t, 25.4, 26.4)) * 360; const bar = $('bar'); bar.style.width = w + 'px';
  show($('h5e'), t, 25.8);
};
</script></body></html>`;

(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  const browser = await chromium.launch();

  // Полностраничные скриншоты сайтов в мобильной версии
  const shots = [];
  for (const s of SITES) {
    const m = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await m.goto('file://' + path.join(IG, 'portfolio', s.key, 'index.html'));
    const out = path.join(DIR, `site-${s.key}.png`);
    await m.screenshot({ path: out, fullPage: true });
    await m.close();
    shots.push('file://' + out);
  }

  const html = path.join(DIR, 'scene.html');
  fs.writeFileSync(html, scene(shots));
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + html);
  await page.evaluate(async () => { await document.fonts.load('500 100px Cormorant'); await document.fonts.load('italic 500 100px Cormorant'); });
  console.log('font ok:', await page.evaluate(() => document.fonts.check('500 100px Cormorant')));
  await page.waitForTimeout(300);

  const total = FPS * DURATION;
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => window.render(t), f / FPS);
    await page.screenshot({ path: path.join(FRAMES, String(f).padStart(4, '0') + '.jpg'), type: 'jpeg', quality: 92 });
  }
  // Обложка для Reels: кадр с крючком
  await page.evaluate(() => window.render(3.0));
  await page.screenshot({ path: path.join(DIR, 'cover.jpg'), type: 'jpeg', quality: 95 });
  await browser.close();

  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, '%04d.jpg'),
    '-i', path.join(DIR, 'audio', 'mix.wav'), '-shortest',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '18', '-preset', 'medium',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', path.join(DIR, 'reel-sdelay-sayt.mp4')]);
  fs.rmSync(FRAMES, { recursive: true, force: true });
  console.log('done');
})();
