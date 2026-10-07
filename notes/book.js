/* 札记 · 留言书 —— 翻页 / 目录 / 留一页
 * 页模型:第 0 页 = 封面;留言从第 1 页起,两页一翻。
 *   对开 cur 显示第 (cur*2) 与 (cur*2+1) 页;totalLeaves-1 = 最后一个对开。
 * 翻页:无动画直切,只留左右钮 + 键盘。
 */
import './notes-data.js';

const $ = s => document.querySelector(s);
const spread = $('#spread'), book = $('#book');
if (!spread || !book) throw new Error('[札记] 页面骨架缺失: #spread / #book 找不到');   // 缺骨架就大声死,别静默白屏
const folioNum = $('#folioNum'), folioBtn = $('#folioBtn'), prevBtn = $('#prevBtn'), nextBtn = $('#nextBtn');
if (!folioNum || !folioBtn || !prevBtn || !nextBtn) throw new Error('[札记] 控件缺失: 页码/翻页钮 id 对不上');
const toc = $('#toc'), tocGrid = $('#tocGrid');
const rootEl = document.documentElement;

let notes = [];            // 全部留言(旧→新)
let BASE_COUNT = 0;        // notes-data.js 预置条数(本地试写的追加在后面)
let cur = 0;               // 当前对开号(0 起)
let totalLeaves = 1;       // ceil((n+1)/2)

