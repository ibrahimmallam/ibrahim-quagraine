(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var staticMode = /[?&]static/.test(location.search);
  var NS = 'http://www.w3.org/2000/svg';

  /* header state */
  var top = document.querySelector('.top');
  var onScroll = function () { top.classList.toggle('is-scrolled', window.scrollY > 30); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  /* Cleveland clock */
  var clock = document.getElementById('clock');
  var tick = function () {
    try { clock.textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).format(new Date()); } catch (e) {}
  };
  tick(); setInterval(tick, 15000);

  /* stroke lengths for draw-on drawings */
  document.querySelectorAll('.draw path, .draw circle, .draw rect').forEach(function (el) {
    try { el.style.setProperty('--len', Math.ceil(el.getTotalLength()) + 1); } catch (e) {}
  });

  /* reveal + draw + counters */
  var revealSel = '.head, .process, .tile, .band__text, .band__video, .render, .strip figure, .tl li, .gaze, .theme, .pubs li, .award, .chips, .journey, .about__photo, .about__text, .contact__t, .contact__mail, .num';
  var drawSel = '.process, .theme, .journey, .hero__art';
  var counters = document.querySelectorAll('.num__n');

  function countUp(el) {
    var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || '0', 10);
    var pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    if (reduce || staticMode) return;
    var t0 = null, dur = 1400;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (to * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step); else el.textContent = pre + to.toFixed(dec) + suf;
    }
    requestAnimationFrame(step);
  }

  if (staticMode || !('IntersectionObserver' in window)) {
    document.querySelectorAll(drawSel).forEach(function (el) { el.classList.add('is-drawn'); });
  } else {
    document.querySelectorAll(revealSel).forEach(function (el) { el.classList.add('rv'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('is-in');
        if (el.matches(drawSel)) el.classList.add('is-drawn');
        var n = el.querySelector && el.querySelector('.num__n');
        if (n) countUp(n);
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    document.querySelectorAll(revealSel + ',' + drawSel).forEach(function (el) { io.observe(el); });
    // stagger siblings
    ['.render', '.strip figure', '.tl li', '.theme', '.pubs li', '.award', '.num'].forEach(function (s) {
      document.querySelectorAll(s).forEach(function (el, i) { el.style.transitionDelay = (i % 6) * 80 + 'ms'; });
    });
  }

  /* active nav */
  if ('IntersectionObserver' in window) {
    var links = [].slice.call(document.querySelectorAll('.nav a[href^="#"]'));
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  /* photo strip arrows */
  var strip = document.querySelector('.strip');
  document.querySelectorAll('.sbtn').forEach(function (b) {
    b.addEventListener('click', function () { strip.scrollBy({ left: parseInt(b.dataset.dir, 10) * strip.clientWidth * 0.7, behavior: reduce ? 'auto' : 'smooth' }); });
  });

  /* lightbox for renders */
  var lb = document.getElementById('lightbox');
  if (lb && lb.showModal) {
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('.render').forEach(function (r) {
      r.addEventListener('click', function () { lbImg.src = r.dataset.full; lbImg.alt = r.querySelector('img').alt; lb.showModal(); });
    });
    lb.addEventListener('click', function () { lb.close(); });
  }

  /* K2CO3 ball-and-stick model, rotatable */
  var mol = document.getElementById('molecule');
  if (mol) {
    var atoms = [
      { e: 'C', p: [0, 0, 0], r: 15, c: '#2B2F2D' },
      { e: 'O', p: [0, -1.25, 0], r: 18, c: '#C0492B' },
      { e: 'O', p: [1.08, 0.62, 0], r: 18, c: '#C0492B' },
      { e: 'O', p: [-1.08, 0.62, 0], r: 18, c: '#C0492B' },
      { e: 'K', p: [2.25, -1.0, 0.9], r: 24, c: '#7C5BB5' },
      { e: 'K', p: [-2.25, -1.0, -0.9], r: 24, c: '#7C5BB5' }
    ];
    var bonds = [[0, 1, 'bond'], [0, 2, 'bond'], [0, 3, 'bond'], [4, 1, 'ionic'], [4, 2, 'ionic'], [5, 1, 'ionic'], [5, 3, 'ionic']];
    var S = 52, ax = -0.5, ay = 0.4, dragging = false, lx = 0, ly = 0, vy = reduce ? 0 : 0.006;
    var bondEls = bonds.map(function (b) { var l = document.createElementNS(NS, 'line'); l.setAttribute('class', b[2]); mol.appendChild(l); return l; });
    var atomEls = atoms.map(function (a) {
      var g = document.createElementNS(NS, 'g');
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', a.r); c.setAttribute('fill', a.c);
      var h = document.createElementNS(NS, 'circle'); h.setAttribute('r', a.r * 0.38); h.setAttribute('cx', -a.r * 0.32); h.setAttribute('cy', -a.r * 0.32); h.setAttribute('fill', 'rgba(255,255,255,.28)');
      var t = document.createElementNS(NS, 'text'); t.textContent = a.e;
      g.appendChild(c); g.appendChild(h); g.appendChild(t); mol.appendChild(g); return g;
    });
    function proj(p) {
      var x = p[0], y = p[1], z = p[2];
      var x1 = x * Math.cos(ay) + z * Math.sin(ay), z1 = -x * Math.sin(ay) + z * Math.cos(ay);
      var y2 = y * Math.cos(ax) - z1 * Math.sin(ax), z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
      var k = 1 / (1 + z2 * 0.12);
      return [x1 * S * k, y2 * S * k, z2, k];
    }
    function render() {
      var P = atoms.map(function (a) { return proj(a.p); });
      bonds.forEach(function (b, i) { var A = P[b[0]], B = P[b[1]]; var l = bondEls[i]; l.setAttribute('x1', A[0]); l.setAttribute('y1', A[1]); l.setAttribute('x2', B[0]); l.setAttribute('y2', B[1]); });
      var order = P.map(function (p, i) { return [p[2], i]; }).sort(function (a, b) { return b[0] - a[0]; });
      order.forEach(function (o) { var i = o[1], g = atomEls[i]; g.setAttribute('transform', 'translate(' + P[i][0].toFixed(1) + ',' + P[i][1].toFixed(1) + ') scale(' + P[i][3].toFixed(3) + ')'); mol.appendChild(g); });
    }
    function loop() { if (!dragging) ay += vy; render(); requestAnimationFrame(loop); }
    mol.addEventListener('pointerdown', function (e) { dragging = true; lx = e.clientX; ly = e.clientY; mol.setPointerCapture(e.pointerId); });
    mol.addEventListener('pointermove', function (e) { if (!dragging) return; ay += (e.clientX - lx) * 0.01; ax += (e.clientY - ly) * 0.01; lx = e.clientX; ly = e.clientY; });
    mol.addEventListener('pointerup', function () { dragging = false; });
    render(); if (!staticMode) requestAnimationFrame(loop);
  }

  /* gaze path: visual search drawing */
  var gz = document.getElementById('gaze');
  if (gz) {
    var cols = 9, rows = 4, items = [], target = 22;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var i = r * cols + c;
      var x = 80 + c * 105 + ((r % 2) ? 26 : 0) + (Math.sin(i * 7.3) * 14);
      var y = 70 + r * 88 + (Math.cos(i * 3.1) * 12);
      items.push([x, y]);
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', y);
      t.setAttribute('class', 'stim' + (i === target ? ' target' : ''));
      t.textContent = i === target ? 'T' : 'L';
      t.setAttribute('transform', 'rotate(' + ((i * 37) % 4) * 90 + ' ' + x + ' ' + y + ')');
      gz.appendChild(t);
    }
    var path = [4, 12, 2, 19, 27, 15, 31, 24, 22];
    var gSac = document.createElementNS(NS, 'g'), gFix = document.createElementNS(NS, 'g');
    gz.appendChild(gSac); gz.appendChild(gFix);
    var eye = document.createElementNS(NS, 'circle'); eye.setAttribute('r', 7); eye.setAttribute('class', 'eye'); gz.appendChild(eye);
    function pt(k) { var p = items[path[k]]; return [p[0] + (k % 2 ? 9 : -7), p[1] + (k % 3 ? -6 : 8)]; }
    function drawAll() {
      for (var k = 0; k < path.length; k++) {
        var p = pt(k);
        if (k > 0) { var q = pt(k - 1); var l = document.createElementNS(NS, 'line'); l.setAttribute('class', 'sac'); l.setAttribute('x1', q[0]); l.setAttribute('y1', q[1]); l.setAttribute('x2', p[0]); l.setAttribute('y2', p[1]); gSac.appendChild(l); }
        var f = document.createElementNS(NS, 'circle'); f.setAttribute('class', 'fix'); f.setAttribute('cx', p[0]); f.setAttribute('cy', p[1]); f.setAttribute('r', 10 + (k * 7) % 14 + (k === path.length - 1 ? 10 : 0)); gFix.appendChild(f);
      }
      var e = pt(path.length - 1); eye.setAttribute('cx', e[0]); eye.setAttribute('cy', e[1]);
    }
    function animate() {
      gSac.textContent = ''; gFix.textContent = '';
      var k = 0, p0 = pt(0); eye.setAttribute('cx', p0[0]); eye.setAttribute('cy', p0[1]);
      function fixate() {
        var p = pt(k);
        var f = document.createElementNS(NS, 'circle'); f.setAttribute('class', 'fix'); f.setAttribute('cx', p[0]); f.setAttribute('cy', p[1]); f.setAttribute('r', 2); gFix.appendChild(f);
        var R = 10 + (k * 7) % 14 + (k === path.length - 1 ? 10 : 0), t0 = null, dwell = 380 + (k * 97) % 300 + (k === path.length - 1 ? 600 : 0);
        function grow(t) { if (!t0) t0 = t; var pr = Math.min(1, (t - t0) / dwell); f.setAttribute('r', 2 + (R - 2) * pr); if (pr < 1) requestAnimationFrame(grow); else next(); }
        requestAnimationFrame(grow);
      }
      function next() {
        k++;
        if (k >= path.length) { setTimeout(animate, 2600); return; }
        var a = pt(k - 1), b = pt(k), l = document.createElementNS(NS, 'line'); l.setAttribute('class', 'sac'); l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', a[0]); l.setAttribute('y2', a[1]); gSac.appendChild(l);
        var t0 = null, dur = 120;
        function move(t) { if (!t0) t0 = t; var pr = Math.min(1, (t - t0) / dur); var x = a[0] + (b[0] - a[0]) * pr, y = a[1] + (b[1] - a[1]) * pr; l.setAttribute('x2', x); l.setAttribute('y2', y); eye.setAttribute('cx', x); eye.setAttribute('cy', y); if (pr < 1) requestAnimationFrame(move); else fixate(); }
        requestAnimationFrame(move);
      }
      fixate();
    }
    if (reduce || staticMode || !('IntersectionObserver' in window)) drawAll();
    else {
      var started = false;
      new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting && !started) { started = true; animate(); ob.disconnect(); } }, { threshold: 0.3 }).observe(gz);
    }
  }
})();
