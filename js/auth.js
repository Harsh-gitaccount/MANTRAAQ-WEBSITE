/**
 * Mantraaq Customer Authentication & Profile Modal Engine
 */

// Inject Auth Modal CSS dynamically
(function injectAuthStyles() {
  const styles = `
    /* Auth Modal Overlay */
    .auth-overlay {
      position: fixed;
      inset: 0;
      background: rgba(3, 10, 5, 0.65);
      backdrop-filter: blur(12px);
      z-index: 1200;
      opacity: 0;
      visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      transition: all 0.3s ease;
    }
    .auth-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    /* Modal Container */
    .auth-modal {
      background: linear-gradient(135deg, #030a05 0%, #07170c 100%);
      width: 100%;
      max-width: 480px;
      border-radius: 20px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      transform: scale(0.95);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      flex-direction: column;
      max-height: 90vh;
      border: 1px solid rgba(74, 222, 128, 0.15);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .auth-overlay.active .auth-modal {
      transform: scale(1);
    }

    /* Header */
    .auth-hdr {
      padding: 20px 24px;
      border-bottom: 1px solid rgba(74, 222, 128, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .auth-hdr h2 {
      font-size: 18px;
      font-weight: 700;
      color: #f0fdf4;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .auth-close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.5);
      transition: color 0.2s;
      line-height: 1;
    }
    .auth-close-btn:hover {
      color: #4ade80;
    }

    /* Body */
    .auth-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      scrollbar-width: auto;
      scrollbar-color: #10b981 rgba(255, 255, 255, 0.05);
    }
    .auth-body::-webkit-scrollbar {
      width: 10px;
      height: 10px;
    }
    .auth-body::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 6px;
    }
    .auth-body::-webkit-scrollbar-thumb {
      background: linear-gradient(to bottom, #4ade80, #10b981);
      border-radius: 6px;
      border: 2px solid #07170c;
    }
    .auth-body::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(to bottom, #22c55e, #10b981);
    }

    /* Tab switcher */
    .auth-tabs {
      display: flex;
      border-bottom: 1px solid rgba(74, 222, 128, 0.1);
      margin-bottom: 24px;
    }
    .auth-tab-btn {
      flex: 1;
      text-align: center;
      padding: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.4);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }
    .auth-tab-btn.active {
      color: #4ade80;
      border-bottom-color: #4ade80;
    }

    /* Forms */
    .auth-form {
      display: none;
      flex-direction: column;
      gap: 16px;
    }
    .auth-form.active {
      display: flex;
    }
    .auth-form-grp {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .auth-form-grp label {
      font-size: 11px;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.5);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      justify-content: space-between;
    }
    .auth-form-grp input {
      border: 1px solid rgba(74, 222, 128, 0.15);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      color: #f0fdf4;
      outline: none;
      transition: border-color 0.2s, background-color 0.2s;
      background: rgba(255, 255, 255, 0.04);
    }
    .auth-form-grp input:focus {
      border-color: #4ade80;
      background: rgba(255, 255, 255, 0.08);
    }
    .auth-btn {
      background: linear-gradient(90deg, #22c55e, #15803d);
      border: none;
      color: #ffffff;
      padding: 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
      transition: all 0.3s;
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .auth-btn:hover {
      box-shadow: 0 6px 16px rgba(34, 197, 94, 0.45);
      transform: translateY(-1px);
    }
    .auth-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    /* Forgot Password link */
    .forgot-link {
      font-size: 12px;
      color: #4ade80;
      text-decoration: none;
      font-weight: 600;
      cursor: pointer;
    }
    .forgot-link:hover {
      color: #86efac;
      text-decoration: underline;
    }

    /* Profile Panel */
    .profile-panel {
      display: none;
      flex-direction: column;
      gap: 20px;
    }
    .profile-panel.active {
      display: flex;
    }
    
    /* Profile Header Info Card */
    .profile-hdr-info {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.02));
      padding: 20px;
      border-radius: 16px;
      border: 1px solid rgba(74, 222, 128, 0.15);
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .profile-avatar {
      background: linear-gradient(135deg, #22c55e, #15803d);
      color: #ffffff;
      width: 48px;
      height: 48px;
      border-radius: 99px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      box-shadow: 0 4px 10px rgba(34, 197, 94, 0.2);
      flex-shrink: 0;
    }
    .profile-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
      flex: 1;
    }
    .profile-meta-name {
      font-size: 16px;
      font-weight: 700;
      color: #f0fdf4;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-meta-email {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Orders List */
    .orders-section h3 {
      font-size: 13px;
      font-weight: 700;
      color: #f0fdf4;
      margin: 0 0 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .profile-orders-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-right: 4px;
    }
    .profile-order-item {
      border: 1px solid rgba(74, 222, 128, 0.08);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .profile-order-item.expanded {
      border-color: rgba(74, 222, 128, 0.25);
      background: rgba(255, 255, 255, 0.04);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
    .profile-order-header {
      padding: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      transition: background 0.2s;
    }
    .profile-order-header:hover {
      background: rgba(255, 255, 255, 0.02);
    }
    .profile-order-summary {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-width: 0;
      padding-right: 12px;
    }
    .profile-order-id {
      font-family: monospace;
      font-weight: 700;
      color: #f0fdf4;
      font-size: 12.5px;
    }
    .profile-order-date {
      color: rgba(255, 255, 255, 0.4);
      font-size: 11px;
    }
    .profile-order-items-summary {
      color: rgba(255, 255, 255, 0.5);
      font-size: 11.5px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .profile-order-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }
    .profile-order-total {
      font-weight: 700;
      color: #f0fdf4;
      font-size: 12.5px;
    }
    .profile-order-status-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .profile-order-status-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2.5px 7px;
      border-radius: 99px;
      text-transform: uppercase;
      display: inline-block;
      letter-spacing: 0.2px;
    }
    .profile-order-status-badge.pending { background: rgba(241, 245, 249, 0.15); color: #cbd5e1; border: 1px solid rgba(241, 245, 249, 0.2); }
    .profile-order-status-badge.paid { background: rgba(209, 250, 229, 0.15); color: #34d399; border: 1px solid rgba(209, 250, 229, 0.2); }
    .profile-order-status-badge.dispatched { background: rgba(219, 234, 254, 0.15); color: #60a5fa; border: 1px solid rgba(219, 234, 254, 0.2); }
    .profile-order-status-badge.delivered { background: rgba(243, 232, 255, 0.15); color: #c084fc; border: 1px solid rgba(243, 232, 255, 0.2); }
    .profile-order-status-badge.cancelled { background: rgba(254, 226, 226, 0.15); color: #f87171; border: 1px solid rgba(254, 226, 226, 0.2); }
    .profile-order-status-badge.refunded { background: rgba(254, 243, 199, 0.15); color: #fbbf24; border: 1px solid rgba(254, 243, 199, 0.2); }
    
    .profile-order-chevron {
      color: rgba(255, 255, 255, 0.4);
      transition: transform 0.3s ease;
    }
    .profile-order-item.expanded .profile-order-chevron {
      transform: rotate(180deg);
      color: #4ade80;
    }
    
    .profile-order-details-inner {
      padding: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .order-details-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .order-details-section h4 {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4ade80;
      margin: 0;
      letter-spacing: 0.5px;
    }
    .order-items-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: rgba(255, 255, 255, 0.015);
      border-radius: 8px;
      padding: 10px;
      border: 1px solid rgba(255, 255, 255, 0.03);
    }
    .order-item-detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
    }
    .order-item-qty {
      color: rgba(255, 255, 255, 0.4);
      font-size: 11px;
      margin-left: 6px;
    }
    .order-item-price {
      font-weight: 600;
      color: #f0fdf4;
    }
    
    .order-details-section-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 14px;
    }
    .address-text, .payment-text {
      font-size: 11.5px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
      margin: 4px 0 0;
    }
    .payment-sub {
      font-size: 10px;
      color: rgba(255, 255, 255, 0.4);
      display: block;
      margin-top: 2px;
    }
    
    /* Timeline styling */
    .timeline-container {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0px;
      padding-left: 20px;
      margin: 6px 0;
    }
    .timeline-step {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-bottom: 16px;
    }
    .timeline-step:last-child {
      padding-bottom: 0;
    }
    .timeline-step::before {
      content: '';
      position: absolute;
      left: -15px;
      top: 14px;
      bottom: -6px;
      width: 2px;
      background: rgba(255, 255, 255, 0.08);
      z-index: 1;
    }
    .timeline-step:last-child::before {
      display: none;
    }
    .timeline-step.completed::before {
      background: #22c55e;
    }
    .timeline-dot {
      position: absolute;
      left: -19px;
      top: 4px;
      width: 10px;
      height: 10px;
      border-radius: 99px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid #030a05;
      z-index: 2;
      transition: all 0.3s;
    }
    .timeline-step.active .timeline-dot {
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
    }
    .timeline-step.cancelled .timeline-dot {
      background: #ef4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
    }
    .timeline-step.refunded .timeline-dot {
      background: #f59e0b;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.6);
    }
    
    .timeline-title {
      font-size: 12px;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.4);
    }
    .timeline-step.active .timeline-title {
      color: #f0fdf4;
    }
    .timeline-step.cancelled .timeline-title {
      color: #fee2e2;
    }
    .timeline-step.refunded .timeline-title {
      color: #fef3c7;
    }
    .timeline-subtitle {
      font-size: 10.5px;
      color: rgba(255, 255, 255, 0.5);
    }
    .timeline-step.active .timeline-subtitle {
      color: rgba(255, 255, 255, 0.7);
    }
    .order-cancel-btn {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 8px;
      transition: all 0.2s;
      align-self: flex-start;
    }
    .order-cancel-btn:hover {
      background: rgba(239, 68, 68, 0.25);
      border-color: #ef4444;
      color: #ffffff;
    }

    /* Sub-panels inside Profile */
    .profile-sub-actions {
      display: flex;
      gap: 12px;
    }
    .profile-sub-btn {
      flex: 1;
      background: rgba(255, 255, 255, 0.04);
      color: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(74, 222, 128, 0.15);
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    .profile-sub-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border-color: #4ade80;
      transform: translateY(-0.5px);
    }
    .profile-logout-btn {
      background: rgba(239, 68, 68, 0.08);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.2);
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      width: 100%;
      margin-top: 12px;
      box-sizing: border-box;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    .profile-logout-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      border-color: #ef4444;
      color: #ffffff;
      transform: translateY(-0.5px);
    }

    /* Celebratory Welcome Panel */
    .welcome-panel {
      display: none;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 16px 8px;
      gap: 20px;
    }
    .welcome-panel.active {
      display: flex;
    }
    .welcome-icon {
      background: rgba(74, 222, 128, 0.08);
      border: 1px solid rgba(74, 222, 128, 0.2);
      border-radius: 99px;
      padding: 16px;
      display: inline-flex;
      animation: popScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes popScale {
      from { transform: scale(0.6); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .welcome-title {
      font-size: 20px;
      font-weight: 800;
      color: #f0fdf4;
      margin: 0;
    }
    .welcome-desc {
      font-size: 13.5px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.6;
      margin: 0;
    }
    .welcome-coupon-card {
      background: linear-gradient(135deg, rgba(74, 222, 128, 0.08), rgba(21, 128, 61, 0.12));
      border: 1px dashed rgba(74, 222, 128, 0.35);
      border-radius: 12px;
      padding: 16px;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }
    .coupon-tag {
      font-size: 10px;
      font-weight: 800;
      color: #86efac;
      letter-spacing: 1px;
    }
    .coupon-code-box {
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(74, 222, 128, 0.2);
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 80%;
      transition: all 0.2s;
    }
    .coupon-code-box:hover {
      border-color: #4ade80;
      background: rgba(0, 0, 0, 0.4);
      box-shadow: 0 4px 12px rgba(74, 222, 128, 0.1);
      transform: translateY(-1px);
    }
    .coupon-code {
      font-family: monospace;
      font-size: 16px;
      font-weight: 800;
      color: #4ade80;
    }
    .coupon-copy-hint {
      font-size: 11px;
      color: #86efac;
      font-weight: 600;
    }
    .coupon-details {
      font-size: 11.5px;
      color: rgba(255, 255, 255, 0.6);
      margin: 0;
      line-height: 1.4;
    }

    /* Login button active indicator */
    .nav-account.logged-in::after {
      content: '';
      position: absolute;
      top: 4px;
      right: 4px;
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 99px;
      border: 2px solid #030a05;
    }
    .nav-account {
      position: relative;
    }

    /* Inline error alert banner */
    .auth-error-alert {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      padding: 12px 16px;
      color: #f87171;
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.5;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: alertSlideDown 0.3s ease-out;
    }
    .auth-error-alert.success-alert {
      background: rgba(74, 222, 128, 0.08);
      border-color: rgba(74, 222, 128, 0.2);
      color: #4ade80;
    }
    @keyframes alertSlideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Password Input Wrapper */
    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }
    .password-input-wrapper input {
      width: 100%;
      padding-right: 42px !important;
    }
    .password-toggle-btn {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      transition: color 0.2s;
      z-index: 5;
    }
    .password-toggle-btn:hover {
      color: #4ade80;
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.innerHTML = styles;
  document.head.appendChild(styleEl);
})();

const CustomerAuth = {
  user: null,

  showError(message) {
    const alertEl = document.getElementById('authErrorAlert');
    if (alertEl) {
      alertEl.className = 'auth-error-alert';
      alertEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>${message}</span>
      `;
      alertEl.style.display = 'flex';
      const bodyEl = document.querySelector('.auth-body');
      if (bodyEl) bodyEl.scrollTop = 0;
    }
  },

  showSuccess(message) {
    const alertEl = document.getElementById('authErrorAlert');
    if (alertEl) {
      alertEl.className = 'auth-error-alert success-alert';
      alertEl.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <span>${message}</span>
      `;
      alertEl.style.display = 'flex';
      const bodyEl = document.querySelector('.auth-body');
      if (bodyEl) bodyEl.scrollTop = 0;
    }
  },

  clearError() {
    const alertEl = document.getElementById('authErrorAlert');
    if (alertEl) {
      alertEl.style.display = 'none';
      alertEl.className = 'auth-error-alert';
      alertEl.innerHTML = '';
    }
  },

  clearInputs() {
    const inputs = [
      'customerLoginEmail', 'customerLoginPassword',
      'customerRegisterName', 'customerRegisterEmail', 'customerRegisterPassword',
      'customerForgotEmail', 'oldPassword', 'newPassword', 'editName', 'editPhone'
    ];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value = '';
        if (['customerLoginPassword', 'customerRegisterPassword', 'oldPassword', 'newPassword'].includes(id)) {
          el.type = 'password';
        }
      }
    });

    document.querySelectorAll('.password-input-wrapper').forEach(wrapper => {
      const eyeOpen = wrapper.querySelector('.eye-open');
      const eyeClosed = wrapper.querySelector('.eye-closed');
      if (eyeOpen) eyeOpen.style.display = 'inline';
      if (eyeClosed) eyeClosed.style.display = 'none';
    });
  },

  async checkAuth() {
    const token = localStorage.getItem('user_token');
    if (!token) {
      this.updateNavbar(false);
      return;
    }

    try {
      const data = await window.MantraaqAPI.getMe();
      if (data) {
        this.user = data.user || data;
        this.updateNavbar(true);
      } else {
        localStorage.removeItem('user_token');
        this.user = null;
        this.updateNavbar(false);
      }
    } catch (err) {
      console.error('Check customer auth error:', err);
      localStorage.removeItem('user_token');
      this.user = null;
      this.updateNavbar(false);
    }
  },

  updateNavbar(isLoggedIn) {
    document.querySelectorAll('[data-action="account"]').forEach(el => {
      if (isLoggedIn) {
        el.classList.add('logged-in');
        el.title = 'My Profile';
      } else {
        el.classList.remove('logged-in');
        el.title = 'Login';
      }
    });
  },

  init() {
    const modalHTML = `
      <div id="authOverlay" class="auth-overlay" onclick="CustomerAuth.handleOverlayClick(event)">
        <div class="auth-modal">
          <div class="auth-hdr">
            <h2 id="authModalTitle">My Account</h2>
            <button class="auth-close-btn" onclick="CustomerAuth.close()">&times;</button>
          </div>

          <div class="auth-body">
            <!-- Inline Error Alert Banner -->
            <div id="authErrorAlert" class="auth-error-alert" style="display: none;"></div>

            <!-- TABS (only shown when not logged in) -->
            <div id="authTabs" class="auth-tabs">
              <button id="tabLogin" class="auth-tab-btn active" onclick="CustomerAuth.switchTab('login')">Login</button>
              <button id="tabRegister" class="auth-tab-btn" onclick="CustomerAuth.switchTab('register')">Register</button>
            </div>

            <!-- LOGIN FORM -->
            <form id="customerLoginForm" class="auth-form active" onsubmit="CustomerAuth.handleLogin(event)">
              <div class="auth-form-grp">
                <label>Email Address</label>
                <input type="email" id="customerLoginEmail" placeholder="you@email.com" autocomplete="username" required />
              </div>
              <div class="auth-form-grp">
                <label>
                  <span>Password</span>
                  <a class="forgot-link" onclick="CustomerAuth.showForgotPassword()">Forgot Password?</a>
                </label>
                <div class="password-input-wrapper">
                  <input type="password" id="customerLoginPassword" placeholder="••••••••" autocomplete="current-password" required />
                  <button type="button" class="password-toggle-btn" onclick="CustomerAuth.togglePasswordVisibility('customerLoginPassword')">
                    <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg class="eye-closed" style="display:none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
              </div>
              <button type="submit" class="auth-btn" id="loginBtn">Sign In</button>
            </form>

            <!-- REGISTER FORM -->
            <form id="customerRegisterForm" class="auth-form" onsubmit="CustomerAuth.handleRegister(event)">
              <div class="auth-form-grp">
                <label>Full Name</label>
                <input type="text" id="customerRegisterName" placeholder="John Doe" autocomplete="name" required />
              </div>
              <div class="auth-form-grp">
                <label>Email Address</label>
                <input type="email" id="customerRegisterEmail" placeholder="you@email.com" autocomplete="email" required />
              </div>
              <div class="auth-form-grp">
                <label>Password (Min 6 Characters)</label>
                <div class="password-input-wrapper">
                  <input type="password" id="customerRegisterPassword" placeholder="••••••••" minlength="6" autocomplete="new-password" required />
                  <button type="button" class="password-toggle-btn" onclick="CustomerAuth.togglePasswordVisibility('customerRegisterPassword')">
                    <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <svg class="eye-closed" style="display:none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                  </button>
                </div>
              </div>
              <button type="submit" class="auth-btn" id="registerBtn">Create Account</button>
            </form>

            <!-- FORGOT PASSWORD FORM -->
            <form id="customerForgotForm" class="auth-form" onsubmit="CustomerAuth.handleForgotSubmit(event)">
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0 0 8px 0;">
                Enter your email address below and we will send you a password reset link.
              </p>
              <div class="auth-form-grp">
                <label>Email Address</label>
                <input type="email" id="customerForgotEmail" placeholder="you@email.com" autocomplete="email" required />
              </div>
              <button type="submit" class="auth-btn" id="forgotBtn">Send Reset Link</button>
              <a class="forgot-link" style="text-align: center; display: block; margin-top: 8px;" onclick="CustomerAuth.switchTab('login')">
                &larr; Back to Login
              </a>
            </form>

            <!-- CELEBRATORY WELCOME PANEL -->
            <div id="customerWelcomePanel" class="welcome-panel">
              <div class="welcome-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h3 class="welcome-title">Welcome, <span id="welcomeCustomerName">Friend</span>!</h3>
              <p class="welcome-desc">Your account has been created successfully. To celebrate, we've added a discount code just for you!</p>
              
              <div class="welcome-coupon-card">
                <span class="coupon-tag">NEW CUSTOMER SPECIAL</span>
                <div class="coupon-code-box" onclick="CustomerAuth.copyWelcomeCoupon()">
                  <span class="coupon-code">WELCOME75</span>
                  <span id="couponCopyHint" class="coupon-copy-hint">Copy Code</span>
                </div>
                <p class="coupon-details">Enjoy flat ₹75 off on orders of ₹599 or above (first order only). Use this code at checkout.</p>
              </div>

              <button class="auth-btn" style="width: 100%; margin-top: 10px;" onclick="CustomerAuth.close()">Start Exploring</button>
            </div>

            <!-- PROFILE & ORDERS PANEL -->
            <div id="customerProfilePanel" class="profile-panel">
              <!-- Tab switcher -->
              <div class="auth-tabs" id="profileTabs" style="margin-bottom: 24px;">
                <button class="auth-tab-btn active" id="tabProfileInfo" onclick="CustomerAuth.switchProfileTab('info')">My Profile</button>
                <button class="auth-tab-btn" id="tabProfileOrders" onclick="CustomerAuth.switchProfileTab('orders')">Order History</button>
              </div>

              <!-- TAB 1: Profile info content -->
              <div id="profileInfoTab" class="profile-tab-content">
                <div class="profile-hdr-info">
                  <div class="profile-avatar" id="profileAvatarChar">C</div>
                  <div class="profile-meta">
                    <h4 class="profile-meta-name" id="profileName">Customer</h4>
                    <p class="profile-meta-email" id="profileEmail">customer@email.com</p>
                  </div>
                </div>

                <!-- Main actions in profile -->
                <div class="profile-sub-actions" id="profileSubActions">
                  <button class="profile-sub-btn" onclick="CustomerAuth.showEditProfile()">Edit Profile</button>
                  <button class="profile-sub-btn" onclick="CustomerAuth.showChangePassword()">Change Password</button>
                </div>

                <!-- EDIT PROFILE SUBFORM -->
                <form id="profileEditForm" class="auth-form" onsubmit="CustomerAuth.handleEditProfileSubmit(event)">
                  <div class="auth-form-grp">
                    <label>Full Name</label>
                    <input type="text" id="editName" required />
                  </div>
                  <div class="auth-form-grp">
                    <label>Phone Number</label>
                    <input type="tel" id="editPhone" placeholder="10-digit number" pattern="[0-9]{10}" />
                  </div>
                  <div style="display:flex; gap:12px; margin-top:8px;">
                    <button type="submit" class="auth-btn" style="flex:1; margin-top:0;">Save</button>
                    <button type="button" class="profile-sub-btn" onclick="CustomerAuth.hideSubforms()">Cancel</button>
                  </div>
                </form>

                <!-- CHANGE PASSWORD SUBFORM -->
                <form id="changePasswordForm" class="auth-form" onsubmit="CustomerAuth.handleChangePasswordSubmit(event)">
                  <div class="auth-form-grp">
                    <label>Current Password</label>
                    <div class="password-input-wrapper">
                      <input type="password" id="oldPassword" autocomplete="current-password" required />
                      <button type="button" class="password-toggle-btn" onclick="CustomerAuth.togglePasswordVisibility('oldPassword')">
                        <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <svg class="eye-closed" style="display:none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      </button>
                    </div>
                  </div>
                  <div class="auth-form-grp">
                    <label>New Password (Min 6 Characters)</label>
                    <div class="password-input-wrapper">
                      <input type="password" id="newPassword" minlength="6" autocomplete="new-password" required />
                      <button type="button" class="password-toggle-btn" onclick="CustomerAuth.togglePasswordVisibility('newPassword')">
                        <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        <svg class="eye-closed" style="display:none;" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                      </button>
                    </div>
                  </div>
                  <div style="display:flex; gap:12px; margin-top:8px;">
                    <button type="submit" class="auth-btn" style="flex:1; margin-top:0;">Update</button>
                    <button type="button" class="profile-sub-btn" onclick="CustomerAuth.hideSubforms()">Cancel</button>
                  </div>
                </form>

                <button class="profile-logout-btn" onclick="CustomerAuth.handleLogout()">
                  Log Out
                </button>
              </div>

              <!-- TAB 2: Orders history content -->
              <div id="profileOrdersTab" class="profile-tab-content" style="display: none;">
                <div class="orders-section" id="ordersSection" style="margin-top: 0;">
                  <div id="profileOrdersList" class="profile-orders-list">
                    <!-- Orders rendered here -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Bind triggers on all Account/Login icons
    document.querySelectorAll('[data-action="account"]').forEach(el => {
      el.removeAttribute('href');
      el.style.cursor = 'pointer';

      el.addEventListener('click', (e) => {
        e.preventDefault();
        CustomerAuth.open();
      });
    });

    // Listen to token authentication events (e.g. from api.js interceptor)
    window.addEventListener('auth:logout', () => {
      this.user = null;
      this.updateNavbar(false);
      this.close();
    });

    this.checkAuth();
  },

  open() {
    this.clearError();
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.add('active');
    
    if (this.user) {
      this.showProfilePanel();
    } else {
      this.switchTab('login');
    }
  },

  close() {
    this.clearError();
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.remove('active');
    this.hideSubforms();
    this.clearInputs();
  },

  handleOverlayClick(e) {
    if (e.target.id === 'authOverlay') {
      this.close();
    }
  },

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const wrapper = input.closest('.password-input-wrapper');
    if (!wrapper) return;
    
    const eyeOpen = wrapper.querySelector('.eye-open');
    const eyeClosed = wrapper.querySelector('.eye-closed');
    
    if (input.type === 'password') {
      input.type = 'text';
      if (eyeOpen) eyeOpen.style.display = 'none';
      if (eyeClosed) eyeClosed.style.display = 'inline';
    } else {
      input.type = 'password';
      if (eyeOpen) eyeOpen.style.display = 'inline';
      if (eyeClosed) eyeClosed.style.display = 'none';
    }
  },

  switchTab(tab) {
    this.clearError();
    document.getElementById('authTabs').style.display = 'flex';
    document.getElementById('authModalTitle').textContent = 'My Account';
    
    document.getElementById('tabLogin').className = tab === 'login' ? 'auth-tab-btn active' : 'auth-tab-btn';
    document.getElementById('tabRegister').className = tab === 'register' ? 'auth-tab-btn active' : 'auth-tab-btn';
    
    document.getElementById('customerLoginForm').className = tab === 'login' ? 'auth-form active' : 'auth-form';
    document.getElementById('customerRegisterForm').className = tab === 'register' ? 'auth-form active' : 'auth-form';
    
    document.getElementById('customerForgotForm').className = 'auth-form';
    document.getElementById('customerProfilePanel').className = 'profile-panel';
    const welcomePanel = document.getElementById('customerWelcomePanel');
    if (welcomePanel) welcomePanel.className = 'welcome-panel';
  },

  showForgotPassword() {
    this.clearError();
    document.getElementById('authTabs').style.display = 'none';
    document.getElementById('authModalTitle').textContent = 'Reset Password';
    document.getElementById('customerLoginForm').className = 'auth-form';
    document.getElementById('customerRegisterForm').className = 'auth-form';
    document.getElementById('customerForgotForm').className = 'auth-form active';
    const welcomePanel = document.getElementById('customerWelcomePanel');
    if (welcomePanel) welcomePanel.className = 'welcome-panel';
  },

  showProfilePanel() {
    this.clearError();
    document.getElementById('authTabs').style.display = 'none';
    document.getElementById('authModalTitle').textContent = 'User Profile';
    document.getElementById('customerLoginForm').className = 'auth-form';
    document.getElementById('customerRegisterForm').className = 'auth-form';
    document.getElementById('customerForgotForm').className = 'auth-form';
    const welcomePanel = document.getElementById('customerWelcomePanel');
    if (welcomePanel) welcomePanel.className = 'welcome-panel';
    
    document.getElementById('profileName').textContent = this.user.name || 'Customer';
    document.getElementById('profileEmail').textContent = this.user.email;

    const avatarCharEl = document.getElementById('profileAvatarChar');
    if (avatarCharEl) {
      const firstLetter = (this.user.name || 'Customer').trim().charAt(0).toUpperCase();
      avatarCharEl.textContent = firstLetter;
    }
    
    document.getElementById('customerProfilePanel').className = 'profile-panel active';
    this.hideSubforms();
    this.switchProfileTab('info'); // Default to Profile Info tab
    this.fetchCustomerOrders();
  },

  switchProfileTab(tab) {
    this.hideSubforms();

    const infoTab = document.getElementById('profileInfoTab');
    const ordersTab = document.getElementById('profileOrdersTab');
    const tabBtnInfo = document.getElementById('tabProfileInfo');
    const tabBtnOrders = document.getElementById('tabProfileOrders');

    if (tab === 'info') {
      if (infoTab) infoTab.style.display = 'block';
      if (ordersTab) ordersTab.style.display = 'none';
      if (tabBtnInfo) tabBtnInfo.classList.add('active');
      if (tabBtnOrders) tabBtnOrders.classList.remove('active');
    } else {
      if (infoTab) infoTab.style.display = 'none';
      if (ordersTab) ordersTab.style.display = 'block';
      if (tabBtnInfo) tabBtnInfo.classList.remove('active');
      if (tabBtnOrders) tabBtnOrders.classList.add('active');
    }
  },

  showWelcomePanel(name) {
    this.clearError();
    document.getElementById('authTabs').style.display = 'none';
    document.getElementById('authModalTitle').textContent = 'Welcome! 🎉';
    
    document.getElementById('customerLoginForm').className = 'auth-form';
    document.getElementById('customerRegisterForm').className = 'auth-form';
    document.getElementById('customerForgotForm').className = 'auth-form';
    document.getElementById('customerProfilePanel').className = 'profile-panel';
    
    document.getElementById('welcomeCustomerName').textContent = name || 'Friend';
    document.getElementById('customerWelcomePanel').className = 'welcome-panel active';
  },

  copyWelcomeCoupon() {
    const couponCode = 'WELCOME75';
    navigator.clipboard.writeText(couponCode).then(() => {
      const hint = document.getElementById('couponCopyHint');
      if (hint) {
        hint.textContent = 'Copied! 👍';
        hint.style.color = '#047857';
        setTimeout(() => {
          hint.textContent = 'Copy Code';
          hint.style.color = '#10b981';
        }, 2000);
      }
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  },

  showEditProfile() {
    this.clearError();
    document.getElementById('profileSubActions').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'none';
    
    document.getElementById('editName').value = this.user.name || '';
    document.getElementById('editPhone').value = this.user.phone || '';
    
    document.getElementById('profileEditForm').className = 'auth-form active';
  },

  showChangePassword() {
    this.clearError();
    document.getElementById('profileSubActions').style.display = 'none';
    document.getElementById('ordersSection').style.display = 'none';
    
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    
    document.getElementById('changePasswordForm').className = 'auth-form active';
  },

  hideSubforms() {
    this.clearError();
    document.getElementById('profileEditForm').className = 'auth-form';
    document.getElementById('changePasswordForm').className = 'auth-form';
    document.getElementById('profileSubActions').style.display = 'flex';
    document.getElementById('ordersSection').style.display = 'block';
  },

  async fetchCustomerOrders() {
    const ordersList = document.getElementById('profileOrdersList');
    if (!ordersList) return;

    ordersList.innerHTML = `<p style="font-size:12px; color:#94a3b8; text-align:center;">Loading orders...</p>`;

    const formatDateTime = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return d.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    try {
      const orders = await window.MantraaqAPI.getMyOrders();
      if (!orders || orders.length === 0) {
        ordersList.innerHTML = `
          <div style="text-align: center; padding: 24px 10px; color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <span style="font-size: 13px; font-weight: 600; color: #64748b;">No orders placed yet</span>
            <span style="font-size: 11.5px; color: #94a3b8; max-width: 220px; line-height: 1.4;">When you place orders, your order history will appear here.</span>
          </div>
        `;
        return;
      }

      ordersList.innerHTML = orders.map(order => {
        // Parse payment method
        const isCod = order.paymentId?.toLowerCase().startsWith('cod') || order.shippingAddress?.paymentMethod === 'COD';
        
        // Customers can self-cancel both Online & COD orders before dispatch (status is PAID)
        const canCancel = order.status === 'PAID';
        
        let cancelBtn = '';
        if (canCancel) {
          cancelBtn = `<button class="order-cancel-btn" onclick="event.stopPropagation(); CustomerAuth.cancelCustomerOrder('${order.id}')">Cancel Order</button>`;
        } else if (order.status === 'DISPATCHED' || order.status === 'DELIVERED') {
          cancelBtn = `<div style="text-align: center; margin-top: 16px; font-size: 11.5px; color: #64748b; font-style: italic; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 12px; width: 100%;">
             Need to cancel or return? Contact support at <a href="mailto:support@mantraaq.com" style="color: #4ade80; text-decoration: none; font-weight: 500;">support@mantraaq.com</a>
           </div>`;
        } else if ((order.status === 'CANCELLED' || order.status === 'REFUNDED') && !isCod) {
          cancelBtn = `<div style="text-align: center; margin-top: 16px; font-size: 11.5px; color: #64748b; font-style: italic; border-top: 1px dashed rgba(255,255,255,0.06); padding-top: 12px; width: 100%;">
             Online refund initiated. For support, email <a href="mailto:support@mantraaq.com" style="color: #4ade80; text-decoration: none; font-weight: 500;">support@mantraaq.com</a>
           </div>`;
        }

        // Display status
        let displayStatus = order.status;
        if (order.status === 'REFUNDED') {
          displayStatus = 'CANCELLED'; // show as cancelled since refunds/returns are disabled
        }

        // Details Inner items
        const itemsHtml = order.orderLineItems.map(item => `
          <div class="order-item-detail-row">
            <span>${MantraAQSanitize(item.productName || 'Product')}${item.variantTitle ? ` <span class="order-item-qty">(${MantraAQSanitize(item.variantTitle)})</span>` : ''} <span class="order-item-qty">x${item.quantity}</span></span>
            <span class="order-item-price">₹${(item.priceAtPurchase * item.quantity).toFixed(0)}</span>
          </div>
        `).join('');

        // Parse Address
        const address = order.shippingAddress || {};
        const addressStr = `
          <strong>${MantraAQSanitize(address.name || 'Recipient')}</strong><br>
          ${MantraAQSanitize(address.street || '')}<br>
          ${MantraAQSanitize(address.city || '')}, ${MantraAQSanitize(address.state || '')} - ${MantraAQSanitize(address.postalCode || '')}<br>
          Phone: ${MantraAQSanitize(address.phone || '')}
        `;

        // Payment Method Text
        const paymentMethodText = isCod ? 'Cash on Delivery (COD)' : 'Paid Online (PayU)';
        const paymentSub = isCod ? 'Pay on Delivery' : (order.paymentId ? `Transaction ID: ${order.paymentId.slice(0, 18)}...` : 'Paid via Card/Netbanking');

        // Timeline Builder
        let timelineHtml = '';
        if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
          timelineHtml = `
            <div class="timeline-container">
              <div class="timeline-step active completed">
                <div class="timeline-dot"></div>
                <div class="timeline-title">Order Placed</div>
                <div class="timeline-subtitle">${formatDateTime(order.createdAt)}</div>
              </div>
              <div class="timeline-step active cancelled">
                <div class="timeline-dot"></div>
                <div class="timeline-title">Order Cancelled</div>
                <div class="timeline-subtitle">${order.cancelledAt ? formatDateTime(order.cancelledAt) : 'This order was cancelled.'}</div>
              </div>
            </div>
          `;
        } else {
          const isOrderedActive = true;
          const isOrderedCompleted = ['PAID', 'DISPATCHED', 'DELIVERED'].includes(order.status);
          
          const isConfirmedActive = ['PAID', 'DISPATCHED', 'DELIVERED'].includes(order.status);
          const isConfirmedCompleted = ['DISPATCHED', 'DELIVERED'].includes(order.status);
          
          const isDispatchedActive = ['DISPATCHED', 'DELIVERED'].includes(order.status);
          const isDispatchedCompleted = order.status === 'DELIVERED';
          
          const isDeliveredActive = order.status === 'DELIVERED';
          
          const confirmedTitle = isCod ? 'Order Confirmed' : 'Payment Confirmed';
          
          let confirmedSubtitle = 'Pending confirmation';
          if (isConfirmedActive) {
            confirmedSubtitle = order.status === 'PAID'
              ? formatDateTime(order.updatedAt)
              : formatDateTime(order.createdAt); // confirmed timestamp fallback
          }

          let dispatchedSubtitle = 'Awaiting shipment';
          if (isDispatchedActive) {
            const dispDateText = order.status === 'DISPATCHED'
              ? formatDateTime(order.updatedAt)
              : 'Shipped';
            dispatchedSubtitle = dispDateText;
            if (order.trackingNumber) {
              dispatchedSubtitle += `<br><span style="font-size: 11px; color: #94a3b8;">${order.trackingCarrier || 'Courier'}: ${order.trackingNumber}</span>`;
            }
          }
          
          let deliveredSubtitle = 'Awaiting delivery';
          if (isDeliveredActive) {
            deliveredSubtitle = formatDateTime(order.updatedAt);
          }
          
          timelineHtml = `
            <div class="timeline-container">
              <div class="timeline-step ${isOrderedActive ? 'active' : ''} ${isOrderedCompleted ? 'completed' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-title">Order Placed</div>
                <div class="timeline-subtitle">${formatDateTime(order.createdAt)}</div>
              </div>
              <div class="timeline-step ${isConfirmedActive ? 'active' : ''} ${isConfirmedCompleted ? 'completed' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-title">${confirmedTitle}</div>
                <div class="timeline-subtitle">${confirmedSubtitle}</div>
              </div>
              <div class="timeline-step ${isDispatchedActive ? 'active' : ''} ${isDispatchedCompleted ? 'completed' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-title">Dispatched</div>
                <div class="timeline-subtitle">${dispatchedSubtitle}</div>
              </div>
              <div class="timeline-step ${isDeliveredActive ? 'active' : ''}">
                <div class="timeline-dot"></div>
                <div class="timeline-title">Delivered</div>
                <div class="timeline-subtitle">${deliveredSubtitle}</div>
              </div>
            </div>
          `;
        }

        return `
          <div class="profile-order-item" id="order-item-${order.id}">
            <div class="profile-order-header" onclick="CustomerAuth.toggleOrderDetails('${order.id}')">
              <div class="profile-order-summary">
                <span class="profile-order-id">#${order.id.slice(0, 8)}</span>
                <span class="profile-order-date">${formatDateTime(order.createdAt)}</span>
                <span class="profile-order-items-summary">
                  ${order.orderLineItems.map(item => item.productName || 'Product').join(', ')}
                </span>
              </div>
              <div class="profile-order-meta">
                <div class="profile-order-total">₹${order.totalAmount.toFixed(0)}</div>
                <div class="profile-order-status-row">
                  <span class="profile-order-status-badge ${displayStatus.toLowerCase()}">${displayStatus}</span>
                  <svg class="profile-order-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>
              </div>
            </div>
            <div class="profile-order-content" style="max-height: 0px; overflow: hidden; transition: max-height 0.3s ease-out;">
              <div class="profile-order-details-inner">
                
                <!-- Tracking Timeline -->
                <div class="order-details-section">
                  <h4>Order Tracking</h4>
                  ${timelineHtml}
                </div>
                
                <!-- Purchased Items -->
                <div class="order-details-section">
                  <h4>Items Purchased</h4>
                  <div class="order-items-list">
                    ${itemsHtml}
                  </div>
                </div>
                
                <!-- Address and Payment details -->
                <div class="order-details-section-grid">
                  <div class="order-details-section">
                    <h4>Delivery Address</h4>
                    <p class="address-text">${addressStr}</p>
                  </div>
                  <div class="order-details-section">
                    <h4>Payment Info</h4>
                    <p class="payment-text">
                      <strong>${paymentMethodText}</strong>
                      <span class="payment-sub">${paymentSub}</span>
                    </p>
                  </div>
                </div>
                
                ${cancelBtn}
              </div>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error('Fetch customer orders error:', err);
      ordersList.innerHTML = `<p style="font-size:12px; color:#ef4444; text-align:center;">Failed to load order history.</p>`;
    }
  },

  toggleOrderDetails(orderId) {
    const itemEl = document.getElementById(`order-item-${orderId}`);
    if (!itemEl) return;

    const contentEl = itemEl.querySelector('.profile-order-content');
    const isExpanded = itemEl.classList.contains('expanded');

    // Close all other expanded items first
    document.querySelectorAll('.profile-order-item.expanded').forEach(el => {
      if (el !== itemEl) {
        el.classList.remove('expanded');
        el.querySelector('.profile-order-content').style.maxHeight = '0px';
      }
    });

    if (isExpanded) {
      itemEl.classList.remove('expanded');
      contentEl.style.maxHeight = '0px';
    } else {
      itemEl.classList.add('expanded');
      contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
    }
  },

  async cancelCustomerOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const data = await window.MantraaqAPI.cancelOrder(orderId);
      if (data && data.success) {
        this.showSuccess(data.message || 'Order cancelled successfully.');
        this.fetchCustomerOrders();
      } else {
        this.showError(data.message || 'Failed to cancel order.');
      }
    } catch (err) {
      console.error('Cancel order frontend error:', err);
      this.showError(err.message || 'Error cancelling order.');
    }
  },

  async handleLogin(e) {
    e.preventDefault();
    this.clearError();
    const email = document.getElementById('customerLoginEmail').value;
    const password = document.getElementById('customerLoginPassword').value;
    const btn = document.getElementById('loginBtn');

    btn.disabled = true;
    btn.textContent = 'Signing in...';

    try {
      const data = await window.MantraaqAPI.login({ email, password });
      if (data && data.success) {
        localStorage.setItem('user_token', data.token);
        this.user = data.user;
        this.updateNavbar(true);
        this.close();
        window.dispatchEvent(new CustomEvent('auth:login'));
        window.Toast.success(`Login Successful: Welcome back, ${data.user.name || 'Customer'}.`);
      } else {
        this.showError(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      this.showError(err.message || 'Incorrect email or password.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    this.clearError();
    const name = document.getElementById('customerRegisterName').value;
    const email = document.getElementById('customerRegisterEmail').value;
    const password = document.getElementById('customerRegisterPassword').value;
    const btn = document.getElementById('registerBtn');

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const data = await window.MantraaqAPI.register({ name, email, password });
      if (data && data.success) {
        localStorage.setItem('user_token', data.token);
        this.user = data.user;
        this.updateNavbar(true);
        this.showWelcomePanel(data.user.name);
        window.dispatchEvent(new CustomEvent('auth:login'));
      } else {
        this.showError(data.message || 'Registration failed.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      this.showError(err.message || 'Registration failed. Email might be in use.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  },

  async handleForgotSubmit(e) {
    e.preventDefault();
    this.clearError();
    const email = document.getElementById('customerForgotEmail').value;
    const btn = document.getElementById('forgotBtn');

    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const data = await window.MantraaqAPI.forgotPassword(email);
      if (data && data.success) {
        this.switchTab('login');
        this.showSuccess(data.message || 'Reset link sent successfully.');
      } else {
        this.showError(data.message || 'Failed to send reset link.');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      this.showError(err.message || 'Error processing request.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send Reset Link';
    }
  },

  async handleEditProfileSubmit(e) {
    e.preventDefault();
    this.clearError();
    const name = document.getElementById('editName').value;
    const phone = document.getElementById('editPhone').value;

    try {
      const data = await window.MantraaqAPI.updateProfile({ name, phone });
      if (data && data.success) {
        this.user = data.user;
        this.showProfilePanel();
        this.showSuccess('Profile updated successfully.');
      } else {
        this.showError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Edit profile error:', err);
      this.showError(err.message || 'Error updating profile.');
    }
  },

  async handleChangePasswordSubmit(e) {
    e.preventDefault();
    this.clearError();
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;

    try {
      const data = await window.MantraaqAPI.changePassword({ currentPassword: oldPassword, newPassword });
      if (data && data.success) {
        this.showProfilePanel();
        this.showSuccess('Password changed successfully.');
      } else {
        this.showError(data.message || 'Failed to change password.');
      }
    } catch (err) {
      console.error('Change password error:', err);
      this.showError(err.message || 'Incorrect old password or invalid new password.');
    }
  },

  async handleLogout() {
    try {
      await window.MantraaqAPI.logout();
    } catch (err) {}
    
    localStorage.removeItem('user_token');
    this.user = null;
    this.updateNavbar(false);
    
    document.getElementById('customerProfilePanel').className = 'profile-panel';
    document.getElementById('authTabs').style.display = 'flex';
    this.switchTab('login');
    this.close();
  }
};

window.CustomerAuth = CustomerAuth;

document.addEventListener('DOMContentLoaded', () => {
  CustomerAuth.init();
});
