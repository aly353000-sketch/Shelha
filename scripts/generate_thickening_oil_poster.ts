import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'public', 'auraglow-posters');
const assetsDir = path.join(outDir, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const sources = {
  logo: path.join(rootDir, 'src/assets/images/auraglow-logo.jpg'),
  bottle: path.join(rootDir, 'public/assets/aistudio/hair_thickening_oil_6c3cf0b3.jpg'),
  beforeAfter: path.join(rootDir, 'src/assets/images/hair_thickening_before_after_1795284814292.jpg'),
};

for (const [key, src] of Object.entries(sources)) {
  if (!fs.existsSync(src)) {
    console.error(`Missing required poster asset (${key}): ${src}`);
    process.exit(1);
  }
}

fs.copyFileSync(sources.logo, path.join(assetsDir, 'auraglow-logo.jpg'));
fs.copyFileSync(sources.bottle, path.join(assetsDir, 'hair-thickening-oil-bottle.jpg'));
fs.copyFileSync(sources.beforeAfter, path.join(assetsDir, 'hair-before-after.jpg'));

const ingredients = [
  'Argan Oil',
  'Jojoba Oil',
  'Squalane Oil',
  'Pumpkin Seed Oil',
  'CCT Oil',
  'Grape Seed Oil',
  'Sweet Almond Oil',
  'Black Seed Oil',
  'Sesame Oil',
  'Vitamin E',
  'IPM',
  'Perfume',
];

const renderHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>Auraglow — ميكس زيوت تكثيف الشعر</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&family=Cairo:wght@400;600;700;800;900&family=Dancing+Script:wght@600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 1080px;
      height: 1350px;
      overflow: hidden;
      background: #FAF6EE;
      font-family: 'Cairo', sans-serif;
      color: #213021;
      -webkit-font-smoothing: antialiased;
    }

    .poster {
      position: relative;
      width: 1080px;
      height: 1350px;
      background:
        radial-gradient(circle at 22% 36%, rgba(212, 162, 68, 0.16) 0%, rgba(212, 162, 68, 0) 44%),
        radial-gradient(circle at 86% 12%, rgba(45, 72, 46, 0.08) 0%, rgba(45, 72, 46, 0) 38%),
        linear-gradient(165deg, #FCF9F3 0%, #F7EFE0 55%, #F2E7D3 100%);
      padding: 34px 40px 30px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    /* Subtle luxury double border */
    .poster::before {
      content: '';
      position: absolute;
      inset: 14px;
      border: 1.5px solid rgba(176, 128, 44, 0.42);
      border-radius: 22px;
      pointer-events: none;
    }
    .poster::after {
      content: '';
      position: absolute;
      inset: 20px;
      border: 1px solid rgba(38, 60, 39, 0.14);
      border-radius: 17px;
      pointer-events: none;
    }

    /* 1) Top Brand Header */
    .top-bar {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 1px solid rgba(176, 128, 44, 0.28);
    }
    .brand-lockup {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .logo-ring {
      width: 78px;
      height: 78px;
      border-radius: 50%;
      padding: 3px;
      background: linear-gradient(135deg, #C8963E, #E5C57B, #9A6D22);
      box-shadow: 0 6px 18px rgba(42, 60, 42, 0.14);
      flex-shrink: 0;
    }
    .logo-ring img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      background: #fff;
      display: block;
    }
    .brand-text-ar {
      font-family: 'Aref Ruqaa', serif;
      font-size: 28px;
      font-weight: 700;
      color: #213421;
      line-height: 1.1;
    }
    .brand-text-sub {
      font-size: 13px;
      font-weight: 700;
      color: #9A6D22;
      letter-spacing: 0.04em;
      margin-top: 2px;
    }
    .meta-tag {
      text-align: left;
      background: rgba(33, 52, 33, 0.06);
      border: 1px solid rgba(33, 52, 33, 0.16);
      border-radius: 12px;
      padding: 10px 18px;
    }
    .meta-tag-main {
      font-size: 15px;
      font-weight: 800;
      color: #213421;
    }
    .meta-tag-sub {
      font-size: 12.5px;
      font-weight: 700;
      color: #9A6D22;
      margin-top: 2px;
    }

    /* 2) Headline Block */
    .headline-wrap {
      position: relative;
      z-index: 2;
      text-align: center;
      margin-top: 12px;
      margin-bottom: 16px;
    }
    .title-ar {
      font-family: 'Aref Ruqaa', serif;
      font-size: 62px;
      font-weight: 700;
      color: #1F321F;
      line-height: 1.15;
      text-shadow: 0 2px 0 rgba(255, 255, 255, 0.7);
    }
    .title-en {
      font-family: 'Dancing Script', cursive;
      font-size: 32px;
      font-weight: 700;
      color: #A6731E;
      line-height: 1.1;
      margin-top: 2px;
      direction: ltr;
    }
    .title-rule {
      width: 180px;
      height: 2px;
      margin: 10px auto 0;
      background: linear-gradient(90deg, transparent, #C49137, transparent);
    }

    /* 3) Main Split Section: Details (Right) + Bottle Photo (Left) */
    .main-grid {
      position: relative;
      z-index: 2;
      display: grid;
      grid-template-columns: 1.24fr 0.92fr;
      gap: 26px;
      align-items: stretch;
      flex: 1;
      min-height: 0;
    }

    .info-col {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
    }

    .info-card {
      background: rgba(255, 253, 248, 0.88);
      border: 1px solid rgba(176, 128, 44, 0.26);
      border-radius: 18px;
      padding: 16px 20px;
      box-shadow: 0 6px 20px rgba(45, 58, 42, 0.05);
    }
    .sec-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 16.5px;
      font-weight: 900;
      color: #213421;
      margin-bottom: 8px;
      padding-bottom: 5px;
      border-bottom: 2px solid rgba(196, 145, 55, 0.45);
    }
    .sec-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: linear-gradient(135deg, #D19C3F, #966618);
      flex-shrink: 0;
    }
    .desc-text {
      font-size: 17.5px;
      line-height: 1.62;
      font-weight: 700;
      color: #2C3A2C;
    }
    .desc-text strong {
      color: #9A6816;
      font-weight: 900;
    }

    .ing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px 14px;
      direction: ltr;
      margin-top: 4px;
    }
    .ing-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Cairo', sans-serif;
      font-size: 14.5px;
      font-weight: 700;
      color: #243524;
      background: rgba(244, 236, 220, 0.55);
      border: 1px solid rgba(176, 128, 44, 0.18);
      border-radius: 8px;
      padding: 5px 10px;
    }
    .ing-bullet {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #B58129;
      flex-shrink: 0;
    }

    .usage-text {
      font-size: 16.5px;
      line-height: 1.58;
      font-weight: 700;
      color: #283828;
    }
    .usage-text strong {
      color: #9A6816;
      font-weight: 900;
    }

    /* Bottle Showcase Frame (cropped to hide raw caption cleanly) */
    .bottle-col {
      display: flex;
      flex-direction: column;
    }
    .bottle-frame {
      position: relative;
      flex: 1;
      border-radius: 24px;
      overflow: hidden;
      border: 2px solid rgba(186, 138, 52, 0.48);
      background: #F4EFE6;
      box-shadow: 0 18px 38px rgba(42, 54, 38, 0.14);
    }
    .bottle-frame img {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 122%;
      object-fit: cover;
      object-position: center bottom;
      display: block;
    }
    .bottle-badge-top {
      position: absolute;
      top: 14px;
      right: 14px;
      background: rgba(31, 50, 31, 0.9);
      color: #F7E7C4;
      font-size: 13.5px;
      font-weight: 800;
      padding: 6px 14px;
      border-radius: 10px;
      border: 1px solid rgba(212, 168, 83, 0.55);
      backdrop-filter: blur(4px);
    }
    .bottle-badge-bottom {
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 14px;
      background: rgba(255, 252, 245, 0.94);
      border: 1px solid rgba(186, 138, 52, 0.45);
      border-radius: 12px;
      padding: 9px 14px;
      text-align: center;
      font-size: 14px;
      font-weight: 800;
      color: #213421;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }
    .bottle-badge-bottom span {
      color: #A06D18;
    }

    /* 4) Bottom Before & After High-Converting Showcase */
    .ba-strip {
      position: relative;
      z-index: 2;
      margin-top: 20px;
      background: linear-gradient(135deg, #213421 0%, #2C442C 100%);
      border-radius: 20px;
      padding: 18px 22px;
      display: grid;
      grid-template-columns: 0.96fr 1.15fr;
      gap: 22px;
      align-items: center;
      border: 1.5px solid rgba(212, 168, 83, 0.55);
      box-shadow: 0 14px 30px rgba(33, 52, 33, 0.18);
    }
    .ba-copy {
      color: #FCF8F0;
    }
    .ba-kicker {
      font-size: 13px;
      font-weight: 800;
      color: #E7C274;
      letter-spacing: 0.02em;
      margin-bottom: 4px;
    }
    .ba-heading {
      font-family: 'Aref Ruqaa', serif;
      font-size: 31px;
      font-weight: 700;
      color: #FFFFFF;
      line-height: 1.25;
      margin-bottom: 12px;
    }
    .ba-points {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .ba-points li {
      font-size: 15px;
      font-weight: 700;
      color: #EEF2EA;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ba-check {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #E2B863, #B6822A);
      color: #1D2E1D;
      font-size: 13px;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .ba-visual {
      position: relative;
      height: 238px;
      border-radius: 15px;
      overflow: hidden;
      border: 2px solid rgba(226, 184, 99, 0.72);
      background: #F4ECE0;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.22);
    }
    .ba-visual img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center 22%;
      transform: scaleX(-1);
      display: block;
    }
    .ba-divider {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 2.5px;
      background: linear-gradient(180deg, #F0CF86, #C08B2E, #F0CF86);
      transform: translateX(-50%);
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
    }
    .ba-pill {
      position: absolute;
      bottom: 10px;
      font-size: 14px;
      font-weight: 900;
      padding: 5px 14px;
      border-radius: 8px;
      letter-spacing: 0.01em;
    }
    .ba-pill.before {
      right: 12px;
      background: rgba(34, 34, 34, 0.82);
      color: #F4EFE6;
      border: 1px solid rgba(255, 255, 255, 0.28);
    }
    .ba-pill.after {
      left: 12px;
      background: linear-gradient(135deg, #213821, #2E4E2E);
      color: #F8E2A8;
      border: 1.5px solid #E2B863;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
    }

    /* 5) Footer Strip */
    .footer-bar {
      position: relative;
      z-index: 2;
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      font-weight: 800;
      color: #3E503E;
      padding: 0 6px;
    }
    .footer-tagline {
      font-family: 'Aref Ruqaa', serif;
      font-size: 21px;
      color: #213421;
    }
    .footer-en {
      font-family: 'Playfair Display', serif;
      font-size: 14px;
      letter-spacing: 0.14em;
      color: #9A6D22;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <main class="poster" id="poster">
    <!-- Top Brand Header -->
    <header class="top-bar">
      <div class="brand-lockup">
        <div class="logo-ring">
          <img src="./assets/auraglow-logo.jpg" alt="لوجو أوراجلو" />
        </div>
        <div>
          <div class="brand-text-ar">أوراجلو · Auraglow</div>
          <div class="brand-text-sub">لأن جمالكِ يستحق الأفضل</div>
        </div>
      </div>
      <div class="meta-tag">
        <div class="meta-tag-main">العناية بالشعر · 125 مل</div>
        <div class="meta-tag-sub">زيوت طبيعية 100% معصورة على البارد</div>
      </div>
    </header>

    <!-- Headline -->
    <section class="headline-wrap">
      <h1 class="title-ar">ميكس زيوت تكثيف الشعر</h1>
      <div class="title-en">Hair Thickening Oil Blend</div>
      <div class="title-rule"></div>
    </section>

    <!-- Main Split: Specs (Right) + Bottle Photo (Left) -->
    <section class="main-grid">
      <div class="info-col">
        <div class="info-card">
          <div class="sec-label"><span class="sec-dot"></span>الوصف</div>
          <p class="desc-text">
            ميكس من الزيوت الطبيعية عالية النقاء والمعصورة على البارد والمنتقاة بعناية
            لتناسب عملية <strong>التكثيف</strong>، ولا تسبب ملمس دهني أو تراكم على الشعر.
          </p>
        </div>

        <div class="info-card">
          <div class="sec-label"><span class="sec-dot"></span>المواد الفعالة الأساسية</div>
          <div class="ing-grid">
            ${ingredients.map((item) => `<div class="ing-item"><span class="ing-bullet"></span><span>${item}</span></div>`).join('\n            ')}
          </div>
        </div>

        <div class="info-card">
          <div class="sec-label"><span class="sec-dot"></span>طريقة الاستخدام</div>
          <p class="usage-text">
            دهان للشعر المندي مسبقاً بماء خفيف مع التركيز على الأطراف — مناسب <strong>للتكثيف</strong> ويصلح كحمام زيت أيضاً.
          </p>
        </div>
      </div>

      <div class="bottle-col">
        <div class="bottle-frame">
          <img src="./assets/hair-thickening-oil-bottle.jpg" alt="عبوة ميكس زيوت تكثيف الشعر من أوراجلو" />
          <div class="bottle-badge-top">125 مل · تركيبة خفيفة</div>
          <div class="bottle-badge-bottom">
            <span>بدون ملمس دهني</span> · امتصاص سريع ونعومة فورية
          </div>
        </div>
      </div>
    </section>

    <!-- Bottom Before & After Strip -->
    <section class="ba-strip">
      <div class="ba-copy">
        <div class="ba-kicker">الفرق الواضح مع الانتظام في الاستخدام</div>
        <div class="ba-heading">كثافة ولمعان يلفت الأنظار</div>
        <ul class="ba-points">
          <li><span class="ba-check">✓</span> يقوّي الشعر ويعزّز الكثافة والامتلاء</li>
          <li><span class="ba-check">✓</span> يقلّل الهيشان ويرطّب الأطراف الجافة</li>
          <li><span class="ba-check">✓</span> مناسب للتكثيف اليومي وحمام الزيت</li>
        </ul>
      </div>

      <div class="ba-visual">
        <img src="./assets/hair-before-after.jpg" alt="الفرق قبل وبعد استخدام ميكس زيوت تكثيف الشعر" />
        <div class="ba-divider"></div>
        <div class="ba-pill before">قبل الاستخدام</div>
        <div class="ba-pill after">بعد الاستخدام</div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer-bar">
      <div class="footer-tagline">لأن جمالكِ يستحق الأفضل</div>
      <div class="footer-en">AURAGLOW · SKIN &amp; HAIR CARE</div>
    </footer>
  </main>
</body>
</html>`;

const viewerHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>بوستر ميكس زيوت تكثيف الشعر — أوراجلو</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #F4F1EA;
      font-family: 'Cairo', sans-serif;
      color: #213421;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 16px 40px;
      gap: 18px;
    }
    .bar {
      width: 100%;
      max-width: 720px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: #fff;
      padding: 14px 18px;
      border-radius: 14px;
      border: 1px solid #DFD7C8;
    }
    .bar h1 { margin: 0; font-size: 1.05rem; }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #213421;
      color: #fff;
      text-decoration: none;
      font-weight: 800;
      font-size: 0.92rem;
      padding: 10px 20px;
      border-radius: 10px;
    }
    .preview {
      width: 100%;
      max-width: 720px;
      border-radius: 16px;
      box-shadow: 0 18px 44px rgba(33, 52, 33, 0.16);
      display: block;
    }
  </style>
</head>
<body>
  <div class="bar">
    <h1>بوستر ميكس زيوت تكثيف الشعر — أوراجلو (جودة عالية 2160×2700)</h1>
    <a class="btn" href="./hair-thickening-oil-poster.jpg" download="Auraglow-Hair-Thickening-Oil-Poster.jpg">تحميل الصورة بجودة عالية (JPG)</a>
  </div>
  <img class="preview" src="./hair-thickening-oil-poster.jpg" alt="بوستر ميكس زيوت تكثيف الشعر من أوراجلو" />
</body>
</html>`;

fs.writeFileSync(path.join(outDir, '_render.html'), renderHtml, 'utf8');
fs.writeFileSync(path.join(outDir, 'index.html'), viewerHtml, 'utf8');
console.log('✓ Generated /public/auraglow-posters/_render.html and index.html');
