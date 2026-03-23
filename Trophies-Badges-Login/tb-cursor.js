/**
 * tb-cursor.js — Trophies & Badges custom cursor
 *
 * Behaviour:
 *   Default  — small navy dot + navy ring trailing behind
 *   Buttons  — ring morphs to a red rounded rectangle, dot grows red
 *   Cards    — ring expands to a large rounded square, dot shrinks
 *   Inputs   — both elements collapse to a thin text-cursor bar
 *   Links    — ring tightens and snaps red (fast transition)
 *   Off-screen / touch — everything hidden, native cursor restored
 *
 * Only activates on devices with a fine pointer (mouse/trackpad).
 * Uses RAF + CSS transform for GPU-composited movement — zero jank.
 */
(function () {
  // Skip entirely on touch-only devices
  if (!window.matchMedia('(pointer: fine)').matches) return;

  /* ── DOM setup ──────────────────────────────────────────── */
  const dot  = document.createElement('div');
  const ring = document.createElement('div');
  dot.id   = 'tb-cursor-dot';
  ring.id  = 'tb-cursor-ring';
  document.body.appendChild(ring);
  document.body.appendChild(dot);

  /* ── State ──────────────────────────────────────────────── */
  let mouseX = -200, mouseY = -200;   // raw position
  let ringX  = -200, ringY  = -200;   // lagging position for ring
  let rafId  = null;
  const LERP = 0.18;  // ring lag — lower = more lag (0.1–0.3 range)

  /* ── RAF loop: move dot instantly, ring lerps behind ─────── */
  function tick() {
    ringX += (mouseX - ringX) * LERP;
    ringY += (mouseY - ringY) * LERP;

    dot.style.transform  = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${ringX}px,  ${ringY}px)  translate(-50%, -50%)`;

    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  /* ── Mouse tracking ─────────────────────────────────────── */
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    document.body.classList.remove('cursor-hidden');
  }, { passive: true });

  document.addEventListener('mouseleave', () => {
    document.body.classList.add('cursor-hidden');
  });
  document.addEventListener('mouseenter', () => {
    document.body.classList.remove('cursor-hidden');
  });

  /* ── Hover classification ───────────────────────────────── */
  const CLASSES = ['cursor-btn', 'cursor-card', 'cursor-input', 'cursor-link'];

  function clearCursorState() {
    document.body.classList.remove(...CLASSES);
  }

  function classifyTarget(el) {
    if (!el) return clearCursorState();

    // Input/textarea/select
    if (el.matches('input, textarea, select')) {
      clearCursorState();
      document.body.classList.add('cursor-input');
      return;
    }

    // Buttons — <button>, .btn-primary, .purchase-btn, .nav-cart, .cat-chip, .qty-control button
    if (el.closest('button, .btn-primary, .btn-secondary, .btn-cta, .purchase-btn, .nav-cart, .cat-chip, .qty-control')) {
      clearCursorState();
      document.body.classList.add('cursor-btn');
      return;
    }

    // Product / category cards
    if (el.closest('.product-card, .category-card, .feature, .menu-item')) {
      clearCursorState();
      document.body.classList.add('cursor-card');
      return;
    }

    // Links — <a>, nav items, footer links
    if (el.closest('a, .auth-link, .detail-back, .sub-back')) {
      clearCursorState();
      document.body.classList.add('cursor-link');
      return;
    }

    clearCursorState();
  }

  document.addEventListener('mouseover', e => {
    classifyTarget(e.target);
  }, { passive: true });

  /* ── Click burst on the dot ─────────────────────────────── */
  document.addEventListener('mousedown', () => {
    dot.style.transition = 'transform 0.08s ease, background 0.08s';
    dot.style.transform  += ' scale(0.6)';
  });
  document.addEventListener('mouseup', () => {
    dot.style.transition = '';
    dot.style.transform  = '';
  });

})();
