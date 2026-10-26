(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var staticMode = /[?&]static/.test(location.search);
  var NS = 'http://www.w3.org/2000/svg';

  requestAnimationFrame(function () { document.querySelector('.hero').classList.add('is-loaded'); });

  var top = document.querySelector('.top');
  var onScroll = function () { top.classList.toggle('is-scrolled', window.scrollY > 20); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var clock = document.getElementById('clock');
  var tick = function () {
    try { clock.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(new Date()); } catch (e) {}
  };
  tick(); setInterval(tick, 15000);

  function countUp(el) {
    var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || '0', 10);
    var pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce || staticMode) return;
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / 1300), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (to * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var sel = '.sec-head, .film, .b, .steps li, .gaze, .papers-head, .paper, .g, .also, .about__copy, .mail, .links';
  if (!staticMode && 'IntersectionObserver' in window) {
    var els = document.querySelectorAll(sel);
    els.forEach(function (el) { el.classList.add('rv'); });
    ['.b', '.paper', '.steps li', '.g'].forEach(function (s) {
      document.querySelectorAll(s).forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; });
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        var n = e.target.querySelector('.n'); if (n) countUp(n);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
    els.forEach(function (el) { io.observe(el); });

    var links = [].slice.call(document.querySelectorAll('.nav a'));
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  /* subtle hero parallax */
  var vis = document.querySelector('.hero__visual');
  if (vis && !reduce) {
    window.addEventListener('scroll', function () {
      var y = Math.min(window.scrollY, 700);
      vis.style.transform = 'translateY(' + (y * 0.08).toFixed(1) + 'px)';
    }, { passive: true });
  }

  /* paper filter */
  var fbtn = document.querySelectorAll('.f');
  fbtn.forEach(function (b) {
    b.addEventListener('click', function () {
      fbtn.forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var f = b.dataset.f;
      document.querySelectorAll('.paper').forEach(function (p) { p.classList.toggle('is-out', f !== 'all' && p.dataset.t !== f); });
    });
  });

  /* lightbox for renders */
  var lb = document.getElementById('lightbox');
  if (lb && lb.showModal) {
    var img = lb.querySelector('img');
    document.querySelectorAll('.b--render').forEach(function (r) {
      r.addEventListener('click', function () { img.src = r.dataset.full; img.alt = r.querySelector('img').alt; lb.showModal(); });
    });
    lb.addEventListener('click', function () { lb.close(); });
  }

  /* gaze path during a visual search */
  var gz = document.getElementById('gaze');
  if (gz) {
    var cols = 9, rows = 4, items = [], target = 22;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var i = r * cols + c;
      var x = 80 + c * 105 + ((r % 2) ? 26 : 0) + Math.sin(i * 7.3) * 14;
      var y = 60 + r * 86 + Math.cos(i * 3.1) * 12;
      items.push([x, y]);
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', y);
      t.setAttribute('class', 'stim' + (i === target ? ' target' : ''));
      t.textContent = i === target ? 'T' : 'L';
      t.setAttribute('transform', 'rotate(' + ((i * 37) % 4) * 90 + ' ' + x + ' ' + y + ')');
      gz.appendChild(t);
    }
    var path = [4, 12, 2, 19, 27, 15, 31, 24, 22];
    var gS = document.createElementNS(NS, 'g'), gF = document.createElementNS(NS, 'g');
    gz.appendChild(gS); gz.appendChild(gF);
    var eye = document.createElementNS(NS, 'circle'); eye.setAttribute('r', 6); eye.setAttribute('class', 'eye'); gz.appendChild(eye);
    var pt = function (k) { var p = items[path[k]]; return [p[0] + (k % 2 ? 9 : -7), p[1] + (k % 3 ? -6 : 8)]; };
    var rad = function (k) { return 10 + (k * 7) % 14 + (k === path.length - 1 ? 12 : 0); };
    var mk = function (tag, cls, at) { var e = document.createElementNS(NS, tag); e.setAttribute('class', cls); for (var a in at) e.setAttribute(a, at[a]); return e; };
    function drawAll() {
      for (var k = 0; k < path.length; k++) {
        var p = pt(k);
        if (k) { var q = pt(k - 1); gS.appendChild(mk('line', 'sac', { x1: q[0], y1: q[1], x2: p[0], y2: p[1] })); }
        gF.appendChild(mk('circle', 'fix', { cx: p[0], cy: p[1], r: rad(k) }));
      }
      var e = pt(path.length - 1); eye.setAttribute('cx', e[0]); eye.setAttribute('cy', e[1]);
    }
    function run() {
      gS.textContent = ''; gF.textContent = '';
      var k = 0, s = pt(0); eye.setAttribute('cx', s[0]); eye.setAttribute('cy', s[1]);
      function fixate() {
        var p = pt(k), f = mk('circle', 'fix', { cx: p[0], cy: p[1], r: 2 }); gF.appendChild(f);
        var R = rad(k), t0 = null, dwell = 380 + (k * 97) % 300 + (k === path.length - 1 ? 700 : 0);
        (function grow(t) { if (!t0) t0 = t; var pr = Math.min(1, (t - t0) / dwell); f.setAttribute('r', 2 + (R - 2) * pr); if (pr < 1) requestAnimationFrame(grow); else next(); })(performance.now());
      }
      function next() {
        k++;
        if (k >= path.length) { setTimeout(run, 2600); return; }
        var a = pt(k - 1), b = pt(k), l = mk('line', 'sac', { x1: a[0], y1: a[1], x2: a[0], y2: a[1] }); gS.appendChild(l);
        var t0 = null;
        (function move(t) { if (!t0) t0 = t; var pr = Math.min(1, (t - t0) / 120); var x = a[0] + (b[0] - a[0]) * pr, y = a[1] + (b[1] - a[1]) * pr; l.setAttribute('x2', x); l.setAttribute('y2', y); eye.setAttribute('cx', x); eye.setAttribute('cy', y); if (pr < 1) requestAnimationFrame(move); else fixate(); })(performance.now());
      }
      fixate();
    }
    if (reduce || staticMode || !('IntersectionObserver' in window)) drawAll();
    else {
      var started = false;
      new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting && !started) { started = true; run(); ob.disconnect(); } }, { threshold: 0.3 }).observe(gz);
    }
  }
})();
