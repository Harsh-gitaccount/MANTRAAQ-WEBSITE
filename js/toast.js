/**
 * Mantraaq Premium Toast Notification System
 * Modern, glassmorphic toast notifications with dark slate design and colored glow accents.
 */
(function () {
  // ── Inject Toast CSS ──────────────────────────────────────────
  const styles = `
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
      max-width: 360px;
      width: calc(100% - 48px);
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 16px;
      background: rgba(15, 23, 42, 0.96);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      overflow: hidden;
      transform: translateX(110%);
      opacity: 0;
      animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .toast-item.removing {
      animation: toastFadeOut 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
    }

    @keyframes toastSlideIn {
      from { transform: translateX(110%); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes toastFadeOut {
      from { transform: translateX(0); opacity: 1; max-height: 120px; margin-bottom: 0; }
      to   { transform: translateX(110%); opacity: 0; max-height: 0; padding: 0 16px; margin-bottom: -12px; }
    }

    /* Icon Container */
    .toast-icon {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Message */
    .toast-message {
      flex: 1;
      font-size: 13px;
      font-weight: 500;
      color: #f8fafc;
      line-height: 1.4;
      margin: 0;
      word-break: break-word;
    }

    /* Close button */
    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.4);
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }
    .toast-close:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.1);
    }

    /* Progress bar */
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      border-radius: 0 0 16px 16px;
      animation: toastProgress linear forwards;
    }
    @keyframes toastProgress {
      from { width: 100%; }
      to   { width: 0%; }
    }

    /* ── Type: Success ── */
    .toast-item.toast-success {
      border-left: 3px solid #10b981;
      box-shadow: 0 12px 30px rgba(16, 185, 129, 0.1), 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .toast-item.toast-success .toast-icon {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }
    .toast-item.toast-success .toast-progress {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    /* ── Type: Error ── */
    .toast-item.toast-error {
      border-left: 3px solid #ef4444;
      box-shadow: 0 12px 30px rgba(239, 68, 68, 0.1), 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .toast-item.toast-error .toast-icon {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }
    .toast-item.toast-error .toast-progress {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    /* ── Type: Warning ── */
    .toast-item.toast-warning {
      border-left: 3px solid #f59e0b;
      box-shadow: 0 12px 30px rgba(245, 158, 11, 0.1), 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .toast-item.toast-warning .toast-icon {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
    }
    .toast-item.toast-warning .toast-progress {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    /* ── Type: Info ── */
    .toast-item.toast-info {
      border-left: 3px solid #3b82f6;
      box-shadow: 0 12px 30px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.25);
    }
    .toast-item.toast-info .toast-icon {
      background: rgba(59, 130, 246, 0.15);
      color: #60a5fa;
    }
    .toast-item.toast-info .toast-progress {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }

    /* ── Mobile Responsive ── */
    @media (max-width: 480px) {
      .toast-container {
        bottom: 16px;
        top: auto;
        right: 16px;
        left: 16px;
        max-width: none;
        width: auto;
      }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.id = 'mantraaq-toast-styles';
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);

  // ── Icon SVGs ─────────────────────────────────────────────────
  const ICONS = {
    success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  };

  const CLOSE_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

  // Default durations
  const DEFAULT_DURATIONS = {
    success: 2500,
    info: 2500,
    error: 4500,
    warning: 4500,
  };

  const MAX_TOASTS = 5;
  let container = null;
  let activeToasts = [];

  function ensureContainer() {
    if (!container || !document.body.contains(container)) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.id = 'toastContainer';
      document.body.appendChild(container);
    }
    return container;
  }

  function dismissToast(toastEl) {
    if (toastEl._dismissed) return;
    toastEl._dismissed = true;

    toastEl.classList.add('removing');
    clearTimeout(toastEl._timer);

    setTimeout(() => {
      toastEl.remove();
      activeToasts = activeToasts.filter(t => t !== toastEl);
    }, 350);
  }

  function show(type, message, duration) {
    const cont = ensureContainer();
    duration = duration || DEFAULT_DURATIONS[type] || 4000;

    // Enforce max toasts
    while (activeToasts.length >= MAX_TOASTS) {
      dismissToast(activeToasts[0]);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${ICONS[type] || ICONS.info}</div>
      <p class="toast-message">${escapeHtml(message)}</p>
      <button class="toast-close" aria-label="Dismiss">${CLOSE_SVG}</button>
      <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
    `;

    // Close button handler
    toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));

    // Auto-dismiss timer
    toast._timer = setTimeout(() => dismissToast(toast), duration);
    toast._dismissed = false;

    // Pause timer on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(toast._timer);
      const progress = toast.querySelector('.toast-progress');
      if (progress) progress.style.animationPlayState = 'paused';
    });
    toast.addEventListener('mouseleave', () => {
      toast._timer = setTimeout(() => dismissToast(toast), 1500);
      const progress = toast.querySelector('.toast-progress');
      if (progress) {
        progress.style.animationPlayState = 'running';
        progress.style.animationDuration = '1500ms';
      }
    });

    cont.appendChild(toast);
    activeToasts.push(toast);

    return toast;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Expose Global API ─────────────────────────────────────────
  window.Toast = {
    success(message, duration) { return show('success', message, duration); },
    error(message, duration)   { return show('error', message, duration); },
    warning(message, duration) { return show('warning', message, duration); },
    info(message, duration)    { return show('info', message, duration); },
  };
})();
