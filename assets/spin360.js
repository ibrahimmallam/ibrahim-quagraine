/* Drag-to-rotate viewer for a pre-rendered 360-degree image sequence.
   Markup: <div class="spin" data-src="path/line-{i}.webp" data-src-sm="path/sm/line-{i}.webp" data-n="72" tabindex="0" role="img" aria-label="..."><img src="path/line-00.webp" alt=""></div>
   Frames load once the viewer scrolls into view. It turns slowly until someone drags, then resumes after a pause.
   Arrow keys step through frames. Reduced-motion users get no auto-turn. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pad(i) { return i < 10 ? '0' + i : '' + i; }
  function init(el) {
    var n = +el.dataset.n || 72;
    var small = window.innerWidth < 700 && el.dataset.srcSm;
    var tpl = small ? el.dataset.srcSm : el.dataset.src;
    var img = el.querySelector('img');
    var frames = new Array(n), loaded = 0, cur = 0, pos = 0, vel = 0;
    var dragging = false, lastX = 0, lastT = 0, idleUntil = 0, raf = 0, visible = false;
    function src(i) { return tpl.replace('{i}', pad(i)); }
    function show(i) {
      i = ((i % n) + n) % n;
      if (i === cur && img.dataset.f) return;
      var f = frames[i];
      if (f && f.complete && f.naturalWidth) { img.src = f.src; img.dataset.f = 1; cur = i; }
    }
    function load() {
      for (var k = 0; k < n; k++) {
        var j = (k % 2 === 0) ? k / 2 : n - (k + 1) / 2;   // load outward from the first frame both ways
        j = Math.round(j) % n;
        if (frames[j]) continue;
        var im = new Image(); im.decoding = 'async';
        im.onload = function () { loaded++; if (loaded === n) el.classList.add('is-ready'); };
        im.src = src(j); frames[j] = im;
      }
    }
    function tick(t) {
      raf = 0;
      if (!visible) return;
      if (!dragging) {
        if (Math.abs(vel) > 0.02) { pos += vel; vel *= 0.94; }
        else if (!reduce && t > idleUntil) pos += 0.12;      // about 3 frames a second
      }
      show(Math.round(pos));
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf) raf = requestAnimationFrame(tick); }
    var per = function () { return Math.max(4, el.clientWidth / (n * 0.9)); };  // pixels per frame
    el.addEventListener('pointerdown', function (e) {
      dragging = true; lastX = e.clientX; lastT = e.timeStamp; vel = 0;
      el.setPointerCapture(e.pointerId); el.classList.add('is-drag');
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dt = Math.max(1, e.timeStamp - lastT);
      pos -= dx / per(); vel = -dx / per() * Math.min(1, 16 / dt);
      lastX = e.clientX; lastT = e.timeStamp;
    });
    function end() { if (!dragging) return; dragging = false; idleUntil = performance.now() + 4000; el.classList.remove('is-drag'); }
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault(); vel = 0; pos += e.key === 'ArrowRight' ? 1 : -1; idleUntil = performance.now() + 6000; show(Math.round(pos));
      }
    });
    el.addEventListener('spin:reset', function () { vel = 0; pos = 0; idleUntil = performance.now() + 4000; show(0); });
    el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    var io = new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { load(); start(); }
    }, { rootMargin: '200px' });
    io.observe(el);
  }
  function boot() { document.querySelectorAll('.spin[data-src]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