const pad2 = n => String(n).padStart(2, '0');
const esc = s => (s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nl2br = s => esc(s).replace(/\n/g, '<br>');

// ── 鱼标内联(视觉规范第七条:要跟 currentColor 必须内联) ──
let fishSvg = '';
async function loadFish() {
    if (fishSvg) return fishSvg;
    try {
        const r = await fetch('../assets/鱼-白墨.svg');
        const t = await r.text();
        // ⚠️ viewBox 在 <svg> 标签上，只抠 <g> 会丢掉坐标系（鱼会「存在但看不见」）。
        fishSvg = t.replace(/stroke="#[0-9a-fA-F]{3,6}"/g, 'stroke="currentColor"')
                   .replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="currentColor"')
                   .replace('<svg ', '<svg width="76" height="76" style="color:inherit" ');
    } catch (e) { /* 拿不到就空着,不白屏 */ }
    return fishSvg;
}

// ── 纸面生成(inner 版供正/反两面复用:不带 .leaf 的定位类) ──
function coverInner() {
    return `<span class="fish-slot">${fishSvg}</span><span class="t">札记</span><span class="s">zyx0407 · Notes</span>`;
}
function noteInner(i) {
    const n = notes[i - 1];
    if (!n) return null;
    return `<span class="note-no">No.${pad2(i)}</span>
      <p class="note-body">${nl2br(n.text)}</p>
      <div class="note-foot"><span class="who">${esc(n.who) || '匿名'}</span><span>${esc(n.date)}</span></div>`;
}
function leafAt(pageIdx) {                 // 0=封面,1..n=留言,>n=封底
    if (pageIdx === 0) return `<div class="leaf left cover">${coverInner()}</div>`;
    const inner = noteInner(pageIdx);
    const side = pageIdx % 2 ? 'right' : 'left';
    if (!inner) return `<div class="leaf ${side} end-note">此册尚空，等第一条。</div>`;
    return `<div class="leaf ${side} ruled">${inner}</div>`;
}

// ── 界格线:按真实行盒逐行画(字坐线上) ──
// ⚠️ getClientRects() 对**块级 <p>** 与整段 Range 都只给一个矩形,读不到"行";
//    但 **Range.setEnd(start→end) 跨到下一行时,getClientRects() 会逐行拆开**。
//    做法:从行首起扩 Range,rects 数量一多 = 越界一行 → 回退一格定该行末尾;
//    行底线 = 本行第一个 rect 的 bottom。正文 ≤240 字,成本可忽略。
function collectText(node) {
    let t = '';
    for (const c of node.childNodes) {
        if (c.nodeType === 3) t += c.textContent;
        else if (c.nodeName === 'BR') t += '\n';
        else t += collectText(c);
    }
    return t;
}
function drawRules(scope) {
    scope.querySelectorAll('.rl').forEach(r => r.remove());
    for (const leaf of scope.querySelectorAll('.ruled')) {
        const body = leaf.querySelector('.note-body'); if (!body || body.dataset.wrapped) continue;
        const text = collectText(body);
        if (!text.trim()) continue;
        body.textContent = text;                        // 纯文本 + pre-wrap(<br> 已还原成 \n)
        body.style.whiteSpace = 'pre-wrap';
        const tn = body.firstChild;
        const lr = leaf.getBoundingClientRect();
        const range = document.createRange();
        const rectsOf = (a, b) => { range.setStart(tn, a); range.setEnd(tn, b); return [...range.getClientRects()].filter(r => r.height > 4); };
        let pos = 0, guard = 0;
        const seen = new Set();                          // 同一底线只画一根(<br> 边界会重复命中)
        while (pos < text.length && guard++ < 60) {
            const n1 = rectsOf(pos, pos + 1).length;    // 单字符基准
            let end = pos + 1;
            while (end < text.length && rectsOf(pos, end + 1).length <= n1) end++;
            const rs = rectsOf(pos, end);
            if (rs.length) {
                const y = Math.round(rs[0].bottom - lr.top);
                if (y > 8 && y < lr.height - 8 && !seen.has(y)) {
                    seen.add(y);
                    const r = document.createElement('i');
                    r.className = 'rl'; r.style.top = y + 'px';
                    leaf.appendChild(r);
                }
            }
            pos = end;
        }
        body.dataset.wrapped = '1';
    }
}

// ── 渲染当前对开(无动画路径:启动 / 跳转 / 写完落页都走这里) ──
function renderSpread() {
    const L = leafAt(cur * 2), R = leafAt(cur * 2 + 1);
    spread.innerHTML = `<div class="spine"></div>` + L + R;
    folioNum.textContent = `${pad2(Math.max(cur * 2, 1))} / ${pad2(Math.max(notes.length, 1))}`;
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur >= totalLeaves - 1;
    // 纸边厚度:剩余页数越多,右缘断口带越长(4px 一节,封顶一页一册的视觉长度)
    const stack = $('#edgeStack');
    if (stack) {
        const remain = Math.max(0, (notes.length + 1) - (cur * 2 + 2));
        stack.style.height = Math.min(240, 8 + remain * 4) + 'px';
    }
    drawRules(spread);
    markTocHere();
    publishProbe();
}

// ── 翻页：定版无动画直切，只留左右钮 + 键盘 ──
function turn(dir) {
    const next = cur + dir;
    if (next < 0 || next > totalLeaves - 1) return;
    closeToc();
    cur = next;
    renderSpread();
}

// ── 目录:页码点开,任意页一步跳 ──
function openToc() {
    toc.hidden = false; folioBtn.setAttribute('aria-expanded', 'true');
    tocGrid.innerHTML = notes.map((n, i) => `
      <button type="button" class="toc-item" data-page="${i + 1}">
        <span class="no">No.${pad2(i + 1)} · ${esc(n.who) || '匿名'}</span>
        <span class="snip">${esc((n.text || '').split('\n')[0])}</span>
      </button>`).join('') || '<span class="toc-kicker">还没有一页</span>';
    markTocHere();
}
function closeToc() { toc.hidden = true; folioBtn.setAttribute('aria-expanded', 'false'); }
function markTocHere() {
    toc.querySelectorAll?.('.toc-item').forEach(b =>
        b.classList.toggle('here', +b.dataset.page >= cur * 2 && +b.dataset.page <= cur * 2 + 1));
}
folioBtn.addEventListener('click', () => { toc.hidden ? openToc() : closeToc(); });
$('#tocClose').addEventListener('click', closeToc);
tocGrid.addEventListener('click', e => {
    const item = e.target.closest('.toc-item'); if (!item) return;
    gotoPage(+item.dataset.page);
});
function gotoPage(pageIdx) {             // 落在包含该页的对开
    const target = Math.floor(pageIdx / 2);
    if (target === cur) { closeToc(); return; }
    cur = target; renderSpread(); closeToc();
}

// ── 数据源:同域有 /notes 接口就走接口;
//    没有(纯静态部署)就退回 notes-data.js + localStorage —— 一套代码两种部署。
const API = '/notes';
let apiOnline = false;

async function probeApi() {
    try {
        const r = await fetch(API, { method: 'GET' });
        if (!r.ok) return false;
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('json')) return false;       // hello 占位/兜底页都到这被挡掉
        const j = await r.json();
        return Array.isArray(j);
    } catch (e) { return false; }
}
async function postNote(note) {                       // 返回 true=已落服务器
    try {
        const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json' },
                                     body: JSON.stringify(note) });
        return r.ok;
    } catch (e) { return false; }
}

