/* 小鱼的声音卡 · 首页个人栏下方（2026-11-07）
 * 点「听小鱼说」才播，不自动播；播放时有进度条，念完自动复位。
 * 依赖同目录 assets/audio/xiaoyu-greeting.mp3（7.4 秒）
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var card = document.getElementById('xyVoiceCard');
    var audio = document.getElementById('xyVoiceAudio');
    var btn = document.getElementById('xyVoicePlay');
    var title = document.getElementById('xyVoiceTitle');
    var sub = document.getElementById('xyVoiceSub');
    var bar = document.getElementById('xyVoiceBar');
    if (!card || !audio || !btn || !title || !sub || !bar) return;

    var icon = btn.querySelector('.xyicon');
    var label = btn.querySelector('.xylabel');
    var IDLE_TITLE = '小鱼有一句话想跟你说～';
    var IDLE_SUB = '';

    function setIcon(t) { if (icon) icon.textContent = t; }
    function setLabel(t) { if (label) label.textContent = t; }

    function reset() {
      card.classList.remove('playing');
      title.textContent = IDLE_TITLE;
      sub.textContent = IDLE_SUB;
      setIcon('\u25B6');
      setLabel('听小鱼说');
      bar.style.width = '0%';
      try { audio.currentTime = 0; } catch (e) { /* ignore */ }
    }

    btn.addEventListener('click', function () {
      if (!audio.paused) {
        audio.pause();
        return;
      }
      var p = audio.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {
          title.textContent = '声音没放出来。';
          sub.textContent = '回头我再修一下。';
          setIcon('\u25B6');
          setLabel('再试一次');
        });
      }
    });

    audio.addEventListener('play', function () {
      card.classList.add('playing');
      title.textContent = '小鱼正在说……';
      sub.textContent = '说完会自动停下。';
      setIcon('\u25A0');
      setLabel('停一下');
    });

    audio.addEventListener('timeupdate', function () {
      var d = audio.duration;
      if (d && isFinite(d)) {
        bar.style.width = Math.min(100, (audio.currentTime / d) * 100).toFixed(1) + '%';
      }
    });

    audio.addEventListener('ended', function () {
      card.classList.remove('playing');
      title.textContent = IDLE_TITLE;
      sub.textContent = '说完了。记得开心哦。';
      setIcon('\u25B6');
      setLabel('再听一遍');
      bar.style.width = '0%';
      try { audio.currentTime = 0; } catch (e) { /* ignore */ }
    });

    audio.addEventListener('pause', function () {
      if (audio.ended) return;
      card.classList.remove('playing');
      title.textContent = IDLE_TITLE;
      sub.textContent = '停在这儿，想听再点一次。';
      setIcon('\u25B6');
      setLabel('继续听');
    });

    reset();
  });
})();
