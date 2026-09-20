/* ============================================================
   阿玖的网站 · zyx0407.com
   星空底 / 进屋开场 / 滚动进屋 / 逐字显影 / 时间线 / 两扇门
   依赖：本地 gsap.min.js（无 CDN、无第三方请求）
   ============================================================ */
(function () {
    'use strict';

    /* ---------------- 环境判断 ---------------- */
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var small = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    var PUSH = !small && !reduce;        // 是否做镜头推进（小屏 / 减少动效 → 不做）

    var $ = function (s, r) { return (r || document).querySelector(s); };
    var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
    var clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };

    /* ================= 星空 ================= */
    var canvas = $('#sky');
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var farStars = [], nearStars = [];
    var frame = 0, raf = null, running = false;
    var meteors = [], meteorWait = 90;              // 进场约 1.5 秒就来第一颗
    var METEOR_MAX = 4;                             // 同时在飞的上限
    var METEOR_GAP_MIN = 240, METEOR_GAP_MAX = 700;  // 帧：约 4~12 秒一波
    var dimP = 0;      // 0 = 门外最亮 → 1 = 屋内最暗
    var pushP = 0;     // 镜头推进进度（0→1）

    function buildStars() {
        var pad = Math.round(Math.max(W, H) * 0.35);
        /* 宁少勿多：稀疏 + 压暗，才像夜空；密了就成了雪花点 */
        var count = Math.floor(((W + pad * 2) * (H + pad * 2)) / 5200);
        var i, j;

        farStars.length = 0;
        for (i = 0; i < count; i++) {
            farStars.push({
                x: -pad + Math.random() * (W + pad * 2),
                y: -pad + Math.random() * (H + pad * 2),
                r: 0.3 + Math.random() * 0.7,
                a: 0.09 + Math.random() * 0.21,
                ph: Math.random() * Math.PI * 2,
                big: Math.random() < 0.01       // 极少量亮星，带一圈很淡的柔光
            });
        }

        nearStars.length = 0;
        var nearCount = Math.round(count / 55) + 6;
        for (j = 0; j < nearCount; j++) {
            nearStars.push({
                x: Math.random() * W,
                y: Math.random() * H,
                d: 0.35 + Math.random() * 0.65,
                ph: Math.random() * Math.PI * 2
            });
        }
    }

    function resizeCanvas() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        buildStars();
    }

    function render() {
        frame = (frame + 1) % 1000000;
        ctx.clearRect(0, 0, W, H);

        var light = 0.2 + 0.8 * (1 - dimP);     // 进屋后星点变暗
        var scale = 1 + 0.26 * pushP;           // 轻微推近
        var drift = -pushP * H * 0.05;          // 轻微上移
        var i;

        /* 远星：缓慢闪烁 */
        ctx.save();
        ctx.translate(W / 2, H / 2 + drift);
        ctx.scale(scale, scale);
        ctx.translate(-W / 2, -H / 2);
        for (i = 0; i < farStars.length; i++) {
            var st = farStars[i];
            var f = 0.86 + 0.14 * Math.sin(frame * 0.006 + st.ph);
            var al = st.a * f * light;

            if (st.big) {
                var hg = ctx.createRadialGradient(st.x, st.y, 0, st.x, st.y, st.r * 7);
                hg.addColorStop(0, 'rgba(255,255,255,' + (al * 0.34).toFixed(3) + ')');
                hg.addColorStop(0.4, 'rgba(214,228,255,' + (al * 0.12).toFixed(3) + ')');
                hg.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.beginPath();
                ctx.arc(st.x, st.y, st.r * 7, 0, 6.2832);
                ctx.fillStyle = hg;
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(st.x, st.y, st.r, 0, 6.2832);
            ctx.fillStyle = 'rgba(255,255,255,' + al.toFixed(3) + ')';
            ctx.fill();
        }
        ctx.restore();

        /* 近星：滚动时从四周掠过 */
        if (pushP > 0.002) {
            var t = pushP;
            for (i = 0; i < nearStars.length; i++) {
                var n = nearStars[i];
                var sc = 1 + 3 * t * n.d;
                var x = W / 2 + (n.x - W / 2) * sc;
                var y = H / 2 + (n.y - H / 2) * sc + drift;
                var r = (0.8 + 2.2 * n.d) * sc;
                var a = t * (0.12 + 0.4 * n.d) * (1 - Math.max(0, (t - 0.7) / 0.3));
                if (a <= 0.01) continue;
                a *= 0.85 + 0.15 * Math.sin(frame * 0.03 + n.ph);
                var g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
                g.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')');
                g.addColorStop(0.35, 'rgba(226,236,255,' + (a * 0.45).toFixed(3) + ')');
                g.addColorStop(1, 'rgba(127,178,224,0)');
                ctx.beginPath();
                ctx.arc(x, y, r * 3, 0, 6.2832);
                ctx.fillStyle = g;
                ctx.fill();
            }
        }

        drawMeteor(light);
    }

    /* ---- 流星：可同时飞好几颗，间隔约 4~12 秒，偶尔来一小阵 ---- */
    function spawnMeteor() {
        if (meteors.length >= METEOR_MAX) return;

        var ang = Math.PI * (0.18 + Math.random() * 0.12);
        var sp = 5.5 + Math.random() * 4;

        meteors.push({
            x: -W * 0.05 + Math.random() * W * 0.7,
            y: Math.random() * H * 0.34,
            vx: Math.cos(ang) * sp,
            vy: Math.sin(ang) * sp,
            nx: Math.cos(ang),
            ny: Math.sin(ang),
            len: 110 + Math.random() * 110,
            t: 0,
            dur: 75 + Math.random() * 45
        });
    }

    function drawMeteor(light) {
        if (reduce || small) return;

        /* 到点就放，偶尔一次放两颗（像一小阵流星雨） */
        if (meteors.length < METEOR_MAX) {
            meteorWait--;
            if (meteorWait <= 0) {
                var n = Math.random() < 0.3 ? 2 : 1;
                for (var q = 0; q < n; q++) spawnMeteor();
                meteorWait = METEOR_GAP_MIN + Math.random() * (METEOR_GAP_MAX - METEOR_GAP_MIN);
            }
        }

        for (var i = meteors.length - 1; i >= 0; i--) {
            var m = meteors[i];

            m.t++;
            m.x += m.vx;
            m.y += m.vy;

            var k = m.t / m.dur;
            if (k >= 1) { meteors.splice(i, 1); continue; }

            var a = Math.sin(Math.PI * k) * 0.9 * Math.max(0.15, light);
            var tx = m.x - m.nx * m.len;
            var ty = m.y - m.ny * m.len;

            ctx.save();
            var g = ctx.createLinearGradient(m.x, m.y, tx, ty);
            g.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')');
            g.addColorStop(0.25, 'rgba(206,226,255,' + (a * 0.42).toFixed(3) + ')');
            g.addColorStop(1, 'rgba(160,196,240,0)');
            ctx.strokeStyle = g;
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(m.x, m.y);
            ctx.lineTo(tx, ty);
            ctx.stroke();

            var hg = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 6);
            hg.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')');
            hg.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(m.x, m.y, 6, 0, 6.2832);
            ctx.fillStyle = hg;
            ctx.fill();
            ctx.restore();
        }
    }

    function loop() {
        render();
        raf = requestAnimationFrame(loop);
    }

    function startSky() {
        if (running) return;
        running = true;
        loop();
    }

    function stopSky() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        raf = null;
    }

    /* ================= 滚动：门牌淡出 + 镜头推进 ================= */
    var hero = $('#sec-hero');
    var heroInner = $('.hero-inner');
    var plate = $('#plate');
    var veil = $('#veil');
    var rail = $('#rail');
    var ticking = false;

    function updateScroll() {
        ticking = false;

        var len = hero.offsetHeight - window.innerHeight;
        var y = window.scrollY || window.pageYOffset || 0;
        var p = len > 0 ? clamp(y / len, 0, 1) : (y > 40 ? 1 : 0);

        dimP = p;
        pushP = PUSH ? p : 0;

        /* 门牌慢慢退场（滚过约 3/4 才完全消失），别让人滚半天看不到东西 */
        if (heroInner) heroInner.style.opacity = String(clamp(1 - p * 1.3, 0, 1));
        if (plate) {
            plate.style.transform = 'translateY(' + (-p * 10).toFixed(2) + 'vh) scale(' + (1 + 0.3 * p).toFixed(3) + ')';
        }
        if (veil && introDone) veil.style.opacity = String(clamp(0.95 - 0.5 * p, 0.25, 1));

        /* 底部星点路标：进屋之后才浮出来 */
        if (rail) rail.classList.toggle('show', p > 0.35);
        updateRail();
    }

    function onScroll() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateScroll);
    }

    /* ================= 逐字拆分 ================= */
    function splitChars(el) {
        var text = el.textContent;
        var out = [];
        var i, span;

        el.textContent = '';
        for (i = 0; i < text.length; i++) {
            span = document.createElement('span');
            span.className = 'ch';
            span.textContent = text.charAt(i) === ' ' ? '\u00A0' : text.charAt(i);
            el.appendChild(span);
            out.push(span);
        }
        return out;
    }

    /* ================= 底部星点路标 ================= */
    var railSections = [], railDots = [];

    function buildRail() {
        railSections = $$('[data-rail]');
        railDots = [];

        railSections.forEach(function (sec) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'rail-dot';
            b.setAttribute('data-label', sec.getAttribute('data-rail'));
            b.setAttribute('aria-label', sec.getAttribute('data-rail'));
            b.addEventListener('click', function () {
                sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
            });
            rail.appendChild(b);
            railDots.push(b);
        });
    }

    /* 按滚动位置算当前栏目。
       以前用"视口中线那条窄带"+IntersectionObserver，但页脚又矮又贴在页面最底，
       永远够不到中线，最后一颗点不亮——所以改成直接算。 */
    function updateRail() {
        if (!railSections.length) return;

        var y = window.scrollY || 0;
        var mid = y + window.innerHeight * 0.5;
        var idx = 0;
        var i, top;

        for (i = 0; i < railSections.length; i++) {
            top = railSections[i].getBoundingClientRect().top + y;
            if (top <= mid) idx = i;
        }

        /* 已经滚到底 → 一定点亮最后一项 */
        var docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        if (window.innerHeight + y >= docH - 4) idx = railSections.length - 1;

        for (i = 0; i < railDots.length; i++) {
            railDots[i].classList.toggle('on', i === idx);
            railDots[i].classList.toggle('past', i < idx);   // 走过的留下痕迹
        }
    }

    /* ================= 进入视口显形 ================= */
    function buildObservers() {
        if (!('IntersectionObserver' in window)) {
            $$('.reveal, .split').forEach(function (el) { el.classList.add('in'); });
            $$('.tl-item').forEach(function (el) { el.classList.add('on'); });
            return;
        }

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.classList.add('in');
                io.unobserve(en.target);
            });
        }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
        $$('.reveal, .split').forEach(function (el) { io.observe(el); });

        var io2 = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) return;
                en.target.classList.add('on');
                io2.unobserve(en.target);
            });
        }, { threshold: 0.6, rootMargin: '0px 0px -10% 0px' });
        $$('.tl-item').forEach(function (el) { io2.observe(el); });
    }

    /* ================= 开场：进屋 ================= */
    var gate = $('#gate');
    var ringFill = $('#ring-fill');
    var ringWrap = $('#ring-wrap');
    var ringEnter = $('#ring-enter');
    var wipe = $('#wipe');
    var mist = $('#mist');
    var plateTitle = $('#plate-title');
    var plateDomain = $('#plate-domain');
    var plateSub = $('#plate-sub');
    var plateChars = [];
    var entered = false;
    var introDone = false;      // 开场淡入结束后，滚轮才接管薄雾亮度

    function revealPlate() {
        gsap.fromTo(plateChars,
            { opacity: 0, filter: 'blur(10px)', y: 12 },
            { opacity: 1, filter: 'blur(0px)', y: 0, duration: .9, stagger: .08, ease: 'power2.out' });
        gsap.fromTo([plateDomain, plateSub],
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: .85, stagger: .14, delay: .4, ease: 'power2.out' });
    }

    function openGate() {
        if (entered) return;
        entered = true;
        document.documentElement.classList.remove('lock');
        ringEnter.style.pointerEvents = 'none';
        gsap.killTweensOf(ringWrap);        // 停掉呼吸，免得和出场抢同一个属性

        var FROST = 'blur(22px) saturate(.78) brightness(.94)';
        var CLEAR = 'blur(0px) saturate(1) brightness(1)';

        /* 雾层待命：不透明度恒为 1，只动 backdrop-filter 和底色，
           这样不会出现"半透明模糊图 + 清晰图"叠在一起的重影 */
        gsap.set(mist, {
            display: 'block', opacity: 1,
            backdropFilter: CLEAR, webkitBackdropFilter: CLEAR,
            backgroundColor: 'rgba(15, 41, 95, 0)'
        });

        /* 出场：环缩掉 → 环那屏淡出（同时整屏开始起雾）→ 停一下 → 雾散 → 门牌从雾里浮出来。
           这里**不再用那圈黑色圆形遮罩**：它扩散得比流星还快，会把正在飞的流星一刀切掉。
           改成纯柔焦，流星是"化开"而不是"被盖住"。 */
        var tl = gsap.timeline();
        tl.to(ringWrap, { scale: .45, opacity: 0, duration: .42, ease: 'power2.in' });
        tl.to(gate, { opacity: 0, duration: .6, ease: 'power2.inOut' }, '-=.15');
        tl.to(mist, {
            backdropFilter: FROST,
            webkitBackdropFilter: FROST,
            backgroundColor: 'rgba(15, 41, 95, .42)',
            duration: .75, ease: 'power2.inOut'
        }, '<');
        tl.set(gate, { display: 'none' });
        tl.to({}, { duration: .15 });
        tl.to(mist, {
            backdropFilter: CLEAR,
            webkitBackdropFilter: CLEAR,
            backgroundColor: 'rgba(15, 41, 95, 0)',
            duration: 1.7, ease: 'power2.inOut'
        });
        tl.set(mist, { display: 'none' });
        tl.call(revealPlate, null, '-=1.4');
        tl.call(function () { introDone = true; });
    }

    function skipGate() {
        entered = true;
        introDone = true;
        document.documentElement.classList.remove('lock');
        gate.style.display = 'none';
        wipe.style.display = 'none';
        mist.style.display = 'none';
        veil.style.opacity = '0.95';
        gsap.set(plateChars, { opacity: 1, filter: 'blur(0px)', y: 0 });
        gsap.set([plateDomain, plateSub], { opacity: 1, y: 0 });
    }

    function runGate() {
        /* 完全照星空站那份：呼吸曲线 + 环/停顿/字样淡入 + 之后的循环呼吸 */
        var breatheEase = 'M0,0 C0.15,0 0.35,0.55 0.6,0.9 C0.8,1.15 0.9,1 1,1';
        gsap.timeline({ onComplete: function () { ringEnter.classList.add('ready'); } })
            .to(ringFill, { strokeDashoffset: 0, duration: 2.2, ease: breatheEase })
            .to(ringWrap, { scale: 1.05, duration: 1.1, ease: 'sine.inOut' }, '-=1.3')
            .to(ringWrap, { scale: 1.0, duration: 1.1, ease: 'sine.inOut' }, '-=0.55')
            .to(ringEnter, { opacity: 1, duration: 0.65, ease: 'power3.out' }, '-=0.3');

        gsap.to(ringWrap, {
            scale: 1.04, duration: 2.0, yoyo: true, repeat: -1,
            ease: 'sine.inOut', delay: 2.3
        });

        ringEnter.addEventListener('click', openGate);
        gate.addEventListener('click', function (e) {
            /* 点空白也能进屋，但要等环走完，免得一进来就被误触 */
            if (!ringEnter.classList.contains('ready')) return;
            if (e.target === gate) openGate();
        });
    }

    /* ================= 两扇门：推门进星空 ================= */
    function bindDoor() {
        var doorStar = $('#door-star');
        if (!doorStar) return;

        doorStar.addEventListener('click', function (e) {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            if (reduce) return;                       // 减少动效偏好 → 直接跳
            e.preventDefault();
            var href = doorStar.getAttribute('href');
            gsap.set(wipe, { display: 'block', opacity: 1, clipPath: 'circle(0% at 50% 50%)', webkitClipPath: 'circle(0% at 50% 50%)' });
            gsap.to(wipe, {
                clipPath: 'circle(150% at 50% 50%)',
                webkitClipPath: 'circle(150% at 50% 50%)',
                duration: 1.05, ease: 'power3.inOut',
                onComplete: function () { window.location.href = href; }
            });
        });
    }

    /* ================= 启动 ================= */
    function init() {
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.scrollTo(0, 0);

        /* 拆字 */
        $$('.split').forEach(function (el) {
            var chars = splitChars(el);
            chars.forEach(function (c, i) {
                c.style.transitionDelay = (i * 0.055).toFixed(3) + 's';
            });
        });
        plateChars = splitChars(plateTitle);
        /* 门牌下方的字先藏好：开场那层是半透明的，不能让它露在环后面 */
        gsap.set([plateDomain, plateSub], { opacity: 0 });

        buildRail();
        buildObservers();
        bindDoor();
        resizeCanvas();
        startSky();

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function () {
            clearTimeout(window.__rz);
            window.__rz = setTimeout(function () {
                resizeCanvas();
                updateScroll();
            }, 150);
        });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) stopSky(); else startSky();
        });

        updateScroll();

        if (reduce) skipGate(); else runGate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
