/* ============================================================
   0407 号小行星 · 第一阶段脚本
   1) 星点画布（含省电策略）
   2) 信号接入式进场
   3) 滚动进入
   调试参数：?nointro=1 跳过进场（截图用）
   ============================================================ */
(function () {
  'use strict';

  /* ---------------- 0. 文案配置（文案.js 驱动，最先执行） ----------------
     想改字就改 文案.js 里的字符串，保存后刷新页面即生效；
     选择器对不上时会在控制台提醒（F12 → Console）。 */
  (function applyText () {
    var list = window.SITE_TEXT;
    if (!list || !list.length) return;
    var miss = [];
    for (var i = 0; i < list.length; i++) {
      var sel = list[i][0], txt = list[i][1];
      var el = document.querySelector(sel);
      if (el) { el.textContent = txt; } else { miss.push(sel); }
    }
    if (miss.length && window.console && console.warn) {
      console.warn('[文案] 这些选择器没匹配上：\n' + miss.join('\n'));
    }
  })();

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var noIntro = reduced || /nointro=1/.test(location.search);

  /* ---------------- 0. 截图辅助 ----------------
     ?shot=inside 会在 <html> 上挂 .shot-inside（收起首屏，方便拍下面的板块）。
     只是给人看的调试开关，不参与页面逻辑，线上带着也无副作用。 */
  var sm = location.search.match(/shot=(\w+)/);
  if (sm) document.documentElement.classList.add('shot-' + sm[1]);

  /* ---------------- 1. 星点 ---------------- */
  var cv = document.getElementById('sky');
  var ctx = cv.getContext('2d');
  var stars = [], W = 0, H = 0, coarse = window.matchMedia('(pointer: coarse)').matches;

  function build() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(W * H / (coarse ? 2600 : 1500));
    stars = [];
    for (var i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.05 + .25,
        a: Math.random() * .5 + .12,
        sp: Math.random() * .8 + .3,
        ph: Math.random() * 6.283
      });
    }
  }

  var meteors = [], nextMeteor = 4500 + Math.random() * 7000;   /* 首颗流星延后几秒 */
  function paint(t) {
    ctx.clearRect(0, 0, W, H);
    var tt = t / 1000;
    var off = reduced ? 0 : (window.scrollY * -0.08) % H;      /* 星点随滚动反向漂移 */
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var a = reduced ? s.a : s.a * (0.55 + 0.45 * Math.sin(tt * s.sp + s.ph));
      var y = s.y + off;
      if (y < -2) y += H; else if (y > H + 2) y -= H;
      ctx.beginPath();
      ctx.arc(s.x, y, s.r, 0, 6.283);
      ctx.fillStyle = 'rgba(219,231,234,' + a.toFixed(2) + ')';
      ctx.fill();
    }
    /* 偶发流星：每 9~27 秒一颗（旧站招牌动效） */
    if (!reduced) {
      if (t > nextMeteor) {
        nextMeteor = t + 9000 + Math.random() * 18000;
        meteors.push({
          x: W * (0.15 + Math.random() * 0.85), y: Math.random() * H * 0.35,
          vx: -(2.6 + Math.random() * 1.6), vy: 1.5 + Math.random() * 0.8,
          life: 1, len: 90 + Math.random() * 70
        });
      }
      for (var m = meteors.length - 1; m >= 0; m--) {
        var me = meteors[m];
        me.x += me.vx * 8; me.y += me.vy * 8; me.life -= 0.03;
        if (me.life <= 0) { meteors.splice(m, 1); continue; }
        var tx = me.x - me.vx * me.len / 3, ty = me.y - me.vy * me.len / 3;
        var grd = ctx.createLinearGradient(me.x, me.y, tx, ty);
        grd.addColorStop(0, 'rgba(233,255,251,' + (0.85 * me.life).toFixed(2) + ')');
        grd.addColorStop(1, 'rgba(79,227,208,0)');
        ctx.strokeStyle = grd; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(tx, ty); ctx.stroke();
      }
    }
  }

  build();

  if (reduced) {
    paint(0);                                  // 只画一帧，不跑循环
  } else {
    var last = 0;
    (function loop(t) {
      window.requestAnimationFrame(loop);
      if (document.hidden) return;             // 切到后台就停
      if (t - last < 60) return;               // 约 16fps，省电也够看
      last = t; paint(t);
    })(0);
  }

  var rt = null;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(build, 200);
  });

  /* ---------------- 2. 信号接入式进场 ---------------- */
  var intro = document.getElementById('intro');
  var numEl = document.getElementById('introNum');
  var logEl = document.getElementById('introLog');
  var LOGS = (window.SITE_INTRO_LOGS && window.SITE_INTRO_LOGS.length) ? window.SITE_INTRO_LOGS : ['正在接入编号 0407 的信号…', '锁定天区 N3', '读取自述档案', '信号已接入'];

  function finish() {
    if (!intro || intro.classList.contains('done')) return;
    intro.classList.add('done');
    document.body.classList.add('ready');
    if (noIntro) {                                  // 跳过进场时不给过渡，直接摘掉
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      return;
    }
    setTimeout(function () {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
    }, 950);
  }

  if (noIntro) {
    finish();
  } else {
    var t0 = performance.now(), dur = 1450;
    (function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      numEl.textContent = Math.round(p * 100);
      logEl.textContent = LOGS[Math.min(LOGS.length - 1, Math.floor(p * LOGS.length))];
      if (p < 1) window.requestAnimationFrame(tick);
      else setTimeout(finish, 280);
    })(t0);

    ['pointerdown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, finish, { once: true });
    });
  }

  /* ---------------- 3. 滚动进入 ---------------- */
  var targets = document.querySelectorAll('.reveal');
  if (reduced || sm || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: .18, rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  /* ---------------- 4. 航行记录：滚到就点亮 ---------------- */
  var items = document.querySelectorAll('.tl-item');
  if (reduced || sm || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('lit'); });
  } else {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('lit'); io2.unobserve(e.target); }
      });
    }, { threshold: .55 });
    Array.prototype.forEach.call(items, function (el) { io2.observe(el); });
  }

  /* ---------------- 5. 页面彩蛋：整页扫描（仅桌面端） ----------------
     规则：准星带扫描圆（78px）→ 圆内隐藏样本进度 0→100%（1.2s）→ 满了才显形（闪光）
           → 显形后点一下才进样本柜。
     他 2026-09-21 的裁定：手机端不加入该功能；电脑端整页可扫；定位是页面彩蛋；
           扫出第一个之后「样本记录」才显现；收小扫描范围 + 加信号强度读数；
           保留系统光标、不干扰正常点击。 */
  (function scanGame () {
    var touchOnly = window.matchMedia('(pointer:coarse)').matches;   // 平板这类"只有手指"的设备：没有准星可言
    if (window.matchMedia('(max-width:640px)').matches || touchOnly) return;
    document.documentElement.classList.add('scan-on');   // 隐藏鼠标指针只在桌面生效（JS 没跑就不隐藏）   // 手机：不参与

    var reticle  = document.getElementById('cross');
    var hud      = document.getElementById('scanHud');
    var sigBar   = document.getElementById('sigBar');
    var sigNum   = document.getElementById('sigNum');
    var bagBtn   = document.getElementById('bagBtn');
    var bagCountEl = document.getElementById('bagCount');
    var panel    = document.getElementById('bagPanel');
    var cabList  = document.getElementById('cabList');
    var cabCountEl = document.getElementById('cabCount');
    var heroCount  = document.getElementById('heroCount');
    var pctEl    = document.getElementById('crossPct');
    if (!reticle || !hud || !bagBtn || !panel) return;

    var NAMES = (window.SITE_FRAGMENTS && window.SITE_FRAGMENTS.length === 4)
      ? window.SITE_FRAGMENTS
      : ['碎片 001 · 一件没做完的东西', '碎片 002 · 早八的残骸',
         '碎片 003 · 一条鱼的记忆碎片', '碎片 004 · 低优先级天体'];
    /* 候选点位：都在各板块的留白处（相对该板块的百分比）；每次进页面随机挑 4 个 */
    var SPOTS = [
      { sel: '.dock',   x: 14, y: 62 },
      { sel: '.dock',   x: 86, y: 54 },
      { sel: '#about',  x: 84, y: 34 },
      { sel: '#about',  x: 82, y: 64 },
      { sel: '#works',  x: 34, y: 90 },
      { sel: '#log',    x: 82, y: 28 },
      { sel: '#log',    x: 84, y: 62 },
      { sel: '#uplink', x: 78, y: 14 },
      { sel: '#uplink', x: 30, y: 91 },
      { sel: '.foot',   x: 20, y: 34 }
    ];
    var REVEAL = 2200;          // 进度满需要多久（毫秒）
    var DECAY  = REVEAL * 1.8;  // 移开后回落多快
    var HOT    = 46;            // 可点热区半径
    var SIG    = 300;           // 信号强度感知半径（越近越强）
    var DEMO   = /demo=[12]/.test(location.search);

    var els = [], prog = [0, 0, 0, 0], shown = [false, false, false, false], got = [false, false, false, false];
    var mx = -9999, my = -9999, active = false, raf = null, last = 0;

    /* 不做持久化：每次进页面、或换个人打开，进度都是全新的 0/4（他 2026-09-21 要求） */

    /* 洗一遍点位，取前 4 个当这一轮的样本位置 */
    var pool = SPOTS.slice();
    for (var k = pool.length - 1; k > 0; k--) {
      var t = Math.floor(Math.random() * (k + 1));
      var tmp = pool[k]; pool[k] = pool[t]; pool[t] = tmp;
    }
    var chosen = pool.slice(0, 4);

    chosen.forEach(function (p, i) {
      var host = document.querySelector(p.sel);
      if (!host) return;
      host.style.position = 'relative';
      var d = document.createElement('div');
      d.className = 'ex-sample';
      d.style.left = p.x + '%';
      d.style.top = p.y + '%';
      d.innerHTML = '<span class="ex-flash"></span><span class="ex-spark"></span>' +
                    '<span class="ex-dot"></span><span class="ex-lbl">' + NAMES[i] + '</span>';
      host.appendChild(d);
      els.push(d);
    });
    if (!els.length) return;

    function centers () {
      return els.map(function (el) {
        var r = el.getBoundingClientRect();
        return { x: r.left, y: r.top };
      });
    }

    function refresh () {
      var n = got.filter(Boolean).length;
      bagCountEl.textContent = n;
      cabCountEl.textContent = n + ' / 4';
      cabList.innerHTML = '';
      for (var i = 0; i < 4; i++) {
        var li = document.createElement('li');
        if (got[i]) {
          li.innerHTML = '<b>00' + (i + 1) + '</b><span>' + NAMES[i].split('· ')[1] + '</span>';
        } else {
          li.className = 'empty';
          li.innerHTML = '<b>00' + (i + 1) + '</b><span>未采集</span>';
        }
        cabList.appendChild(li);
      }
      /* 扫到第一个之后，「样本记录」才显现 */
      if (n > 0) {
        bagBtn.hidden = false;
        if (heroCount) {
          heroCount.textContent = ('0' + n).slice(-2);
          heroCount.classList.remove('lit');
          void heroCount.offsetWidth;
          heroCount.classList.add('lit');
        }
      }
    }

    function flash (el) {
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('shown', 'flash');
      window.setTimeout(function () { el.classList.remove('flash'); }, 950);
    }

    function collect (i, quiet) {
      if (got[i]) return;
      got[i] = true; shown[i] = true; prog[i] = 1;
      flash(els[i]);
      els[i].classList.add('got');
      /* 不落盘 */
      refresh();
      window.dispatchEvent(new CustomEvent('fragment-got', {
        detail: { index: i, n: got.filter(Boolean).length, el: els[i] }
      }));
      if (got.every(Boolean)) window.dispatchEvent(new CustomEvent('fragments-full'));
    }

    function tick (now) {
      raf = window.requestAnimationFrame(tick);
      if (document.hidden) { last = now; return; }
      var dt = last ? Math.min(64, now - last) : 16;
      last = now;

      var cs = centers(), busy = false, locked = false, best = 0, nearest = 1e9;
      for (var i = 0; i < 4; i++) {
        var el = els[i];
        if (got[i]) continue;
        var dx = mx - cs[i].x, dy = my - cs[i].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < nearest) nearest = d;
        var near = active && d <= 78;
        if (!shown[i] && near) {
          prog[i] = Math.min(1, prog[i] + dt / REVEAL);
          busy = true; locked = true;
          if (prog[i] >= 1) { shown[i] = true; flash(el); }
        } else if (!shown[i] && prog[i] > 0) {
          prog[i] = Math.max(0, prog[i] - dt / DECAY);
          busy = true;
        }
        if (!got[i] && !shown[i] && prog[i] > best) best = prog[i];
      }

      if (pctEl) pctEl.textContent = Math.round(best * 100) + '%';
      reticle.style.setProperty('--charge', best.toFixed(2));
      reticle.classList.toggle('charging', best > 0);
      reticle.classList.toggle('locked', locked);

      var sig = nearest < SIG ? Math.max(0, Math.round((1 - nearest / SIG) * 100)) : 0;
      if (sig > 0) {
        hud.classList.add('on');
        sigBar.style.width = sig + '%';
        sigNum.textContent = sig;
      } else {
        hud.classList.remove('on');
      }

      if (!busy && !active && sig === 0) { window.cancelAnimationFrame(raf); raf = null; }
    }

    function place (e) {
      mx = e.clientX; my = e.clientY;
      reticle.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      reticle.classList.add('on');
      active = true;
      if (!raf) { last = 0; raf = window.requestAnimationFrame(tick); }
    }

    function tryCollect () {
      var cs = centers();
      for (var i = 0; i < 4; i++) {
        if (got[i] || !shown[i]) continue;
        var dx = mx - cs[i].x, dy = my - cs[i].y;
        if (Math.sqrt(dx * dx + dy * dy) <= HOT) { collect(i); return; }
      }
    }

    window.addEventListener('pointermove', place);
    /* 光标被藏起来了 → 进到能点的地方时准星轻轻收拢一下，免得人找不到哪儿能点 */
    document.addEventListener('pointerover', function (e) {
      var t = e.target;
      var inter = !!(t && t.closest && t.closest('a[href], button'));
      reticle.classList.toggle('link', inter);
    });
    window.addEventListener('pointerdown', function (e) {
      if (e.target.closest && e.target.closest('.bag-btn, .bag-panel')) return;  // 不干扰柜子
      place(e);
      tryCollect();
    });
    document.addEventListener('pointerleave', function () {
      active = false; reticle.classList.remove('on'); hud.classList.remove('on');
    });
    bagBtn.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      hud.classList.toggle('off', !panel.hidden);
    });

    refresh();

    /* 截图预演：?demo=1（不写存档，且冻住不推进） */
    if (DEMO) {
      if (/demo=2/.test(location.search)) { collect(0, true); collect(2, true); collect(3, true); window.setTimeout(function () { window.dispatchEvent(new CustomEvent('fragments-full')); }, 0); }
      console.log('sample spots: ' + chosen.map(function (p) { return p.sel + '@' + p.x + ',' + p.y; }).join(' | '));
      var cs0 = centers();
      shown[0] = true; prog[0] = 1;
      els[0].classList.add('shown', 'flash');
      window.setTimeout(function () { collect(1, true); }, 0);   /* 等监听器注册好再发事件 */
      prog[2] = .55;
      mx = cs0[2].x; my = cs0[2].y; active = true;
      reticle.style.transform = 'translate(' + mx + 'px,' + my + 'px)';
      reticle.classList.add('on', 'charging', 'locked');
      if (pctEl) pctEl.textContent = '55%';
      reticle.style.setProperty('--charge', '0.55');
      hud.classList.add('on');
      sigBar.style.width = '78%'; sigNum.textContent = '78';
      if (raf) { window.cancelAnimationFrame(raf); raf = null; }
    }
  })();

  /* ---------------- 6. 页面动态与彩蛋 ----------------
     ① 行星 hover：环亮 + 星芒炸一下   ② 行星跟随鼠标轻微视差
     ③ 标题逐字显影   ④ 页脚悄悄话打字机   ⑤ 四块碎片集齐：星芒炸 + 读数闪 + 一句收尾 */
  (function extras () {
    var rock = document.querySelector('.rock');
    var hit  = document.querySelector('.rock-hit');
    var box  = document.querySelector('.rock-box');
    var eggDone = document.getElementById('eggDone');
    var heroCount = document.getElementById('heroCount');

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var shot = /[?&]shot=/.test(location.search);
    var desktop = !window.matchMedia('(max-width:640px)').matches;

    /* 调试开关：?pet=1 直接摆出 hover 状态（无头截图用） */
    if (/[?&]pet=1/.test(location.search) && rock) rock.classList.add('pet');

    /* ① 行星 hover */
    if (rock && hit) {
      hit.addEventListener('pointerenter', function () {
        rock.classList.remove('pet'); void rock.offsetWidth; rock.classList.add('pet');
      });
      hit.addEventListener('pointerleave', function () { rock.classList.remove('pet'); });
    }

    /* ② 视差（桌面、且不是"不想动"的人） */
    if (box && desktop && !reduced) {
      var tx = 0, ty = 0, queued = false;
      window.addEventListener('pointermove', function (e) {
        if (box.dataset.drag) return;                 /* 正在被拖的时候不做视差 */
        tx = -((e.clientX / window.innerWidth - .5) * 2) * 9;
        ty = -((e.clientY / window.innerHeight - .5) * 2) * 6;
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          box.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
          queued = false;
        });
      });
    }

    /* ③ 标题逐字显影 */
    var titles = document.querySelectorAll('.block-head h2');
    if (titles.length) {
      Array.prototype.forEach.call(titles, function (h) {
        var text = h.textContent;
        h.textContent = '';
        h.classList.add('split');
        Array.prototype.forEach.call(text.split(''), function (ch, i) {
          var s = document.createElement('span');
          s.className = 'ch';
          s.textContent = ch;
          s.style.transitionDelay = (i * 70) + 'ms';
          h.appendChild(s);
        });
      });
      if (reduced || shot || !('IntersectionObserver' in window)) {
        Array.prototype.forEach.call(titles, function (h) { h.classList.add('in'); });
      } else {
        var io3 = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('in'); io3.unobserve(e.target); }
          });
        }, { threshold: .4 });
        Array.prototype.forEach.call(titles, function (h) { io3.observe(h); });
      }
    }

    /* ④ 页脚悄悄话打字机 */
    var whisper = document.querySelector('.whisper');
    if (whisper) {
      var full = whisper.textContent.trim();
      if (reduced || shot || !('IntersectionObserver' in window)) {
        whisper.textContent = full;
      } else {
        whisper.textContent = '';
        var typed = false;
        var io4 = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting || typed) return;
            typed = true; io4.unobserve(e.target);
            whisper.classList.add('typing');
            var i = 0;
            (function step () {
              whisper.textContent = full.slice(0, ++i);
              if (i < full.length) window.setTimeout(step, 95);
              else whisper.classList.remove('typing');
            })();
          });
        }, { threshold: .6 });
        io4.observe(whisper);
      }
    }

    /* 调试开关：?fly=1 模拟刚采集一块（用来抓飞行动画的中间帧） */
    if (/[?&]fly=1/.test(location.search)) {
      window.setTimeout(function () {
        var es = document.querySelectorAll('.ex-sample'), el = null, vh = window.innerHeight;
        for (var i = 0; i < es.length; i++) {
          var r = es[i].getBoundingClientRect();
          if (r.top > 40 && r.top < vh - 40) { el = es[i]; break; }
        }
        if (!el) {                                  /* 没有可见碎片 → 用模拟起点，方便调试看效果 */
          el = {
            getBoundingClientRect: function () {
              return { left: window.innerWidth * .3, top: window.innerHeight - 130, width: 0, height: 0 };
            },
            classList: { add: function () {}, remove: function () {}, contains: function () { return false; } }
          };
        } else {
          el.classList.add('shown', 'got');
        }
        window.dispatchEvent(new CustomEvent('fragment-got', { detail: { index: 0, n: 1, el: el } }));
      }, 60);
    }
    /* ⑧ 环上微光点：转到行星背面就淡出（修"隔着行星发亮"）
       只在收过碎片之后才开这个循环 —— 没碎片时不必占着一帧一帧 */
    var motes = document.querySelectorAll('.mote');
    if (motes.length) {
      var moteLast = 0, moteOn = false;
      var moteLoop = function (t) {
        if (!moteOn) return;
        window.requestAnimationFrame(moteLoop);
        if (t - moteLast < 50) return;
        moteLast = t;
        var hitEl2 = document.querySelector('.rock-hit');
        var bx2 = document.querySelector('.rock-box');
        if (!hitEl2 || !bx2) return;
        var any = false;
        for (var q = 1; q <= 4; q++) { if (bx2.classList.contains('f' + q)) { any = true; break; } }
        if (!any) return;
        var cr = hitEl2.getBoundingClientRect();
        if (cr.bottom < 0 || cr.top > window.innerHeight) return;      /* 看不见就别算 */
        var ccx = cr.left + cr.width / 2, ccy = cr.top + cr.height / 2;
        var ra = -18 * Math.PI / 180;                                  /* 环的倾斜角 */
        var ndx = -Math.sin(ra), ndy = Math.cos(ra);                    /* 环的"远近轴" */
        Array.prototype.forEach.call(motes, function (m) {
          var r = m.getBoundingClientRect();
          var dxm = (r.left + r.width / 2) - ccx, dym = (r.top + r.height / 2) - ccy;
          m.classList.toggle('behind', dxm * ndx + dym * ndy < -6);
        });
      };
      window.addEventListener('fragment-got', function () {
        if (moteOn) return;
        moteOn = true;
        window.requestAnimationFrame(moteLoop);
      });
    }
    /* ⑥ 每收一块碎片：碎片飞向行星 + 行星长一点东西 */
    var demoMode = /[?&]demo=/.test(location.search);
    var rbox = document.querySelector('.rock-box');

    /* 碎片飞行：画在专用画布上 —— 彗星拖尾 + 亮头 + 出发时炸几点碎星 */
    var flyCv = document.createElement('canvas');
    flyCv.className = 'fly-canvas';
    document.body.appendChild(flyCv);
    var fctx = flyCv.getContext('2d'), fW = 0, fH = 0;
    function sizeFly () {
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      fW = window.innerWidth; fH = window.innerHeight;
      flyCv.width = Math.round(fW * dpr); flyCv.height = Math.round(fH * dpr);
      flyCv.style.width = fW + 'px'; flyCv.style.height = fH + 'px';
      fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeFly();
    window.addEventListener('resize', sizeFly);

    var flights = [], flyRaf = null;
    function drawFlights (t) {
      fctx.clearRect(0, 0, fW, fH);
      if (!flights.length) { flyRaf = null; return; }
      flyRaf = window.requestAnimationFrame(drawFlights);
      for (var i = flights.length - 1; i >= 0; i--) {
        var f = flights[i];
        var u = (t - f.t0) / f.dur;
        if (u >= 1) { if (f.onDone) f.onDone(); flights.splice(i, 1); continue; }
        /* 每帧重新取坐标：镜头跟着滚动时轨迹也不会跑偏 */
        var sr = f.srcEl ? f.srcEl.getBoundingClientRect() : { left: f.sx, top: f.sy, width: 0, height: 0 };
        var sx = sr.left + sr.width / 2, sy = sr.top + sr.height / 2;
        var trr = f.planetEl ? f.planetEl.getBoundingClientRect() : null;
        var ex, ey;
        if (trr && trr.bottom > 0 && trr.top < fH) { ex = trr.left + trr.width / 2; ey = trr.top + trr.height / 2; }
        else { ex = sx; ey = -60; }
        var dxs = ex - sx, dys = ey - sy;
        var lens = Math.sqrt(dxs * dxs + dys * dys) || 1;
        var nx2 = -dys / lens, ny2 = dxs / lens;
        var bends = Math.min(80, lens * .16) * (dys < 0 ? 1 : -1);
        var cx = sx + dxs * .5 + nx2 * bends, cy = sy + dys * .5 + ny2 * bends;
        var pt = function (s) {
          var a = 1 - s;
          return {
            x: a * a * sx + 2 * a * s * cx + s * s * ex,
            y: a * a * sy + 2 * a * s * cy + s * s * ey
          };
        };
        var head = pt(u);
        var tailStart = Math.max(0, u - .32);
        fctx.lineCap = 'round';
        for (var k = 0; k < 12; k++) {
          var u1 = tailStart + (u - tailStart) * (k / 12);
          var u2 = tailStart + (u - tailStart) * ((k + 1) / 12);
          var p1 = pt(u1), p2 = pt(u2);
          fctx.beginPath();
          fctx.moveTo(p1.x, p1.y); fctx.lineTo(p2.x, p2.y);
          fctx.lineWidth = 0.8 + 3.6 * (k / 12);
          fctx.strokeStyle = 'rgba(157,243,230,' + (0.05 + 0.5 * (k / 12)).toFixed(3) + ')';
          fctx.stroke();
        }
        fctx.beginPath(); fctx.arc(head.x, head.y, 8, 0, 6.283);
        fctx.fillStyle = 'rgba(79,227,208,.18)'; fctx.fill();
        fctx.beginPath(); fctx.arc(head.x, head.y, 3, 0, 6.283);
        fctx.fillStyle = '#eafffb'; fctx.fill();
        if (u < .3) {
          var bu = u / .3;
          for (var q = 0; q < 7; q++) {
            var ang = (q / 7) * 6.283 + f.seed;
            var rr = 4 + bu * 26;
            fctx.beginPath();
            fctx.arc(sx + Math.cos(ang) * rr, sy + Math.sin(ang) * rr, 1.5 * (1 - bu), 0, 6.283);
            fctx.fillStyle = 'rgba(233,255,251,' + (0.75 * (1 - bu)).toFixed(2) + ')';
            fctx.fill();
          }
        }
      }
    }

    var scrollRaf = null;
    function cancelScrollHome () {
      if (scrollRaf) { window.cancelAnimationFrame(scrollRaf); scrollRaf = null; }
    }
    function scrollHome (dur) {
      cancelScrollHome();
      var y0 = window.scrollY, t0 = performance.now();
      (function step (now) {
        var u = Math.min(1, (now - t0) / dur);
        var ez = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;   /* 三次缓动，更柔和 */
        window.scrollTo(0, y0 * (1 - ez));
        if (u < 1) { scrollRaf = window.requestAnimationFrame(step); }
        else { scrollRaf = null; }
      })(t0);
      /* 他自己一动滚轮/触摸，就立刻不跟了 */
      window.addEventListener('wheel', cancelScrollHome, { once: true, passive: true });
      window.addEventListener('touchstart', cancelScrollHome, { once: true, passive: true });
    }

    function flyToPlanet (el, onArrive) {
      if (!el) { if (onArrive) onArrive(); return; }
      var r = el.getBoundingClientRect();
      var sx = r.left, sy = r.top;
      var hitEl = document.querySelector('.rock-hit');
      var tr = hitEl ? hitEl.getBoundingClientRect() : null;
      var visible = tr && tr.bottom > 0 && tr.top < window.innerHeight;
      var ex, ey;
      if (visible) { ex = tr.left + tr.width / 2; ey = tr.top + tr.height / 2; }
      else { ex = sx; ey = -60; }                 /* 行星在视野外 → 顺着自己这一列垂直上飞 */
      var fired = false;
      function done () {
        if (fired) return; fired = true;
        el.classList.add('gone');
        if (onArrive) onArrive();                 /* 到达那一刻才炸星芒 + 报进度 */
      }
      if (demoMode || reduced) { done(); return; }
      flights.push({
        srcEl: el, planetEl: document.querySelector('.rock-hit'),
        sx: sx, sy: sy, ex: ex, ey: ey,
        t0: performance.now(), dur: 1750, seed: Math.random() * 6.283, onDone: done
      });
      if (!flyRaf) flyRaf = window.requestAnimationFrame(drawFlights);
      window.setTimeout(done, 2600);              /* 兜底 */
      if (!visible) scrollHome(1900);             /* 行星不在视野 → 镜头平滑跟回顶部 */
    }

    function planetPulse () {
      if (!rock) return;
      rock.classList.remove('pet'); void rock.offsetWidth; rock.classList.add('pet');
    }

    var STAGE = (window.SITE_TOASTS && window.SITE_TOASTS.length === 4) ? window.SITE_TOASTS : ['一块碎片回来了。它绕着行星转起来。', '第二块回来了。又一颗围着它转。', '第三块回来了。环上又亮一颗。', '观测完成'];
    window.addEventListener('fragment-got', function (e) {
      var d = e.detail || {};
      if (rbox && d.n) rbox.classList.add('f' + d.n);          /* 行星逐次生长 */
      flyToPlanet(d.el, function () {                           /* 归位那一刻才报进度 */
        planetPulse();
        if (!eggDone) return;
        eggDone.textContent = STAGE[Math.min(3, d.n - 1)];
        eggDone.classList.add('on');
        if (d.n < 4) {
          window.setTimeout(function () {
            if (eggDone.textContent === STAGE[d.n - 1]) eggDone.classList.remove('on');
          }, 3400);
        }
      });
    });
    /* ⑤ 集齐彩蛋 */
    window.addEventListener('fragments-full', function () {
      if (rock) { rock.classList.remove('pet'); void rock.offsetWidth; rock.classList.add('pet'); }
      if (heroCount) { heroCount.classList.remove('lit'); void heroCount.offsetWidth; heroCount.classList.add('lit'); }
      if (eggDone) eggDone.classList.add('on');
    });
  })();

  /* ---------------- 7. 把页面填满：七样动态与互动 ----------------
     ① 仪器分隔线 + 图版编号  ② 标题旁跳动读数  ③ 滚动进度 + 当前栏目
     ④ 指针光晖  ⑤ 页脚信号波形  ⑥ 星点视差 + 偶发流星（在星空模块里） */
  (function fillPage () {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var desktop = !window.matchMedia('(max-width:640px)').matches;

    /* ① 给每个板块挂图版编号 */
    var blocks = document.querySelectorAll('.inside .block');
    Array.prototype.forEach.call(blocks, function (b, i) {
      b.setAttribute('data-plate', 'PLATE ' + ('0' + (i + 1)).slice(-2));
    });

    /* ② 标题旁的跳动读数 */
    var heads = document.querySelectorAll('.block-head');
    Array.prototype.forEach.call(heads, function (head) {
      var s = document.createElement('span');
      s.className = 'head-read';
      s.setAttribute('data-sec', '0');
      s.textContent = (window.SITE_READOUT || '已探索') + ' 0s';
      var kk = head.querySelector('.kicker');
      if (kk) { kk.insertAdjacentElement('afterend', s); } else { head.appendChild(s); }
    });
    if (heads.length && !reduced) {
      window.setInterval(function () {
        Array.prototype.forEach.call(heads, function (head) {
          var sec = head.closest('.block');
          if (!sec) return;
          var r = sec.getBoundingClientRect();
          var vis = r.top < window.innerHeight * .8 && r.bottom > window.innerHeight * .2;
          var el = head.querySelector('.head-read');
          if (!el) return;
          var n = parseInt(el.getAttribute('data-sec'), 10) || 0;
          if (vis) n++;
          el.setAttribute('data-sec', n);
          el.textContent = (window.SITE_READOUT || '已探索') + ' ' + n + 's';
          el.style.color = vis ? 'var(--dim)' : 'var(--faint)';
        });
      }, 1000);
    }

    /* ③ 滚动进度 + 当前栏目 */
    var rail = document.createElement('div');
    rail.className = 'scroll-rail';
    rail.innerHTML = '<i></i>';
    var read = document.createElement('div');
    read.className = 'scroll-read';
    read.textContent = '正在观测：阿玖';
    document.body.appendChild(rail);
    document.body.appendChild(read);
    var dot = rail.querySelector('i');
    var secs = document.querySelectorAll('.dock, .inside .block, .foot');
    var queued = false;
    function onScroll () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      dot.style.top = (p * 100).toFixed(2) + '%';
      var cur = '阿玖';
      Array.prototype.forEach.call(secs, function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= window.innerHeight * .38) {
          var t = s.querySelector('h2') || s.querySelector('.dock-title') || s.querySelector('.whisper');
          if (t) cur = t.textContent.replace(/\s+/g, '');
        }
      });
      read.textContent = '正在观测：' + cur;
    }
    function requestScroll () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; onScroll(); });
    }
    window.addEventListener('scroll', requestScroll, { passive: true });
    window.addEventListener('resize', requestScroll);
    onScroll();

    /* ④ 首屏那行「↓ 继续」：点了就平滑滚到 01 */
    var cue = document.getElementById('cue');
    if (cue) {
      cue.addEventListener('click', function () {
        var about = document.getElementById('about');
        if (!about) return;
        about.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      });
    }

    /* ④ 指针光晖 */
    if (desktop && !reduced) {
      var glow = document.createElement('div');
      glow.className = 'cursor-glow';
      document.body.appendChild(glow);
      var gq = false, gx = 0, gy = 0;
      window.addEventListener('pointermove', function (e) {
        gx = e.clientX; gy = e.clientY;
        if (gq) return;
        gq = true;
        window.requestAnimationFrame(function () {
          glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)';
          glow.classList.add('on');
          gq = false;
        });
      });
      document.addEventListener('pointerleave', function () { glow.classList.remove('on'); });
    }

    /* ⑤ 页脚信号波形 */
    var foot = document.querySelector('.foot');
    if (foot) {
      var d = '', n2 = 120, mid = 20, amp = 9;
      for (var i2 = 0; i2 <= n2; i2++) {
        d += (i2 ? ' L' : 'M') + (i2 * 10) + ' ' + (mid + Math.sin((i2 / n2) * Math.PI * 4) * amp).toFixed(1);
      }
      var wrap = document.createElement('div');
      wrap.className = 'wave-wrap';
      wrap.innerHTML = '<svg viewBox="0 0 1200 40" preserveAspectRatio="none" aria-hidden="true">' +
                       '<path d="' + d + '"/></svg><span class="wave-label">SIGNAL</span>';
      foot.insertBefore(wrap, foot.firstChild);
    }

  })();
})();
