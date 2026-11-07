/* =====================================================================
   VERSION A — "LAB"  ·  interactions
   Requires: config.js, data.js, gsap (+ScrollTrigger, SplitText, ScrambleText, Flip), lenis, lightbox
   ===================================================================== */
(() => {
  'use strict';
  const SITE = window.SITE || {};
  const ITEMS = (window.WORK && window.WORK.items) || [];
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, Flip);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isTouch = matchMedia('(hover: none)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = (id) => ITEMS.find((i) => i.id === id);
  const pick = (ids) => ids.map(byId).filter(Boolean);
  const SCR_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+';

  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ------------------------------------------------------------------
     1. SITE CONFIG → DOM
  ------------------------------------------------------------------ */
  $$('[data-site]').forEach((el) => {
    const k = el.dataset.site;
    if (k === 'name-upper') el.textContent = (SITE.name || '').toUpperCase();
    else if (SITE[k] != null) el.textContent = SITE[k];
  });
  $$('[data-site-href]').forEach((a) => {
    const k = a.dataset.siteHref;
    if (k === 'mailto') a.href = 'mailto:' + (SITE.email || '');
    if (k === 'tel') a.href = 'tel:' + (SITE.phone || '').replace(/[^\d+]/g, '');
  });
  $$('.socials').forEach((w) => {
    w.innerHTML = (SITE.socials || []).filter((s) => s.url).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('');
  });
  const clocks = $$('[data-clock]');
  const tickClock = () => {
    let t;
    try { t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SITE.timezone, timeZoneName: 'short' }); }
    catch { t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    clocks.forEach((c) => (c.textContent = t.toUpperCase()));
  };
  tickClock(); setInterval(tickClock, 15000);

  // wrap each character of an element in .ch spans (keeps spaces)
  function chars(el) {
    const text = el.textContent;
    el.textContent = '';
    const inner = document.createElement('span');
    inner.className = 'fit-in';
    inner.style.display = 'inline-flex';
    inner.style.whiteSpace = 'pre';
    [...text].forEach((c) => {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      s.setAttribute('aria-hidden', 'true');
      inner.appendChild(s);
    });
    el.appendChild(inner);
    return $$('.ch', el);
  }

  // scale font-size so the element's content exactly spans its parent's width
  const fits = [];
  function fitText(el, state) {
    const run = () => {
      const inner = el.querySelector('.fit-in') || el;
      let restore = null;
      if (state) {
        // measure at an explicit variable-font state, then put back whatever inline values were there
        const cs = [...el.querySelectorAll('.ch')];
        const saved = cs.map((c) => [c.style.getPropertyValue('--wd'), c.style.getPropertyValue('--wg'), c.style.transform]);
        cs.forEach((c) => { c.style.setProperty('--wd', state.wd); c.style.setProperty('--wg', state.wg || 900); c.style.transform = 'none'; });
        restore = () => cs.forEach((c, i) => {
          const [a, b, t] = saved[i];
          if (a) c.style.setProperty('--wd', a); else c.style.removeProperty('--wd');
          if (b) c.style.setProperty('--wg', b); else c.style.removeProperty('--wg');
          c.style.transform = t;
        });
      }
      el.style.fontSize = '100px';
      const w = inner.getBoundingClientRect().width;
      const cs = getComputedStyle(el.parentElement);
      const avail = el.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (w > 0) el.style.fontSize = (100 * avail / w) * 0.995 + 'px';
      if (restore) restore();
    };
    fits.push(run); run();
  }

  /* ------------------------------------------------------------------
     2. RENDER DATA-DRIVEN SECTIONS
  ------------------------------------------------------------------ */
  // hero floaters
  const floatItems = pick([
    'dlab-the-smallest-instrument-on-the-bench', 'heidolph-laboratory-tools-for-synthesis', 'zeiss-fastest-growing-partner',
    'catalyst-cue-magazine-catalyst-cue-live-now', 'jeiotech-heat-alone-can-damage-samples', 'sonics-kras-erk-breakthrough'
  ]);
  const spots = [
    { l: 6, t: 20, w: 12, d: .5, z: 1 }, { l: 27, t: 9, w: 16, d: .9, z: 3 }, { l: 55, t: 17, w: 11, d: .35, z: 1 },
    { l: 76, t: 7, w: 9, d: 1.1, z: 3 }, { l: 84, t: 34, w: 12, d: .6, z: 1 }, { l: 40, t: 40, w: 15, d: 1.3, z: 3 }
  ];
  const floaters = $('.hero__floaters');
  floatItems.forEach((it, i) => {
    const s = spots[i];
    const f = document.createElement('div');
    f.className = 'floater';
    f.style.cssText = `left:${s.l}%;top:${s.t}%;--w:clamp(90px,${s.w}vw,${s.w * 18}px);--ar:${it.w}/${it.h};z-index:${s.z}`;
    f.dataset.depth = s.d;
    f.innerHTML = `<div class="floater__in" style="width:100%;height:100%"><img src="${it.thumb}" alt=""></div>`;
    floaters.appendChild(f);
  });

  // marquee
  const discA = ['Social Campaigns', 'Carousels', 'Email Banners', 'Expo Graphics', 'Editorial', 'Motion Reels'];
  const discB = ['Standees', 'Web Banners', 'Festival Films', 'Product Reels', 'Magazines', 'Brand Collabs'];
  $$('.marquee__row').forEach((row, r) => {
    const words = r ? discB : discA;
    const html = words.map((w) => `<span class="marquee__item">${w}<span class="star">✺</span></span>`).join('');
    $('.marquee__inner', row).innerHTML = html + html + html + html;
  });

  // pills inside about text
  const pillImgs = pick(['nanalysis-benchtop-nmr-spectrometers', 'vizag-expo-2026', 'bwb-technologies-crystal-clear']);
  $$('[data-pill]').forEach((p) => {
    const it = pillImgs[+p.dataset.pill]; if (!it) return;
    p.innerHTML = `<img src="${it.kind === 'video' ? it.thumb : it.thumb}" alt="">`;
  });

  // stats + services
  $('.stats').innerHTML = (SITE.stats || []).map((s) => `<div class="stat"><div class="stat__v"><span data-count="${s.value}">0</span><sup>${esc(s.suffix)}</sup></div><div class="stat__l mono">${esc(s.label)}</div></div>`).join('');
  $('.services__list').innerHTML = (SITE.services || []).map((s, i) => `<li><span class="n">${pad(i + 1)}</span><span data-scramble-hover>${esc(s)}</span></li>`).join('');

  // digital horizontal cards
  const digital = ITEMS.filter((i) => i.cat === 'digital' && i.sub !== 'Carousels' && i.featured);
  const ord = [];
  const posts = digital.filter((i) => i.w / i.h < 1.1), wides = digital.filter((i) => i.w / i.h >= 1.1);
  while (posts.length || wides.length) { if (posts.length) ord.push(posts.shift()); if (wides.length) ord.push(wides.shift()); if (posts.length) ord.push(posts.shift()); }
  $('.hs__track').innerHTML = ord.map((it, i) => {
    const r = it.w / it.h;
    const k = r < 1.1 ? 'p' : r < 2.3 ? 'l' : 'w';
    return `<article class="card card--${k}" data-id="${it.id}" data-cursor="View">
      <div class="card__media" style="--ar:${it.w}/${it.h}"><img src="${it.thumb}" data-hi="${it.src}" alt="${esc(it.title)}" loading="lazy"></div>
      <div class="card__meta mono"><span class="card__client">${esc(it.client)}</span><span>${pad(i + 1)}</span></div>
      <h4 class="card__title">${esc(it.title)}</h4>
    </article>`;
  }).join('');
  $('.hs__total').textContent = pad(ord.length);

  // decks
  const carousels = ITEMS.filter((i) => i.sub === 'Carousels');
  $('.decks__grid').innerHTML = carousels.map((it) => {
    const pgs = (it.pages || [{ thumb: it.thumb }]).slice(0, 4);
    return `<article class="deck" data-id="${it.id}" data-cursor="Read">
      <div class="deck__stack">${pgs.map((p) => `<div class="deck__page"><img src="${p.thumb}" alt="" loading="lazy"></div>`).join('')}</div>
      <div class="deck__meta mono"><span class="deck__client">${esc(it.client)}</span><span>${pad((it.pages || [1]).length)} slides</span></div>
      <h4 class="deck__title">${esc(it.title)}</h4>
    </article>`;
  }).join('');

  // zoom image
  const zoomItem = byId('being-instruments-water-bath-backdrop') || ITEMS.find((i) => i.cat === 'print');
  if (zoomItem) { $('.zoom__img').src = zoomItem.src; $('.zoom__cap-t').textContent = `${zoomItem.client} — ${zoomItem.title}`; }

  // book leaves
  const mag = ITEMS.find((i) => i.id.includes('vol-03-issue-01'));
  let leaves = [];
  if (mag && mag.pages) {
    const pg = mag.pages.slice(0, 13).concat(mag.pages.slice(-1));
    const book = $('.book__book');
    const par = pg[0].w / pg[0].h;
    book.style.aspectRatio = String(2 * par);
    for (let i = 0; i < pg.length; i += 2) {
      const L = document.createElement('div');
      L.className = 'leaf';
      L.innerHTML = `<div class="leaf__face leaf__face--front"><img src="${pg[i].src}" alt="Catalyst Cue page ${i + 1}" loading="lazy"></div>` +
        (pg[i + 1] ? `<div class="leaf__face leaf__face--back"><img src="${pg[i + 1].src}" alt="Catalyst Cue page ${i + 2}" loading="lazy"></div>` : '') +
        `<div class="leaf__shade"></div>`;
      book.appendChild(L);
    }
    leaves = $$('.leaf', book);
    $('.book__open').addEventListener('click', () => Lightbox.open(mag, 0));
  }

  // standees
  const vizag = byId('vizag-expo-2026');
  const stItems = [];
  if (vizag) vizag.pages.forEach((p, i) => stItems.push({ item: vizag, page: i, thumb: p.thumb, w: p.w, h: p.h, cap: `Vizag Expo 2026 · Panel ${pad(i + 1)}` }));
  ['labstation-labstation-i-glovebox-standee', 'rotachrom-cpc-modeler-standee', 'being-instruments-biosafety-cabinet-poster', 'being-instruments-rotary-evaporator-poster', 'being-instruments-product-range-poster']
    .map(byId).filter(Boolean).forEach((it) => stItems.push({ item: it, page: 0, thumb: it.thumb, w: it.w, h: it.h, cap: `${it.client} · ${it.title}` }));
  const order = [0, 5, 1, 6, 2, 7, 3, 8, 4, 9];
  const cols = $$('.standees__cols .col');
  order.map((i) => stItems[i]).filter(Boolean).forEach((s, k) => {
    const el = document.createElement('figure');
    el.className = 'st'; el.dataset.cursor = 'View';
    el.innerHTML = `<img src="${s.thumb}" alt="${esc(s.cap)}" loading="lazy" width="${s.w}" height="${s.h}"><figcaption class="st__cap"><span class="mono">${esc(s.item.client)}</span><span class="mono">${esc(s.cap.split('·').pop().trim())}</span></figcaption>`;
    el.addEventListener('click', () => Lightbox.open(s.item, s.page));
    cols[k % 3].appendChild(el);
  });

  // print grid
  const pg = pick(['inkarp-full-page-brand-advertisement', 'inkarp-corporate-diary-2026', 'mettler-toledo-fp20-bio-ph-meter-flyer-a5', 'inkarp-chennai-aict-backdrop', 'catalyst-cue-magazine-catalyst-cue-live-now', 'being-instruments-water-bath-backdrop', 'catalyst-cue-magazine-catalyst-cue-pre-launch-teaser']);
  $('.pgrid__items').innerHTML = pg.map((it) => {
    const r = it.w / it.h;
    return `<article class="pitem ${r > 1.3 ? 'pitem--wide' : ''}" data-id="${it.id}" data-cursor="${it.pages ? 'Flip' : 'View'}">
      <div class="pitem__media" style="--ar:${r > 1.3 ? '16/9' : '4/5'}"><img src="${it.thumb}" alt="${esc(it.title)}" loading="lazy"></div>
      <div class="pitem__meta mono"><span>${esc(it.client)}</span><span>${it.pages ? pad(it.pages.length) + ' pp' : esc(it.sub)}</span></div>
      <div class="pitem__t">${esc(it.title)}</div></article>`;
  }).join('');

  // motion
  const vids = ITEMS.filter((i) => i.kind === 'video');
  const subs = [...new Set(vids.map((v) => v.sub))];
  $('.filters').innerHTML = [`<button class="is-active" data-f="*" role="tab" aria-selected="true">All<sup>${vids.length}</sup></button>`]
    .concat(subs.map((s) => `<button data-f="${esc(s)}" role="tab" aria-selected="false">${esc(s)}<sup>${vids.filter((v) => v.sub === s).length}</sup></button>`)).join('');
  $('.mgrid').innerHTML = vids.map((v) => {
    const mins = `${pad(Math.floor(v.duration / 60))}:${pad(v.duration % 60)}`;
    return `<article class="vcard ${v.orientation === 'landscape' ? 'vcard--land' : ''}" data-id="${v.id}" data-sub="${esc(v.sub)}" data-cursor="Play">
      <div class="vcard__media"><img src="${v.thumb}" alt="${esc(v.title)}" loading="lazy"><video muted loop playsinline preload="none" data-src="${v.preview}"></video>
        <div class="vcard__top mono"><span>${esc(v.sub)}</span><span>${mins}</span></div><span class="vcard__play" aria-hidden="true">▶</span></div>
      <div class="vcard__meta"><div class="vcard__client mono">${esc(v.client)}</div><h4 class="vcard__title">${esc(v.title)}</h4></div></article>`;
  }).join('');

  // client index
  const groups = {};
  ITEMS.forEach((i) => { (groups[i.client] = groups[i.client] || []).push(i); });
  const clientList = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  const catName = { digital: 'Digital', print: 'Print', motion: 'Motion' };
  $('.clients').innerHTML = clientList.map(([c, arr], i) => {
    const tags = [...new Set(arr.map((a) => catName[a.cat]))].join(' · ');
    return `<li class="client" data-client="${esc(c)}" data-cursor="Open"><span class="client__n mono">${pad(i + 1)}</span><span class="client__name">${esc(c)}</span><span class="client__tags mono">${tags}</span><span class="client__count mono">${pad(arr.length)} ${arr.length > 1 ? 'pieces' : 'piece'}</span></li>`;
  }).join('');

  // generic click → lightbox
  document.addEventListener('click', (e) => {
    const el = e.target.closest('.card, .deck, .pitem, .vcard');
    if (el) { const it = byId(el.dataset.id); if (it) Lightbox.open(it, 0); return; }
    const cl = e.target.closest('.client');
    if (cl) {
      const arr = groups[cl.dataset.client] || [];
      const stills = arr.filter((a) => a.kind !== 'video');
      if (!stills.length) { Lightbox.open(arr[0], 0); return; }
      const pages = stills.flatMap((a) => a.pages ? a.pages : [{ src: a.src, thumb: a.thumb, w: a.w, h: a.h }]);
      Lightbox.open({ title: `${stills.length} piece${stills.length > 1 ? 's' : ''}`, client: cl.dataset.client, kind: 'doc', pages }, 0);
    }
  });

  /* ------------------------------------------------------------------
     3. SMOOTH SCROLL
  ------------------------------------------------------------------ */
  const lenis = new Lenis({ lerp: reduce ? 1 : 0.085, smoothWheel: !reduce, wheelMultiplier: 1 });
  window.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const t = id === '#top' ? 0 : $(id);
    if (t === null) return;
    e.preventDefault();
    lenis.scrollTo(t, { duration: 1.8, easing: (x) => 1 - Math.pow(1 - x, 4) });
  });

  /* ------------------------------------------------------------------
     4. TEXT FX HELPERS
  ------------------------------------------------------------------ */
  function scramble(el, text, dur = 0.9) {
    gsap.to(el, { duration: dur, scrambleText: { text, chars: SCR_CHARS, speed: 0.6, revealDelay: 0.15 }, overwrite: true });
  }
  if (!isTouch) {
    $$('[data-scramble-hover]').forEach((el) => {
      const orig = el.textContent;
      el.addEventListener('mouseenter', () => scramble(el, orig, 0.6));
    });
  }
  // hero discipline cycle
  const cyc = $('[data-cycle]');
  if (cyc) {
    const words = cyc.dataset.cycle.split('|'); let ci = 0;
    setInterval(() => { ci = (ci + 1) % words.length; scramble(cyc, words[ci], 1); }, 2600);
  }

  /* ------------------------------------------------------------------
     5. CURSOR
  ------------------------------------------------------------------ */
  const cursor = $('.cursor'), cLabel = $('.cursor__label');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  if (!isTouch) {
    const cx = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-cursor]');
      if (t) { cursor.classList.add('is-big'); cLabel.textContent = t.dataset.cursor; }
      else cursor.classList.remove('is-big');
    });
    document.addEventListener('mouseleave', () => cursor.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cursor.classList.remove('is-hidden'));
  }

  /* ------------------------------------------------------------------
     6. TEXT SETUP (split + fit) — before loader so layout is final
  ------------------------------------------------------------------ */
  const heroName = $('.hero__name > span');
  const heroChars = chars(heroName);
  fitText(heroName, { wd: 125, wg: 900 });

  const megas = $$('[data-stretch], [data-fill]').map((el) => {
    const label = el.textContent;
    const cs = chars(el);
    if (el.hasAttribute('data-fill')) {
      const fill = document.createElement('span');
      fill.className = 'fill'; fill.setAttribute('aria-hidden', 'true');
      fill.innerHTML = el.innerHTML;
      el.appendChild(fill);
    }
    el.setAttribute('aria-label', label);
    // fit at the widest (final) state
    fitText(el, { wd: 125 });
    return { el, cs: $$('.ch', el) };
  });
  const stTitle = $('[data-stretch-sm]');
  const stChars = chars(stTitle);
  fitText(stTitle, { wd: 125 });

  const contactLines = $$('.contact__line').map((l) => chars(l));
  const contactLong = $$('.contact__line').sort((a, b) => b.textContent.length - a.textContent.length)[0];
  fitText(contactLong, { wd: 62 });
  $$('.contact__line').forEach((l) => { if (l !== contactLong) l.style.fontSize = contactLong.style.fontSize; });

  const giant = $('.contact__giant');
  giant.innerHTML = `<span class="fit-in" style="display:inline-block">${giant.innerHTML}</span>`;
  fitText(giant);

  // About: wrap words manually (skips .pill)
  function wrapWords(root) {
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const parts = n.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) frag.appendChild(document.createTextNode(p));
            else { const s = document.createElement('span'); s.className = 'word'; s.textContent = p; frag.appendChild(s); out.push(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('pill')) walk(n);
      });
    };
    walk(root);
    return out;
  }
  const aboutWords = wrapWords($('.about__text'));

  let resizeT;
  addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { fits.forEach((f) => f()); $$('.contact__line').forEach((l) => { if (l !== contactLong) l.style.fontSize = contactLong.style.fontSize; }); ScrollTrigger.refresh(); }, 200);
  });

  /* ------------------------------------------------------------------
     7. PRELOADER
  ------------------------------------------------------------------ */
  const loader = $('.loader');
  const flash = $('.loader__flash');
  const flashSrc = ITEMS.filter((i) => i.featured).slice(0, 40).filter((_, i) => i % 3 === 0).map((i) => i.thumb).slice(0, 12);
  flash.innerHTML = flashSrc.map((s) => `<img src="${s}" alt="">`).join('');
  const critical = [...new Set([...flashSrc, ...floatItems.map((i) => i.thumb), ...ord.slice(0, 6).map((i) => i.thumb)])];
  let loaded = 0;
  const bump = () => { loaded++; };
  critical.forEach((src) => { const im = new Image(); im.onload = im.onerror = bump; im.src = src; });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  let fontsDone = false; fontsReady.then(() => { fontsDone = true; fits.forEach((f) => f()); });

  const num = $('.loader__num'), bar = $('.loader__bar i'), status = $('.loader__status');
  const statuses = ['Initialising', 'Calibrating pixels', 'Mixing pigments', 'Rendering reels', 'Ready'];
  let shown = 0, stIdx = 0, fi = 0, flashT = 0;
  const t0 = performance.now(), MIN = reduce ? 300 : 2600;
  const flashImgs = $$('img', flash);

  function loaderTick() {
    const real = (loaded / critical.length) * (fontsDone ? 1 : 0.9);
    const timeP = Math.min(1, (performance.now() - t0) / MIN);
    const target = Math.min(real, timeP) * 100;
    shown += (target - shown) * 0.08;
    if (target >= 100 && shown > 99.4) shown = 100;
    num.textContent = pad(Math.floor(shown), 3);
    bar.style.transform = `scaleX(${shown / 100})`;
    const s = Math.min(statuses.length - 1, Math.floor(shown / 100 * (statuses.length - 1) + 0.0001));
    if (s !== stIdx) { stIdx = s; scramble(status, statuses[s], 0.6); }
    if (performance.now() - flashT > 120 && flashImgs.length) {
      flashT = performance.now();
      flashImgs.forEach((im) => im.classList.remove('on'));
      flashImgs[fi++ % flashImgs.length].classList.add('on');
    }
    if (shown >= 100) { gsap.ticker.remove(loaderTick); exitLoader(); }
  }
  gsap.ticker.add(loaderTick);

  function exitLoader() {
    fits.forEach((f) => f());
    const tl = gsap.timeline({ defaults: { ease: 'expo.inOut' } });
    tl.to('.loader__count', { yPercent: -110, duration: 0.9, ease: 'expo.in' })
      .to(['.loader__top', '.loader__hint', '.loader__bar'], { autoAlpha: 0, duration: 0.4 }, '<')
      .to(flash, { clipPath: 'inset(50% 50% 50% 50%)', duration: 0.8 }, '<0.1')
      .to('.loader__cols i', { scaleY: 0, transformOrigin: 'top', duration: 1.1, stagger: 0.07 }, '-=0.3')
      .set(loader, { display: 'none' })
      .add(() => {
        document.body.classList.remove('is-loading');
        lenis.start();
        ScrollTrigger.refresh();
      }, '-=0.6')
      .add(heroIntro(), '-=1.05');
  }

  /* ------------------------------------------------------------------
     8. HERO
  ------------------------------------------------------------------ */
  gsap.set(heroChars, { yPercent: 105, '--wd': 62 });
  gsap.set('.hero__lines i', { scaleY: 0 });
  gsap.set('[data-intro]', { autoAlpha: 0, y: 20 });
  gsap.set('.floater', { scale: 0, rotate: () => gsap.utils.random(-14, 14) });
  gsap.set('.nav', { autoAlpha: 0, y: -20 });

  function heroIntro() {
    const tl = gsap.timeline();
    tl.to('.hero__lines i', { scaleY: 1, duration: 1.4, stagger: 0.08, ease: 'expo.inOut' }, 0)
      .to(heroChars, { yPercent: 0, duration: 1.3, stagger: 0.08, ease: 'expo.out' }, 0.2)
      .to(heroChars, { '--wd': 125, duration: 1.6, stagger: 0.08, ease: 'expo.inOut' }, 0.5)
      .to('.floater', { scale: 1, rotate: () => gsap.utils.random(-6, 6), duration: 1.2, stagger: 0.07, ease: 'back.out(1.4)' }, 0.7)
      .to('[data-intro]', { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, 0.9)
      .to('.nav', { autoAlpha: 1, y: 0, duration: 0.9, ease: 'expo.out' }, 1)
      .add(() => { $$('.hero__meta span[data-intro]').forEach((m) => scramble(m, m.textContent, 0.9)); heroMouse(); }, 1);
    return tl;
  }

  // proximity: letters near the cursor inhale (narrow + light)
  function heroMouse() {
    if (isTouch || reduce) return;
    const qs = heroChars.map((c) => ({ c, wd: gsap.quickTo(c, '--wd', { duration: 0.7, ease: 'power3' }), wg: gsap.quickTo(c, '--wg', { duration: 0.7, ease: 'power3' }) }));
    const flo = $$('.floater').map((f) => {
      const inn = $('.floater__in', f), d = +f.dataset.depth;
      return { d, x: gsap.quickTo(inn, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(inn, 'y', { duration: 1.2, ease: 'power3' }) };
    });
    let inHero = true;
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: (s) => (inHero = s.isActive) });
    addEventListener('mousemove', (e) => {
      if (!inHero) return;
      qs.forEach(({ c, wd, wg }) => {
        const r = c.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy * 0.6);
        const k = gsap.utils.clamp(0, 1, d / (innerWidth * 0.32));
        wd(62 + k * 63); wg(300 + k * 600);
      });
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      flo.forEach((f) => { f.x(-nx * 60 * f.d); f.y(-ny * 40 * f.d); });
    });
    $('.hero').addEventListener('mouseleave', () => qs.forEach(({ wd, wg }) => { wd(125); wg(900); }));
  }

  // hero scroll-out
  const heroOut = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } });
  heroOut.to(heroChars, { yPercent: (i) => -30 - i * 18, scaleY: 1.5, ease: 'none', stagger: 0.02 }, 0)
    .to('.floater', { y: (i, el) => -innerHeight * 0.9 * (+el.dataset.depth), rotate: (i) => (i % 2 ? 18 : -18), ease: 'none' }, 0)
    .to('.hero__bottom', { autoAlpha: 0, y: -60, ease: 'none' }, 0)
    .to('.hero__lines i', { scaleY: 0, transformOrigin: 'bottom', stagger: 0.03, ease: 'none' }, 0);

  // nav progress
  gsap.to('.nav__progress i', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: 0.3 } });

  /* ------------------------------------------------------------------
     9. MARQUEE — scroll-velocity driven, flips with direction
  ------------------------------------------------------------------ */
  const marqs = $$('.marquee__row').map((row) => ({ inner: $('.marquee__inner', row), dir: +row.dataset.dir, x: 0 }));
  const wrapX = gsap.utils.wrap(-25, 0);
  const skewSet = marqs.map((m) => gsap.quickTo(m.inner, 'skewX', { duration: 0.6, ease: 'power3' }));
  let scrollDir = 1;
  gsap.ticker.add((t, dt) => {
    const v = lenis.velocity || 0;
    if (v > 0.2) scrollDir = 1; else if (v < -0.2) scrollDir = -1;
    const speed = (0.012 + Math.min(Math.abs(v), 60) * 0.006) * (dt / 16.67);
    marqs.forEach((m, i) => {
      m.x = wrapX(m.x - speed * m.dir * scrollDir);
      gsap.set(m.inner, { xPercent: m.x });
      skewSet[i](gsap.utils.clamp(-12, 12, -v * 0.35 * m.dir));
    });
  });

  /* ------------------------------------------------------------------
     10. ABOUT — words light up, pills grow, counters
  ------------------------------------------------------------------ */
  gsap.fromTo(aboutWords, { opacity: 0.12 }, { opacity: 1, stagger: 0.05, ease: 'none', scrollTrigger: { trigger: '.about__text', start: 'top 80%', end: 'bottom 45%', scrub: true } });
  $$('.pill').forEach((p) => {
    gsap.from(p, { width: 0, marginLeft: 0, marginRight: 0, ease: 'none', scrollTrigger: { trigger: p, start: 'top 85%', end: 'top 55%', scrub: true } });
  });
  $$('[data-count]').forEach((el) => {
    const v = +el.dataset.count, o = { n: 0 };
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { n: v, duration: 2, ease: 'expo.out', onUpdate: () => (el.textContent = Math.round(o.n)) }) });
  });
  gsap.from('.services__list li', { y: 40, opacity: 0, stagger: 0.06, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.services__list', start: 'top 85%' } });
  $$('.label').forEach((l) => {
    const t = l.innerHTML;
    ScrollTrigger.create({ trigger: l, start: 'top 92%', once: true, onEnter: () => { gsap.from(l, { opacity: 0, duration: 0.4 }); $$('span', l).forEach((s) => scramble(s, s.textContent, 0.8)); } });
  });

  /* ------------------------------------------------------------------
     11. MEGA TITLES — stretch on scroll / outline fill
  ------------------------------------------------------------------ */
  megas.forEach(({ el, cs }) => {
    const mid = (cs.length - 1) / 2;
    gsap.fromTo(cs, { '--wd': 62, yPercent: (i) => 40 + Math.abs(i - mid) * 18 }, {
      '--wd': 125, yPercent: 0, ease: 'none', stagger: { each: 0.04, from: 'center' },
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 30%', scrub: 0.8 }
    });
    const fill = $('.fill', el);
    if (fill) {
      const fcs = $$('.ch', fill);
      gsap.fromTo(fcs, { '--wd': 62, yPercent: (i) => 40 + Math.abs(i - mid) * 18 }, { '--wd': 125, yPercent: 0, ease: 'none', stagger: { each: 0.04, from: 'center' }, scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 30%', scrub: 0.8 } });
      gsap.fromTo(fill, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 45%', end: 'bottom top', scrub: true } });
    }
  });
  gsap.fromTo(stChars, { '--wd': 62 }, { '--wd': 125, ease: 'none', stagger: { each: 0.05, from: 'start' }, scrollTrigger: { trigger: '.standees', start: 'top 80%', end: 'top 10%', scrub: 0.8 } });

  /* ------------------------------------------------------------------
     12. DIGITAL — pinned horizontal gallery (desktop) / swipe (mobile)
  ------------------------------------------------------------------ */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 761px)', () => {
    const track = $('.hs__track');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const skew = gsap.quickTo('.card', 'skewX', { duration: 0.5, ease: 'power3' });
    const hTween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.hs', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1, refreshPriority: 1,
        onUpdate: (self) => {
          $('.hs__bar i').style.transform = `scaleX(${self.progress})`;
          const n = Math.min(ord.length, 1 + Math.floor(self.progress * ord.length));
          $('.hs__count').textContent = pad(n);
          skew(gsap.utils.clamp(-6, 6, self.getVelocity() / -400));
        },
        onScrubComplete: () => skew(0)
      }
    });
    $$('.card').forEach((card) => {
      const img = $('img', card), cl = $('.card__client', card);
      gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: hTween, start: 'left right', end: 'right left', scrub: true } });
      ScrollTrigger.create({ trigger: card, containerAnimation: hTween, start: 'left 85%', once: true, onEnter: () => scramble(cl, cl.textContent, 0.8) });
    });
    return () => gsap.set('.card', { clearProps: 'skewX' });
  });
  mm.add('(max-width: 760px)', () => {
    const hs = $('.hs');
    const onS = () => {
      const p = hs.scrollLeft / Math.max(1, hs.scrollWidth - hs.clientWidth);
      $('.hs__bar i').style.transform = `scaleX(${p})`;
      $('.hs__count').textContent = pad(Math.min(ord.length, 1 + Math.floor(p * (ord.length - 1) + 0.5)));
    };
    hs.addEventListener('scroll', onS, { passive: true });
    return () => hs.removeEventListener('scroll', onS);
  });
  // upgrade card images to high-res once visible
  const hiObs = new IntersectionObserver((ents) => ents.forEach((e) => {
    if (!e.isIntersecting) return;
    const img = e.target, hi = img.dataset.hi;
    if (hi) { const pre = new Image(); pre.onload = () => (img.src = hi); pre.src = hi; delete img.dataset.hi; }
    hiObs.unobserve(img);
  }), { rootMargin: '0px 400px 0px 400px' });
  $$('img[data-hi]').forEach((i) => hiObs.observe(i));

  /* ------------------------------------------------------------------
     13. DECKS — deal in, fan on hover / on view (touch)
  ------------------------------------------------------------------ */
  gsap.from('.deck', { y: 160, rotate: (i) => (i % 2 ? 12 : -12), opacity: 0, duration: 1.3, stagger: 0.09, ease: 'expo.out', scrollTrigger: { trigger: '.decks__grid', start: 'top 85%' } });
  $$('.deck').forEach((d) => {
    if (!isTouch) { d.addEventListener('mouseenter', () => d.classList.add('is-fanned')); d.addEventListener('mouseleave', () => d.classList.remove('is-fanned')); }
    else ScrollTrigger.create({ trigger: d, start: 'top 60%', end: 'bottom 30%', toggleClass: 'is-fanned' });
  });
  gsap.from('.decks__title', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.decks__head', start: 'top 80%' } });

  /* ------------------------------------------------------------------
     14. PRINT — zoom-through reveal
  ------------------------------------------------------------------ */
  const zl = $('.zoom__w--l'), zr = $('.zoom__w--r');
  gsap.set([zl, zr], { '--wd': 62 });
  gsap.timeline({ scrollTrigger: { trigger: '.zoom', start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
    .to('.zoom__media', { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'power2.inOut', duration: 1 }, 0)
    .to('.zoom__img', { scale: 1, ease: 'power2.inOut', duration: 1 }, 0)
    .to(zl, { xPercent: -70, ease: 'power2.in', duration: 1 }, 0)
    .to(zr, { xPercent: 70, ease: 'power2.in', duration: 1 }, 0)
    .to('.zoom__words', { opacity: 0, duration: 0.3 }, 0.75)
    .from('.zoom__cap', { opacity: 0, y: 20, duration: 0.3 }, 0.8);
  [zl, zr].forEach((w) => (w.style.fontVariationSettings = '"wdth" var(--wd), "wght" 900'));
  gsap.to([zl, zr], { '--wd': 125, ease: 'none', scrollTrigger: { trigger: '.zoom', start: 'top 80%', end: 'top top', scrub: true } });
  ScrollTrigger.create({ trigger: '.zoom', start: '70% bottom', once: true, onEnter: () => scramble($('.zoom__cap-t'), $('.zoom__cap-t').textContent, 1.2) });

  /* ------------------------------------------------------------------
     15. PRINT — scroll flip-book
  ------------------------------------------------------------------ */
  if (leaves.length) {
    const N = leaves.length, book = $('.book__book'), pgEl = $('.book__pg');
    const setZ = (p) => leaves.forEach((L, i) => (L.style.zIndex = p > i + 0.5 ? i + 1 : N - i));
    setZ(0);
    gsap.set(book, { xPercent: -25 });
    const tl = gsap.timeline({
      defaults: { ease: 'power1.inOut' },
      scrollTrigger: {
        trigger: '.book', start: 'top top', end: 'bottom bottom', scrub: 0.7,
        onUpdate: (self) => {
          const p = self.progress * (N + 0.6) - 0.3;
          setZ(p);
          const k = Math.max(0, Math.min(N, Math.round(p)));
          pgEl.textContent = k === 0 ? '01' : k === N ? pad(N * 2) : `${pad(k * 2)}–${pad(k * 2 + 1)}`;
        }
      }
    });
    tl.to({}, { duration: 0.3 });
    leaves.forEach((L, i) => {
      tl.to(L, { rotateY: -180, duration: 1 }, 0.3 + i);
      tl.to($('.leaf__shade', L), { opacity: 0.35, duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.3 + i);
    });
    tl.to(book, { xPercent: 0, duration: 1 }, 0.3);
    tl.to(book, { xPercent: 25, duration: 1 }, 0.3 + N - 1);
    tl.to({}, { duration: 0.3 });
    gsap.from('.book__info > *', { y: 40, opacity: 0, stagger: 0.08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.book', start: 'top 70%' } });
  }

  /* ------------------------------------------------------------------
     16. PRINT — standee columns parallax, grid reveal
  ------------------------------------------------------------------ */
  mm.add('(min-width: 761px)', () => {
    const speeds = [-12, -32, -6];
    $$('.standees__cols .col').forEach((c, i) => gsap.to(c, { yPercent: speeds[i], ease: 'none', scrollTrigger: { trigger: '.standees__cols', start: 'top bottom', end: 'bottom top', scrub: true } }));
  });
  gsap.utils.toArray('.pitem').forEach((p) => {
    gsap.from(p, { y: 80, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 90%' } });
    gsap.fromTo($('img', p), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: p, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ------------------------------------------------------------------
     17. MOTION — reveal, filters (Flip), autoplay previews
  ------------------------------------------------------------------ */
  ScrollTrigger.batch('.vcard', { start: 'top 92%', onEnter: (b) => gsap.from(b, { y: 100, opacity: 0, rotateX: -20, transformPerspective: 800, stagger: 0.08, duration: 1.2, ease: 'expo.out' }), once: true });
  $('.filters').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    $$('.filters button').forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-selected', x === b); });
    const f = b.dataset.f, cards = $$('.vcard');
    const state = Flip.getState(cards);
    cards.forEach((c) => (c.style.display = f === '*' || c.dataset.sub === f ? '' : 'none'));
    Flip.from(state, {
      duration: 0.8, ease: 'expo.inOut', scale: true, absolute: true, nested: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.6, delay: 0.25 }),
      onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
      onComplete: () => ScrollTrigger.refresh()
    });
  });
  const vObs = new IntersectionObserver((ents) => ents.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      if (!v.src) v.src = v.dataset.src;
      const p = v.play(); if (p) p.then(() => v.classList.add('is-playing')).catch(() => {});
    } else { v.pause(); }
  }), { threshold: 0.35 });
  $$('.vcard video').forEach((v) => vObs.observe(v));

  /* ------------------------------------------------------------------
     18. CLIENT INDEX — floating preview follows cursor
  ------------------------------------------------------------------ */
  gsap.from('.client', { yPercent: 100, opacity: 0, stagger: 0.03, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.clients', start: 'top 85%' } });
  if (!isTouch) {
    const fl = $('.clients__float'), flImg = $('img', fl);
    const fx = gsap.quickTo(fl, 'x', { duration: 0.6, ease: 'power3' }), fy = gsap.quickTo(fl, 'y', { duration: 0.6, ease: 'power3' });
    const rot = gsap.quickTo(fl, 'rotate', { duration: 0.8, ease: 'power3' });
    let lastX = 0, cycleT, curClient;
    addEventListener('mousemove', (e) => { fx(e.clientX + 30); fy(e.clientY - 160); rot(gsap.utils.clamp(-14, 14, (e.clientX - lastX) * 0.6)); lastX = e.clientX; });
    $$('.client').forEach((row) => {
      row.addEventListener('mouseenter', () => {
        const arr = groups[row.dataset.client]; curClient = row.dataset.client;
        let k = 0; const show = () => { flImg.src = arr[k % arr.length].thumb; k++; };
        show(); clearInterval(cycleT); cycleT = setInterval(() => curClient === row.dataset.client && show(), 650);
        gsap.to(fl, { opacity: 1, scale: 1, duration: 0.5, ease: 'expo.out' });
      });
      row.addEventListener('mouseleave', () => { clearInterval(cycleT); gsap.to(fl, { opacity: 0, scale: 0.6, duration: 0.4 }); });
    });
  }

  /* ------------------------------------------------------------------
     19. CONTACT — rising letters + cursor wave
  ------------------------------------------------------------------ */
  const allContactChars = contactLines.flat();
  gsap.from(allContactChars, { yPercent: 110, '--wd': 125, stagger: 0.03, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.contact__title', start: 'top 85%' } });
  if (!isTouch && !reduce) {
    const q = allContactChars.map((c) => ({ c, wd: gsap.quickTo(c, '--wd', { duration: 0.6, ease: 'power3' }) }));
    $('.contact').addEventListener('mousemove', (e) => {
      q.forEach(({ c, wd }) => {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), (e.clientY - (r.top + r.height / 2)) * 0.8);
        wd(62 + 63 * Math.max(0, 1 - d / 260));
      });
    });
    $('.contact').addEventListener('mouseleave', () => q.forEach(({ wd }) => wd(62)));
  }
  gsap.fromTo('.contact__giant', { yPercent: 40 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.contact__giant', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  $('.contact__copy').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(SITE.email || ''); scramble(b, 'Copied ✓', 0.6); }
    catch { scramble(b, 'Copy failed', 0.6); }
    setTimeout(() => scramble(b, 'Copy email', 0.6), 2200);
  });
  // magnetic email
  if (!isTouch) {
    const em = $('.contact__email');
    const mx = gsap.quickTo(em, 'x', { duration: 0.6, ease: 'power3' }), my = gsap.quickTo(em, 'y', { duration: 0.6, ease: 'power3' });
    em.addEventListener('mousemove', (e) => { const r = em.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.15); my((e.clientY - r.top - r.height / 2) * 0.3); });
    em.addEventListener('mouseleave', () => { mx(0); my(0); });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
