// js/main.js - Complete Consolidated Version
document.addEventListener('DOMContentLoaded', function() {
    
    // ===== SMOOTH SCROLLING =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // ════════════════════════════════════
// HERO — CINEMATIC INIT
// ════════════════════════════════════

// 1. Trigger entrance animations
setTimeout(() => {
  document.getElementById('home')?.classList.add('loaded');
}, 120);

// 2. Parallax on scroll (desktop only)
if (window.innerWidth > 768) {
  window.addEventListener('scroll', () => {
    const mesh = document.querySelector('.hero-mesh');
    if (mesh) {
      mesh.style.transform = `translateY(${window.scrollY * 0.2}px)`;
    }
  }, { passive: true });
}

// 3. Floating particles
(function spawnParticles() {
  const container = document.getElementById('hero-particles');
  if (!container) return;
  const n = window.innerWidth < 600 ? 10 : 25;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const s = Math.random() * 4 + 1.5;
    p.style.cssText = `
      width:${s}px; height:${s}px;
      left:${Math.random()*100}%;
      animation-duration:${Math.random()*16+10}s;
      animation-delay:-${Math.random()*16}s;
      opacity:${Math.random()*0.5+0.1};
    `;
    container.appendChild(p);
  }
})();

// 4. Magnetic effect on primary button (desktop only)
if (window.innerWidth > 768) {
  const btn = document.querySelector('.hbtn-primary');
  if (btn) {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.2;
      const y = (e.clientY - r.top - r.height / 2) * 0.2;
      btn.style.transform = `translate(${x}px,${y}px) translateY(-3px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  }
}

// ════════════════════════════════════
/* ════════════════════════════════════════
   ABOUT — MANTRAAQ FINAL JS
   Fixes: no FOUC, auto-rotate, no counters
════════════════════════════════════════ */
(function initAbout() {

  /* ─────────────────────────────────────
     1. SCROLL REVEAL
  ───────────────────────────────────── */
  const revEls = document.querySelectorAll('[data-rev]');
  if ('IntersectionObserver' in window && revEls.length) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.revDelay || 0);
        setTimeout(() => e.target.classList.add('vis'), d);
        ro.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revEls.forEach(el => ro.observe(el));
  }

  /* ─────────────────────────────────────
     2. HOOK TEXT — NO FOUC
     Text is already visible in HTML/CSS.
     We only START the cycle AFTER a delay.
     No initial hide/show = no flash.
  ───────────────────────────────────── */
  const cycleEl = document.getElementById('htCycle');
  const phrases = [
    'the wrong snacks.',
    'processed lies.',
    'empty calories.',
    'what you were told was healthy.'
  ];
  let ci = 0;

  if (cycleEl) {
    // Start cycling after 3s (let user read first phrase)
    setTimeout(function startCycle() {
      setInterval(() => {
        // Step 1: exit current text
        cycleEl.classList.remove('cy-show', 'cy-in');
        cycleEl.classList.add('cy-out');

        setTimeout(() => {
          // Step 2: swap text while invisible
          ci = (ci + 1) % phrases.length;
          cycleEl.textContent = phrases[ci];

          // Step 3: position for entrance
          cycleEl.classList.remove('cy-out');
          cycleEl.classList.add('cy-in');

          // Force browser to register cy-in before cy-show
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              cycleEl.classList.remove('cy-in');
              cycleEl.classList.add('cy-show');
            });
          });
        }, 340);

      }, 2800);
    }, 3000);
  }

  /* ─────────────────────────────────────
     3. PHOTO DECK — AUTO ROTATE + DOTS
  ───────────────────────────────────── */
  const deck   = document.getElementById('photoDeck');
  const cards  = deck  ? deck.querySelectorAll('.pd-card')   : [];
  const dots   = deck  ? deck.querySelectorAll('.pd-dot')    : [];
  const progFill = document.getElementById('pdProgFill');
  const ROTATE_INTERVAL = 3500; // ms
  const CIRCUMFERENCE = 94.2;   // 2π × r (r=15)
  let   currentCard = 0;
  let   rotateTimer = null;
  let   progTimer   = null;
  const isMobile = () => window.innerWidth <= 768;

  function goToCard(idx) {
    const total = cards.length;
    const prev  = currentCard;
    currentCard = (idx + total) % total;

    // Remove all position classes
    cards.forEach(c => c.classList.remove('pd-front','pd-mid','pd-back'));
    dots.forEach(d  => d.classList.remove('active'));

    // Assign new positions
    cards[currentCard].classList.add('pd-front');
    cards[(currentCard - 1 + total) % total].classList.add('pd-mid');
    cards[(currentCard - 2 + total) % total].classList.add('pd-back');

    // On mobile: hide non-front cards completely
    if (isMobile()) {
      cards.forEach((c, i) => {
        c.style.opacity = (i === currentCard) ? '1' : '0';
        c.style.pointerEvents = (i === currentCard) ? '' : 'none';
      });
    }

    // Activate dot
    if (dots[currentCard]) dots[currentCard].classList.add('active');

    // Restart progress ring
    startProgress();
  }

  function startProgress() {
    if (!progFill) return;
    // Reset instantly
    progFill.style.transition = 'none';
    progFill.style.strokeDashoffset = CIRCUMFERENCE;

    // Then animate over ROTATE_INTERVAL
    clearTimeout(progTimer);
    progTimer = setTimeout(() => {
      progFill.style.transition =
        `stroke-dashoffset ${ROTATE_INTERVAL}ms linear`;
      progFill.style.strokeDashoffset = '0';
    }, 30);
  }

  function startAutoRotate() {
    clearInterval(rotateTimer);
    rotateTimer = setInterval(() => {
      goToCard(currentCard + 1);
    }, ROTATE_INTERVAL);
  }

  if (cards.length) {
    // Init: set initial deck positions
    goToCard(0);
    startAutoRotate();

    // Dot click — manual override
    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        clearInterval(rotateTimer);
        goToCard(i);
        startAutoRotate(); // restart timer after manual pick
      });
    });

    // Pause on hover (desktop)
    if (deck) {
      deck.addEventListener('mouseenter', () => clearInterval(rotateTimer));
      deck.addEventListener('mouseleave', () => {
        startAutoRotate();
        startProgress();
      });
    }
  }
   /* ─────────────────────────────────────
     10. COMMUNITY PERKS — STAGGER REVEAL
  ───────────────────────────────────── */
  const commSection = document.querySelector('.comm-section');
  if (commSection) {
    const co = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      commSection.querySelectorAll('.comm-perk').forEach((perk, i) => {
        perk.style.opacity = '0';
        perk.style.transform = 'translateX(-16px)';
        setTimeout(() => {
          perk.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          perk.style.opacity = '1';
          perk.style.transform = 'none';
        }, 200 + i * 130);
      });
      // Animate Bihar stat numbers
      commSection.querySelectorAll('.cbc-stat').forEach((stat, i) => {
        setTimeout(() => {
          stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          stat.style.opacity = '1';
          stat.style.transform = 'none';
        }, 400 + i * 100);
      });
      co.disconnect();
    }, { threshold: 0.2 });
    // Init hidden state for stats
    commSection.querySelectorAll('.cbc-stat').forEach(s => {
      s.style.opacity = '0';
      s.style.transform = 'translateY(12px)';
    });
    co.observe(commSection);
  }

  /* ─────────────────────────────────────
     11. QR CARD — 3D TILT ON HOVER
  ───────────────────────────────────── */
  const qrCard = document.querySelector('.comm-qr-card');
  if (qrCard && !isMobile()) {
    let qrRaf;
    qrCard.addEventListener('mousemove', e => {
      cancelAnimationFrame(qrRaf);
      qrRaf = requestAnimationFrame(() => {
        const r = qrCard.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width  / 2) / r.width  * 10;
        const y = (e.clientY - r.top  - r.height / 2) / r.height * 10;
        qrCard.style.transform =
          `perspective(800px) rotateX(${-y}deg) rotateY(${x}deg) translateY(-6px)`;
      });
    });
    qrCard.addEventListener('mouseleave', () => {
      cancelAnimationFrame(qrRaf);
      qrCard.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      qrCard.style.transform = '';
      setTimeout(() => { qrCard.style.transition = ''; }, 600);
    });
  }

  /* ─────────────────────────────────────
     12. MISSION ITEMS — STAGGER
  ───────────────────────────────────── */
  const missionCard = document.querySelector('.comm-mission-card');
  if (missionCard) {
    const mo = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      missionCard.querySelectorAll('.cmc-item').forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(16px)';
        setTimeout(() => {
          item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
          item.style.opacity = '1';
          item.style.transform = 'none';
        }, 150 + i * 140);
      });
      mo.disconnect();
    }, { threshold: 0.3 });
    missionCard.querySelectorAll('.cmc-item').forEach(i => {
      i.style.opacity = '0';
      i.style.transform = 'translateY(16px)';
    });
    mo.observe(missionCard);
  }


  /* ─────────────────────────────────────
     4. STORY PANELS DRIVE PHOTO DECK
     Desktop only — scroll activates panels
  ───────────────────────────────────── */
  const panels = document.querySelectorAll('.story-panel');

  if (!isMobile() && panels.length) {
    // Clear initial sp-active/sp-dim set in HTML
    panels.forEach(p => { p.classList.remove('sp-active','sp-dim'); p.classList.add('sp-dim'); });
    panels[0].classList.remove('sp-dim');
    panels[0].classList.add('sp-active');

    const po = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const idx = parseInt(e.target.dataset.panel) - 1;
        panels.forEach(p => {
          p.classList.remove('sp-active');
          p.classList.add('sp-dim');
        });
        e.target.classList.remove('sp-dim');
        e.target.classList.add('sp-active');
        // Let the panel scroll drive the photo deck too
        clearInterval(rotateTimer);
        goToCard(idx);
        startAutoRotate();
      });
    }, { threshold: 0.55, rootMargin: '-15% 0px -15% 0px' });
    panels.forEach(p => po.observe(p));
  }

  /* ─────────────────────────────────────
     5. HEALTH CARD PROGRESS BARS
  ───────────────────────────────────── */
  const healthSection = document.querySelector('.health-section');
  if (healthSection) {
    const hco = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      healthSection.querySelectorAll('.hcm-fill').forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = bar.dataset.w + '%';
        }, i * 90);
      });
      hco.disconnect();
    }, { threshold: 0.2 });
    hco.observe(healthSection);
  }

  /* ─────────────────────────────────────
     6. SVG JOURNEY PATH DRAW
  ───────────────────────────────────── */
  const jPath = document.getElementById('jPath');
  if (jPath) {
    const jo = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      jPath.style.transition =
        'stroke-dashoffset 2.2s cubic-bezier(0.16,1,0.3,1)';
      jPath.style.strokeDashoffset = '0';
      jo.disconnect();
    }, { threshold: 0.3 });
    const js = document.querySelector('.journey-section');
    if (js) jo.observe(js);
  }

  /* ─────────────────────────────────────
     7. MAGNETIC CTA BUTTON
  ───────────────────────────────────── */
  const magBtn = document.querySelector('.mag-btn');
  if (magBtn && !isMobile()) {
    magBtn.addEventListener('mousemove', e => {
      const r = magBtn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) * 0.2;
      const y = (e.clientY - r.top  - r.height / 2) * 0.2;
      magBtn.style.transform = `translate(${x}px,${y}px) translateY(-4px)`;
    });
    magBtn.addEventListener('mouseleave', () => {
      magBtn.style.transform = '';
    });
  }

  /* ─────────────────────────────────────
     8. DIFF LIST STAGGER
  ───────────────────────────────────── */
  const diffSection = document.querySelector('.diff-section');
  if (diffSection) {
    const dfo = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      const items = diffSection.querySelectorAll('.diff-col li');
      items.forEach((li, i) => {
        li.style.opacity = '0';
        li.style.transform = 'translateX(-12px)';
        setTimeout(() => {
          li.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          li.style.opacity = '1';
          li.style.transform = 'none';
        }, i * 80);
      });
      dfo.disconnect();
    }, { threshold: 0.25 });
    dfo.observe(diffSection);
  }

  /* ─────────────────────────────────────
     9. HEALTH CARD 3D TILT
  ───────────────────────────────────── */
  if (!isMobile()) {
    document.querySelectorAll('.hc').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width  - 0.5;
        const y = (e.clientY - r.top)  / r.height - 0.5;
        card.style.transform =
          `translateY(-10px) rotateX(${-y * 7}deg) rotateY(${x * 7}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

})();

/* ════════════════════════════════════════
   CERTIFICATIONS JS — Minimal & Clean
════════════════════════════════════════ */
(function initCerts() {

  /* ── 1. SCROLL REVEAL ── */
  const els = document.querySelectorAll('[data-cv-rev]');
  if ('IntersectionObserver' in window && els.length) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.cvDelay || 0);
        setTimeout(() => e.target.classList.add('cv-vis'), d);
        ro.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    els.forEach(el => ro.observe(el));
  }

  /* ── 2. PROGRESS BARS ── */
  const cvSection = document.querySelector('.cv');
  if (cvSection) {
    const bo = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      document.querySelectorAll('.cv-bar-fill').forEach((bar, i) => {
        setTimeout(() => {
          bar.style.width = '100%';
        }, 400 + i * 140);
      });
      bo.disconnect();
    }, { threshold: 0.3 });
    bo.observe(cvSection);
  }

  /* ── 3. TILE HOVER: subtle logo lift already in CSS ── */
  /* ── No tilt, no glow cursor — keeping it clean ── */

})();

