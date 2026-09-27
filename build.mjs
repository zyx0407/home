/**
 * 由 site-data.js 生成作品详情页 → work/<slug>.html（静态页，不需要 JS 就能读）
 *
 *   node build.mjs          # 生成 / 更新全部（数据里没有的旧页面会被删掉）
 *
 * 本地服务在保存数据后也会 import 这个模块调用 build()，保存即重新生成。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));   // C-gallery
const DATA = path.join(ROOT, 'site-data.js');
const OUT = path.join(ROOT, 'work');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slugify = (s) => String(s || '')
  .trim().toLowerCase()
  .replace(/[^a-z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '');

export function loadData() {
  const src = fs.readFileSync(DATA, 'utf8');
  const win = {};
  new Function('window', src)(win);
  return win.SITE || {};
}

function detailHTML(w) {
  const text = String(w.detail == null ? '' : w.detail).trim();
  if (!text) {
    return '<p class="empty">这件作品的详情还没写 —— 在编辑模式（?edit=1）里补上，保存后这页会自动重生成。</p>';
  }
  return text.split(/\n{2,}/).map((para) =>
    '        <p>' + esc(para).replace(/\n/g, '<br>') + '</p>'
  ).join('\n');
}

function pageHTML(S, w, slug) {
  const who = S.who || {};
  const f = S.footer || {};
  const tags = (w.tags || []).filter(Boolean).map((t) => '<span class="chip">' + esc(t) + '</span>').join('');
  const title = esc(w.title || '作品');
  const note = esc(w.note || '');
  const desc = [w.title, w.note].filter(Boolean).join(' —— ');
  const link = (w.link && w.linkLabel)
    ? '\n        <p class="tags"><a class="go" href="' + esc(w.link) + '" target="_blank" rel="noopener">' + esc(w.linkLabel) + '</a></p>'
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="nightmode" content="disable">
<title>${title} · ${esc(who.name || '')}</title>
<meta name="description" content="${esc(desc)}">
<script src="../../theme.js"></script>
<script src="../../assets/平滑滚动.js" defer></script>
<link rel="stylesheet" href="../../style.css">
</head>
<body>
<div class="wrap">

  <div class="top">
    <a class="back" href="../">← 作品</a>
    <div class="tools">
      <div class="theme">
        <button type="button" id="themeBtn" title="切换白天 / 深夜" aria-label="切换白天 / 深夜">
          <svg class="ico ico-sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4.1"></circle>
            <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.5 5.5l1.5 1.5M17 17l1.5 1.5M18.5 5.5L17 7M7 17l-1.5 1.5"></path>
          </svg>
          <svg class="ico ico-moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <main id="page">
    <section class="subpage">
      <p class="page-kicker">作品</p>
      <h1>${title}</h1>
      <p class="sub">${note}</p>
      ${tags ? '<p class="tags">' + tags + '</p>' : ''}${link}
    </section>

    <section class="detail">
${detailHTML(w)}
    </section>

  </main>
</div>
</body>
</html>
`;
}

export function build() {
  const S = loadData();
  const works = S.works || [];
  fs.mkdirSync(OUT, { recursive: true });

  const wanted = new Set();
  const written = [];
  works.forEach((w, i) => {
    const slug = slugify(w.slug || ('work-' + (i + 1)));
    if (!slug) return;
    wanted.add(slug);
    fs.mkdirSync(path.join(OUT, slug), { recursive: true });
    fs.writeFileSync(path.join(OUT, slug, 'index.html'), pageHTML(S, w, slug), 'utf8');
    written.push('work/' + slug + '/');
  });

  // 数据里已经没有的作品 → 删掉它残留的目录；但别碰清单页 work\index.html
  for (const f of fs.readdirSync(OUT)) {
    if (f === 'index.html') continue;
    if (!wanted.has(f)) fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
  }
  return written;
}

// 直接 `node build.mjs` 时执行并打印结果
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = build();
  console.log('已生成 ' + out.length + ' 个详情页：');
  out.forEach((p) => console.log('  ' + p));
}
