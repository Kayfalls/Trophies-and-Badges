// =============================================================
// SANITIZE.JS — HTML entity escaping to prevent XSS
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