/* ════════════════════════════════════════
   EVENT SECTION JS
════════════════════════════════════════ */
(function initEvent() {

  /* ── 1. SCROLL REVEAL ── */
  const els = document.querySelectorAll('[data-ev-rev]');
  if ('IntersectionObserver' in window && els.length) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.evDelay || 0);
        setTimeout(() => e.target.classList.add('ev-vis'), d);
        ro.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => ro.observe(el));
  }

  /* ── 2. COUNTER ANIMATION ── */
  const evSection = document.querySelector('.ev');
  if (evSection) {
    const co = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;

      // Animate all counters — ev-float-num and ev-ms-num
      const counters = evSection.querySelectorAll(
        '[data-target]'
      );
      counters.forEach(el => {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const dur    = 1800;
        const start  = performance.now();

        function tick(now) {
          const p    = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.floor(target * ease) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });

      co.disconnect();
    }, { threshold: 0.3 });
    co.observe(evSection);
  }

  /* ── 3. TAPE PAUSE ON HOVER ── */
  const tape = document.querySelector('.ev-tape-track');
  if (tape) {
    const tapeWrap = document.querySelector('.ev-tape');
    if (tapeWrap) {
      tapeWrap.addEventListener('mouseenter', () => {
        tape.style.animationPlayState = 'paused';
      });
      tapeWrap.addEventListener('mouseleave', () => {
        tape.style.animationPlayState = 'running';
      });
    }
  }

  /* ── 4. PHOTO PARALLAX (subtle) ── */
  if (window.innerWidth > 768) {
    const bigPhoto = document.querySelector('.ev-photo-big img');
    if (bigPhoto) {
      window.addEventListener('scroll', () => {
        const section = document.querySelector('.ev');
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const progress = -rect.top / (rect.height + window.innerHeight);
        const shift = progress * 40;
        bigPhoto.style.transform = `translateY(${shift}px) scale(1.08)`;
      }, { passive: true });
    }
  }

})();



    // ===== PROGRESS BAR =====
    window.addEventListener('scroll', () => {
        const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = scrolled + '%';
        }
    });

    // ===== ANIMATED COUNTERS =====
    function animateCounters() {
        const counters = document.querySelectorAll('.counter');
        let hasAnimated = false;
        
        counters.forEach(counter => {
            if (!hasAnimated) {
                const target = parseInt(counter.getAttribute('data-target'));
                const increment = target / 100;
                let current = 0;
                
                const updateCounter = () => {
                    if (current < target) {
                        current += increment;
                        counter.textContent = Math.ceil(current);
                        setTimeout(updateCounter, 20);
                    } else {
                        counter.textContent = target + (target < 100 ? '%' : '+');
                    }
                };
                updateCounter();
            }
        });
        hasAnimated = true;
    }

    // Trigger counters when impact section is visible
    const impactObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
            }
        });
    });
    
    const impactSection = document.querySelector('#impact');
    if (impactSection) {
        impactObserver.observe(impactSection);
    }

    // ===== MOBILE MENU TOGGLE =====
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // ===== NAVBAR SCROLL EFFECT =====
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const nav = document.querySelector('nav');
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 50) {
            nav.classList.add('bg-gray-900/95', 'backdrop-blur-sm', 'shadow-lg');
        } else {
            nav.classList.remove('bg-gray-900/95', 'backdrop-blur-sm', 'shadow-lg');
        }
        
        lastScrollTop = scrollTop;
    });

    // ===== ANIMATE ELEMENTS ON SCROLL =====
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in-up');
            }
        });
    }, observerOptions);

    // Observe all sections
    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });

    /* ════════════════════════════════════════
   CONTACT JS — MantraAQ FINAL
   Formspree: https://formspree.io/f/movlloyl
════════════════════════════════════════ */
(function initContact() {

  /* ── SCROLL REVEAL ── */
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.ctDelay || 0);
        setTimeout(() => e.target.classList.add('ct-vis'), d);
        ro.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-ct-rev]').forEach(el => ro.observe(el));
  } else {
    document.querySelectorAll('[data-ct-rev]').forEach(el => {
      el.classList.add('ct-vis');
    });
  }

  /* ── ELEMENTS ── */
  const form      = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const status    = document.getElementById('form-status');
  const textarea  = document.getElementById('ct-message');
  const charCount = document.getElementById('ctCharCount');

  if (!form || !submitBtn || !status) {
    console.warn('Contact: form elements not found');
    return;
  }

  /* ── HELPERS ── */
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  function showStatus(msg, type) {
    status.textContent = msg;
    status.className = `ct-status ct-status-show ct-status-${type}`;
  }

  function clearStatus() {
    status.className = 'ct-status';
    status.textContent = '';
  }

  function setBtnText(txt) {
    const el = submitBtn.querySelector('.ct-submit-text');
    if (el) el.textContent = txt;
    else submitBtn.textContent = txt;
  }

  function setBtnState(loading) {
    submitBtn.disabled = loading;
  }

  function ripple() {
    submitBtn.classList.remove('ct-rippling');
    void submitBtn.offsetWidth;
    submitBtn.classList.add('ct-rippling');
    setTimeout(() => submitBtn.classList.remove('ct-rippling'), 700);
  }

  /* ── CHAR COUNTER ── */
  if (textarea && charCount) {
    const MAX = 500;
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCount.textContent = `${len} / ${MAX}`;
      charCount.style.color = len > MAX * 0.9
        ? (len >= MAX ? '#f87171' : '#fb923c')
        : '#1f2937';
      if (len >= MAX) textarea.value = textarea.value.slice(0, MAX);
    });
  }

  /* ── FIELD VALIDATION FEEDBACK ── */
  function markField(fieldId, valid) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.style.borderColor = valid
      ? 'rgba(16,185,129,0.3)'
      : 'rgba(239,68,68,0.35)';
  }

  /* ── FORM SUBMIT ── */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearStatus();

    const name    = form.querySelector('#ct-name')?.value.trim()    || '';
    const email   = form.querySelector('#ct-email')?.value.trim()   || '';
    const message = form.querySelector('#ct-message')?.value.trim() || '';

    /* Validation */
    let valid = true;

    if (!name) {
      markField('ct-name', false);
      valid = false;
    } else {
      markField('ct-name', true);
    }

    if (!email || !isValidEmail(email)) {
      markField('ct-email', false);
      valid = false;
    } else {
      markField('ct-email', true);
    }

    if (!message || message.length < 10) {
      markField('ct-message', false);
      valid = false;
    } else {
      markField('ct-message', true);
    }

    if (!valid) {
      showStatus('⚠️ Please fill in all fields correctly.', 'err');
      return;
    }

    /* Loading */
    setBtnState(true);
    setBtnText('Sending...');
    ripple();

    try {
      const response = await fetch('https://formspree.io/f/movlloyl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name:     name,
          email:    email,
          subject:  form.querySelector('#ct-subject')?.value || 'General Inquiry',
          message:  message,
          _subject: 'Contact Form - MantraAQ'
        })
      });

      if (response.ok) {
        showStatus('✅ Message sent! We\'ll get back to you within 24 hours.', 'ok');
        form.reset();
        if (charCount) charCount.textContent = '0 / 500';
        setBtnText('Message Sent ✓');
        setTimeout(() => {
          setBtnText('Send Message');
          clearStatus();
        }, 6000);

      } else {
        const data = await response.json().catch(() => ({}));
        const msg  = data?.errors?.[0]?.message || `Error ${response.status}`;
        showStatus(`❌ ${msg}. Please try again.`, 'err');
        setBtnText('Send Message');
      }

    } catch (err) {
      console.error('Contact fetch error:', err);
      showStatus('❌ Network error. Please check your connection.', 'err');
      setBtnText('Send Message');
    }

    setBtnState(false);
    setTimeout(() => clearStatus(), 8000);
  });

  /* ── Reset field borders on input ── */
  ['ct-name', 'ct-email', 'ct-message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        el.style.borderColor = '';
        clearStatus();
      });
    }
  });

})();

