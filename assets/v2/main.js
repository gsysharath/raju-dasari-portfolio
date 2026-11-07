/* =====================================================================
   VERSION B — "EDITORIAL"  ·  interactions
   Requires: config.js, data.js, gsap (+ScrollTrigger, SplitText), lenis, lightbox
   ===================================================================== */
(() => {
  'use strict';
  const SITE = window.SITE || {};
  const ITEMS = (window.WORK && window.WORK.items) || [];
  gsap.registerPlugin(ScrollTrigger, SplitText);

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isTouch = matchMedia('(hover: none)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const byId = (id) => ITEMS.find((i) => i.id === id);
  const pick = (ids) => ids.map(byId).filter(Boolean);
  const stillPages = (it) => (it.kind === 'video' ? [{ src: it.poster, thumb: it.thumb, w: it.w, h: it.h }] : it.pages ? it.pages : [{ src: it.src, thumb: it.thumb, w: it.w, h: it.h }]);

  history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ------------------------------------------------------------------
     1. CONFIG → DOM
  ------------------------------------------------------------------ */
  if (!SITE.fullName) SITE.fullName = [SITE.name, SITE.surname].filter(Boolean).join(' ');
  $$('[data-site]').forEach((el) => { const k = el.dataset.site; if (SITE[k] != null) el.textContent = SITE[k]; });
  $('.hero__name').setAttribute('aria-label', SITE.fullName);
  $$('[data-site-href]').forEach((a) => {
    const k = a.dataset.siteHref;
    if (k === 'mailto') a.href = 'mailto:' + (SITE.email || '');
    if (k === 'tel') a.href = 'tel:' + (SITE.phone || '').replace(/[^\d+]/g, '');
  });
  $$('.socials').forEach((w) => (w.innerHTML = (SITE.socials || []).filter((s) => s.url).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join('')));
  const clocks = $$('[data-clock]');
  const tickClock = () => {
    let t; try { t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: SITE.timezone, timeZoneName: 'short' }); } catch { t = new Date().toLocaleTimeString(); }
    clocks.forEach((c) => (c.textContent = t.toUpperCase()));
  };
  tickClock(); setInterval(tickClock, 15000);

  // split text into .ch spans, keeping inline elements like <em>
  function splitChars(el) {
    const out = [];
    const walk = (node, target) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          [...n.textContent].forEach((c) => {
            if (c === ' ' || c === '\n') { target.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; s.setAttribute('aria-hidden', 'true');
            target.appendChild(s); out.push(s);
          });
        } else if (n.nodeType === 1) {
          const clone = n.cloneNode(false); target.appendChild(clone); walk(n, clone);
        }
      });
    };
    const frag = document.createElement('span'); frag.className = 'split-in';
    walk(el, frag);
    el.textContent = ''; el.appendChild(frag);
    // collapse whitespace text nodes into word groups so lines don't break mid-word
    return out;
  }
  function fitText(el, ratio = 1) {
    const inner = el.querySelector('.fit-in');
    el.style.fontSize = '100px';
    const w = inner.getBoundingClientRect().width;
    const avail = el.clientWidth;
    if (w > 0) el.style.fontSize = (100 * avail / w) * ratio + 'px';
  }

  /* ------------------------------------------------------------------
     2. RENDER
  ------------------------------------------------------------------ */
  // hero collage
  const collage = [
    { id: 'dlab-the-smallest-instrument-on-the-bench', l: 3, t: 45, w: 9, r: -8, d: 0.6 },
    { id: 'catalyst-cue-magazine-catalyst-cue-live-now', l: 88.5, t: 21, w: 7.5, r: 7, d: 1 },
    { id: 'heidolph-laboratory-tools-for-synthesis', l: 63, t: 67, w: 14, r: -4, d: 0.8 },
    { id: 'zeiss-fastest-growing-partner', l: 2.5, t: 17, w: 7, r: 5, d: 1.2 }
  ];
  $('.hero__collage').innerHTML = collage.map((c) => {
    const it = byId(c.id); if (!it) return '';
    return `<figure class="print-pin" data-depth="${c.d}" data-rot="${c.r}" style="left:${c.l}%;top:${c.t}%;--w:clamp(90px,${c.w}vw,${c.w * 17}px);--ar:${it.w}/${it.h};transform:rotate(${c.r}deg)"><img src="${it.thumb}" alt=""></figure>`;
  }).join('');

  // bands
  const bandA = ['Social campaigns', 'Carousels', 'Email & web banners', 'Expo graphics', 'Editorial', 'Motion reels'];
  const bandB = ['Now booking 2027', 'Freelance & full-time', 'Hyderabad × anywhere', 'Say hello'];
  const bandHTML = (arr) => { const h = arr.map((w) => `<span class="band__item">${w}<i>✦</i></span>`).join(''); return h + h + h + h; };
  $('.band--a .band__in').innerHTML = bandHTML(bandA);
  $('.band--b .band__in').innerHTML = bandHTML(bandB);

  // contents
  const digitalAll = ITEMS.filter((i) => i.cat === 'digital' && i.sub !== 'Carousels');
  const carousels = ITEMS.filter((i) => i.sub === 'Carousels');
  const vids = ITEMS.filter((i) => i.kind === 'video');
  const toc = [
    { t: 'Selected work', d: 'Six feature stories', p: 'p. 04', href: '#work', img: 'chemspeed-coating-r-d-webinar' },
    { t: 'The feed', d: `${digitalAll.length} posts, mailers & banners`, p: 'p. 12', href: '#feed', img: 'nanalysis-benchtop-nmr-spectrometers' },
    { t: 'Carousel stories', d: `${carousels.length} swipe series`, p: 'p. 18', href: '.swipe', img: 'photon-etc-what-your-camera-can-t-see' },
    { t: 'Print & editorial', d: 'Magazines, standees, posters', p: 'p. 24', href: '#print', img: 'catalyst-cue-magazine-catalyst-cue-vol-03-issue-01' },
    { t: 'Motion', d: `${vids.length} reels & films`, p: 'p. 32', href: '#motion', img: 'dussehra-2026' },
    { t: 'Say hello', d: 'Open for projects', p: 'p. 40', href: '#contact', img: 'sartorius-partner-award-2026' }
  ];
  $('.toc__list').innerHTML = toc.map((r, i) => `<li class="toc__row" data-href="${r.href}" data-img="${(byId(r.img) || {}).thumb || ''}" data-cur="Read"><span class="toc__n">${pad(i + 1)}</span><span><span class="toc__t">${esc(r.t)}</span></span><span class="toc__d">${esc(r.d)}</span><span class="toc__p">${r.p}</span></li>`).join('');

  // selected work — stacking cards
  const FEATURES = [
    { t: 'Automation, in <em>conversation</em>', client: 'Chemspeed', tags: ['Social', 'Email', 'Web banners'], c: ['#2337ff', '#efe9dd'],
      d: "A running LinkedIn and email series for Chemspeed's lab-automation roadshow — customer visits, webinars and expert sessions told through one bold blue-and-orange system.",
      ids: ['chemspeed-coating-r-d-webinar', 'chemspeed-the-future-of-scientific-automation', 'chemspeed-the-lab-of-the-future', 'chemspeed-ai-driven-discovery-research', 'chemspeed-from-customer-visits-to-action', 'chemspeed-solutions-start-at-the-customer-s-bench'] },
    { t: 'We are <em>here</em>', client: 'Analytica Lab India 2026', tags: ['Campaign', 'Social', 'Motion'], c: ['#ff4a1c', '#16130f'],
      d: 'An end-to-end expo campaign: a mascot-led countdown, teaser reels, stall invites, email banners and thank-you films for India’s biggest lab show.',
      ids: ['inkarp-we-are-here-analytica-lab-india-2026', 'next-stop-analytica-2026', 'inkarp-analytica-mumbai-2026', 'inkarp-meet-us-at-analytica-lab-india', 'inkarp-visit-us-analytica-lab-india-2025'] },
    { t: 'Catalyst <em>Cue</em>', client: 'Science magazine', tags: ['Editorial', 'Launch', 'Motion'], c: ['#16130f', '#efe9dd'],
      d: 'Covers, layouts and the launch campaign for a quarterly science magazine — from coming-soon teasers to a “live now” film.',
      ids: ['catalyst-cue-magazine-catalyst-cue-vol-03-issue-01', 'catalyst-cue-magazine-catalyst-cue-live-now', 'catalyst-cue-magazine-catalyst-cue-launch-film', 'catalyst-cue-magazine-catalyst-cue-pre-launch-teaser', 'catalyst-cue-catalyst-cue-curated-for-you'] },
    { t: 'The curious <em>scientist</em>', client: 'Product highlights', tags: ['Social', 'Character', 'Carousels'], c: ['#e2d8c4', '#16130f'],
      d: 'A recurring 3D scientist who questions, explains and celebrates — giving dense product specs a friendly, instantly recognisable face across brands.',
      ids: ['dlab-the-smallest-instrument-on-the-bench', 'jeiotech-heat-alone-can-damage-samples', 'nenovision-sem-shows-what-it-looks-like', 'radleys-oil-bath-vs-heat-on', 'nanosurf-autonomous-afm-webinar'] },
    { t: 'On the show <em>floor</em>', client: 'Vizag Expo 2026', tags: ['Large format', 'Print'], c: ['#c9e4d6', '#16130f'],
      d: 'Five modular display panels plus standees that let an entire product portfolio read clearly from across an exhibition hall.',
      ids: ['vizag-expo-2026', 'labstation-labstation-i-glovebox-standee', 'rotachrom-cpc-modeler-standee'] },
    { t: 'Clean, clinical, <em>confident</em>', client: 'Being Instruments', tags: ['Posters', 'Backdrops'], c: ['#d9d2f7', '#16130f'],
      d: 'A poster and backdrop system built on crisp product photography, sweeping blue curves and scannable QR call-outs.',
      ids: ['being-instruments-biosafety-cabinet-poster', 'being-instruments-water-bath-backdrop', 'being-instruments-rotary-evaporator-poster', 'being-instruments-product-range-poster'] }
  ];
  $('.stack').innerHTML = FEATURES.map((f, i) => {
    const its = pick(f.ids);
    const vis = its.slice(0, 3).map((it) => `<div class="scard__img" data-id="${it.id}" data-cur="${it.kind === 'video' ? 'Play' : 'View'}"><img src="${it.kind === 'video' ? it.thumb : it.thumb}" alt="${esc(it.title)}" loading="lazy">${it.kind === 'video' ? '<span class="vtag">▶ Film</span>' : ''}</div>`).join('');
    return `<article class="scard" style="--i:${i};--c-bg:${f.c[0]};--c-fg:${f.c[1]}" data-f="${i}">
      <div class="scard__text">
        <div class="scard__top"><span>${pad(i + 1)} / ${pad(FEATURES.length)}</span><span>${esc(f.client)}</span></div>
        <h3 class="scard__t">${f.t}</h3>
        <p class="scard__d">${esc(f.d)}</p>
        <div class="scard__tags">${f.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
        <button class="pill-btn scard__cta" data-f="${i}">View the project — ${its.reduce((n, it) => n + stillPages(it).length, 0)} frames ↗</button>
      </div>
      <div class="scard__vis">${vis}</div><div class="scard__shade"></div></article>`;
  }).join('');

  // feed strips
  const posts = digitalAll.filter((i) => i.w / i.h < 1.1);
  const wides = digitalAll.filter((i) => i.w / i.h >= 1.1);
  const half = Math.ceil(posts.length / 2);
  const fitem = (it) => `<figure class="fitem" data-id="${it.id}" style="--ar:${it.w}/${it.h}" data-cur="View"><img src="${it.thumb}" alt="${esc(it.title)}" loading="lazy"><figcaption class="fitem__cap"><b>${esc(it.client)}</b>${esc(it.title)}</figcaption></figure>`;
  const strips = $$('.strip__in');
  strips[0].innerHTML = posts.slice(0, half).map(fitem).join('');
  strips[1].innerHTML = wides.map(fitem).join('');
  strips[2].innerHTML = posts.slice(half).map(fitem).join('');

  // swipe / phone
  const slides = [];
  carousels.forEach((c, k) => (c.pages || [c]).forEach((p, j) => slides.push({ k, j, thumb: p.thumb })));
  const ranges = carousels.map((c, k) => { const idx = slides.map((s, i) => (s.k === k ? i : -1)).filter((i) => i >= 0); return [idx[0], idx[idx.length - 1]]; });
  $('.phone__track').innerHTML = slides.map((s) => `<img src="${s.thumb}" alt="" loading="lazy">`).join('');
  $('.swipe__list').innerHTML = carousels.map((c, k) => `<li data-k="${k}"><span class="sl-c">${esc(c.client)}</span><span class="sl-t">${esc(c.title)}</span></li>`).join('');
  $('.swipe__of').textContent = '/ ' + pad(carousels.length);

  // fan
  const mag = ITEMS.find((i) => i.id.includes('vol-03-issue-01'));
  const fanPages = mag && mag.pages ? mag.pages.slice(0, 9) : [];
  $('.fan__deck').innerHTML = fanPages.map((p, i) => `<figure class="fan__page" data-i="${i}" style="--ar:${p.w}/${p.h};z-index:${fanPages.length - i}" data-cur="Read"><img src="${p.thumb}" alt="Catalyst Cue page ${i + 1}" loading="lazy"></figure>`).join('');
  if (mag) $('.fan__open').addEventListener('click', () => Lightbox.open(mag, 0));

  // floor standees
  const vizag = byId('vizag-expo-2026');
  const stnds = [];
  if (vizag) vizag.pages.forEach((p, i) => stnds.push({ it: vizag, i, thumb: p.thumb, w: p.w, h: p.h, cap: `Panel ${pad(i + 1)}` }));
  pick(['labstation-labstation-i-glovebox-standee', 'rotachrom-cpc-modeler-standee']).forEach((it) => stnds.push({ it, i: 0, thumb: it.thumb, w: it.w, h: it.h, cap: it.client }));
  const order = stnds.length === 7 ? [5, 0, 1, 2, 3, 4, 6] : stnds.map((_, i) => i);
  $('.floor__row').innerHTML = order.map((k) => { const s = stnds[k]; return `<figure class="stnd" data-k="${k}" data-cur="View"><img src="${s.thumb}" alt="${esc(s.it.title)} — ${esc(s.cap)}" width="${s.w}" height="${s.h}" loading="lazy"><figcaption>${esc(s.cap)}</figcaption></figure>`; }).join('');
  $$('.stnd').forEach((el) => el.addEventListener('click', () => { const s = stnds[+el.dataset.k]; Lightbox.open(s.it, s.i); }));

  // spreads
  const spreads = pick(['being-instruments-product-range-poster', 'inkarp-chennai-aict-backdrop', 'inkarp-corporate-diary-2026', 'inkarp-full-page-brand-advertisement', 'being-instruments-water-bath-backdrop', 'mettler-toledo-fp20-bio-ph-meter-flyer-a5']);
  $('.spreads').innerHTML = spreads.map((it) => `<figure class="spread" data-id="${it.id}" data-cur="${it.pages ? 'Flip' : 'View'}"><div class="spread__img" style="--ar:${Math.max(0.72, it.w / it.h).toFixed(3)}"><img src="${it.thumb}" alt="${esc(it.title)}" loading="lazy"></div><figcaption class="spread__cap"><span class="spread__t">${esc(it.title)}</span><span class="spread__c">${esc(it.client)}${it.pages ? ' · ' + it.pages.length + ' pp' : ''}</span></figcaption></figure>`).join('');

  // ring
  $('.ring').innerHTML = vids.map((v, i) => `<div class="rcard" data-id="${v.id}" data-i="${i}" data-cur="Play"><img src="${v.thumb}" alt="${esc(v.title)}" loading="lazy"><video muted loop playsinline preload="none" data-src="${v.preview}"></video></div>`).join('');

  // clients marquee + services
  const groups = {};
  ITEMS.forEach((i) => (groups[i.client] = (groups[i.client] || 0) + 1));
  const names = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const mid = Math.ceil(names.length / 2);
  const cm = (arr) => { const h = arr.map(([n, c]) => `<span class="cmarq__item">${esc(n)}<sup>${pad(c)}</sup><i>✦</i></span>`).join(''); return h + h + h; };
  const cmIns = $$('.cmarq__in');
  cmIns[0].innerHTML = cm(names.slice(0, mid));
  cmIns[1].innerHTML = cm(names.slice(mid));
  $('.services').innerHTML = (SITE.services || []).map((s, i) => `<div class="svc"><b>${pad(i + 1)}</b><span>${esc(s)}</span></div>`).join('');

  // clicks → lightbox
  document.addEventListener('click', (e) => {
    const cta = e.target.closest('.scard__cta');
    if (cta) {
      const f = FEATURES[+cta.dataset.f], its = pick(f.ids);
      Lightbox.open({ title: f.t.replace(/<[^>]+>/g, ''), client: f.client, kind: 'doc', pages: its.flatMap(stillPages) }, 0);
      return;
    }
    const el = e.target.closest('.scard__img, .fitem, .spread, .rcard');
    if (el) { const it = byId(el.dataset.id); if (it) Lightbox.open(it, 0); return; }
    const fp = e.target.closest('.fan__page');
    if (fp && mag) { Lightbox.open(mag, +fp.dataset.i); return; }
  });

  /* ------------------------------------------------------------------
     3. SMOOTH SCROLL + THEMES + MASTHEAD
  ------------------------------------------------------------------ */
  const lenis = new Lenis({ lerp: reduce ? 1 : 0.09, smoothWheel: !reduce });
  window.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  lenis.stop();

  const goTo = (target) => lenis.scrollTo(target, { duration: 1.8, easing: (x) => 1 - Math.pow(1 - x, 4) });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a) {
      const id = a.getAttribute('href'); const t = id === '#top' ? 0 : $(id);
      if (t === null) return;
      e.preventDefault(); if (document.body.classList.contains('menu-open')) toggleMenu(false); goTo(t); return;
    }
    const row = e.target.closest('.toc__row');
    if (row) { const t = $(row.dataset.href); if (t) goTo(t); }
  });

  const THEMES = { paper: ['#efe9dd', '#16130f'], sand: ['#e2d8c4', '#16130f'], ink: ['#16130f', '#efe9dd'] };
  let curTheme = 'paper';
  const setTheme = (t) => {
    if (t === curTheme || !THEMES[t]) return; curTheme = t;
    gsap.to(document.body, { '--bg': THEMES[t][0], '--fg': THEMES[t][1], duration: 0.9, ease: 'power2.out', overwrite: true });
    const meta = $('meta[name="theme-color"]'); if (meta) meta.content = THEMES[t][0];
  };
  gsap.set(document.body, { '--bg': THEMES.paper[0], '--fg': THEMES.paper[1] });
  $$('[data-theme]').forEach((sec) => ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: (s) => s.isActive && setTheme(sec.dataset.theme) }));

  const mast = $('.mast');
  lenis.on('scroll', ({ scroll, direction }) => {
    mast.style.setProperty('--mast-bg', scroll > 80 ? 1 : 0);
    if (!document.body.classList.contains('menu-open')) mast.classList.toggle('is-hidden', direction > 0 && scroll > 400);
  });

  /* ------------------------------------------------------------------
     4. CURSOR
  ------------------------------------------------------------------ */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  if (!isTouch) {
    const cur = $('.cur'), lbl = $('.cur__lbl');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.4, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: 0.4, ease: 'power3' });
    addEventListener('mousemove', (e) => { cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-cur]');
      cur.classList.toggle('is-big', !!t); if (t) lbl.textContent = t.dataset.cur;
    });
  }

  /* ------------------------------------------------------------------
     5. MENU
  ------------------------------------------------------------------ */
  const menu = $('.menu'), menuBtn = $('.mast__menu');
  const menuImgs = ['chemspeed-coating-r-d-webinar', 'heidolph-laboratory-tools-for-synthesis', 'catalyst-cue-magazine-catalyst-cue-live-now', 'sankranthi', 'zeiss-fastest-growing-partner'].map((id) => (byId(id) || {}).thumb);
  const menuImgBox = $('.menu__img');
  function showMenuImg(i) {
    const im = document.createElement('img'); im.src = menuImgs[i] || ''; im.alt = '';
    menuImgBox.appendChild(im);
    gsap.fromTo(im, { clipPath: 'inset(100% 0 0 0)', scale: 1.2 }, { clipPath: 'inset(0% 0 0 0)', scale: 1, duration: 0.8, ease: 'expo.out', onComplete: () => { while (menuImgBox.children.length > 1) menuImgBox.firstChild.remove(); } });
  }
  function toggleMenu(open) {
    document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open);
    $('.mast__menu-t').textContent = open ? 'Close' : 'Contents';
    if (open) {
      lenis.stop(); menu.classList.add('is-open'); mast.classList.remove('is-hidden');
      gsap.fromTo(menu, { clipPath: 'circle(0% at 100% 0%)' }, { clipPath: 'circle(150% at 100% 0%)', duration: 1, ease: 'expo.inOut' });
      gsap.fromTo('.menu__t', { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.06, ease: 'expo.out', delay: 0.35 });
      showMenuImg(0);
    } else {
      gsap.to(menu, { clipPath: 'circle(0% at 100% 0%)', duration: 0.8, ease: 'expo.inOut', onComplete: () => menu.classList.remove('is-open') });
      lenis.start();
    }
  }
  menuBtn.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
  $$('.menu__nav a').forEach((a) => a.addEventListener('mouseenter', () => showMenuImg(+a.dataset.menuImg)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu-open')) toggleMenu(false); });

  /* ------------------------------------------------------------------
     6. TEXT SETUP
  ------------------------------------------------------------------ */
  const heroName = $('.hero__name');
  const firstChars = splitChars($('.hn--first'));
  const lastChars = splitChars($('.hn__word'));
  const heroChars = [...firstChars, ...lastChars];
  const swash = $('.hn__swash path');
  const swashLen = swash ? swash.getTotalLength() : 0;
  const fitHero = () => fitText(heroName, innerWidth < 760 ? 0.92 : 0.76);
  fitHero();

  const morphs = $$('[data-morph]').map((el) => ({ el, cs: splitChars(el) }));
  const waveChars = splitChars($('[data-wave]'));
  const contactChars = $$('.cl').map((l) => splitChars(l)).flat();

  // rotating italic word
  const rot = $('.rot'), rotIn = $('.rot__in');
  const rotWords = $$('em', rotIn);
  rotIn.appendChild(rotWords[0].cloneNode(true));
  let rotI = 0;
  const rotW = () => rotWords.map((w) => w.scrollWidth);
  let rotWidths = rotW();
  rot.style.width = rotWidths[0] + 'px';
  function rotNext() {
    rotI++;
    const h = rotWords[0].offsetHeight;
    gsap.to(rotIn, { y: -rotI * h, duration: 0.9, ease: 'expo.inOut', onComplete: () => { if (rotI === rotWords.length) { rotI = 0; gsap.set(rotIn, { y: 0 }); } } });
    rot.style.width = rotWidths[rotI % rotWords.length] + 'px';
  }

  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { fitHero(); rotWidths = rotW(); rot.style.width = rotWidths[rotI % rotWords.length] + 'px'; ScrollTrigger.refresh(); }, 200); });

  /* ------------------------------------------------------------------
     7. LOADER — dealing cards
  ------------------------------------------------------------------ */
  const ld = $('.ld'), stack = $('.ld__stack');
  const ldSrc = ITEMS.filter((i) => i.featured && i.kind !== 'video').filter((_, i) => i % 2 === 0).slice(0, 14).map((i) => i.thumb);
  const heroSrc = collage.map((c) => (byId(c.id) || {}).thumb).filter(Boolean);
  const critical = [...new Set([...ldSrc, ...heroSrc])];
  let loaded = 0;
  critical.forEach((s) => { const im = new Image(); im.onload = im.onerror = () => loaded++; im.src = s; });
  let fontsDone = false;
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { fontsDone = true; fitHero(); rotWidths = rotW(); rot.style.width = rotWidths[rotI % rotWords.length] + 'px'; });

  const ldN = $('.ld__n'), ldBar = $('.ld__bar i');
  let shown = 0, dealt = 0, lastDeal = 0, z = 1;
  const t0 = performance.now(), MIN = reduce ? 300 : 2800;
  function deal() {
    const src = ldSrc[dealt % ldSrc.length]; dealt++;
    const c = document.createElement('div'); c.className = 'ld__card'; c.style.zIndex = z++;
    c.innerHTML = `<img src="${src}" alt="">`;
    stack.appendChild(c);
    gsap.fromTo(c, { yPercent: 130, rotate: gsap.utils.random(-14, 14), scale: 0.9 }, { yPercent: 0, rotate: gsap.utils.random(-5, 5), scale: 1, duration: 0.7, ease: 'expo.out' });
    if (stack.children.length > 5) stack.firstChild.remove();
  }
  function ldTick() {
    const real = (loaded / critical.length) * (fontsDone ? 1 : 0.9);
    const target = Math.min(real, Math.min(1, (performance.now() - t0) / MIN)) * 100;
    shown += (target - shown) * 0.08;
    if (target >= 100 && shown > 99.4) shown = 100;
    ldN.textContent = Math.floor(shown);
    ldBar.style.transform = `scaleX(${shown / 100})`;
    if (performance.now() - lastDeal > 230 && shown < 100) { lastDeal = performance.now(); deal(); }
    if (shown >= 100) { gsap.ticker.remove(ldTick); exit(); }
  }
  gsap.ticker.add(ldTick);

  function exit() {
    fitHero();
    const top = stack.lastElementChild;
    const r = top.getBoundingClientRect();
    const s = Math.max(innerWidth / r.width, innerHeight / r.height) * 1.15;
    const tl = gsap.timeline();
    tl.to(['.ld__top', '.ld__foot'], { opacity: 0, duration: 0.4 })
      .to(top, { rotate: 0, scale: s, borderRadius: 0, duration: 1.1, ease: 'expo.inOut' }, 0.1)
      .to(ld, { yPercent: -100, duration: 1.1, ease: 'expo.inOut' }, 1.05)
      .to(ld, { borderBottomLeftRadius: '50% 18%', borderBottomRightRadius: '50% 18%', duration: 0.6, ease: 'power2.in' }, 1.05)
      .add(() => { document.body.classList.remove('is-loading'); lenis.start(); ScrollTrigger.refresh(); }, 1.3)
      .add(intro(), 1.25)
      .set(ld, { display: 'none' });
  }

  /* ------------------------------------------------------------------
     8. HERO
  ------------------------------------------------------------------ */
  gsap.set(firstChars, { yPercent: 110, '--w': 900, '--s': 0 });
  gsap.set(lastChars, { yPercent: 120, rotateX: -85, opacity: 0, '--w': 900, '--s': 0, transformPerspective: 700, transformOrigin: '50% 100%' });
  if (swash) gsap.set(swash, { strokeDasharray: swashLen, strokeDashoffset: swashLen });
  gsap.set('.print-pin', { y: () => innerHeight * 0.7, opacity: 0 });
  gsap.set(['.hero__rules', '.hero__tag', '.hero__foot'], { opacity: 0, y: 30 });
  gsap.set(mast, { yPercent: -120 });

  function intro() {
    const tl = gsap.timeline();
    tl.to(firstChars, { yPercent: 0, duration: 1.4, stagger: 0.07, ease: 'expo.out' }, 0)
      .to(firstChars, { '--w': 380, '--s': 100, duration: 1.8, stagger: 0.07, ease: 'expo.inOut' }, 0.3)
      // surname: letters flip up one by one, then settle from bold to light italic
      .to(lastChars, { yPercent: 0, rotateX: 0, opacity: 1, duration: 1.3, stagger: 0.07, ease: 'expo.out' }, 0.55)
      .to(lastChars, { '--w': 300, '--s': 100, duration: 1.6, stagger: 0.07, ease: 'expo.inOut' }, 0.85);
    if (swash) tl.to(swash, { strokeDashoffset: 0, duration: 1.4, ease: 'expo.inOut' }, 1.15);
    tl.to('.print-pin', { y: 0, opacity: 1, duration: 1.4, stagger: 0.1, ease: 'expo.out' }, 0.25)
      .to(['.hero__rules', '.hero__tag', '.hero__foot'], { opacity: 1, y: 0, duration: 1, stagger: 0.1, ease: 'expo.out' }, 0.6)
      .to(mast, { yPercent: 0, duration: 1, ease: 'expo.out' }, 0.8)
      .add(() => { setInterval(rotNext, 2300); heroMouse(); surnameFx(); }, 1.2);
    return tl;
  }

  // surname: a weight wave ripples through "Dasari" every few seconds, the swash redraws, letters hop on hover
  function surnameFx() {
    if (!lastChars.length) return;
    if (!isTouch) lastChars.forEach((c) => c.addEventListener('mouseenter', () => {
      gsap.fromTo(c, { y: 0 }, { y: -c.offsetHeight * 0.18, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.out' });
    }));
    if (reduce) return;
    const wave = gsap.timeline({ repeat: -1, repeatDelay: 3.4, delay: 2.2 });
    wave.to(lastChars, { '--w': 820, '--s': 0, yPercent: -9, duration: 0.45, stagger: 0.08, ease: 'sine.inOut' }, 0)
      .to(lastChars, { '--w': 300, '--s': 100, yPercent: 0, duration: 0.75, stagger: 0.08, ease: 'sine.inOut' }, 0.45);
    if (swash) {
      wave.fromTo(swash, { strokeDashoffset: 0 }, { strokeDashoffset: -swashLen, duration: 0.8, ease: 'power2.in', immediateRender: false }, 0.15)
        .fromTo(swash, { strokeDashoffset: swashLen }, { strokeDashoffset: 0, duration: 1.1, ease: 'expo.out', immediateRender: false }, 0.95);
    }
  }

  function heroMouse() {
    if (isTouch || reduce) return;
    const q = firstChars.map((c) => ({ c, w: gsap.quickTo(c, '--w', { duration: 0.8, ease: 'power3' }), s: gsap.quickTo(c, '--s', { duration: 0.8, ease: 'power3' }) }));
    const pins = $$('.print-pin').map((p) => ({ d: +p.dataset.depth, x: gsap.quickTo($('img', p), 'x', { duration: 1, ease: 'power3' }), y: gsap.quickTo($('img', p), 'y', { duration: 1, ease: 'power3' }) }));
    let active = true;
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: (s) => (active = s.isActive) });
    addEventListener('mousemove', (e) => {
      if (!active) return;
      q.forEach(({ c, w, s }) => {
        const r = c.getBoundingClientRect();
        const d = Math.abs(e.clientX - (r.left + r.width / 2));
        const k = Math.max(0, 1 - d / (innerWidth * 0.35));
        w(380 + k * 520); s(100 - k * 100);
      });
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      pins.forEach((p) => { p.x(nx * 14 * p.d); p.y(ny * 10 * p.d); });
    });
  }

  // hero scroll-out: letters drift apart, prints straighten and fly
  const hmid = (heroChars.length - 1) / 2;
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 } })
    .to(heroChars, { x: (i) => (i - hmid) * innerWidth * 0.045, rotate: (i) => (i - hmid) * 5, ease: 'none' }, 0)
    .to(firstChars, { '--w': 900, ease: 'none' }, 0)
    .to('.hn__swash', { opacity: 0, ease: 'none' }, 0)
    .to('.print-pin', { rotate: 0, y: (i, el) => -innerHeight * 0.6 * (+el.dataset.depth), ease: 'none' }, 0)
    .to('.hero__tag', { yPercent: -60, opacity: 0, ease: 'none' }, 0);

  /* ------------------------------------------------------------------
     9. BANDS + CLIENT MARQUEES (velocity driven)
  ------------------------------------------------------------------ */
  const loops = [
    { el: $('.band--a .band__in'), dir: 1, span: 25 }, { el: $('.band--b .band__in'), dir: -1, span: 25 },
    { el: cmIns[0], dir: 1, span: 33.333 }, { el: cmIns[1], dir: -1, span: 33.333 }
  ].map((l) => ({ ...l, x: l.dir > 0 ? 0 : -l.span }));
  gsap.ticker.add((t, dt) => {
    const v = lenis.velocity || 0;
    const sp = (0.018 + Math.min(Math.abs(v), 50) * 0.005) * (dt / 16.67);
    loops.forEach((l) => {
      l.x -= sp * l.dir * (v < -0.3 ? -1 : 1);
      if (l.x <= -l.span) l.x += l.span; if (l.x > 0) l.x -= l.span;
      gsap.set(l.el, { xPercent: l.x });
    });
  });

  /* ------------------------------------------------------------------
     10. CONTENTS
  ------------------------------------------------------------------ */
  const tocSplit = SplitText.create('.toc__title', { type: 'chars' });
  gsap.from(tocSplit.chars, { yPercent: 100, opacity: 0, rotate: 8, stagger: 0.04, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.toc__title', start: 'top 85%' } });
  gsap.fromTo('.toc__row', { '--ln': 0 }, { '--ln': 1, stagger: 0.1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: '.toc__list', start: 'top 85%' } });
  gsap.from('.toc__row > *', { y: 30, opacity: 0, stagger: 0.03, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.toc__list', start: 'top 85%' } });
  $$('.kicker__line').forEach((l) => gsap.fromTo(l, { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: l, start: 'top 90%' } }));
  if (!isTouch) {
    const peek = $('.toc__peek'), pImg = $('img', peek);
    const px = gsap.quickTo(peek, 'x', { duration: 0.7, ease: 'power3' }), py = gsap.quickTo(peek, 'y', { duration: 0.7, ease: 'power3' });
    $('.toc__list').addEventListener('mousemove', (e) => { px(e.clientX - 120); py(e.clientY - 150); });
    $$('.toc__row').forEach((r) => {
      r.addEventListener('mouseenter', () => {
        pImg.src = r.dataset.img;
        gsap.to(peek, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'expo.out' });
        gsap.fromTo(pImg, { scale: 1.3 }, { scale: 1, duration: 1, ease: 'expo.out' });
      });
      r.addEventListener('mouseleave', () => gsap.to(peek, { clipPath: 'inset(50% 50% 50% 50%)', duration: 0.5, ease: 'expo.in' }));
    });
  }

  /* ------------------------------------------------------------------
     11. SECTION HEADS — weight & softness morph on scroll
  ------------------------------------------------------------------ */
  morphs.forEach(({ el, cs }) => {
    gsap.fromTo(cs, { '--w': 900, '--s': 0, yPercent: 60, opacity: 0 }, {
      '--w': 380, '--s': 100, yPercent: 0, opacity: 1, ease: 'none', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 45%', scrub: 0.8 }
    });
  });
  $$('.sechead__p').forEach((p) => gsap.from(p, { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: p, start: 'top 90%' } }));
  $$('[data-lines]').forEach((el) => {
    if (el.classList.contains('toc__title')) return;
    const sp = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(sp.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
  });

  /* ------------------------------------------------------------------
     12. STACKING CARDS
  ------------------------------------------------------------------ */
  const cards = $$('.scard');
  cards.forEach((c, i) => {
    const next = cards[i + 1];
    if (next) {
      gsap.to(c, { scale: 0.88 + i * 0.012, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } });
      gsap.to($('.scard__shade', c), { opacity: 0.4, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 20%', scrub: true } });
    }
    const title = $('.scard__t', c);
    const sp = SplitText.create(title, { type: 'lines', mask: 'lines' });
    gsap.from(sp.lines, { yPercent: 110, duration: 1.2, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 60%' } });
    gsap.from($$('.scard__img', c), { clipPath: 'inset(100% 0 0 0)', duration: 1.4, stagger: 0.12, ease: 'expo.inOut', scrollTrigger: { trigger: c, start: 'top 70%' } });
  });

  /* ------------------------------------------------------------------
     13. FEED — film strips slide in opposite directions
  ------------------------------------------------------------------ */
  $$('.strip').forEach((s) => {
    const inn = $('.strip__in', s), sp = +s.dataset.speed;
    const travel = () => Math.max(0, inn.scrollWidth - innerWidth) * Math.min(1, Math.abs(sp));
    gsap.fromTo(inn, { x: () => (sp < 0 ? 0 : -travel()) }, { x: () => (sp < 0 ? -travel() : 0), ease: 'none', scrollTrigger: { trigger: '.strips', start: 'top bottom', end: 'bottom top', scrub: 0.6, invalidateOnRefresh: true } });
  });
  const fc = $('.feed__count'), fco = { n: 0 };
  ScrollTrigger.create({ trigger: '.feed', start: 'top 70%', once: true, onEnter: () => gsap.to(fco, { n: digitalAll.length, duration: 1.6, ease: 'expo.out', onUpdate: () => (fc.textContent = Math.round(fco.n)) }) });

  /* ------------------------------------------------------------------
     14. SWIPE — scroll drives the phone carousel
  ------------------------------------------------------------------ */
  const track = $('.phone__track'), lis = $$('.swipe__list li'), pager = $('.phone__pager');
  let curK = -1;
  function setCarousel(k, f) {
    if (k !== curK) {
      curK = k;
      lis.forEach((li, i) => li.classList.toggle('is-on', i === k));
      const c = carousels[k];
      $('.phone__client').textContent = c.client;
      $('.phone__cap').textContent = c.title;
      pager.innerHTML = (c.pages || [c]).map(() => '<i></i>').join('');
      $('.swipe__i').textContent = pad(k + 1);
      gsap.fromTo('.swipe__i', { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'expo.out' });
    }
    const j = Math.round(f) - ranges[k][0];
    $$('i', pager).forEach((d, i) => d.classList.toggle('on', i === j));
  }
  setCarousel(0, 0);
  const swipeST = ScrollTrigger.create({
    trigger: '.swipe', start: 'top top', end: () => '+=' + slides.length * innerHeight * 0.2, pin: '.swipe__pin', scrub: true, invalidateOnRefresh: true, refreshPriority: 2,
    onUpdate: (self) => {
      const f = self.progress * (slides.length - 1);
      gsap.to(track, { xPercent: -f * 100, duration: 0.5, ease: 'power3', overwrite: true });
      const k = ranges.findIndex(([a, b]) => Math.round(f) >= a && Math.round(f) <= b);
      if (k >= 0) setCarousel(k, f);
    }
  });
  lis.forEach((li, k) => li.addEventListener('click', () => {
    const f = ranges[k][0] / (slides.length - 1);
    goTo(swipeST.start + f * (swipeST.end - swipeST.start) + 2);
  }));
  $('.phone__screen').addEventListener('click', () => { if (curK >= 0) { const f = Math.round(swipeST.progress * (slides.length - 1)); Lightbox.open(carousels[curK], Math.max(0, f - ranges[curK][0])); } });
  $('.phone__screen').dataset.cur = 'Read';
  gsap.from('.phone__frame', { y: 120, rotate: 6, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.swipe', start: 'top 70%' } });

  /* ------------------------------------------------------------------
     15. PRINT — fan of pages, standees rise, spreads reveal
  ------------------------------------------------------------------ */
  const fanEls = $$('.fan__page');
  if (fanEls.length) {
    const n = fanEls.length, fm = (n - 1) / 2;
    gsap.timeline({ scrollTrigger: { trigger: '.fan', start: 'top top', end: 'bottom bottom', scrub: 0.8 } })
      .fromTo(fanEls, { rotate: 0, y: 200, x: 0 }, { rotate: (i) => (fm - i) * 9.5, y: (i) => Math.abs(i - fm) * 6, x: (i) => (fm - i) * 6, ease: 'power2.out', duration: 1, stagger: 0.02 })
      .to(fanEls, { y: (i) => Math.abs(i - fm) * 6 - 30, duration: 0.4 });
    gsap.from('.fan__text > *', { y: 40, opacity: 0, stagger: 0.1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.fan', start: 'top 60%' } });
  }
  gsap.fromTo('.stnd', { rotateX: 84, opacity: 0.2 }, { rotateX: 0, opacity: 1, ease: 'power2.out', stagger: 0.12, scrollTrigger: { trigger: '.floor__stage', start: 'top 90%', end: 'center 55%', scrub: 0.8 } });
  $$('.spread').forEach((s) => {
    gsap.fromTo($('.spread__img', s), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: { trigger: s, start: 'top 85%' } });
    gsap.to($('img', s), { scale: 1, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from($('.spread__cap', s), { y: 20, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 75%' } });
  });

  /* ------------------------------------------------------------------
     16. MOTION — 3D ring spun by scroll
  ------------------------------------------------------------------ */
  const ring = $('.ring'), rcs = $$('.rcard'), N = rcs.length, step = 360 / N;
  let radius = 0;
  const layoutRing = () => {
    const cw = ring.offsetWidth;
    radius = (cw / 2) / Math.tan(Math.PI / N) * 1.18;
    rcs.forEach((c, i) => (c.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`));
  };
  layoutRing();
  ScrollTrigger.addEventListener('refreshInit', layoutRing);
  const ringState = { r: 0 };
  let front = -1;
  const nowEls = { sub: $('.motion__sub'), title: $('.motion__title'), client: $('.motion__client') };
  function setFront(i) {
    if (i === front) return;
    const prev = rcs[front]; if (prev) { prev.classList.remove('is-front'); const pv = $('video', prev); pv.pause(); }
    front = i; const c = rcs[i]; c.classList.add('is-front');
    const v = vids[i];
    gsap.to(Object.values(nowEls), { yPercent: -40, opacity: 0, duration: 0.18, stagger: 0.03, onComplete: () => {
      nowEls.sub.textContent = `${pad(i + 1)} / ${pad(N)} — ${v.sub}`; nowEls.title.textContent = v.title; nowEls.client.textContent = v.client;
      gsap.fromTo(Object.values(nowEls), { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: 'expo.out' });
    } });
    const vid = $('video', c);
    if (!vid.src) vid.src = vid.dataset.src;
    const p = vid.play(); if (p) p.then(() => vid.classList.add('is-playing')).catch(() => {});
  }
  setFront(0);
  const waveQ = waveChars.map((c) => gsap.quickSetter(c, 'yPercent'));
  gsap.fromTo(ring, { scale: 0.55, rotateX: 25 }, { scale: 1, rotateX: -6, ease: 'none', scrollTrigger: { trigger: '.motion', start: 'top bottom', end: 'top top', scrub: true } });
  ScrollTrigger.create({
    trigger: '.motion', start: 'top top', end: () => '+=' + innerHeight * 3.2, pin: '.motion__pin', scrub: 0.8, refreshPriority: 1,
    onUpdate: (self) => {
      const r = -self.progress * (360 - step);
      gsap.to(ringState, { r, duration: 0.6, ease: 'power3', overwrite: true, onUpdate: () => {
        gsap.set(ring, { rotateY: ringState.r });
        const idx = ((Math.round(-ringState.r / step) % N) + N) % N;
        setFront(idx);
      } });
      waveChars.forEach((c, i) => { waveQ[i](Math.sin(i * 0.9 + self.progress * 14) * 10); c.style.setProperty('--w', 300 + 500 * (0.5 + 0.5 * Math.sin(i * 0.7 + self.progress * 10))); });
    }
  });
  $('.motion__play').addEventListener('click', () => Lightbox.open(vids[front], 0));

  /* ------------------------------------------------------------------
     17. CLIENTS / SERVICES
  ------------------------------------------------------------------ */
  gsap.from('.svc', { y: 30, opacity: 0, stagger: 0.05, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.services', start: 'top 85%' } });

  /* ------------------------------------------------------------------
     18. CONTACT
  ------------------------------------------------------------------ */
  $$('.contact__t em .ch').forEach((c) => c.classList.add('it'));
  gsap.from(contactChars, { yPercent: 100, opacity: 0, '--w': 900, stagger: 0.015, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.contact__t', start: 'top 80%' } });
  if (!isTouch && !reduce) {
    const q = contactChars.map((c) => ({ c, w: gsap.quickTo(c, '--w', { duration: 0.6, ease: 'power3' }), s: gsap.quickTo(c, '--s', { duration: 0.6, ease: 'power3' }) }));
    $('.contact').addEventListener('mousemove', (e) => q.forEach(({ c, w, s }) => {
      const r = c.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const k = Math.max(0, 1 - d / 220);
      w(300 + 600 * k); s(100 - 100 * k);
    }));
    $('.contact').addEventListener('mouseleave', () => q.forEach(({ w, s }) => { w(300); s(100); }));
  }
  $('.contact__copy').addEventListener('click', async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(SITE.email || ''); b.textContent = 'Copied ✓'; } catch { b.textContent = 'Copy failed'; }
    setTimeout(() => (b.textContent = 'Copy email'), 2200);
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
