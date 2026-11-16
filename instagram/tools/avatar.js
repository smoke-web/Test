// Рисует варианты аватара 1080×1080 (Instagram обрезает их в круг).
// Запуск: node instagram/tools/avatar.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'images', 'avatar');
fs.mkdirSync(OUT, { recursive: true });
const BLUE = '#2f5bff';

const page = (body, bg) => `<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1080px;background:${bg};display:flex;align-items:center;justify-content:center;font-family:"Inter Display",Inter,sans-serif;overflow:hidden}
</style></head><body>${body}</body></html>`;

// Всё важное держим внутри центрального круга диаметром ~860px.
const variants = {
  // 1. Окно браузера с цифрой 7: «сайт за 7 дней»
  'avatar-1-browser': page(`
    <div style="width:640px;height:540px;background:#fff;border-radius:56px;box-shadow:0 30px 80px rgba(0,0,0,.25);overflow:hidden;display:flex;flex-direction:column">
      <div style="height:96px;background:#eef1ff;display:flex;align-items:center;gap:22px;padding-left:44px">
        <i style="width:30px;height:30px;border-radius:50%;background:#ff5f57"></i>
        <i style="width:30px;height:30px;border-radius:50%;background:#febc2e"></i>
        <i style="width:30px;height:30px;border-radius:50%;background:#28c840"></i>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:18px">
        <span style="font-size:330px;font-weight:900;color:${BLUE};line-height:1;letter-spacing:-10px">7</span>
        <span style="font-size:76px;font-weight:800;color:#141414;line-height:.95">дней</span>
      </div>
    </div>`, BLUE),

  // 2. Код-скобки: универсальный знак веб-разработчика
  'avatar-2-code': page(`
    <div style="font-size:420px;font-weight:900;color:#fff;letter-spacing:-20px;line-height:1;display:flex;align-items:center">
      <span>&lt;</span><span style="color:#ffd84d;margin:0 6px">/</span><span>&gt;</span>
    </div>`, BLUE),

  // 3. Текстовый: «сайт за неделю» крупно, как бейдж
  'avatar-3-text': page(`
    <div style="text-align:center;color:#141414;line-height:.92">
      <div style="font-size:190px;font-weight:900;letter-spacing:-6px">сайт</div>
      <div style="font-size:120px;font-weight:800;color:${BLUE};margin:10px 0">за</div>
      <div style="font-size:170px;font-weight:900;letter-spacing:-6px">неделю</div>
    </div>`, '#ffd84d'),
};

(async () => {
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
  for (const [name, html] of Object.entries(variants)) {
    await p.setContent(html);
    await p.screenshot({ path: path.join(OUT, `${name}.png`) });
  }

  // Превью: как аватары выглядят в профиле (круг 300px) и в ленте/комментариях (круг 64px)
  const imgs = Object.keys(variants).map((n) => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, `${n}.png`)).toString('base64'));
  await p.setViewportSize({ width: 1200, height: 560 });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    body{margin:0;background:#fff;font-family:Inter;display:flex;gap:60px;padding:50px;justify-content:center}
    .c{text-align:center} .big{width:300px;height:300px;border-radius:50%} .row{display:flex;align-items:center;gap:14px;margin-top:30px;justify-content:center}
    .sm{width:64px;height:64px;border-radius:50%} b{font-size:22px}
  </style></head><body>${imgs.map((s, i) => `<div class="c"><img class="big" src="${s}"><div class="row"><img class="sm" src="${s}"><b>sait.za.nedelu</b></div><p style="color:#888;font-size:20px">Вариант ${i + 1}</p></div>`).join('')}</body></html>`);
  await p.screenshot({ path: path.join(OUT, 'preview.png') });
  await browser.close();
  console.log('done');
})();