/* ════════════════════════════════════════
   FOOTER JS — MantraAQ
════════════════════════════════════════ */
(function initFooter() {

  /* ── Auto year ── */
  const yearEl = document.getElementById('ftYear');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Back to top visibility ── */
  const toTop = document.getElementById('ftToTop');
  if (toTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 600) {
        toTop.classList.add('ft-totop-vis');
      } else {
        toTop.classList.remove('ft-totop-vis');
      }
    }, { passive: true });

    toTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

})();
/* ════════════════════════════════════════
   IMPACT SECTION JS — MantraAQ
════════════════════════════════════════ */
(function initImpact() {

  /* ── 1. SCROLL REVEAL ── */
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.imDelay || 0);
        setTimeout(() => e.target.classList.add('im-vis'), d);
        ro.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('[data-im-rev]').forEach(el => ro.observe(el));
  } else {
    document.querySelectorAll('[data-im-rev]').forEach(el => {
      el.classList.add('im-vis');
    });
  }

  /* ── 2. COUNTER ANIMATION ── */
  const section = document.querySelector('.im');
  if (!section) return;

  const co = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;

    /* Animate number counters */
    document.querySelectorAll('.im-counter').forEach(el => {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const dur    = 2000;
      const start  = performance.now();

      function tick(now) {
        const p    = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 4); // ease-out quartic
        const val  = Math.floor(target * ease);
        el.textContent = val + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = target + suffix; // ensure exact final value
      }
      requestAnimationFrame(tick);
    });

    /* Animate progress bars */
    document.querySelectorAll('.im-bar-fill').forEach((bar, i) => {
      setTimeout(() => {
        const w = bar.dataset.w || '100';
        bar.style.width = w + '%';
      }, 300 + i * 120);
    });

    co.disconnect();
  }, { threshold: 0.25 });

  co.observe(section);

  /* ── 3. CARD CURSOR GLOW ── */
  if (window.innerWidth > 768) {
    document.querySelectorAll('.im-card').forEach(card => {
      const glow = card.querySelector('.im-card-glow');
      card.addEventListener('mousemove', e => {
        const r   = card.getBoundingClientRect();
        const xPct = ((e.clientX - r.left) / r.width) * 100;
        const yPct = ((e.clientY - r.top)  / r.height) * 100;
        if (glow) {
          glow.style.background = `radial-gradient(
            circle at ${xPct}% ${yPct}%,
            rgba(16,185,129,0.1) 0%,
            transparent 65%
          )`;
        }
      });
      card.addEventListener('mouseleave', () => {
        if (glow) glow.style.background = '';
      });
    });
  }

})();

 
    /* ════════════════════════════════════════
   NEWSLETTER — FINAL FIXED
════════════════════════════════════════ */
(function () {

  /* ── Scroll Reveal ── */
  document.querySelectorAll('[data-nl-rev]').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(22px)';
    el.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
  });

  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const d = parseInt(e.target.dataset.nlDelay || 0);
        setTimeout(() => {
          e.target.style.opacity = '1';
          e.target.style.transform = 'none';
          e.target.classList.add('nl-vis');
        }, d);
        ro.unobserve(e.target);
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-nl-rev]').forEach(el => ro.observe(el));
  } else {
    // Fallback for old browsers
    document.querySelectorAll('[data-nl-rev]').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /* ── Elements ── */
  const form   = document.getElementById('newsletter-form');
  const btn    = document.getElementById('newsletter-btn');
  const input  = document.getElementById('newsletter-email');
  const status = document.getElementById('newsletter-status');
  const btnText = btn ? btn.querySelector('.nl-btn-text') : null;

  if (!form || !btn || !input || !status) {
    console.warn('Newsletter: one or more elements not found');
    return;
  }

  /* ── Helpers ── */
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  function showStatus(msg, type) {
    // type: 'ok' | 'err'
    status.textContent = msg;
    status.style.display     = 'block';
    status.style.opacity     = '1';
    status.style.transform   = 'none';
    status.style.padding     = '10px 20px';
    status.style.borderRadius = '100px';
    status.style.fontSize    = '0.82rem';
    status.style.fontWeight  = '600';
    status.style.marginTop   = '14px';
    status.style.textAlign   = 'center';

    if (type === 'ok') {
      status.style.background = 'rgba(16,185,129,0.1)';
      status.style.border     = '1px solid rgba(16,185,129,0.2)';
      status.style.color      = '#4ade80';
    } else {
      status.style.background = 'rgba(239,68,68,0.08)';
      status.style.border     = '1px solid rgba(239,68,68,0.18)';
      status.style.color      = '#f87171';
    }
  }

  function clearStatus() {
    status.textContent   = '';
    status.style.display = 'none';
    status.style.padding = '0';
    status.style.border  = 'none';
    status.style.background = 'transparent';
  }

  function setBtnText(txt) {
    if (btnText) btnText.textContent = txt;
  }

  function setBtnState(loading) {
    btn.disabled = loading;
    btn.style.opacity = loading ? '0.7' : '1';
    btn.style.pointerEvents = loading ? 'none' : '';
  }

  /* ── Submit ── */
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearStatus();

    const email = input.value.trim();

    /* Validation — hard stop */
    if (!email) {
      showStatus('⚠️ Please enter your email address.', 'err');
      input.focus();
      return;
    }
    if (!isValidEmail(email)) {
      showStatus('⚠️ Please enter a valid email address.', 'err');
      input.focus();
      return;
    }

    /* UI: loading */
    setBtnState(true);
    setBtnText('Sending...');

    try {
      const response = await fetch('https://formspree.io/f/mvgqbpro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          _subject: 'Newsletter Subscription - MantraAQ'
        })
      });

      if (response.ok) {
        showStatus('🎉 Subscribed! Welcome to the MantraAQ family.', 'ok');
        form.reset();
        setBtnText('✓ Done');
        setTimeout(() => {
          setBtnText('Subscribe');
          clearStatus();
        }, 1500);

      } else {
        const data = await response.json().catch(() => ({}));
        const errMsg = (data.errors && data.errors[0] && data.errors[0].message)
          ? data.errors[0].message
          : `Error ${response.status}. Please try again.`;
        showStatus('❌ ' + errMsg, 'err');
        setBtnText('Subscribe');
      }

    } catch (err) {
      console.error('Newsletter fetch error:', err);
      showStatus('❌ Network error. Check your connection.', 'err');
      setBtnText('Subscribe');
    }

    setBtnState(false);
  });

  /* ── Clear error on typing ── */
  input.addEventListener('input', () => {
    if (status.textContent && status.style.color === 'rgb(248, 113, 113)') {
      clearStatus();
    }
  });

  /* ── Focus state on field wrap ── */
  input.addEventListener('focus', () => {
    input.closest('.nl-field-wrap')?.classList.add('nl-focused');
  });
  input.addEventListener('blur', () => {
    input.closest('.nl-field-wrap')?.classList.remove('nl-focused');
  });

  /* ── Tape pause on hover ── */
  const tape = document.querySelector('.nl-tape');
  const tapeTrack = document.querySelector('.nl-tape-track');
  if (tape && tapeTrack) {
    tape.addEventListener('mouseenter', () => tapeTrack.style.animationPlayState = 'paused');
    tape.addEventListener('mouseleave', () => tapeTrack.style.animationPlayState = 'running');
  }

})();


    console.log('All event listeners attached successfully');
});

