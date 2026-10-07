/**
 * Product page behaviour: gallery, size picker, quantity, add to cart, buy now, sticky bar.
 * The page is pre-rendered from the catalogue at build time (#pdp-data). Live stock,
 * prices and product id come from the API, so cart actions wait for that data.
 */
(function () {
  'use strict';

  const root = document.querySelector('[data-pdp]');
  const dataEl = document.getElementById('pdp-data');
  if (!root || !dataEl) return;

  const Card = window.MantraAQCard;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const handle = root.dataset.pdp;
  const staticData = JSON.parse(dataEl.textContent);

  let selectedId = ($('.pdp-size.is-active', root) || {}).dataset?.variantId || (staticData.variants[0] || {}).id;
  let liveProduct = null;

  // ── Live product ────────────────────────────────────────────────
  let resolveLive;
  const livePromise = new Promise(r => { resolveLive = r; });

  function setLive(product) {
    if (liveProduct || !product || product.handle !== handle) return;
    liveProduct = product;
    applyLive();
    resolveLive(product);
  }

  window.addEventListener('storefront:synced', e => {
    const list = (e.detail && e.detail.products) || [];
    const found = list.find(p => p.handle === handle);
    if (found) setLive(found);
    else fetchLive();
  });

  let fetching = false;
  async function fetchLive() {
    if (liveProduct || fetching || !window.MantraaqAPI) return;
    fetching = true;
    try {
      setLive(await window.MantraaqAPI.getProductByHandle(handle));
    } catch (err) {
      console.warn('PDP: could not load live product', err);
    } finally {
      fetching = false;
    }
  }

  // If the storefront sync is slow or fails, ask for this product directly
  setTimeout(fetchLive, 4000);

  function variants() {
    return liveProduct ? liveProduct.variants : staticData.variants.map(v => ({ ...v, stockQuantity: v.inStock ? 1 : 0 }));
  }

  function currentVariant() {
    const vs = variants();
    return vs.find(v => v.id === selectedId) || vs[0];
  }

  function isSoon() {
    return Card.isComingSoon(liveProduct || staticData);
  }

  /** Sync sizes, stock and buttons with the live product. */
  function applyLive() {
    const vs = liveProduct.variants;
    $$('.pdp-size', root).forEach(btn => {
      const v = vs.find(x => x.id === btn.dataset.variantId);
      const out = !v || !(v.stockQuantity > 0);
      btn.disabled = out;
      btn.classList.toggle('is-out', out);
      if (v) {
        const span = $('span', btn);
        if (span) span.textContent = Card.rupees(v.price);
      }
    });
    const cur = currentVariant();
    if (!cur || !(cur.stockQuantity > 0)) {
      const firstIn = vs.find(v => v.stockQuantity > 0 && $(`.pdp-size[data-variant-id="${CSS.escape(v.id)}"]`, root));
      if (firstIn) selectedId = firstIn.id;
    }
    if (liveProduct.reviewCount > 0 && liveProduct.avgRating) {
      const r = $('[data-pdp-rating]', root);
      if (r) {
        r.innerHTML = `<span class="review-stars">${Card.STAR}</span>${Number(liveProduct.avgRating).toFixed(1)} · ${liveProduct.reviewCount} review${liveProduct.reviewCount === 1 ? '' : 's'}`;
        r.hidden = false;
      }
    }
    render();
  }

  // ── Rendering ───────────────────────────────────────────────────
  const priceEl = $('[data-pdp-price]', root);
  const stockEl = $('[data-pdp-stock]', root);
  const sizeLabel = $('[data-pdp-size-label]', root);
  const addBtn = $('[data-pdp-add]', root);
  const buyBtn = $('[data-pdp-buy]', root);
  const qtyInput = $('[data-qty-input]', root);
  const sticky = $('[data-sticky-buy]');

  function render() {
    const v = currentVariant();
    if (!v) return;
    $$('.pdp-size', root).forEach(btn => {
      const on = btn.dataset.variantId === v.id;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
    if (sizeLabel) sizeLabel.textContent = v.title;

    const off = Card.discountPct(v.price, v.compareAtPrice);
    if (priceEl) {
      priceEl.innerHTML = `<span class="now">${Card.rupees(v.price)}</span>` +
        (off ? `<span class="was">${Card.rupees(v.compareAtPrice)}</span><span class="off">${off}% OFF</span>` : '') +
        '<span class="tax">Inclusive of all taxes</span>';
    }

    const soon = isSoon();
    const inStock = v.stockQuantity > 0;
    if (stockEl) {
      let text = 'In stock, ships in 1 to 2 business days';
      let cls = '';
      if (soon) { text = 'Coming soon'; cls = 'is-out'; }
      else if (!inStock) { text = 'Sold out right now'; cls = 'is-out'; }
      else if (liveProduct && v.stockQuantity <= 5) { text = `Only ${v.stockQuantity} left, ships in 1 to 2 business days`; cls = 'is-low'; }
      stockEl.textContent = text;
      stockEl.className = `pdp-stock ${cls}`.trim();
    }

    const canBuy = inStock && !soon;
    [addBtn, buyBtn].forEach(b => { if (b) b.disabled = !canBuy; });
    if (addBtn) $('span', addBtn).textContent = canBuy ? 'Add to cart' : (soon ? 'Coming soon' : 'Sold out');

    if (qtyInput) {
      const max = liveProduct ? Math.max(1, Math.min(20, v.stockQuantity)) : 20;
      qtyInput.max = max;
      if (Number(qtyInput.value) > max) qtyInput.value = max;
    }

    if (sticky) {
      $('[data-sb-size]', sticky).textContent = v.title;
      $('[data-sb-price]', sticky).textContent = Card.rupees(v.price);
      const sb = $('[data-sb-add]', sticky);
      sb.disabled = !canBuy;
      sb.textContent = canBuy ? 'Add to cart' : (soon ? 'Coming soon' : 'Sold out');
    }
  }

  // ── Size and quantity ───────────────────────────────────────────
  $$('.pdp-size', root).forEach(btn => btn.addEventListener('click', () => {
    if (btn.disabled) return;
    selectedId = btn.dataset.variantId;
    render();
  }));

  function qty() {
    const n = parseInt(qtyInput && qtyInput.value, 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  $$('[data-qty]', root).forEach(btn => btn.addEventListener('click', () => {
    const max = parseInt(qtyInput.max || '20', 10);
    qtyInput.value = Math.min(max, Math.max(1, qty() + parseInt(btn.dataset.qty, 10)));
  }));
  if (qtyInput) qtyInput.addEventListener('change', () => {
    const max = parseInt(qtyInput.max || '20', 10);
    qtyInput.value = Math.min(max, Math.max(1, qty()));
  });

  // ── Cart actions ────────────────────────────────────────────────
  async function addToCart(button) {
    if (!window.Cart) return false;
    let product = liveProduct;
    if (!product) {
      const label = button.querySelector('span') || button;
      const before = label.textContent;
      button.disabled = true;
      label.textContent = 'One moment…';
      fetchLive();
      product = await Promise.race([livePromise, new Promise(r => setTimeout(() => r(null), 15000))]);
      label.textContent = before;
      button.disabled = false;
      if (!product) {
        window.Toast && window.Toast.error('Connection issue: we could not reach the store. Please try again in a moment.');
        return false;
      }
      render();
    }
    const v = currentVariant();
    if (!v || !(v.stockQuantity > 0)) {
      window.Toast && window.Toast.error(`Out of stock: ${product.name} (${v ? v.title : ''}) is sold out.`);
      return false;
    }
    const before = (window.Cart.items || []).find(i => i.variantId === v.id);
    const beforeQty = before ? before.quantity : 0;
    window.Cart.addItem(v, product, qty());
    const after = (window.Cart.items || []).find(i => i.variantId === v.id);
    const added = !!after && after.quantity > beforeQty;
    if (added) {
      button.classList.add('is-added');
      setTimeout(() => button.classList.remove('is-added'), 900);
    }
    return added;
  }

  if (addBtn) addBtn.addEventListener('click', () => addToCart(addBtn));
  if (buyBtn) buyBtn.addEventListener('click', async () => {
    const v = currentVariant();
    const inCart = v && (window.Cart.items || []).some(i => i.variantId === v.id);
    const ok = await addToCart(buyBtn);
    if (!ok && !inCart) return;
    window.Cart.open();
    window.Cart.showCheckoutForm();
  });
  if (sticky) {
    const sb = $('[data-sb-add]', sticky);
    sb.addEventListener('click', () => addToCart(sb));
  }

  // ── Sticky buy bar (mobile) ─────────────────────────────────────
  const buyBox = $('.pdp-buy', root);
  if (sticky && buyBox && 'IntersectionObserver' in window) {
    let buyVisible = true;
    let footVisible = false;
    const update = () => {
      const on = !buyVisible && !footVisible;
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', String(!on));
    };
    new IntersectionObserver(([e]) => { buyVisible = e.isIntersecting || e.boundingClientRect.top > 0; update(); }).observe(buyBox);
    const foot = document.getElementById('footer');
    if (foot) new IntersectionObserver(([e]) => { footVisible = e.isIntersecting; update(); }).observe(foot);
  }

  // ── Gallery ─────────────────────────────────────────────────────
  const main = $('.pdp-main', root);
  const thumbs = $$('.pdp-thumb', root);
  const dots = $$('.pdp-dots i', root);
  if (main) {
    const setActive = i => {
      thumbs.forEach((t, j) => t.classList.toggle('is-active', i === j));
      dots.forEach((d, j) => d.classList.toggle('is-active', i === j));
    };
    thumbs.forEach(t => t.addEventListener('click', () => {
      const i = parseInt(t.dataset.index, 10);
      main.scrollTo({ left: i * main.clientWidth, behavior: 'smooth' });
      setActive(i);
    }));
    let raf;
    main.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setActive(Math.round(main.scrollLeft / Math.max(1, main.clientWidth))));
    }, { passive: true });
    main.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      main.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * main.clientWidth, behavior: 'smooth' });
    });
  }

  render();
})();
