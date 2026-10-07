/**
 * MantraAQ storefront motion and small interactions.
 * Everything here is progressive enhancement: the page reads and works
 * without it, and all motion respects prefers-reduced-motion.
 * GSAP + ScrollTrigger (js/vendor) are used when present.
 */
(function () {
  'use strict';

  const doc = document.documentElement;
  doc.classList.remove('no-js');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger) && !reduceMotion;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ── 1. Reveal on scroll ─────────────────────────────────────── */
  function initReveal() {
    const els = $$('[data-reveal]:not(.is-in)');
    if (!els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(el => io.observe(el));
  }

  /* ── 2. Hero product slider ──────────────────────────────────── */
  function initHero() {
    const hero = $('.hero');
    if (!hero) return;
    const slides = $$('.hero-slide', hero);
    const thumbs = $$('.hero-thumb', hero);
    const word = $('.hero-word', hero);
    const card = $('.hero-card', hero);
    const countEl = $('.hero-count b', hero);
    if (!slides.length) return;

    const DURATION = 6000;
    hero.style.setProperty('--hero-dur', DURATION + 'ms');
    let index = 0;
    let timer = null;
    let paused = false;

    function fillCard(slide) {
      if (!card) return;
      $('.hero-card-k', card).textContent = slide.dataset.kicker || '';
      $('.hero-card-name', card).textContent = slide.dataset.name || '';
      $('.hero-card-line', card).textContent = slide.dataset.line || '';
      const price = slide.dataset.price ? `<small>${slide.dataset.soldout === 'true' ? 'sold out' : 'from'}</small>${slide.dataset.price}` : '';
      $('.hero-card-price', card).innerHTML = price;
      const link = $('.hero-card a', card);
      if (link) {
        link.href = slide.dataset.href || '#products';
        link.setAttribute('aria-label', 'Shop ' + (slide.dataset.name || 'now'));
      }
    }

    // Live prices and stock replace the build-time values on each slide
    window.addEventListener('storefront:synced', e => {
      const list = (e.detail && e.detail.products) || [];
      slides.forEach(slide => {
        const p = list.find(x => x.handle === slide.dataset.handle);
        if (!p || !p.variants || !p.variants.length) return;
        const inStock = p.variants.filter(v => v.stockQuantity > 0);
        const pool = inStock.length ? inStock : p.variants;
        slide.dataset.price = window.MantraAQCard.rupees(Math.min(...pool.map(v => Number(v.price))));
        slide.dataset.soldout = String(!inStock.length);
      });
      fillCard(slides[index]);
    });

    function show(next, instant) {
      if (next === index && !instant) return;
      const prev = slides[index];
      const curr = slides[next];
      index = next;

      hero.style.setProperty('--hero-tint', curr.dataset.tint || 'var(--tint-atta)');
      thumbs.forEach((t, i) => {
        t.classList.toggle('is-active', i === next);
        t.setAttribute('aria-selected', String(i === next));
        const bar = $('.bar', t);
        if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      });
      if (countEl) countEl.textContent = String(next + 1).padStart(2, '0');

      if (hasGsap && !instant) {
        const outImgs = $$('img', prev);
        const inImgs = $$('img', curr);
        gsap.timeline()
          .to(outImgs, { y: 60, xPercent: -6, scale: .88, opacity: 0, duration: .5, ease: 'power3.in', stagger: .05 })
          .add(() => { prev.classList.remove('is-active'); curr.classList.add('is-active'); gsap.set(outImgs, { clearProps: 'all' }); })
          .fromTo(inImgs, { y: -60, xPercent: 8, scale: .88, opacity: 0 }, { y: 0, xPercent: 0, scale: 1, opacity: 1, duration: 1, ease: 'expo.out', stagger: .09 });
        if (word) {
          gsap.timeline()
            .to(word, { xPercent: -8, opacity: 0, duration: .4, ease: 'power2.in' })
            .add(() => { word.textContent = curr.dataset.word || ''; })
            .fromTo(word, { xPercent: 8, opacity: 0 }, { xPercent: 0, opacity: 1, duration: .8, ease: 'expo.out' });
        }
        if (card) {
          gsap.timeline()
            .to(card, { y: 14, opacity: 0, duration: .3, ease: 'power2.in' })
            .add(() => fillCard(curr))
            .to(card, { y: 0, opacity: 1, duration: .6, ease: 'expo.out' });
        }
      } else {
        slides.forEach(s => s.classList.toggle('is-active', s === curr));
        if (word) word.textContent = curr.dataset.word || '';
        fillCard(curr);
      }
    }

    function schedule() {
      clearTimeout(timer);
      if (paused || reduceMotion || slides.length < 2) return;
      timer = setTimeout(() => { show((index + 1) % slides.length); schedule(); }, DURATION);
    }
    function setPaused(p) {
      paused = p;
      hero.classList.toggle('is-paused', p);
      if (p) clearTimeout(timer); else schedule();
    }

    thumbs.forEach((t, i) => t.addEventListener('click', () => { show(i); schedule(); }));
    const stage = $('.hero-stage', hero);
    if (stage) {
      stage.addEventListener('mouseenter', () => setPaused(true));
      stage.addEventListener('mouseleave', () => setPaused(false));
    }
    document.addEventListener('visibilitychange', () => setPaused(document.hidden));

    // Swipe on touch
    let x0 = null;
    hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 50 || !e.target.closest('.hero-stage')) return;
      show((index + (dx < 0 ? 1 : slides.length - 1)) % slides.length);
      schedule();
    }, { passive: true });

    show(0, true);
    schedule();

    if (hasGsap) {
      // Entrance
      gsap.from('.hero-title .line > span', { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .09, delay: .1 });
      gsap.from(['.hero-copy .eyebrow', '.hero-copy .lead', '.hero-ctas', '.hero-trust'], { y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: .08, delay: .45 });
      // clearProps: a leftover transform on an ancestor would stop the food photo's multiply blend
      gsap.from('.hero-stage', { scale: .9, opacity: 0, duration: 1.4, ease: 'expo.out', delay: .2, clearProps: 'transform,opacity' });
      gsap.from(['.hero-badge', '.hero-card', '.hero-nav'], { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: .1, delay: .7 });

      // Scroll: word slides sideways, copy fades. The product stage stays put because
      // transforming it would break the food photo's multiply blend.
      ScrollTrigger.matchMedia({
        '(min-width: 901px)': function () {
          gsap.to('.hero-word', { x: -140, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
          gsap.to('.hero-copy', { yPercent: 18, opacity: .2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
        }
      });
    }
  }

  /* ── 3. Marquee band reacts to scroll speed ──────────────────── */
  function initBand() {
    if (!hasGsap) return;
    $$('.band').forEach(band => {
      const track = $('.band-track', band);
      let skew = gsap.quickTo(track, 'skewX', { duration: .5, ease: 'power3' });
      ScrollTrigger.create({
        onUpdate: self => {
          const v = gsap.utils.clamp(-8, 8, self.getVelocity() / -300);
          skew(v);
        }
      });
    });
  }

  /* ── 4. Horizontal rails (products, recipes, reviews) ────────── */
  const arrow = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="${d}"/></svg>`;

  function initRail(wrap) {
    const rail = $('.rail', wrap);
    if (!rail || rail.dataset.bound) return;
    rail.dataset.bound = '1';
    const progress = $('.rail-progress', wrap);
    const bar = progress && $('i', progress);

    // Phones hide the header arrows, so a row under the rail carries a "2 / 7" count and small arrows.
    // It tells shoppers there is more to swipe through, and how much.
    let count = null;
    if (progress && !progress.parentElement.classList.contains('rail-meta')) {
      const meta = document.createElement('div');
      meta.className = 'rail-meta';
      progress.before(meta);
      meta.innerHTML = '<span class="rail-count" aria-hidden="true"></span>'
        + '<span class="rail-mini">'
        + '<button class="rail-btn" type="button" data-rail-prev aria-label="Previous">' + arrow('M19 12H5M11 6l-6 6 6 6') + '</button>'
        + '<button class="rail-btn" type="button" data-rail-next aria-label="Next">' + arrow('M5 12h14M13 6l6 6-6 6') + '</button>'
        + '</span>';
      meta.prepend(progress);
      count = $('.rail-count', meta);
    }
    const prevs = $$('[data-rail-prev]', wrap);
    const nexts = $$('[data-rail-next]', wrap);

    function gap() { return parseFloat(getComputedStyle(rail).columnGap) || 16; }
    function step() {
      const item = rail.firstElementChild;
      return item ? item.getBoundingClientRect().width + gap() : rail.clientWidth;
    }
    // Scroll by code with snapping paused: iOS Safari can cancel a smooth scroll on a snapping strip
    let snapTimer;
    function go(left) {
      clearTimeout(snapTimer);
      rail.style.scrollSnapType = 'none';
      rail.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
      snapTimer = setTimeout(() => { rail.style.scrollSnapType = ''; }, 700);
    }
    function update() {
      const max = rail.scrollWidth - rail.clientWidth;
      prevs.forEach(b => { b.disabled = rail.scrollLeft <= 4; });
      nexts.forEach(b => { b.disabled = rail.scrollLeft >= max - 4; });
      if (bar) {
        const visible = Math.min(1, rail.clientWidth / Math.max(rail.scrollWidth, 1));
        bar.style.width = (visible * 100) + '%';
        bar.style.transform = `translateX(${max > 0 ? (rail.scrollLeft / max) * ((1 - visible) / visible) * 100 : 0}%)`;
      }
      if (count) {
        const total = rail.children.length;
        const shown = rail.scrollLeft >= max - 4 ? total : Math.min(total, Math.max(1, Math.round(rail.scrollLeft / step()) + 1));
        const pad = n => String(n).padStart(2, '0');
        count.innerHTML = `<b>${pad(shown)}</b> / ${pad(total)}`;
        count.parentElement.hidden = max <= 4;
      }
    }
    prevs.forEach(b => b.addEventListener('click', () => go(Math.max(0, rail.scrollLeft - step()))));
    nexts.forEach(b => b.addEventListener('click', () => go(rail.scrollLeft + step())));
    rail.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    wrap.addEventListener('rail:updated', () => requestAnimationFrame(update));

    // Mouse drag on desktop
    let down = false, startX = 0, startLeft = 0, moved = false;
    rail.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = rail.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 6) { moved = true; rail.classList.add('is-dragging'); }
      if (moved) rail.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      if (moved) {
        rail.classList.remove('is-dragging');
        // Snap to the nearest card after a drag
        const s = step();
        go(Math.round(rail.scrollLeft / s) * s);
        const block = ev => { ev.preventDefault(); ev.stopPropagation(); };
        rail.addEventListener('click', block, { capture: true, once: true });
        setTimeout(() => rail.removeEventListener('click', block, { capture: true }), 50);
      }
    });
    update();
    initAutoplay(wrap, rail, step, go);
  }

  /* Rails with data-autoplay="ms" advance one card at a time and loop.
     The first move comes soon after the rail scrolls into view, so it reads as a carousel.
     They pause while hovered, touched, focused, off screen or in a background tab. */
  function initAutoplay(wrap, rail, step, go) {
    const delay = parseInt(wrap.dataset.autoplay || '0', 10);
    if (!delay || reduceMotion) return;
    let visible = false, holdUntil = 0, hovering = false, timer = null;
    const hold = ms => { holdUntil = Date.now() + ms; };
    wrap.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovering = true; });
    wrap.addEventListener('pointerleave', () => { hovering = false; hold(1500); });
    rail.addEventListener('touchstart', () => hold(8000), { passive: true });
    wrap.addEventListener('focusin', () => hold(10000));
    $$('[data-rail-prev], [data-rail-next]', wrap).forEach(b => b.addEventListener('click', () => hold(8000)));
    function tick() {
      timer = setTimeout(tick, delay);
      if (!visible || hovering || document.hidden || Date.now() < holdUntil || rail.classList.contains('is-dragging')) return;
      const max = rail.scrollWidth - rail.clientWidth;
      if (max <= 4) return;
      const atEnd = rail.scrollLeft >= max - 4;
      go(atEnd ? 0 : Math.min(max, rail.scrollLeft + step()));
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !timer) timer = setTimeout(tick, 1600);
      }, { threshold: 0.5 }).observe(rail);
    } else { visible = true; timer = setTimeout(tick, delay); }
  }

  function initRails() { $$('[data-rail]').forEach(initRail); }

  /* ── 5. Pond-to-plate story: vertical scroll unrolls the painted scroll sideways ── */
  function initStory() {
    const story = $('.story');
    const pin = story && $('.story-pin', story);
    const track = story && $('.story-track', story);
    const paper = story && $('.story-scroll', story);
    if (!pin || !track || !paper) return;
    const leaves = $$('.story-leaf', story);
    const bar = $('.story-progress-bar', story);
    const labels = $$('.story-progress-steps li', story);
    const wide = window.matchMedia('(min-width: 1000px) and (min-height: 600px)');
    let pinned = false, dist = 0, ticking = false;

    function update() {
      ticking = false;
      if (!pinned) return;
      const p = dist ? Math.min(1, Math.max(0, -story.getBoundingClientRect().top / dist)) : 0;
      const x = p * dist;
      track.style.transform = `translate3d(${-x}px,0,0)`;
      if (bar) bar.style.setProperty('--p', p.toFixed(4));
      const vw = window.innerWidth;
      let active = 0;
      leaves.forEach((leaf, i) => {
        const left = paper.offsetLeft + leaf.offsetLeft - x; // both relative to the sticky pin
        // 0 while the leaf is off to the right, 1 once it is well inside the screen
        const t = Math.min(1, Math.max(0, (vw - left) / (vw * 0.55)));
        leaf.style.setProperty('--t', t.toFixed(3));
        if (left < vw * 0.5) active = i;
      });
      labels.forEach((li, i) => li.classList.toggle('is-active', i === active));
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    function measure() {
      pinned = wide.matches && !reduceMotion;
      story.classList.toggle('is-pinned', pinned);
      if (!pinned) {
        story.style.height = '';
        track.style.transform = '';
        leaves.forEach(leaf => leaf.style.removeProperty('--t'));
        return;
      }
      dist = Math.max(0, track.scrollWidth - window.innerWidth);
      story.style.height = `${pin.offsetHeight + dist}px`;
      update();
    }

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (pinned) measure(); }).observe(track);
    // Images can change the track width once they load
    $$('img', track).forEach(img => { if (!img.complete) img.addEventListener('load', measure, { once: true }); });
  }

  /* ── 6. Parallax images and footer word ──────────────────────── */
  function initParallax() {
    if (!hasGsap) return;
    $$('[data-parallax]').forEach(el => {
      const amount = parseFloat(el.dataset.parallax) || 10;
      gsap.fromTo(el, { yPercent: -amount }, { yPercent: amount, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    const word = $('.foot-word');
    if (word) gsap.fromTo(word, { xPercent: 8 }, { xPercent: -8, ease: 'none', scrollTrigger: { trigger: word, start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('.cat').forEach((cat, i) => {
      gsap.from(cat, { y: 60 + i * 20, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.cats', start: 'top 85%' } });
    });
  }

  /* ── 7. Category tiles filter the shop without reloading ─────── */
  function initCategoryLinks() {
    $$('[data-shop-filter]').forEach(link => {
      link.addEventListener('click', e => {
        const grid = $('#storefront-products-grid');
        if (!grid) return;
        e.preventDefault();
        if (window.MantraAQShopFilter) window.MantraAQShopFilter(link.dataset.shopFilter);
        // Scroll to the filtered grid, not the tiles the visitor just clicked
        const target = $('#shop-all') || $('#products');
        const top = target.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* ── 8. Cookie notice ────────────────────────────────────────── */
  function initCookie() {
    const banner = $('#maq-cookie-banner');
    if (!banner) return;
    let ok = null;
    try { ok = localStorage.getItem('maq_cookie_ok'); } catch (e) { /* storage blocked */ }
    if (ok) return;
    setTimeout(() => { banner.hidden = false; }, 1800);
    $$('[data-cookie-close]', banner).forEach(btn => btn.addEventListener('click', () => {
      banner.hidden = true;
      try { localStorage.setItem('maq_cookie_ok', '1'); } catch (e) { /* storage blocked */ }
    }));
  }

  /* ── 9. Reviews pulled from the live API (hidden when there are none) ── */
  async function initReviews(products) {
    const section = $('[data-reviews]');
    if (!section || section.dataset.loaded || !window.MantraaqAPI) return;
    // data-reviews-handle limits the section to one product (product pages)
    const only = section.dataset.reviewsHandle;
    const reviewed = (products || []).filter(p => p.reviewCount > 0 && (!only || p.handle === only)).slice(0, 6);
    if (!reviewed.length) return;
    section.dataset.loaded = '1';

    const results = await Promise.allSettled(reviewed.map(p => window.MantraaqAPI.getProductReviews(p.handle).then(r => (r || []).map(x => ({ ...x, product: p })))));
    const reviews = results.flatMap(r => r.status === 'fulfilled' ? r.value : [])
      .filter(r => r.comment && r.comment.trim().length > 8)
      .sort((a, b) => (b.rating - a.rating) || (new Date(b.createdAt) - new Date(a.createdAt)))
      .slice(0, 10);
    if (!reviews.length) return;

    const esc = window.MantraAQCard.escapeHtml;
    const star = window.MantraAQCard.STAR;
    const total = reviewed.reduce((n, p) => n + p.reviewCount, 0);
    const avg = reviewed.reduce((n, p) => n + p.avgRating * p.reviewCount, 0) / total;

    const summary = $('[data-reviews-summary]', section);
    if (summary) summary.innerHTML = `<span class="stat-big">${avg.toFixed(1)}</span><div><div class="review-stars">${star.repeat(5)}</div><span>${total} verified review${total === 1 ? '' : 's'}</span></div>`;

    $('.rail', section).innerHTML = reviews.map(r => {
      const name = (r.user && r.user.name ? r.user.name : 'Customer').trim();
      const short = name.split(/\s+/).map((w, i) => i === 0 ? w : w[0] + '.').join(' ');
      return `<article class="review">
        <div class="review-stars" aria-label="${r.rating} out of 5">${Array.from({ length: 5 }, (_, i) => i < r.rating ? star : star.replace('<svg', '<svg class="off"')).join('')}</div>
        <q>${esc(r.comment.trim())}</q>
        <div class="review-by"><span class="review-avatar" aria-hidden="true">${esc(short[0] || 'C')}</span><div><b>${esc(short)}</b><span>on ${esc(r.product.name)}</span></div></div>
      </article>`;
    }).join('');
    section.hidden = false;
    initRail($('[data-rail]', section));
    if (hasGsap) ScrollTrigger.refresh();
  }

  // The contact form moved from /#contact to its own page; keep old links working
  if (location.hash === '#contact' && !document.getElementById('contact-form')) location.replace('/contact');

  document.addEventListener('DOMContentLoaded', () => {
    initReveal();
    initHero();
    initBand();
    initRails();
    initStory();
    initParallax();
    initCategoryLinks();
    initCookie();
  });

  window.addEventListener('storefront:synced', e => {
    initReveal();
    $$('[data-rail]').forEach(w => w.dispatchEvent(new CustomEvent('rail:updated')));
    initReviews(e.detail && e.detail.products);
    if (hasGsap) ScrollTrigger.refresh();
  });

  window.MantraAQSite = { initRail, initReveal };
})();
