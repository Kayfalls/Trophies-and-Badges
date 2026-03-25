// =============================================================
// APP.JS — Trophies-Badges Customer App (products.html)
// =============================================================


// ─── TOAST ─────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.className = `toast show ${type}`;
  document.getElementById('toast-msg').textContent = msg;
  setTimeout(() => t.className = 'toast', 3000);
}

// ─── MOBILE MENU ───────────────────────────────────────────
function toggleMenu() {
  document.getElementById('mobile-menu')?.classList.toggle('open');
}

// ─── STATE ─────────────────────────────────────────────────
let allProducts    = [];
let activeCategory = 'all';
let searchQuery    = '';

// ─── LOAD CATEGORIES ───────────────────────────────────────
async function loadCategories() {
  try {
    const snap   = await db.collection('categories').orderBy('name').get();
    const scroll = document.getElementById('cat-scroll');
    if (!scroll) return;

    snap.forEach(doc => {
      const chip       = document.createElement('div');
      chip.className   = 'cat-chip';
      chip.dataset.cat = doc.id;
      chip.textContent = doc.data().name;
      scroll.appendChild(chip);
    });

    scroll.addEventListener('click', e => {
      const chip = e.target.closest('.cat-chip');
      if (!chip) return;
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCategory = chip.dataset.cat;
      renderProducts();
    });
  } catch (err) {
    console.error('Categories error:', err);
  }
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
      if (grid) grid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <h3>Could not load products</h3>
          <p>Please check your connection and try again.</p>
        </div>`;
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

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.categoryName?.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-box-open"></i>
        <h3>${searchQuery ? 'No results found' : 'No products yet'}</h3>
        <p>${searchQuery ? `No products match "${escapeHtml(searchQuery)}"` : 'Check back soon — products are being added!'}</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const imgHtml = p.images && p.images[0]
      ? `<img class="card-img" src="${escapeHtml(p.images[0])}" alt="${escapeHtml(p.name)}" loading="lazy">`
      : `<div class="card-img-placeholder"><i class="fa-solid fa-trophy"></i></div>`;

    const stockClass = p.stock === 0 ? 'out' : '';
    const stockText  = p.stock === 0
      ? 'Out of stock'
      : p.stock <= 5 ? `Only ${p.stock} left` : 'In stock';

    return `
      <div class="product-card" onclick="window.location.href='product-detail.html?id=${p.id}'">
        ${imgHtml}
        <div class="card-body">
          ${p.categoryName ? `<div class="card-cat">${escapeHtml(p.categoryName)}</div>` : ''}
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
    timeout = setTimeout(() => {
      searchQuery = e.target.value.trim();
      renderProducts();
    }, 300);
  });
}

// ─── INIT ──────────────────────────────────────────────────
loadCategories();
loadProducts();
