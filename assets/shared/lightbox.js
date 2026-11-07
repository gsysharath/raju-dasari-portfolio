/* Shared lightbox: images, multi-page documents (PDF renders) and videos.
   Usage: Lightbox.open(item, startIndex)  — item comes from window.WORK.items
   Styling comes from CSS custom properties set by each version (see lightbox.css). */
(function () {
  const el = document.createElement('div');
  el.className = 'lb';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="lb__backdrop" data-lb-close></div>
    <div class="lb__chrome">
      <div class="lb__meta">
        <span class="lb__client"></span>
        <span class="lb__title"></span>
      </div>
      <div class="lb__count"></div>
      <button class="lb__close" data-lb-close aria-label="Close">Close <span>✕</span></button>
    </div>
    <div class="lb__stage"></div>
    <button class="lb__nav lb__nav--prev" aria-label="Previous">←</button>
    <button class="lb__nav lb__nav--next" aria-label="Next">→</button>
    <div class="lb__strip"></div>`;
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(el));

  const $ = (s) => el.querySelector(s);
  let item = null, frames = [], idx = 0, lastFocus = null;

  function framesFor(it) {
    if (it.kind === 'video') return [{ video: it.video, poster: it.poster, w: it.w, h: it.h }];
    if (it.pages && it.pages.length) return it.pages;
    return [{ src: it.src, thumb: it.thumb, w: it.w, h: it.h }];
  }

  function render(dir = 0) {
    const f = frames[idx];
    const stage = $('.lb__stage');
    const old = stage.querySelector('video'); if (old) old.pause();
    let node;
    if (f.video) {
      node = document.createElement('video');
      node.src = f.video; node.poster = f.poster || '';
      node.controls = true; node.autoplay = true; node.playsInline = true;
    } else {
      node = document.createElement('img');
      node.src = f.src; node.alt = (item.title || '') + (frames.length > 1 ? ` — page ${idx + 1}` : '');
      node.decoding = 'async';
    }
    node.className = 'lb__media';
    node.style.setProperty('--ar', `${f.w || 16} / ${f.h || 9}`);
    stage.replaceChildren(node);
    if (window.gsap) gsap.fromTo(node, { opacity: 0, x: dir * 60, scale: 0.96 }, { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: 'expo.out' });
    $('.lb__count').textContent = frames.length > 1 ? `${String(idx + 1).padStart(2, '0')} / ${String(frames.length).padStart(2, '0')}` : (item.kind === 'video' ? 'Motion' : '');
    el.classList.toggle('lb--multi', frames.length > 1);
    el.querySelectorAll('.lb__strip button').forEach((b, i) => b.classList.toggle('is-active', i === idx));
    const active = el.querySelector('.lb__strip .is-active');
    if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }

  function go(d) {
    if (frames.length < 2) return;
    idx = (idx + d + frames.length) % frames.length;
    render(d);
  }

  function open(it, start = 0) {
    item = it; frames = framesFor(it); idx = start;
    lastFocus = document.activeElement;
    $('.lb__client').textContent = it.client || '';
    $('.lb__title').textContent = it.title || '';
    const strip = $('.lb__strip');
    strip.replaceChildren(...(frames.length > 1 ? frames.map((f, i) => {
      const b = document.createElement('button');
      b.innerHTML = `<img src="${f.thumb || f.src}" alt="" loading="lazy">`;
      b.setAttribute('aria-label', `Page ${i + 1}`);
      b.onclick = () => { const d = i > idx ? 1 : -1; idx = i; render(d); };
      return b;
    }) : []));
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('lb-lock');
    if (window.lenis) window.lenis.stop();
    if (window.gsap) {
      gsap.fromTo(el.querySelector('.lb__backdrop'), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.7, ease: 'expo.inOut' });
      gsap.fromTo([el.querySelector('.lb__chrome'), el.querySelector('.lb__strip')], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.35, stagger: 0.08 });
    }
    render(0);
    $('.lb__close').focus({ preventScroll: true });
  }

  function close() {
    if (!el.classList.contains('is-open')) return;
    const v = el.querySelector('video'); if (v) v.pause();
    const done = () => {
      el.classList.remove('is-open'); el.setAttribute('aria-hidden', 'true');
      $('.lb__stage').replaceChildren();
      document.documentElement.classList.remove('lb-lock');
      if (window.lenis) window.lenis.start();
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    if (window.gsap) {
      gsap.to(el.querySelectorAll('.lb__media, .lb__chrome, .lb__strip, .lb__nav'), { opacity: 0, duration: 0.25 });
      gsap.to(el.querySelector('.lb__backdrop'), { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'expo.inOut', delay: 0.1, onComplete: () => { gsap.set(el.querySelectorAll('.lb__nav'), { clearProps: 'opacity' }); done(); } });
    } else done();
  }

  el.addEventListener('click', (e) => {
    if (e.target.closest('[data-lb-close]')) close();
    if (e.target.closest('.lb__nav--prev')) go(-1);
    if (e.target.closest('.lb__nav--next')) go(1);
  });
  document.addEventListener('keydown', (e) => {
    if (!el.classList.contains('is-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
  });
  // touch swipe
  let sx = null;
  el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', (e) => {
    if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });

  window.Lightbox = { open, close };
})();
