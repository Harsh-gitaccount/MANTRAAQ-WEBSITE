/**
 * Mantraaq Search Overlay Module
 * Premium full-screen glassmorphic search with live product filtering.
 */

;(function () {
  'use strict';

  /* ───────────────────────── CSS INJECTION ───────────────────────── */
  const css = `
    /* ── Search Overlay ── */
    .search-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: min(18vh, 160px);
      background: rgba(3, 10, 5, 0.82);
      backdrop-filter: blur(24px) saturate(140%);
      -webkit-backdrop-filter: blur(24px) saturate(140%);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                  visibility 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .search-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    /* ── Close Button ── */
    .search-close-btn {
      position: absolute;
      top: 28px;
      right: 32px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 50%;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.5);
      font-size: 22px;
      line-height: 1;
      transition: all 0.25s ease;
    }
    .search-close-btn:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #4ade80;
      transform: rotate(90deg);
    }

    /* ── Search Container ── */
    .search-container {
      width: 90%;
      max-width: 640px;
      transform: translateY(18px) scale(0.97);
      opacity: 0;
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) 0.05s,
                  opacity 0.35s ease 0.05s;
    }
    .search-overlay.active .search-container {
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    /* ── Input Wrapper ── */
    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(7, 23, 12, 0.65);
      border: 1px solid rgba(74, 222, 128, 0.18);
      border-radius: 16px;
      box-shadow: 0 0 0 0 rgba(74, 222, 128, 0),
                  0 8px 32px rgba(0, 0, 0, 0.35);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .search-input-wrap:focus-within {
      border-color: rgba(74, 222, 128, 0.45);
      box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.08),
                  0 8px 40px rgba(0, 0, 0, 0.4);
    }

    /* Magnifying glass icon */
    .search-icon {
      flex-shrink: 0;
      margin-left: 20px;
      color: rgba(74, 222, 128, 0.55);
      transition: color 0.25s ease;
    }
    .search-input-wrap:focus-within .search-icon {
      color: #4ade80;
    }

    /* Input field */
    .search-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      padding: 20px 20px 20px 14px;
      font-size: 18px;
      font-weight: 500;
      color: #f0fdf4;
      font-family: inherit;
      letter-spacing: 0.01em;
    }
    .search-input::placeholder {
      color: rgba(255, 255, 255, 0.28);
      font-weight: 400;
    }

    /* Shortcut hint */
    .search-hint {
      flex-shrink: 0;
      margin-right: 16px;
      padding: 4px 10px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.4);
      letter-spacing: 0.5px;
      cursor: pointer;
      user-select: none;
      transition: all 0.2s ease;
    }
    .search-hint:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #4ade80;
    }

    /* ── Results Dropdown ── */
    .search-results {
      margin-top: 8px;
      background: rgba(7, 23, 12, 0.75);
      border: 1px solid rgba(74, 222, 128, 0.12);
      border-radius: 14px;
      max-height: 360px;
      overflow-y: auto;
      overflow-x: hidden;
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
      scrollbar-width: auto;
      scrollbar-color: #10b981 rgba(255, 255, 255, 0.05);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.25s ease, transform 0.25s ease;
    }
    .search-results.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .search-results::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    .search-results::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }
    .search-results::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #4ade80, #10b981);
      border-radius: 6px;
      border: 2px solid #030d06; /* Matches search dropdown background */
    }
    .search-results::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to bottom, #22c55e, #10b981);
    }

    /* Result item */
    .search-result-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 20px;
      cursor: pointer;
      transition: background 0.2s ease;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .search-result-item:last-child {
      border-bottom: none;
    }
    .search-result-item:hover,
    .search-result-item.focused {
      background: rgba(74, 222, 128, 0.08);
    }
    .search-result-item:active {
      background: rgba(74, 222, 128, 0.14);
    }

    .search-result-icon {
      flex-shrink: 0;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(74, 222, 128, 0.08);
      border: 1px solid rgba(74, 222, 128, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #4ade80;
    }

    .search-result-info {
      flex: 1;
      min-width: 0;
    }
    .search-result-title {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
    }
    .search-result-desc {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.35);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 2px 0 0;
    }

    .search-result-arrow {
      flex-shrink: 0;
      color: rgba(255, 255, 255, 0.15);
      transition: color 0.2s ease, transform 0.2s ease;
    }
    .search-result-item:hover .search-result-arrow {
      color: #4ade80;
      transform: translateX(3px);
    }

    /* Empty state */
    .search-empty {
      padding: 36px 20px;
      text-align: center;
      color: rgba(255, 255, 255, 0.3);
      font-size: 14px;
      font-weight: 500;
    }
    .search-empty-icon {
      font-size: 32px;
      margin-bottom: 10px;
      opacity: 0.5;
    }

    /* ── Product Card Highlight Animation ── */
    @keyframes searchHighlightPulse {
      0%   { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.45); }
      40%  { box-shadow: 0 0 20px 6px rgba(74, 222, 128, 0.25); }
      100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
    }
    .product-card.search-highlight {
      animation: searchHighlightPulse 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      outline: 2px solid rgba(74, 222, 128, 0.35);
      outline-offset: 4px;
      border-radius: inherit;
      transition: outline-color 2s ease;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .search-overlay {
        padding-top: 80px;
      }
      .search-container {
        width: 94%;
      }
      .search-input {
        font-size: 16px;
        padding: 16px 14px 16px 12px;
      }
      .search-hint {
        display: none;
      }
      .search-close-btn {
        top: 18px;
        right: 18px;
        width: 38px;
        height: 38px;
        font-size: 20px;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ──────────────────────── DOM INJECTION ──────────────────────── */
  const overlayHTML = `
    <div id="searchOverlay" class="search-overlay">
      <button class="search-close-btn" aria-label="Close search">&times;</button>
      <div class="search-container">
        <div class="search-input-wrap">
          <svg class="search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input id="searchInput" class="search-input" type="text"
                 placeholder="Search products…" autocomplete="off" spellcheck="false" />
          <span class="search-hint">Close</span>
        </div>
        <div id="searchResults" class="search-results"></div>
      </div>
    </div>
  `;

  /* ──────────────────────── SEARCH MODULE ──────────────────────── */
  let debounceTimer = null;
  let focusedIndex = -1;

  const Search = {
    init() {
      document.body.insertAdjacentHTML('beforeend', overlayHTML);

      const overlay = document.getElementById('searchOverlay');
      const input = document.getElementById('searchInput');
      const closeBtn = overlay.querySelector('.search-close-btn');
      const escHint = overlay.querySelector('.search-hint');

      // Close on backdrop click
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) Search.close();
      });

      // Close button
      closeBtn.addEventListener('click', () => Search.close());

      // ESC keyboard hint clickable
      if (escHint) {
        escHint.addEventListener('click', (e) => {
          e.stopPropagation();
          Search.close();
        });
      }

      // ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('active')) {
          e.preventDefault();
          Search.close();
        }
      });

      // Keyboard shortcut: Ctrl+K or Cmd+K to open
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          Search.open();
        }
      });

      // Live search on input
      input.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => Search._performSearch(input.value), 120);
      });

      // Keyboard navigation in results
      input.addEventListener('keydown', (e) => {
        const items = document.querySelectorAll('.search-result-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
          Search._updateFocus(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          focusedIndex = Math.max(focusedIndex - 1, 0);
          Search._updateFocus(items);
        } else if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < items.length) {
          e.preventDefault();
          items[focusedIndex].click();
        }
      });

      // Bind any [data-action="search"] triggers on the page
      document.querySelectorAll('[data-action="search"]').forEach((el) => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          Search.open();
        });
      });
    },

    open(query = '') {
      const overlay = document.getElementById('searchOverlay');
      const input = document.getElementById('searchInput');
      if (!overlay) return;

      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Slight delay so the CSS transition finishes before focus (avoids mobile keyboard jank)
      setTimeout(() => {
        input.value = query;
        input.focus();
        if (query) {
          Search._performSearch(query);
        } else {
          Search._clearResults();
        }
      }, 80);
    },

    close() {
      const overlay = document.getElementById('searchOverlay');
      if (!overlay) return;

      overlay.classList.remove('active');
      document.body.style.overflow = '';
      focusedIndex = -1;
      Search._clearResults();
    },

    /* ── Internal helpers ── */

    _clearResults() {
      const results = document.getElementById('searchResults');
      if (results) {
        results.innerHTML = '';
        results.classList.remove('visible');
      }
    },

    _performSearch(query) {
      const results = document.getElementById('searchResults');
      const trimmed = query.trim().toLowerCase();

      if (!trimmed) {
        Search._clearResults();
        return;
      }

      const cards = document.querySelectorAll('.product-card[data-product]');
      const matches = [];

      cards.forEach((card) => {
        if (card.style.display === 'none') return;
        const productKey = (card.getAttribute('data-product') || '').toLowerCase();
        const title = (card.querySelector('.product-title')?.textContent || '').toLowerCase();
        const description = (card.querySelector('.product-description')?.textContent || '').toLowerCase();
        const featureTags = Array.from(card.querySelectorAll('.feature-tag'))
          .map((t) => t.textContent.toLowerCase())
          .join(' ');

        const searchable = `${productKey} ${title} ${description} ${featureTags}`;

        if (searchable.includes(trimmed)) {
          matches.push({
            card,
            title: card.querySelector('.product-title')?.textContent || productKey,
            description: card.querySelector('.product-description')?.textContent?.trim().substring(0, 80) || '',
            key: productKey,
          });
        }
      });

      focusedIndex = -1;

      if (matches.length === 0) {
        results.innerHTML = `
          <div class="search-empty">
            <div class="search-empty-icon">🔍</div>
            No products found for "<strong style="color:#4ade80">${Search._escapeHTML(query.trim())}</strong>"
          </div>
        `;
        results.classList.add('visible');
        return;
      }

      results.innerHTML = matches
        .map(
          (m, i) => `
          <div class="search-result-item" data-search-index="${i}" data-product-key="${m.key}">
            <div class="search-result-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </div>
            <div class="search-result-info">
              <p class="search-result-title">${Search._highlightMatch(m.title, query.trim())}</p>
              <p class="search-result-desc">${m.description ? Search._escapeHTML(m.description) + '…' : ''}</p>
            </div>
            <svg class="search-result-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        `
        )
        .join('');

      results.classList.add('visible');

      // Attach click listeners
      results.querySelectorAll('.search-result-item').forEach((item) => {
        item.addEventListener('click', () => {
          const key = item.getAttribute('data-product-key');
          Search._navigateToProduct(key);
        });
      });
    },

    _navigateToProduct(productKey) {
      Search.close();

      const card = document.querySelector(`.product-card[data-product="${productKey}"]`);
      if (!card) return;

      // Scroll to the card
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Add highlight after scroll completes
        setTimeout(() => {
          card.classList.add('search-highlight');
          // Remove highlight after animation
          setTimeout(() => {
            card.classList.remove('search-highlight');
            card.style.outlineColor = 'transparent';
          }, 2200);
        }, 450);
      }, 150);
    },

    _updateFocus(items) {
      items.forEach((item, i) => {
        item.classList.toggle('focused', i === focusedIndex);
      });
      // Scroll focused item into view
      if (focusedIndex >= 0 && items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    },

    _escapeHTML(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    },

    _highlightMatch(text, query) {
      const escaped = Search._escapeHTML(text);
      const queryEscaped = Search._escapeHTML(query);
      const regex = new RegExp(`(${queryEscaped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return escaped.replace(regex, '<span style="color:#4ade80;font-weight:700">$1</span>');
    },
  };

  /* ── Export ── */
  window.Search = Search;

  /* ── Auto-init ── */
  document.addEventListener('DOMContentLoaded', () => {
    Search.init();
    
    // Check if query param exists
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q') || urlParams.get('search');
    if (q) {
      Search.open(q);
    }
  });
})();
