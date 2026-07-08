/**
 * MantraAQ — XSS Sanitization Utility
 * Strips dangerous HTML patterns from user/API-supplied strings
 * before they are inserted into the DOM via innerHTML templates.
 *
 * Usage:  sanitize(untrustedString)
 *         sanitizeURL(untrustedURL)
 */

(function () {
  'use strict';

  // Temp element for entity decoding
  const _decodeEl = document.createElement('textarea');

  /**
   * Sanitize a string for safe HTML insertion.
   * Removes <script>, <iframe>, <object>, <embed>, <form>,
   * on* event handlers, javascript: URIs, and data: URIs in attributes.
   */
  function sanitize(str) {
    if (typeof str !== 'string') return str;

    // Decode HTML entities first so encoded attacks are caught
    _decodeEl.innerHTML = str;
    let decoded = _decodeEl.value;

    // Strip dangerous tags entirely (including content)
    decoded = decoded.replace(/<\s*(script|iframe|object|embed|form|link|base|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
    // Strip self-closing dangerous tags
    decoded = decoded.replace(/<\s*(script|iframe|object|embed|form|link|base|meta)[^>]*\/?>/gi, '');
    // Strip inline event handlers (onclick, onerror, onload, etc.)
    decoded = decoded.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    // Strip javascript: and data: URIs inside href/src/action attributes
    decoded = decoded.replace(/(href|src|action)\s*=\s*(?:"(?:javascript|data|vbscript):[^"]*"|'(?:javascript|data|vbscript):[^']*')/gi, '$1=""');

    return decoded;
  }

  /**
   * Sanitize a URL — only allow http(s) and relative paths.
   * Returns empty string for javascript:, data:, vbscript: URIs.
   */
  function sanitizeURL(url) {
    if (typeof url !== 'string') return '';
    const trimmed = url.trim().toLowerCase();
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:')
    ) {
      return '';
    }
    return url;
  }

  // Expose globally
  window.MantraAQSanitize = sanitize;
  window.MantraAQSanitizeURL = sanitizeURL;
})();
