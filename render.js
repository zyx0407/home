/* 把 site-data.js 的内容摆到页面上（主页 / 作品清单 / 详情页共用）
   职责只有一件：数据 → DOM。哪个元素在就填哪个，不在就跳过。
   标题里 `[[文字]]` = 带琥珀色下划线的部分，`\n` = 换行。 */
(function () {
  var S = window.SITE || {};

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function headline(t) {
    return esc(t).replace(/\[\[([^\]]+)\]\]/g, '<em>$1</em>').replace(/\n/g, '<br>');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function workHTML(w, i) {
    w = w || {};
    var tags = (w.tags || []).filter(function (t) { return t; }).map(function (t) {
      return '<span class="chip">' + esc(t) + '</span>';
    }).join('');
    var slot = (w.link && w.linkLabel)
      ? '<a href="' + esc(w.link) + '" target="_blank" rel="noopener">' + esc(w.linkLabel) + '</a>'
      : esc(w.year || '');
    return '' +
      '<article class="item rv" data-work="' + i + '">' +
        '<div class="no">' + pad(i + 1) + '</div>' +
        '<div>' +
          '<h2 data-work-title="' + i + '">' +
            (w.slug ? '<a href="' + encodeURIComponent(w.slug) + '/">' + esc(w.title) + '</a>' : esc(w.title)) +
          '</h2>' +
          '<p class="note" data-work-note="' + i + '">' + esc(w.note) + '</p>' +
          (tags ? '<p class="tags">' + tags + '</p>' : '') +
        '</div>' +
        '<div class="year" data-work-year="' + i + '">' + slot + '</div>' +
      '</article>';
  }

  function render() {
    S = window.SITE || {};
    var who = S.who || {};
    var home = S.home || {};
    var f = S.footer || {};
    var q = function (sel) { return document.querySelector(sel); };
    var el;

    /* 顶栏 */
    if ((el = q('.who b'))) el.textContent = who.name || '';
    if ((el = q('.who span'))) el.textContent = who.handle || '';
    if ((el = q('.gh'))) { el.href = who.github || '#'; el.textContent = who.githubLabel || 'GitHub ↗'; }

    /* 首屏（标了 data-home 的取 home.*，否则取顶层那套） */
    if ((el = q('.kicker'))) {
      el.textContent = el.hasAttribute('data-home') ? (home.kicker || '') : (S.kicker || '');
    }
    // h1 只在该元素自己标了 data-headline 时才由数据填 —— 副页标题是页面自己写的，别覆盖
    if ((el = q('h1[data-headline]'))) el.innerHTML = headline(S.headline || '');
    if ((el = q('.hero .sub'))) el.textContent = S.sub || '';

    /* 主页的「关于我 / 联络 / 作品入口」 */
    if ((el = q('#aboutTitle'))) el.textContent = home.aboutTitle || '';
    if ((el = q('#aboutBody'))) {
      el.innerHTML = (home.about || []).map(function (p, i) {
        return '<p class="lede" data-about="' + i + '">' + esc(p).replace(/\n/g, '<br>') + '</p>';
      }).join('');
    }
    if ((el = q('#mailBody'))) {
      el.innerHTML = home.mailText ? '<p class="lede" data-mail="1">' + esc(home.mailText) + '</p>' : '';
    }
    if ((el = q('#contactTitle'))) el.textContent = home.contactTitle || '';
    if ((el = q('#contactList'))) {
      el.innerHTML = (home.contact || []).map(function (c, i) {
        if (!c || !c.label) return '';
        return c.href
          ? '<a data-contact="' + i + '" href="' + esc(c.href) + '" target="_blank" rel="noopener">' + esc(c.label) + '</a>'
          : '<span class="tbd" data-contact="' + i + '">' + esc(c.label) + '</span>';
      }).join('');
    }
    if ((el = q('#navWork'))) {
      var wl = home.workLink || {};
      el.href = wl.href || 'work/';
      el.textContent = wl.label || '作品';
    }

    /* 作品清单 */
    var works = (S.works || []);
    if ((el = q('.list-label'))) el.textContent = S.listLabel || '';
    if ((el = q('.list-range'))) el.textContent = works.length ? ('01 — ' + pad(works.length)) : '';
    if ((el = q('#works'))) {
      el.innerHTML = works.length
        ? works.map(workHTML).join('')
        : '<p class="empty">小鱼：清单还在整理中 —— 可以在编辑模式（?edit=1）里加作品。</p>';
    }

    /* 页脚 */
    if ((el = q('.copy'))) el.textContent = f.copy || '';
    if ((el = q('.site-link'))) { el.href = f.siteUrl || '#'; el.textContent = f.site || ''; }

    document.documentElement.setAttribute('data-rendered', String(works.length));
  }

  window.__render = render;
  render();
})();