// ── 留一页 ──
const mask = $('#sheetMask'), form = $('#sheetForm'), bodyInput = $('#bodyInput'),
      nickInput = $('#nickInput'), cnt = $('#cnt'), sheetNo = $('#sheetNo');
function openSheet() { sheetNo.textContent = pad2(notes.length + 1); mask.hidden = false; bodyInput.focus(); }
function closeSheet() { mask.hidden = true; form.reset(); cnt.textContent = '0 / 240'; }
$('#writeBtn').addEventListener('click', openSheet);
$('#sheetClose').addEventListener('click', closeSheet);
mask.addEventListener('pointerdown', e => { if (e.target === mask) closeSheet(); });
bodyInput.addEventListener('input', () => { cnt.textContent = `${bodyInput.value.length} / 240`; });
form.addEventListener('submit', async e => {
    e.preventDefault();
    const text = bodyInput.value.trim(); if (!text) return;
    const d = new Date(), p = n => String(n).padStart(2, '0');
    const note = { who: nickInput.value.trim(), date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, text };
    if (apiOnline) {
        if (!await postNote(note)) { flashSheet('没存上，再试一次'); return; }
    } else {
        localStorage.setItem('zyx-notes-extra', JSON.stringify(notes.slice(BASE_COUNT)));
    }
    notes.push(note);
    totalLeaves = Math.ceil((notes.length + 1) / 2);
    closeSheet();
    cur = totalLeaves - 1;               // 写完直接看见自己那页
    renderSpread();
});
function flashSheet(msg) {               // 便签内轻提示(不改颜色、不加动画堆料)
    cnt.textContent = msg; cnt.style.color = 'var(--amber)';
}

// ── 输入接线：只留左右钮 + 键盘 ← → PgUp/PgDn（不接手动翻页：拖角/点页/点角/触摸滑动都不做） ──
prevBtn.addEventListener('click', () => turn(-1));
nextBtn.addEventListener('click', () => turn(1));
addEventListener('keydown', e => {
    if (!mask.hidden) { if (e.key === 'Escape') closeSheet(); return; }
    if (!toc.hidden && e.key === 'Escape') { closeToc(); return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') turn(1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') turn(-1);
});
addEventListener('resize', () => drawRules(spread));

// ── 启动 ──
async function boot() {
    notes = (window.NOTES || []).slice();
    BASE_COUNT = notes.length;
    apiOnline = await probeApi();
    if (apiOnline) {                                   // 接口在 → 列表以服务器为准
        try { notes = await (await fetch(API)).json(); BASE_COUNT = notes.length; }
        catch (e) { apiOnline = false; }
    }
    if (!apiOnline) {                                  // 纯静态兜底:本地试写的页也在(刷新不丢)
        try {
            const extra = JSON.parse(localStorage.getItem('zyx-notes-extra') || '[]');
            if (Array.isArray(extra)) notes = notes.concat(extra);
        } catch (e) {}
    }
    totalLeaves = Math.ceil((notes.length + 1) / 2);
    await loadFish();
    renderSpread();
    const qs = new URLSearchParams(location.search);
    if (qs.has('opentoc')) openToc();                  // 截图用:目录展开态
    if (qs.has('gotoend')) { cur = totalLeaves - 1; renderSpread(); }   // 截图用:翻到封底
    if (qs.has('goto')) {                              // 截图/验收用:直接跳到某对开(无动画)
        const g = +qs.get('goto'); if (g >= 0 && g < totalLeaves) { cur = g; renderSpread(); }
    }
    rootEl.setAttribute('data-ready', '1');
}
boot();

// ── 无头验收读数(脚手架约定) ──
function publishProbe() {
    rootEl.setAttribute('data-yy-probe', JSON.stringify({
        notes: notes.length, cur, totalLeaves,
        leaves: [...spread.querySelectorAll('.leaf')].map(l => l.className.replace(/leaf /, '')),
        folio: folioNum.textContent,
        navPrevDisabled: prevBtn.disabled, navNextDisabled: nextBtn.disabled
    }));
}
window.addEventListener('error', e => rootEl.setAttribute('data-error', (e.message || 'unknown').slice(0, 200)));
