// =============================================================
// SHARED.JS — Common utilities used across all pages
// =============================================================

/**
 * Escapes HTML special characters to prevent XSS attacks.
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
 * @param {string} msg  — The message to display
 * @param {string} type — 'success' | 'error'
 */
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = `toast show ${type}`;
  const icon  = document.getElementById('toast-icon');
  if (icon) icon.className = type === 'success'
    ? 'fa-solid fa-circle-check'
    : 'fa-solid fa-circle-xmark';
  const msgEl = document.getElementById('toast-msg');
  if (msgEl) msgEl.textContent = msg;
  setTimeout(() => t.className = 'toast', 3000);
}

// =============================================================
// AUTH-AWARE NAVBAR
// Runs on every customer page that loads shared.js + Firebase.
// Watches auth state and swaps the Sign In link for a user
// avatar/name dropdown when the user is logged in.
// =============================================================

(function initNavAuth() {
  // Wait for Firebase to be available (it's loaded before shared.js on
  // most pages, but guard just in case)
  if (typeof firebase === 'undefined' || !firebase.auth) {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof firebase !== 'undefined' && firebase.auth) bindAuthNav();
    });
  } else {
    bindAuthNav();
  }

  function bindAuthNav() {
    firebase.auth().onAuthStateChanged(async user => {
      updateNavAuth(user);
    });
  }

  async function updateNavAuth(user) {
    const desktopBtn = document.getElementById('nav-auth-btn');
    const mobileBtn  = document.getElementById('mobile-auth-btn');

    if (!desktopBtn && !mobileBtn) return; // admin/dashboard pages — skip

    if (!user) {
      // ── Signed OUT — show Sign In link ───────────────────
      if (desktopBtn) {
        desktopBtn.outerHTML =
          `<a href="login.html" id="nav-auth-btn" style="display:flex;align-items:center;gap:6px;">
             <i class="fa-solid fa-user"></i> Sign In
           </a>`;
      }
      if (mobileBtn) {
        mobileBtn.outerHTML =
          `<a href="login.html" id="mobile-auth-btn">
             <i class="fa-solid fa-user"></i> Sign In
           </a>`;
      }
      return;
    }

    // ── Signed IN — fetch display name ────────────────────
    let displayName = user.displayName || user.email.split('@')[0];
    try {
      // Try to get the name stored in Firestore users collection
      const snap = await firebase.firestore()
        .collection('users').doc(user.uid).get();
      if (snap.exists && snap.data().name) {
        displayName = snap.data().name.split(' ')[0]; // first name only
      }
    } catch (_) { /* offline / rules — fall back to email prefix */ }

    const initial = displayName.charAt(0).toUpperCase();

    // ── Desktop: avatar + name + dropdown ────────────────
    if (desktopBtn) {
      desktopBtn.outerHTML = `
        <div class="nav-user-wrap" id="nav-user-wrap">
          <button class="nav-user-btn" id="nav-user-btn" onclick="toggleUserDropdown()">
            <span class="nav-avatar">${initial}</span>
            <span class="nav-username">${escapeHtml(displayName)}</span>
            <i class="fa-solid fa-chevron-down nav-chevron"></i>
          </button>
          <div class="nav-dropdown" id="nav-dropdown">
            <div class="nav-dropdown-email">${escapeHtml(user.email)}</div>
            <hr class="nav-dropdown-divider">
            <button class="nav-dropdown-item" onclick="handleSignOut()">
              <i class="fa-solid fa-right-from-bracket"></i> Sign Out
            </button>
          </div>
        </div>`;
    }

    // ── Mobile menu: name + sign out ─────────────────────
    if (mobileBtn) {
      mobileBtn.outerHTML = `
        <div style="display:flex;flex-direction:column;gap:2px;">
          <span style="padding:11px 16px;font-weight:700;color:#2f308d;font-size:14px;">
            <i class="fa-solid fa-user" style="margin-right:8px;"></i>${escapeHtml(displayName)}
          </span>
          <a href="#" id="mobile-auth-btn" onclick="handleSignOut(); return false;"
             style="color:#c00!important;">
            <i class="fa-solid fa-right-from-bracket"></i> Sign Out
          </a>
        </div>`;
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', e => {
      const wrap = document.getElementById('nav-user-wrap');
      if (wrap && !wrap.contains(e.target)) {
        document.getElementById('nav-dropdown')?.classList.remove('open');
        document.querySelector('.nav-chevron')?.style.setProperty('transform', '');
      }
    });
  }
})();

function toggleUserDropdown() {
  const dd      = document.getElementById('nav-dropdown');
  const chevron = document.querySelector('.nav-chevron');
  if (!dd) return;
  const isOpen = dd.classList.toggle('open');
  if (chevron) chevron.style.transform = isOpen ? 'rotate(180deg)' : '';
}

function handleSignOut() {
  firebase.auth().signOut().then(() => {
    showToast('Signed out successfully');
    // Refresh the page so nav updates back to Sign In
    setTimeout(() => window.location.reload(), 800);
  });
}
