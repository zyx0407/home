/**
 * 静态化构建 · 门面站（零依赖，Node 24）
 *
 * 做法：起本地静态服务 → 无头 Edge 打开页面、给 6 秒虚拟时间让渲染与动画跑完
 *      → --dump-dom 取渲染后的 DOM → 写回根目录 index.html。
 *
 * 为什么：抓取器/AI 拿到的是完整静态内容；有 JS 的浏览器仍会重播动画（渲染函数幂等）。
 *
 * 用法（在本目录）：
 *   node _src/build.mjs            # 构建首页
 *   node _src/build.mjs --check    # 只量字数与体积，不写文件
 *
 * 改文案/作品/链接 → 跑一次；改壳 → 动 _src/index.shell.html 再跑。
 */
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 5197;
const CHROME = process.env.CHROME || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PAGES = [{ file: 'index.html', url: '/index.html', waitMs: 6000 }];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.json': 'application/json',
};

function serve() {
  return new Promise((resolve) => {
    const srv = createServer(async (req, res) => {
      try {
        const u = decodeURIComponent(req.url.split('?')[0]);
        const p = path.join(SITE, path.normalize(u).replace(/^([/\\])+/, ''));
        if (!p.startsWith(SITE)) { res.writeHead(403); res.end(); return; }
        const buf = await readFile(p);
        res.writeHead(200, { 'content-type': MIME[path.extname(p).toLowerCase()] || 'application/octet-stream' });
        res.end(buf);
      } catch { res.writeHead(404); res.end('not found'); }
    });
    srv.listen(PORT, '127.0.0.1', () => resolve(srv));
  });
}

function dumpDom(url, waitMs) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
      '--no-default-browser-check', '--disable-extensions', '--mute-audio',
      `--virtual-time-budget=${waitMs}`, '--dump-dom', url,
    ];
    const child = spawn(CHROME, args, { windowsHide: true });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('close', (code) => code === 0 ? resolve(out) : reject(new Error(`chrome exit ${code}\n${err.slice(-400)}`)));
    child.on('error', reject);
  });
}

function stripText(html) {
  const body = (html.match(/<body[\s\S]*<\/body>/i) || [''])[0];
  return body.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

const check = process.argv.includes('--check');
const srv = await serve();
let fail = 0;
try {
  for (const page of PAGES) {
    const url = `http://127.0.0.1:${PORT}${page.url}`;
    const dom = await dumpDom(url, page.waitMs);
    if (!/<!DOCTYPE html>/i.test(dom)) { console.error('✗ 没拿到完整 DOM'); fail++; continue; }
    if (/data-nofade/.test(dom.match(/<html[^>]*>/i)?.[0] || '')) {
      console.error('✗ 抓到了 ?still/nofade 定态，动画会被焊死'); fail++; continue;
    }
    const text = stripText(dom);
    const bytes = Buffer.byteLength(dom);
    console.log(`· ${page.file}  静态正文 ${text.length} 字  ${(bytes / 1024).toFixed(1)}KB`);
    const must = [['鱼标', /class="yu-svg"/], ['三个入口', /(个人|作品|链接)/], ['备案号', /豫ICP备/]];
    const missing = must.filter(([, re]) => !re.test(dom)).map(([n]) => n);
    if (text.length < 250 || missing.length) {
      console.error('✗ 静态内容不完整：字数', text.length, '缺', missing.join('、') || '无');
      fail++; continue;
    }
    if (check) continue;
    await writeFile(path.join(SITE, page.file), dom, 'utf8');
    console.log(`✓ 写入 ${page.file}`);
  }
} finally {
  srv.close();
}
if (fail) { console.error(`构建有 ${fail} 处不过`); process.exitCode = 1; }
