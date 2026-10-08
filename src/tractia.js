/* TRACTIA | landing
   GSAP + ScrollTrigger + SplitText + Lenis por CDN, sem build.
   Sem GSAP, ou com "menos movimento" ligado, a pagina abre completa (showAll). */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var NS = 'http://www.w3.org/2000/svg';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var hasSplit = typeof window.SplitText !== 'undefined';

  var nav = $('#nav');
  var lenis = null;

  try { history.scrollRestoration = 'manual'; } catch (e) {}

  /* ------------------------------------------------------------------
     Ancoras: deslizam com o Lenis (ou nativo)
     ------------------------------------------------------------------ */
  function goTo(id) {
    var target = id === '#topo' ? 0 : $(id);
    if (target === null) { return; }
    if (lenis) {
      lenis.scrollTo(target, { offset: 0, duration: 1.8, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) { return; }
      if (id !== '#topo' && !$(id)) { return; }
      e.preventDefault();
      goTo(id);
      try { history.replaceState(null, '', id); } catch (err) {}
    });
  });

  /* ------------------------------------------------------------------
     Botoes: duplica o texto (rolagem) e a seta (troca na diagonal); o efeito em si e CSS
     ------------------------------------------------------------------ */
  function enhanceButtons() {
    $$('.btn').forEach(function (b) {
      if (b.__done) { return; }
      b.__done = true;
      Array.prototype.slice.call(b.childNodes).forEach(function (n) {
        if (n.nodeType === 3 && n.textContent.trim()) {
          var label = n.textContent.trim();
          var t = document.createElement('span'); t.className = 'btn__t';
          var a = document.createElement('span'); a.className = 'btn__t1'; a.textContent = label;
          var c = document.createElement('span'); c.className = 'btn__t2'; c.textContent = label; c.setAttribute('aria-hidden', 'true');
          t.appendChild(a); t.appendChild(c);
          b.replaceChild(t, n);
        }
      });
      var ico = $('.btn__i svg', b);
      if (ico) { var k = ico.cloneNode(true); k.setAttribute('aria-hidden', 'true'); ico.parentNode.appendChild(k); }
    });
    $$('.btn-round').forEach(function (r) {
      var s = $('svg', r);
      if (s && !r.__done) { r.__done = true; var k = s.cloneNode(true); k.setAttribute('aria-hidden', 'true'); r.appendChild(k); }
    });
  }
  enhanceButtons();

  /* ------------------------------------------------------------------
     Desenhos que nascem de dados (funcionam sem GSAP)
     ------------------------------------------------------------------ */
  function el(name, attrs) {
    var n = document.createElementNS(NS, name);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }

  /* grafico da secao "espaco entre tecnologia e resultado": curva suave por 7 pontos */
  var VH = 360;
  var H = [0.07, 0.14, 0.23, 0.36, 0.53, 0.74, 0.96];
  var chart = { pts: [], len: 0, line: null, clip: null, tip: null, cols: [] };
  function curve(P) {
    var d = 'M' + P[0][0] + ' ' + P[0][1];
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, P.length - 1)];
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
           ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
           ' ' + p2[0] + ' ' + p2[1];
    }
    return d;
  }
  function buildChartShape() {
    var line = $('.chart__line');
    if (!line) { return; }
    /* celular em pe: curva mais alta (a tela e estreita); desktop: tela deitada */
    VH = window.matchMedia('(max-width: 899px)').matches ? 560 : 360;
    var svg = $('.chart__svg');
    svg.setAttribute('viewBox', '0 0 1000 ' + VH);
    $('.chart__clip').setAttribute('height', VH + 60);
    var gd = ''; for (var k = 1; k <= 4; k++) { gd += 'M0 ' + Math.round(VH * k / 5) + 'H1000'; }
    $('.chart__grid path').setAttribute('d', gd);
    var pts = H.map(function (h, i) { return [Math.round((i + 0.5) / 7 * 1000), Math.round(VH - (24 + h * (VH - 52)))]; });
    var P = [[0, pts[0][1] + 16]].concat(pts, [[1000, pts[6][1] - 16]]);
    var d = curve(P);
    line.setAttribute('d', d);
    $('.chart__area').setAttribute('d', d + ' L1000 ' + VH + ' L0 ' + VH + ' Z');
    chart.pts = pts;
    chart.line = line;
    chart.len = line.getTotalLength();
    chart.clip = $('.chart__clip');
    chart.tip = $('.chart__tip');
    chart.cols = $$('.chart__c');
    chart.cols.forEach(function (c, i) { c.style.setProperty('--y', ((VH - pts[i][1]) / VH * 100).toFixed(2) + '%'); });
  }
  /* desenha o grafico ate a fracao p (0..1) do comprimento da curva */
  function renderChart(p) {
    if (!chart.line) { return; }
    chart.p = p;
    var pt = chart.line.getPointAtLength(chart.len * p);
    chart.line.style.strokeDashoffset = String(1 - p);
    chart.line.style.opacity = p < 0.003 ? '0' : '1';
    chart.clip.setAttribute('width', (pt.x + 2).toFixed(1));
    chart.tip.style.left = (pt.x / 10) + '%';
    chart.tip.style.top = (pt.y / VH * 100) + '%';
    chart.tip.style.opacity = p < 0.003 ? '0' : '1';
    chart.cols.forEach(function (c, i) { c.classList.toggle('on', pt.x >= chart.pts[i][0] - 8); });
    var kw = $$('.tr__t .k');
    if (kw[0]) { kw[0].classList.toggle('on', p > 0.02); }
    if (kw[1]) { kw[1].classList.toggle('on', p > 0.985); }
  }

  buildChartShape();
  (function () { var mq = window.matchMedia('(max-width: 899px)'); var f = function () { buildChartShape(); renderChart(chart.p || 0); }; if (mq.addEventListener) { mq.addEventListener('change', f); } })();

  /* ------------------------------------------------------------------
     Fundo da hero: imagem (aparece na hora) e, por cima, o video em loop que entra com fade quando pode tocar.
     Celular/rede economica: versao 720p; sem movimento reduzido; pausa quando a hero sai da tela.
     ------------------------------------------------------------------ */
  function initHeroVideo() {
    var v = $('.hero__video');
    if (!v) { return; }
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var conn = navigator.connection || {};
    if (reduce || conn.saveData) { return; }
    var small = window.matchMedia('(max-width: 899px)').matches || /2g/.test(conn.effectiveType || '');
    v.muted = true; v.defaultMuted = true; v.setAttribute('playsinline', '');
    v.addEventListener('canplay', function () { v.classList.add('is-on'); }, { once: true });
    v.src = (small && v.getAttribute('data-sd')) || v.getAttribute('data-hd');
    var p = v.play(); if (p && p.catch) { p.catch(function () { v.classList.remove('is-on'); }); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { var q = v.play(); if (q && q.catch) { q.catch(function () {}); } } else { v.pause(); }
      }).observe(v);
    }
    document.addEventListener('visibilitychange', function () { if (document.hidden) { v.pause(); } else if (v.classList.contains('is-on')) { var q = v.play(); if (q && q.catch) { q.catch(function () {}); } } });
  }
  initHeroVideo();

  /* ------------------------------------------------------------------
     Sem GSAP ou com movimento reduzido: tudo pronto
     ------------------------------------------------------------------ */
  function lightZones() {
    var on = false;
    ['.sol'].forEach(function (s) {
      var r = $(s).getBoundingClientRect();
      if (r.top <= 40 && r.bottom > 40) { on = true; }
    });
    nav.classList.toggle('on-light', on);
  }
  function basics() {
    root.classList.add('no-anim');
    renderChart(1);
    var onScroll = function () { nav.classList.toggle('is-solid', window.scrollY > 40); lightZones(); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  if (!hasGsap || reduce) { basics(); return; }

  /* ==================================================================
     Versao animada
     ================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  if (hasSplit) { gsap.registerPlugin(SplitText); }
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.defaults({ ease: 'power3.out' });

  if (typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  /* linhas com mascara que sobem; opts.now = ja, sem esperar a rolagem */
  function revealLines(el, opts) {
    opts = opts || {};
    gsap.set(el, { visibility: 'visible' });
    if (!hasSplit) {
      return gsap.from(el, {
        y: 30, autoAlpha: 0, duration: 1.1, delay: opts.delay || 0,
        scrollTrigger: opts.now ? null : { trigger: el, start: 'top 88%', once: true }
      });
    }
    var played = false;
    return SplitText.create(el, {
      type: 'lines', mask: 'lines', linesClass: 'ln', autoSplit: true,
      onSplit: function (self) {
        if (played) { return; }
        var cfg = { yPercent: 115, duration: 1.4, ease: 'expo.out', stagger: 0.1, delay: opts.delay || 0 };
        if (!opts.now) {
          cfg.scrollTrigger = { trigger: el, start: 'top 88%', once: true, onEnter: function () { played = true; } };
        } else { played = true; }
        return gsap.from(self.lines, cfg);
      }
    });
  }

  function fadeUp(els, opts) {
    opts = opts || {};
    return gsap.from(els, {
      y: opts.y || 36, autoAlpha: 0, duration: 1.1, stagger: opts.stagger || 0.12, delay: opts.delay || 0,
      scrollTrigger: opts.now ? null : { trigger: opts.trigger || els, start: 'top 88%', once: true }
    });
  }

  /* ---------- barra de navegacao ---------- */
  var navHidden = false;
  function buildChrome() {
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        nav.classList.toggle('is-solid', y > 40);
        var hide = navHidden;
        if (y > 360 && self.direction === 1) { hide = true; }
        else if (self.direction === -1 || y <= 360) { hide = false; }
        if (hide !== navHidden) {
          navHidden = hide;
          gsap.to(nav, { yPercent: hide ? -100 : 0, duration: .5, ease: 'power2.out', overwrite: 'auto' });
        }
      }
    });
  }

  /* o menu fica claro sobre as secoes claras; criado depois da tela fixa para contar o espaco dela */
  function buildNavTheme() {
    var zones = {};
    ['.sol'].forEach(function (s) {
      ScrollTrigger.create({
        trigger: s, start: 'top 40px', end: 'bottom 40px',
        onToggle: function (self) {
          zones[s] = self.isActive;
          nav.classList.toggle('on-light', !!(zones['.hero'] || zones['.sol']));
        }
      });
    });
    /* menu: destaca o link da secao atual */
    $$('.nav__links a').forEach(function (a) {
      var sec = $(a.getAttribute('href'));
      if (!sec) { return; }
      ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: function (s) { a.classList.toggle('is-current', s.isActive); } });
    });
  }

  /* ---------- hero ---------- */
  function buildHero() {
    gsap.from(nav, { y: -24, autoAlpha: 0, duration: 1, delay: .2 });

    /* texto: cada linha sobe de dentro da sua mascara */
    gsap.set('.hero__top, .hero__btns', { visibility: 'visible' });
    gsap.from('.hero__top', { y: 24, autoAlpha: 0, duration: 1.1, delay: .35 });
    gsap.from('.hero__t .hi', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: .12, delay: .45 });
    gsap.from('.hero__btns', { y: 28, autoAlpha: 0, duration: 1.1, delay: 1.2 });

    gsap.from('.hero__bg', { opacity: 0, duration: 1.8, ease: 'power2.out' });
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (en) { $('.hero').classList.toggle('is-off', !en[0].isIntersecting); }).observe($('.hero')); }

  }

  /* ---------- tracao: o grafico sobe com a rolagem, depois vira "tracao" ---------- */
  function buildTracao() {
    var section = $('.tr');
    var mm = gsap.matchMedia();

    renderChart(0);
    revealLines($('.tr__t'));

    mm.add('(min-width: 900px)', function () {
      var a = $('.tr__a'), fim = $('.tr__fim'), big = $('.tr__big'), txt = $('.tr__txt');
      var title = $('.tr__t'), device = $('.device');
      var proxy = { p: 0 };
      var grow = gsap.timeline();
      grow.to(proxy, { p: 1, duration: 6.2, ease: 'power1.inOut', onUpdate: function () { renderChart(proxy.p); } });

      /* "phone scroll hero" (21st.dev), com o celular deitado: antes de fixar a tela, conforme a secao
         sobe, ele comeca inclinado para tras (22 graus), se endireita, cresce (.94 a 1) e sobe sobre o
         titulo (8% da propria altura), enquanto o titulo sobe bem mais devagar */
      gsap.fromTo(device, { rotateX: 22, scale: 0.94, yPercent: 0 }, {
        rotateX: 0, scale: 1, yPercent: -16, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.6 }
      });
      gsap.fromTo(title, { y: 0 }, {
        y: -24, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.6 }
      });

      /* ja com a tela fixa: o grafico se desenha na tela do celular e depois vira "tracao" */
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section, start: 'top top', end: '+=560%', pin: true, scrub: 1.2, anticipatePin: 1 }
      });
      /* "Chamamos isso de" nasce no centro; surge "tracao." tambem centralizada embaixo; ela desliza para a
         esquerda (justifica) e so entao o texto aparece ao lado */
      var row2 = $('.tr__row2'), l1 = $('.tr__l1'), l2 = $('.tr__l2');
      var l2Dx = function () { return fim.clientWidth / 2 - (row2.offsetLeft + l2.offsetWidth / 2); };

      tl.add(grow, 0.4)
        .to(a, { autoAlpha: 0, y: -50, duration: 0.9, ease: 'power1.out' }, 7.6)
        .fromTo(fim, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5 }, 8.9)
        .from(l1, { y: 90, duration: 1.4, ease: 'power3.out' }, 8.9)
        .fromTo(l2, { x: l2Dx }, { x: 0, duration: 1.6, ease: 'power3.inOut', invalidateOnRefresh: true }, 11.6)
        .from(l2, { autoAlpha: 0, y: 70, scale: 0.94, filter: 'blur(14px)', duration: 1.5, ease: 'power3.out' }, 10.0)
        .from(txt, { autoAlpha: 0, x: 40, duration: 1.2, ease: 'power3.out' }, 12.6)
        .to({}, { duration: 1.6 }, 13.8);
    });

    mm.add('(max-width: 899px)', function () {
      var device = $('.device'), title = $('.tr__t');
      /* mesma animacao do desktop, com o celular em pe: inclina para tras, se endireita e sobe sobre o titulo */
      gsap.fromTo(device, { rotateX: 20, scale: 0.94, yPercent: 0 }, {
        rotateX: 0, scale: 1, yPercent: -4, ease: 'none',
        scrollTrigger: { trigger: '.device__stage', start: 'top 98%', end: 'top 45%', scrub: 0.6 }
      });
      gsap.fromTo(title, { y: 0 }, { y: -14, ease: 'none', scrollTrigger: { trigger: '.device__stage', start: 'top 98%', end: 'top 45%', scrub: 0.6 } });
      /* o grafico se desenha dentro da tela enquanto o aparelho atravessa a janela */
      var proxy = { p: 0 };
      gsap.to(proxy, {
        p: 1, ease: 'none', onUpdate: function () { renderChart(proxy.p); },
        scrollTrigger: { trigger: '.device', start: 'top 62%', end: 'bottom 52%', scrub: 1 }
      });
      fadeUp($$('.tr__l1, .tr__l2'), { trigger: '.tr__fim' });
      fadeUp($$('.tr__txt > *'), { trigger: '.tr__txt' });
    });
  }

  /* ---------- solucoes ---------- */
  function buildSolucoes() {
    revealLines($('.sol__t'));
    fadeUp($('.sol__head .eyebrow'), { trigger: '.sol__head' });
    fadeUp($('.sol__head .btn'), { trigger: '.sol__head', y: 24 });
    $$('.item').forEach(function (it) {
      fadeUp(it, { trigger: it, y: 44 });
      gsap.from($('.item__n', it), { x: -14, autoAlpha: 0, duration: .9, scrollTrigger: { trigger: it, start: 'top 85%', once: true } });
    });
  }

  /* ---------- para quem: cada criterio acende na sua vez ---------- */
  function buildPara() {
    revealLines($('.qual__lead'));
    var items = $$('.qual__list li');
    items.forEach(function (li) {
      gsap.fromTo(li,
        { opacity: .3, x: 0 },
        { opacity: 1, ease: 'none', scrollTrigger: { trigger: li, start: 'top 82%', end: 'top 52%', scrub: .5 } });
      gsap.to(li, {
        opacity: .42, ease: 'none', immediateRender: false,
        scrollTrigger: { trigger: li, start: 'top 26%', end: 'top 6%', scrub: .5 }
      });
    });
  }

  /* ---------- fechamento ---------- */
  function buildFim() {
    var t = $('.fim__t');
    gsap.set(t, { visibility: 'visible' });
    gsap.from([$('.fim__a'), $('.fim__b')], {
      yPercent: 40, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: .18,
      scrollTrigger: { trigger: t, start: 'top 85%', once: true }
    });
    /* ao terminar a rolagem, "Tracao gera." passa do branco para um laranja escuro queimado */
    gsap.fromTo('.fim__b', { color: '#ffffff' }, { color: '#4a1d03', ease: 'none', scrollTrigger: { trigger: '.fim__t', start: 'top 65%', end: 'bottom 42%', scrub: 0.6 } });
    fadeUp($('.fim .btn'), { trigger: '.fim .btn', y: 30 });
    gsap.fromTo('.foot__mark', { yPercent: 30 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  function start() {
    root.classList.add('ready');
    buildChrome();
    buildHero();
    buildTracao();
    buildNavTheme();
    buildSolucoes();
    buildPara();
    buildFim();
    if (lenis) { lenis.start(); }
    setTimeout(function () { ScrollTrigger.refresh(); }, 500);
    setTimeout(function () { ScrollTrigger.refresh(); }, 1800);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { ScrollTrigger.refresh(); } });
    if (location.hash && $(location.hash)) { setTimeout(function () { goTo(location.hash); }, 1600); }
  }

  /* plano B: se algo quebrar na montagem, a pagina abre pronta */
  function safeStart() {
    try { start(); }
    catch (err) {
      if (window.console) { console.error('[tractia] animacao desligada:', err); }
      gsap.killTweensOf('*');
      $$('body *').forEach(function (n) { if (n.style && n.style.length && !n.closest('svg')) { n.style.opacity = ''; n.style.visibility = ''; n.style.transform = ''; n.style.filter = ''; } });
      ScrollTrigger.getAll().forEach(function (st) { st.kill(true); });
      if (lenis) { lenis.destroy(); lenis = null; }
      basics();
    }
  }

  var run = function () {
    window.scrollTo(0, 0);
    var go = function () { safeStart(); };
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(go); } else { go(); }
  };
  if (document.readyState === 'complete') { run(); } else { window.addEventListener('load', run); }
})();