/* code for navbar in phone*/
// Mobile menu functionality - WORKING VERSION

/* ════════════════════════════════════════
   NAVBAR JS — MantraAQ FINAL
   Fixed: inert instead of aria-hidden
════════════════════════════════════════ */
(function initNav() {

  const nav       = document.getElementById('mainNav');
  const hamburger = document.getElementById('navHamburger');
  const drawer    = document.getElementById('navDrawer');

  if (!nav) return;

  /* ── 1. SCROLL: transparent → dark blur ── */
  function onScroll() {
    if (window.scrollY > 40) {
      nav.classList.add('nav-scrolled');
    } else {
      nav.classList.remove('nav-scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run immediately on load

  /* ── 2. HAMBURGER TOGGLE ── */
  if (hamburger && drawer) {

    /* Start with drawer inert (closed) */
    drawer.setAttribute('inert', '');

    hamburger.addEventListener('click', () => {
      const isOpen = drawer.classList.toggle('nav-drawer-open');
      hamburger.classList.toggle('nav-open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));

      if (isOpen) {
        drawer.removeAttribute('inert');  // allow focus when open
      } else {
        drawer.setAttribute('inert', ''); // block focus when closed
      }
    });
  }

  /* ── 3. CLOSE DRAWER on mobile link click ── */
  document.querySelectorAll('[data-nav-mob]').forEach(link => {
    link.addEventListener('click', () => {
      drawer?.classList.remove('nav-drawer-open');
      hamburger?.classList.remove('nav-open');
      hamburger?.setAttribute('aria-expanded', 'false');
      drawer?.setAttribute('inert', '');
    });
  });

  /* ── 4. CLOSE DRAWER on outside click ── */
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) {
      drawer?.classList.remove('nav-drawer-open');
      hamburger?.classList.remove('nav-open');
      hamburger?.setAttribute('aria-expanded', 'false');
      drawer?.setAttribute('inert', '');
    }
  });

  /* ── 5. SMOOTH SCROLL for all nav links ── */
  document.querySelectorAll('[data-nav], [data-nav-mob]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = 70;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── 6. ACTIVE LINK highlight on scroll ── */
  const sections   = ['home', 'about-us', 'products', 'contact'];
  const allLinks   = document.querySelectorAll('[data-nav], [data-nav-mob]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute('id');
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('nav-active', href === `#${id}`);
      });
    });
  }, { threshold: 0.4, rootMargin: '-60px 0px -40% 0px' });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  /* ── 7. CLOSE DRAWER on resize to desktop ── */
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768) {
      drawer?.classList.remove('nav-drawer-open');
      hamburger?.classList.remove('nav-open');
      hamburger?.setAttribute('aria-expanded', 'false');
      drawer?.setAttribute('inert', '');
    }
  }, { passive: true });

})();


