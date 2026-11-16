// Рекламный Reels 1080×1920, 18 с, 30 fps. Тёмный премиальный стиль.
// Запуск: node instagram/reels/ad-reel/make.js   (нужны Playwright и ffmpeg)
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const IG = path.resolve(DIR, '..', '..');
const FRAMES = path.join(DIR, 'frames');
const FPS = 30, DURATION = 18;
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

<div id="s5" class="abs" style="top:560px">
  <div class="cap gold" id="h5a">Беру 3 проекта в месяц</div>
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
  // 1. Крючок
  show($('h1a'), t, 0.1, 2.8); show($('h1b'), t, 0.5, 2.8); show($('h1c'), t, 1.0, 2.8);
  // 2. Боль
  show($('h2a'), t, 3.2, 4.7); show($('h2b'), t, 3.6, 4.7);
  // 3. Портфолио в телефоне: 3 сайта по 2.2 с, каждый прокручивается
  const p = $('phone');
  const pin = ease(seg(t, 5.0, 5.7)), pout = seg(t, 11.3, 11.7);
  p.style.opacity = pin * (1 - pout);
  p.style.transform = 'translateY(' + ((1 - pin) * 300 - pout * 80) + 'px) scale(' + (0.92 + 0.08 * pin) + ')';
  const labels = ${JSON.stringify(SITES.map((s) => s.label))};
  let active = Math.min(2, Math.max(0, Math.floor((t - 5.0) / 2.2)));
  for (let i = 0; i < 3; i++) {
    const img = $('img' + i), start = 5.0 + i * 2.2;
    const vis = i === 0 ? 1 - seg(t, start + 2.0, start + 2.3) : seg(t, start - 0.2, start + 0.1) * (i === 2 ? 1 : 1 - seg(t, start + 2.0, start + 2.3));
    img.style.opacity = vis;
    const maxScroll = img.naturalHeight * (524 / img.naturalWidth) - 1124;
    img.style.transform = 'translateY(' + (-inOut(seg(t, start + 0.3, start + 2.1)) * Math.max(0, Math.min(maxScroll, 1400))) + 'px)';
  }
  const lbl = $('lbl'); lbl.textContent = 'Проект 0' + (active + 1) + ' · ' + labels[active];
  const lt = (t - 5.0) - active * 2.2;
  lbl.style.opacity = (t < 5 || t > 11.7) ? 0 : ease(clamp(lt / .4)) * (1 - clamp((lt - 1.9) / .3) * (active < 2 ? 1 : 0)) * (1 - pout);
  // 4. Ценность
  show($('h4a'), t, 11.8, 14.1); show($('h4b'), t, 12.1, 14.1); show($('h4c'), t, 12.5, 14.1); show($('h4d'), t, 13.0, 14.1);
  // 5. Призыв
  show($('h5a'), t, 14.4); show($('h5b'), t, 14.7); show($('h5c'), t, 15.0); show($('h5d'), t, 15.3);
  const w = ease(seg(t, 15.6, 16.6)) * 360; const bar = $('bar'); bar.style.width = w + 'px';
  show($('h5e'), t, 15.9);
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
  await page.evaluate(() => window.render(2.2));
  await page.screenshot({ path: path.join(DIR, 'cover.jpg'), type: 'jpeg', quality: 95 });
  await browser.close();

  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, '%04d.jpg'),
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-crf', '18', '-preset', 'medium',
    '-c:a', 'aac', '-movflags', '+faststart', path.join(DIR, 'reel-sdelay-sayt.mp4')]);
  fs.rmSync(FRAMES, { recursive: true, force: true });
  console.log('done');
})();
