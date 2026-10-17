/* 主页天气 · 铅笔雨丝（2026-10-17 接入主页）
   口径：只要下雨、不要涟漪（2026-10 定案）；零依赖；canvas 铺在内容下面、pointer-events:none。
   参数：?rain=1|2|3 雨势（0=关闭，默认 2）；主题跟随主站 theme.js 的 html[data-theme]。
   prefers-reduced-motion：不启动。?nofade=1：冻结（截图稳）。
   探针：documentElement.dataset 挂 fps / drops / error（无头验收用）。 */
(function () {
  var root = document.documentElement;
  var q = new URLSearchParams(location.search);
  var cv = document.getElementById('rain');
  if (!cv) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nofade = q.has('nofade');
  var RAIN = Math.min(Math.max(Number(q.get('rain')) || 2, 0), 3);
  if (reduce || RAIN === 0) { cv.style.display = 'none'; return; }

  var W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  addEventListener('resize', resize); resize();

  /* 雨势三档：疏 / 匀 / 密（偏疏——站点是安静的美术馆，不是天气 App） */
  var DROP_TARGET = [0, 45, 90, 160][RAIN];
  var rnd = Math.random;
  function isNight() { return root.getAttribute('data-theme') === 'night'; }
  function strokeColor(a) {
    /* 夜里白线要压暗一档，不然刺眼；白天用墨色本身的淡 alpha */
    var k = isNight() ? 0.72 : 1;
    return isNight() ? 'rgba(236,238,241,' + (a * k) + ')' : 'rgba(28,29,31,' + a + ')';
  }

  /* 雨丝：一条线 = 粉雾底 + 细芯 两笔（手绘铅笔四件套，整体调轻调慢） */
  var WIND = 0.05;
  var drops = [];
  function newDrop(seedTop) {
    var s = 0.55 + Math.pow(rnd(), 1.5) * 1.1;      /* 纵深：小值=远处细淡，大值=近处粗快 */
    return {
      x: rnd() * W * 1.2 - W * 0.1,
      y: seedTop ? rnd() * H : -rnd() * H * 0.35,
      len: (8 + rnd() * 10) * s,
      v: H * (0.35 + rnd() * 0.35) * s,
      s: s,
      ph: rnd() * Math.PI * 2,
      w: 0.5 + rnd() * 0.35,
      a: (0.06 + rnd() * 0.07) * (0.5 + s * 0.6),
      tail: 0.5 + rnd() * 0.5
    };
  }
  for (var i = 0; i < DROP_TARGET; i++) drops.push(newDrop(true));

  /* 点页面 = 那一小片雨突然变大 */
  addEventListener('pointerdown', function (e) {
    if (e.target.closest && e.target.closest('button,a')) return;
    for (var i = 0; i < 14; i++) {
      var d = newDrop(false);
      d.x = e.clientX + (rnd() - 0.5) * 180;
      d.y = e.clientY + (rnd() - 0.5) * 120 - H * 0.1;
      drops.push(d);
    }
    while (drops.length > DROP_TARGET + 60) drops.shift();
  });

  var now = 0, last = performance.now(), fpsAcc = 0, fpsN = 0;
  function frame(t) {
    now = t / 1000;
    var dt = nofade ? 0 : Math.min((t - last) / 1000, 0.05);
    last = t;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (var j = 0; j < drops.length; j++) {
      var d = drops[j];
      d.y += d.v * dt;
      d.x += d.v * WIND * dt + Math.sin(now * 1.4 + d.ph) * 4 * dt;
      if (d.y - d.len > H) Object.assign(d, newDrop(false));
      if (d.x < -30) d.x += W + 60; else if (d.x > W + 30) d.x -= W + 60;
      var wob = 0.9;
      var x0 = d.x + Math.sin(d.ph) * wob;
      var xm = d.x + d.len * WIND * 0.5 + Math.sin(d.ph + 2.1) * wob;
      var x1 = d.x + d.len * WIND + Math.sin(d.ph + 4.3) * wob;
      ctx.beginPath();
      ctx.moveTo(x0, d.y);
      ctx.quadraticCurveTo(xm, d.y + d.len * 0.55, x1, d.y + d.len);
      ctx.strokeStyle = strokeColor(d.a * 0.3);
      ctx.lineWidth = d.w + 0.9;
      ctx.stroke();
      ctx.strokeStyle = strokeColor(d.a * (0.55 + d.tail * 0.45));
      ctx.lineWidth = d.w;
      ctx.stroke();
    }
    fpsAcc += dt || 1 / 60; fpsN++;
    if (fpsN >= 30) {
      var ds = root.dataset;
      ds.fps = Math.round(fpsN / Math.max(fpsAcc, 1e-3));
      ds.drops = drops.length;
      fpsAcc = 0; fpsN = 0;
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  addEventListener('error', function (e) { root.dataset.error = String(e.message || e.error).slice(0, 200); });
})();
