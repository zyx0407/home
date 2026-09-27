/* 顺滑滚动 —— 仿 Lenis 的最小实现（自己写，不引第三方）
   做法：只接管「鼠标滚轮」；把滚动量交给一条 rAF 缓动去逼近目标位置。
   触摸 / 键盘 / 拖滚动条 / 锚点跳转 全走浏览器原生，不劫持。
   `?smooth=0` 关掉；系统开了「减少动态效果」或触摸设备，也自动不启用。
   验收钩子：启用时 <html data-smooth="on">，window.__smooth 可读 target / current。 */
(function () {
  var q = location.search;
  if (/[?&]smooth=0/.test(q)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia && window.matchMedia('(hover:none)').matches) return;

  // 强度由 site-data.js 的 settings.smooth 决定（在 /定制台/ 里调；0 = 关）
  var st = (window.SITE && window.SITE.settings) || {};
  var pct = st.smooth == null ? 12 : Number(st.smooth);
  if (!pct) return;

  var EASE = Math.max(0.02, Math.min(0.5, pct / 100));   // 每帧逼近多少
  var target = window.scrollY || 0;
  var current = target;
  var raf = null;

  function maxScroll() {
    return Math.max(0, (document.documentElement.scrollHeight || 0) - window.innerHeight);
  }
  function clampY(v) { return Math.max(0, Math.min(v, maxScroll())); }

  function tick() {
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.4) {
      current = target;
      raf = null;
      window.scrollTo(0, current);
      return;
    }
    window.scrollTo(0, current);
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.defaultPrevented) return;                                  // 页面缩放不拦
    if (e.target && e.target.closest && e.target.closest('[data-native-scroll]')) return;
    var unit = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? window.innerHeight : 1);
    target = clampY(target + e.deltaY * unit);
    e.preventDefault();
    if (raf == null) { current = window.scrollY; raf = requestAnimationFrame(tick); }
  }, { passive: false });

  // 键盘 / 锚点 / 拖滚动条 造成的位移：重新对齐，别把它抢回来
  window.addEventListener('scroll', function () {
    if (raf == null) target = current = window.scrollY;
  });
  window.addEventListener('resize', function () { target = current = window.scrollY; });

  document.documentElement.setAttribute('data-smooth', 'on');
  window.__smooth = {
    get target() { return target; },
    get current() { return current; },
    max: maxScroll
  };
})();
