// =============================================================
// SHARED.JS — Common utilities used across all pages
// =============================================================

/**
 * Escapes HTML special characters to prevent XSS attacks.
 * Use this on any user-generated content before inserting via innerHTML.
 * @param {string} str — The raw string to escape
 * @returns {string} — The escaped string safe for innerHTML
 */
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

/**
 * Toggles the mobile navigation menu.
 */
function toggleMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
}

/**
 * Shows a toast notification message.
 * @param {string} msg — The message to display
 * @param {string} type — 'success' or 'error'
 */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = `toast show ${type}`;
  const msgEl = document.getElementById('toast-msg');
  if (msgEl) msgEl.textContent = msg;
  setTimeout(() => t.className = 'toast', 3000);
}
