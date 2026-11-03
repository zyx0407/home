/* 侧栏「此刻」——纯前端、零依赖，只读本机时间 */
(function () {
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function weekOfYear(d) {
    var t = new Date(d.getTime());
    t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() + 3 - ((t.getDay() + 6) % 7));
    var first = new Date(t.getFullYear(), 0, 4);
    return 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7);
  }

  function dayOfYear(d) {
    var start = new Date(d.getFullYear(), 0, 1);
    return Math.floor((d - start) / 86400000) + 1;
  }

  function draw() {
    var d = new Date();
    var days = (d.getFullYear() % 4 === 0 && d.getFullYear() % 100 !== 0) || d.getFullYear() % 400 === 0 ? 366 : 365;
    var week = weekOfYear(d);
    var pct = Math.round(dayOfYear(d) / days * 100);

    var t = document.getElementById('nowTime');
    var dt = document.getElementById('nowDate');
    var wk = document.getElementById('barWeek');
    var yp = document.getElementById('barYear');

    if (t) t.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    if (dt) {
      var wkName = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      dt.textContent = d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · 星期' + wkName;
    }
    if (wk) wk.style.setProperty('--p', Math.round(week / 52 * 100) + '%');
    if (yp) yp.style.setProperty('--p', pct + '%');

    var wl = document.getElementById('nowWeek');
    var yl = document.getElementById('nowYear');
    if (wl) wl.textContent = '第 ' + week + ' 周 / 52';
    if (yl) yl.textContent = '今年已过 ' + pct + '%';
  }

  draw();
  setInterval(draw, 1000);
})();