// ========================================
// PRODUCT GALLERY FUNCTIONALITY
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    initProductGalleries();
});

function initProductGalleries() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const gallery = card.querySelector('.product-gallery');
        const images = card.querySelectorAll('.product-img');
        const indicators = card.querySelectorAll('.indicator');
        const prevBtn = card.querySelector('.gallery-nav.prev');
        const nextBtn = card.querySelector('.gallery-nav.next');
        
        let currentIndex = 0;
        let autoPlayInterval;
        let isHovered = false;
        
        // Navigate to specific image
        function goToImage(index) {
            if (index < 0) index = images.length - 1;
            if (index >= images.length) index = 0;
            
            // Update images
            images.forEach((img, i) => {
                img.classList.toggle('active', i === index);
            });
            
            // Update indicators
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });
            
            currentIndex = index;
        }
        
        // Auto-play functionality
        function startAutoPlay() {
            if (autoPlayInterval) return;
            autoPlayInterval = setInterval(() => {
                if (!isHovered) {
                    goToImage(currentIndex + 1);
                }
            }, 3000);
        }
        
        function stopAutoPlay() {
            if (autoPlayInterval) {
                clearInterval(autoPlayInterval);
                autoPlayInterval = null;
            }
        }
        
        // Navigation button handlers
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                goToImage(currentIndex - 1);
                stopAutoPlay();
                setTimeout(startAutoPlay, 5000);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                goToImage(currentIndex + 1);
                stopAutoPlay();
                setTimeout(startAutoPlay, 5000);
            });
        }
        
        // Indicator click handlers
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                goToImage(index);
                stopAutoPlay();
                setTimeout(startAutoPlay, 5000);
            });
        });
        
        // Hover pause
        card.addEventListener('mouseenter', () => {
            isHovered = true;
        });
        
        card.addEventListener('mouseleave', () => {
            isHovered = false;
        });
        
        // Touch swipe for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        gallery.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        gallery.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchStartX - touchEndX > swipeThreshold) {
                // Swipe left
                goToImage(currentIndex + 1);
            } else if (touchEndX - touchStartX > swipeThreshold) {
                // Swipe right
                goToImage(currentIndex - 1);
            }
            stopAutoPlay();
            setTimeout(startAutoPlay, 5000);
        }
        
        // Keyboard navigation
        card.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                goToImage(currentIndex - 1);
                stopAutoPlay();
                setTimeout(startAutoPlay, 5000);
            } else if (e.key === 'ArrowRight') {
                goToImage(currentIndex + 1);
                stopAutoPlay();
                setTimeout(startAutoPlay, 5000);
            }
        });
        
        // Start auto-play on load
        startAutoPlay();
    });
}

// Smooth scroll for "View All Products" button
document.querySelectorAll('a[href^="https://"]').forEach(link => {
    link.addEventListener('click', function(e) {
        // Optional: Add analytics tracking here
        console.log('Product link clicked:', this.href);
    });
});
