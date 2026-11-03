/* 联络圆钮：微信 / 抖音 / 邮箱 都是「点一下复制」，只是提示语不同；GitHub 是链接（2026-11-04） */
(function () {
  var tip = null, timer = 0;

  function toast(msg) {
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'toast';
      document.body.appendChild(tip);
    }
    tip.textContent = msg;
    tip.classList.add('on');
    clearTimeout(timer);
    timer = setTimeout(function () { tip.classList.remove('on'); }, 1800);
  }

  function copy(text, label) {
    var ok = function () { toast(label + '已复制：' + text); };
    var fail = function () { toast(label + '：' + text); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(ok, fail);
    } else {
      fail();
    }
  }

  /* 邮箱地址不写进 HTML，运行时拼 */
  function mail() {
    return ['aj', 'zyx0407'].join('.') + '@' + ['qq', 'com'].join('.');
  }

  function bind(el) {
    el.addEventListener('click', function (e) {
      var label = el.getAttribute('data-label') || '内容';
      if (el.hasAttribute('data-copy-mail')) {
        e.preventDefault();
        copy(mail(), label);
        return;
      }
      var v = el.getAttribute('data-copy');
      if (v) {
        e.preventDefault();
        copy(v, label);
      }
    });
  }

  function start() {
    [].forEach.call(document.querySelectorAll('[data-copy],[data-copy-mail]'), bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
