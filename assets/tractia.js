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

  /* hero: leque de linhas finas subindo, na mesma curva dos feixes */
  function buildArtShape() {
    var g = $('.art__fan');
    if (!g) { return; }
    var n = 16;
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      var d = 'M-120 ' + (930 + (t - 0.5) * 56) +
        ' C' + (520 + t * 90) + ' ' + (890 - t * 50) +
        ' ' + (920 + t * 110) + ' ' + (470 - t * 190) +
        ' 1720 ' + (-90 + t * 380);
      g.appendChild(el('path', { d: d, pathLength: '1' }));
      if (i % 2 === 0) { $('.art__comets').appendChild(el('path', { d: d, pathLength: '1', 'class': 'comet' })); }
    }
    var b3 = $('.art__beams .b3');
    var pt = b3.getPointAtLength(b3.getTotalLength() * 0.8);
    $$('.art__node circle').forEach(function (c) { c.setAttribute('cx', pt.x.toFixed(1)); c.setAttribute('cy', pt.y.toFixed(1)); });
  }
  buildChartShape();
  buildArtShape();

  /* ------------------------------------------------------------------
     Fundo em video (opcional): se existir assets/media/hero-fundo.mp4, ele assume o lugar do desenho animado.
     Gere o video numa IA (ver ia/PROMPT-VIDEO-HERO.md) e salve nesse caminho.
     ------------------------------------------------------------------ */
  function initHeroVideo() {
    var v = $('.hero__video'), bg = $('.hero__bg');
    var saver = navigator.connection && navigator.connection.saveData;
    if (!v || reduce || saver || !window.fetch) { return; }
    var src = 'assets/media/hero-fundo.mp4';
    fetch(src, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) { return; }
      v.src = src;
      v.addEventListener('canplay', function () {
        bg.classList.add('has-video');
        var p = v.play(); if (p && p.catch) { p.catch(function () {}); }
      }, { once: true });
    }).catch(function () {});
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
    $$('.art__fan path').forEach(function (p) { p.style.strokeDasharray = 'none'; });
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

    /* linhas finas se desenham */
    var fan = $$('.art__fan path');
    gsap.set(fan, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.to(fan, { strokeDashoffset: 0, duration: 2.8, stagger: .07, delay: .7, ease: 'power2.out' });
    gsap.from('.art__beams path', { opacity: 0, duration: 2.2, stagger: .2, delay: .5 });

    /* fundo vivo: feixes respiram bem, manchas de luz derivam, cometas sobem pelas linhas */
    gsap.to('.art__beams', { x: -70, y: 34, duration: 7, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.art__beams--2', { x: 60, y: -26, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.art__beams .b2', { opacity: 0.55, duration: 3.2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.blob--1', { x: '-9vw', y: '8vw', scale: 1.18, duration: 9, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.blob--2', { x: '12vw', y: '-7vw', scale: 1.12, duration: 11, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.blob--3', { x: '-14vw', y: '10vh', scale: 1.3, duration: 13, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    $$('.art__comets .comet').forEach(function (c, i) {
      gsap.set(c, { strokeDasharray: '0.06 0.94', strokeDashoffset: 0.06, opacity: 0.9 });
      gsap.to(c, { strokeDashoffset: -0.94, duration: 3.4 + (i % 4) * 0.9, ease: 'none', repeat: -1, delay: 1.6 + i * 0.55 });
    });

    /* o fundo acompanha o mouse de leve */
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var qx = gsap.quickTo('.hero__bg .art', 'x', { duration: 1.4, ease: 'power3.out' });
      var qy = gsap.quickTo('.hero__bg .art', 'y', { duration: 1.4, ease: 'power3.out' });
      $('.hero').addEventListener('mousemove', function (e) {
        qx((e.clientX / window.innerWidth - 0.5) * -34);
        qy((e.clientY / window.innerHeight - 0.5) * -22);
      });
    }
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
        rotateX: 0, scale: 1, yPercent: -20, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.6 }
      });
      gsap.fromTo(title, { y: 0 }, {
        y: -24, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top bottom', end: 'top top', scrub: 0.6 }
      });

      /* ja com a tela fixa: o grafico se desenha na tela do celular e depois vira "tracao" */
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section, start: 'top top', end: '+=540%', pin: true, scrub: 1.2, anticipatePin: 1 }
      });
      tl.add(grow, 0.4)
        .to(a, { autoAlpha: 0, y: -50, duration: 0.9, ease: 'power1.out' }, 7.6)
        .fromTo(fim, { autoAlpha: 0 }, { autoAlpha: 1, duration: .5 }, 8.9)
        .from($('.tr__l1'), { y: 90, duration: 1.4, ease: 'power3.out' }, 8.9)
        .from(txt, { y: 60, autoAlpha: 0, duration: 1.2, ease: 'power3.out' }, 9.6)
        .from($('.tr__l2'), { autoAlpha: 0, y: 70, scale: 0.94, filter: 'blur(14px)', duration: 1.5, ease: 'power3.out' }, 11.6)
        .to({}, { duration: 1.2 }, 13.2);
    });

    mm.add('(max-width: 899px)', function () {
      var proxy = { p: 0 };
      gsap.to(proxy, {
        p: 1, ease: 'none', onUpdate: function () { renderChart(proxy.p); },
        scrollTrigger: { trigger: '.chart', start: 'top 80%', end: 'bottom 40%', scrub: 1 }
      });
      revealLines($('.tr__big'));
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
        { opacity: .18, x: 0 },
        { opacity: 1, ease: 'none', scrollTrigger: { trigger: li, start: 'top 82%', end: 'top 52%', scrub: .5 } });
      gsap.to(li, {
        opacity: .32, ease: 'none', immediateRender: false,
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
      ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
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
