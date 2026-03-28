// =============================================================
// APP.JS — Trophies-Badges Customer App (products.html)
// =============================================================

// showToast and toggleMenu are provided by shared.js

// ─── STATE ─────────────────────────────────────────────────
let allProducts       = [];
let allSubcategories  = [];
let activeCategory    = 'all';   // 'all' | category doc id
let activeSubcategory = 'all';   // 'all' | subcategory doc id
let searchQuery       = '';

// ─── LOAD CATEGORIES + SUBCATEGORIES ───────────────────────
async function loadCategories() {
  try {
    const [catSnap, subcatSnap] = await Promise.all([
      db.collection('categories').orderBy('name').get(),
      db.collection('subcategories').orderBy('name').get()
    ]);

    allSubcategories = subcatSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const scroll = document.getElementById('cat-scroll');
    if (!scroll) return;

    // Build main category chips
    catSnap.forEach(doc => {
      const chip        = document.createElement('div');
      chip.className    = 'cat-chip';
      chip.dataset.cat  = doc.id;
      chip.dataset.type = 'main';
      chip.textContent  = doc.data().name;
      scroll.appendChild(chip);
    });

    // ── Chip click handler ──────────────────────────────────
    scroll.addEventListener('click', e => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;

      if (chip.dataset.type === 'main') {
        activeCategory    = chip.dataset.cat;
        activeSubcategory = 'all';
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderSubcategoryChips(activeCategory);

      } else if (chip.dataset.type === 'sub') {
        activeSubcategory = chip.dataset.cat === activeSubcategory ? 'all' : chip.dataset.cat;
        document.querySelectorAll('.cat-chip[data-type="sub"]').forEach(c => c.classList.remove('active'));
        if (activeSubcategory !== 'all') chip.classList.add('active');

      } else {
        // "All" chip
        activeCategory    = 'all';
        activeSubcategory = 'all';
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        clearSubcategoryChips();
      }

      renderProducts();
    });

    // ── Handle URL param (e.g. from homepage category cards) ─
    const catNameParam = new URLSearchParams(window.location.search).get('categoryName');
    if (catNameParam) {
      const matchingChip = Array.from(scroll.querySelectorAll('.cat-chip[data-type="main"]'))
        .find(c => c.textContent.trim().toLowerCase() === catNameParam.toLowerCase());
      if (matchingChip) {
        document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
        matchingChip.classList.add('active');
        activeCategory = matchingChip.dataset.cat;
        renderSubcategoryChips(activeCategory);
      }
    }

  } catch (err) {
    console.error('Categories error:', err);
  }
}

// ─── SUBCATEGORY CHIPS ──────────────────────────────────────
function renderSubcategoryChips(parentId) {
  clearSubcategoryChips();
  const subs = allSubcategories.filter(s => s.parentId === parentId);
  if (subs.length === 0) return;

  const scroll = document.getElementById('cat-scroll');

  const divider = document.createElement('span');
  divider.id = 'subcat-divider';
  divider.textContent = '›';
  divider.style.cssText = 'color:#aaa;font-size:18px;align-self:center;flex-shrink:0;padding:0 2px;';
  scroll.appendChild(divider);

  subs.forEach(sub => {
    const chip        = document.createElement('div');
    chip.className    = 'cat-chip subcat-chip';
    chip.dataset.cat  = sub.id;
    chip.dataset.type = 'sub';
    chip.textContent  = sub.name;
    scroll.appendChild(chip);
  });
}

function clearSubcategoryChips() {
  document.querySelectorAll('.subcat-chip, #subcat-divider').forEach(el => el.remove());
  activeSubcategory = 'all';
}

// ─── LOAD PRODUCTS ─────────────────────────────────────────
function loadProducts() {
  db.collection('products')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      allProducts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      renderProducts();
    }, err => {
      console.error('Products error:', err);
      const grid = document.getElementById('product-grid');
      if (grid) grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Could not load products</h3><p>Please check your connection and try again.</p></div>';
    });
}

// ─── RENDER PRODUCTS ───────────────────────────────────────
function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  let filtered = allProducts;

  if (activeCategory !== 'all') {
    filtered = filtered.filter(p => p.categoryId === activeCategory);
  }
  if (activeSubcategory !== 'all') {
    filtered = filtered.filter(p => p.subcategoryId === activeSubcategory);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q) ||
      p.subcategoryName?.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fa-solid fa-box-open"></i><h3>${searchQuery ? 'No results found' : 'No products yet'}</h3><p>${searchQuery ? 'No products match "' + escapeHtml(searchQuery) + '"' : 'Check back soon!'}</p></div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const imgHtml = p.images && p.images[0]
      ? `<img class="card-img" src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.name)}" loading="lazy">`
      : `<div class="card-img-placeholder"><i class="fa-solid fa-trophy"></i></div>`;

    const stockClass = p.stock === 0 ? 'out' : '';
    const stockText  = p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock';
    const catLabel   = p.subcategoryName || p.categoryName || '';

    return `
      <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
        ${imgHtml}
        <div class="card-body">
          ${catLabel ? `<div class="card-cat">${escapeHtml(catLabel)}</div>` : ''}
          <div class="card-title">${escapeHtml(p.name)}</div>
          <div class="card-price">R${Number(p.price).toFixed(2)}</div>
          <div class="card-stock ${stockClass}">${stockText}</div>
        </div>
      </div>`;
  }).join('');
}

// ─── SEARCH ────────────────────────────────────────────────
const searchInput = document.getElementById('search-input');
if (searchInput) {
  let timeout;
  searchInput.addEventListener('input', e => {
    clearTimeout(timeout);
    timeout = setTimeout(() => { searchQuery = e.target.value.trim(); renderProducts(); }, 300);
  });
}

// ─── INIT ──────────────────────────────────────────────────
// Load categories first so allSubcategories is populated before
// the products onSnapshot fires and renderProducts() runs.
loadCategories().then(() => loadProducts());
