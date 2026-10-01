/* TRACTIA | landing
   GSAP + ScrollTrigger + SplitText + Lenis por CDN, sem build.
   Sem GSAP, ou com "menos movimento" ligado, a pagina abre completa (showAll). */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

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
     Video da hero: toca sem som, some e volta ao fim de cada volta,
     pausa fora da tela. Sem video (menos movimento, economia de dados,
     erro), fica a foto de capa.
     ------------------------------------------------------------------ */
  function initVideo() {
    var v = $('.hero__video');
    if (!v) { return; }
    var saver = navigator.connection && navigator.connection.saveData;
    if (reduce || saver) { return; }
    v.src = window.innerWidth < 900 ? v.getAttribute('data-sd') : v.getAttribute('data-hd');
    v.muted = true;
    var play = function () { var p = v.play(); if (p && p.catch) { p.catch(function () {}); } };
    v.addEventListener('playing', function () { v.classList.remove('is-out'); v.classList.add('is-on'); });
    v.addEventListener('timeupdate', function () { if (v.duration && v.duration - v.currentTime < 0.7) { v.classList.add('is-out'); } });
    v.addEventListener('ended', function () { v.currentTime = 0; play(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { if (en[0].isIntersecting) { play(); } else { v.pause(); } }).observe(v);
    }
    play();
  }
  initVideo();

  /* ------------------------------------------------------------------
     Sem GSAP ou com movimento reduzido: tudo pronto
     ------------------------------------------------------------------ */
  function basics() {
    root.classList.add('no-anim');
    var onScroll = function () { nav.classList.toggle('is-solid', window.scrollY > 40); };
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

  /* linhas com mascara que sobem; `trigger` define quando (ou null = ja) */
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

  /* o menu fica claro sobre a secao clara; criado depois da tela fixa para contar o espaco dela */
  function buildNavTheme() {
    ScrollTrigger.create({ trigger: '.sol', start: 'top 40px', end: 'bottom 40px', onToggle: function (self) { nav.classList.toggle('on-light', self.isActive); } });
  }

  /* ---------- hero ---------- */
  function buildHero() {
    gsap.from(nav, { y: -24, autoAlpha: 0, duration: 1, delay: .2 });
    gsap.from('.hero__panel', { xPercent: 6, autoAlpha: 0, duration: 1.5, delay: .1, ease: 'power3.out' });
    revealLines($('.hero__t'), { now: true, delay: .3 });
    fadeUp($$('.hero__p, .hero__btns'), { now: true, delay: .9, y: 28, stagger: .14 });
  }

  /* ---------- tracao: a escada se enche com a rolagem, depois vira "tracao" ---------- */
  function buildTracao() {
    var section = $('.tr');
    var steps = $$('.steps__s');
    var fills = $$('.steps__fill');
    var kw = $$('.tr__t .k');
    var mm = gsap.matchMedia();

    /* acende o rotulo de cada degrau conforme o preenchimento chega nele */
    function light(p) {
      steps.forEach(function (s, i) { s.classList.toggle('on', (i + 0.35) / steps.length <= p + 0.001); });
      if (kw[0]) { kw[0].classList.toggle('on', p > 0.02); }
      if (kw[1]) { kw[1].classList.toggle('on', p >= 0.999); }
    }
    light(0);

    revealLines($('.tr__t'));

    mm.add('(min-width: 900px)', function () {
      var a = $('.tr__a'), fim = $('.tr__fim'), big = $('.tr__big'), txt = $('.tr__txt');
      var grow = gsap.timeline({ defaults: { ease: 'none' } });
      grow.fromTo(fills, { scaleY: 0 }, { scaleY: 1, duration: 1, stagger: 0.9 });

      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section, start: 'top top', end: '+=420%', pin: true, scrub: .6, anticipatePin: 1,
          onUpdate: function () { light(grow.progress()); },
          onRefresh: function () { light(grow.progress()); }
        }
      });
      tl.add(grow, 0.3)
        .to(a, { autoAlpha: 0, y: -60, duration: 1.1, ease: 'power2.in' }, 7.4)
        .fromTo(fim, { autoAlpha: 0 }, { autoAlpha: 1, duration: .4 }, 8.2)
        .from(big, { y: 90, duration: 1.4, ease: 'power3.out' }, 8.2)
        .from(txt, { y: 60, autoAlpha: 0, duration: 1.2, ease: 'power3.out' }, 8.9)
        .to({}, { duration: 1.4 }, 10.1);
    });

    mm.add('(max-width: 899px)', function () {
      gsap.fromTo(fills, { scaleX: 0 }, {
        scaleX: 1, ease: 'none', stagger: 0.9,
        scrollTrigger: {
          trigger: '.steps', start: 'top 80%', end: 'bottom 55%', scrub: .5,
          onUpdate: function (self) { light(self.progress); }
        }
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
