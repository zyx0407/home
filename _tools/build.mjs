/**
 * 作品详情页生成器 —— 2026-10-17 他定：不做详情页。
 * 现在本模块只做一件事：清理 work/ 下历史残留的详情目录，清单页 work/index.html 不动。
 *
 *   node build.mjs          # 只清理残留
 *
 * 本地服务在保存数据后也会 import 这个模块调用 build()。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));   // 站点根
const OUT = path.join(ROOT, 'work');

export function loadData() {
  const win = {};
  new Function('window', fs.readFileSync(path.join(ROOT, 'site-data.js'), 'utf8'))(win);
  return win.SITE || {};
}

export function build() {
  fs.mkdirSync(OUT, { recursive: true });
  // 详情页不做了：work/ 下只保留清单页 index.html，历史详情目录一律清掉
  for (const f of fs.readdirSync(OUT)) {
    if (f === 'index.html') continue;
    fs.rmSync(path.join(OUT, f), { recursive: true, force: true });
  }
  return [];
}

// 直接 `node build.mjs` 时执行并打印结果
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  build();
  console.log('详情页已停用，只清理残留（work/ 下仅保留清单页）');
}
