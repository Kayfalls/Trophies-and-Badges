// =============================================================
// ADMIN DASHBOARD LOGIC — Trophies-Site
// =============================================================

// Auth guard — redirect to login if not admin (via Custom Claims)
auth.onAuthStateChanged(async user => {
  if (!user) {
    window.location.href = 'admin.html';
    return;
  }
  try {
    const tokenResult = await user.getIdTokenResult();
    if (tokenResult.claims.admin !== true || !user.emailVerified) {
      auth.signOut().then(() => window.location.href = 'admin.html');
      return;
    }
  } catch (err) {
    auth.signOut().then(() => window.location.href = 'admin.html');
    return;
  }
  // Admin verified — load data
  loadDashboard();
  loadProducts();
  loadCategories();
  loadOrders();
});

// escapeHtml is provided by shared.js

// ─── NAVIGATION ───────────────────────────────────────────────
const navLinks   = document.querySelectorAll('.sidebar-nav a');
const sections   = document.querySelectorAll('.section');
const pageTitle  = document.getElementById('page-title');
const sidebar    = document.getElementById('sidebar');
const overlay    = document.getElementById('sidebar-overlay');
const hamburger  = document.getElementById('hamburger');

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    const target = link.dataset.section;
    navLinks.forEach(l => l.classList.remove('active'));
    sections.forEach(s => s.classList.remove('active'));
    link.classList.add('active');
    document.getElementById(`section-${target}`).classList.add('active');
    pageTitle.textContent = link.textContent.trim();
    closeSidebar();
  });
});

hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
});
overlay.addEventListener('click', closeSidebar);
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
}

document.getElementById('logout-btn').addEventListener('click', () => {
  auth.signOut().then(() => window.location.href = 'admin.html');
});

// showToast is provided by shared.js

// ─── DASHBOARD STATS ───────────────────────────────────────────
async function loadDashboard() {
  try {
    const [products, categories, reviews] = await Promise.all([
      db.collection('products').get(),
      db.collection('categories').get(),
      db.collection('reviews').get()
    ]);
    document.getElementById('stat-products').textContent   = products.size;
    document.getElementById('stat-categories').textContent = categories.size;
    document.getElementById('stat-reviews').textContent    = reviews.size;
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

// ─── CATEGORIES ───────────────────────────────────────────────
let categoriesCache = [];
let subcategoriesCache = [];

// ─── LOAD CATEGORIES + SUBCATEGORIES ──────────────────────────
async function loadCategories() {
  try {
    const [catSnap, subcatSnap] = await Promise.all([
      db.collection('categories').orderBy('name').get(),
      db.collection('subcategories').orderBy('name').get()
    ]);
    categoriesCache    = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    subcategoriesCache = subcatSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderCategories();
    renderSubcategories();
    populateCategoryDropdown();
    populateSubcatParentDropdown();
  } catch (err) {
    console.error('Categories load error:', err);
  }
}

// ─── RENDER MAIN CATEGORIES ───────────────────────────────────
function renderCategories() {
  const list = document.getElementById('cat-list');
  if (categoriesCache.length === 0) {
    list.innerHTML = '<p style="color:#999;font-size:14px;">No categories yet. Add one below.</p>';
    return;
  }
  list.innerHTML = categoriesCache.map(c => `
    <div class="cat-chip">
      <span>${escapeHtml(c.name)}</span>
      <button onclick="deleteCategory('${c.id}')" title="Delete">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `).join('');
}

// ─── RENDER SUBCATEGORIES (grouped by parent) ─────────────────
function renderSubcategories() {
  const container = document.getElementById('subcat-list');
  if (!container) return;

  if (subcategoriesCache.length === 0) {
    container.innerHTML = '<p style="color:#999;font-size:14px;margin-bottom:12px;">No subcategories yet.</p>';
    return;
  }

  // Group by parentId
  const grouped = {};
  subcategoriesCache.forEach(s => {
    if (!grouped[s.parentId]) grouped[s.parentId] = [];
    grouped[s.parentId].push(s);
  });

  container.innerHTML = Object.entries(grouped).map(([parentId, subs]) => {
    const parentName = categoriesCache.find(c => c.id === parentId)?.name || 'Unknown';
    const chips = subs.map(s => `
      <div class="cat-chip" style="background:#eef0fa;">
        <span>${escapeHtml(s.name)}</span>
        <button onclick="deleteSubcategory('${s.id}')" title="Delete">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`).join('');
    return `
      <div style="margin-bottom:16px;">
        <div style="font-size:12px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.6px;margin-bottom:8px;">
          <i class="fa-solid fa-folder-open" style="margin-right:6px;"></i>${escapeHtml(parentName)}
        </div>
        <div class="cat-list">${chips}</div>
      </div>`;
  }).join('');
}

// ─── POPULATE PARENT DROPDOWN IN SUBCAT FORM ─────────────────
function populateSubcatParentDropdown() {
  const sel = document.getElementById('subcat-parent');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select parent category...</option>' +
    categoriesCache.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
}

// ─── ADD MAIN CATEGORY ────────────────────────────────────────
document.getElementById('add-cat-btn').addEventListener('click', async () => {
  const input = document.getElementById('new-cat-input');
  const name  = input.value.trim();
  if (!name) return;
  try {
    await db.collection('categories').add({ name, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    input.value = '';
    await loadCategories();
    showToast(`Category "${name}" added`);
  } catch (err) {
    showToast('Error adding category', 'error');
  }
});

// ─── ADD SUBCATEGORY ──────────────────────────────────────────
document.getElementById('add-subcat-btn').addEventListener('click', async () => {
  const parentId = document.getElementById('subcat-parent').value;
  const input    = document.getElementById('new-subcat-input');
  const name     = input.value.trim();
  if (!parentId) { showToast('Select a parent category first', 'error'); return; }
  if (!name)     { showToast('Enter a subcategory name', 'error'); return; }
  const parentName = categoriesCache.find(c => c.id === parentId)?.name || '';
  try {
    await db.collection('subcategories').add({
      name, parentId, parentName,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    input.value = '';
    await loadCategories();
    showToast(`Subcategory "${name}" added under "${parentName}"`);
  } catch (err) {
    showToast('Error adding subcategory', 'error');
  }
});

// ─── DELETE MAIN CATEGORY ─────────────────────────────────────
async function deleteCategory(id) {
  const hasChildren = subcategoriesCache.some(s => s.parentId === id);
  if (hasChildren) {
    showToast('Delete subcategories under this category first', 'error');
    return;
  }
  if (!confirm('Delete this category?')) return;
  try {
    await db.collection('categories').doc(id).delete();
    await loadCategories();
    showToast('Category deleted');
  } catch (err) {
    showToast('Error deleting category', 'error');
  }
}

// ─── DELETE SUBCATEGORY ───────────────────────────────────────
async function deleteSubcategory(id) {
  if (!confirm('Delete this subcategory?')) return;
  try {
    await db.collection('subcategories').doc(id).delete();
    await loadCategories();
    showToast('Subcategory deleted');
  } catch (err) {
    showToast('Error deleting subcategory', 'error');
  }
}

// ─── CATEGORY DROPDOWN (product modal) ───────────────────────
function populateCategoryDropdown(selected = '') {
  const select = document.getElementById('p-category');
  const catOptions = categoriesCache.map(c =>
    `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
  ).join('');

  if (select) {
    select.innerHTML = '<option value="">Select a category...</option>' +
      catOptions + '<option value="__new__">+ Create new category</option>';
  }

  const filterSelect = document.getElementById('pm-filter-cat');
  if (filterSelect) {
    const currentFilter = filterSelect.value;
    filterSelect.innerHTML = '<option value="">All Categories</option>' + catOptions;
    if (categoriesCache.some(c => c.id === currentFilter)) {
      filterSelect.value = currentFilter;
    }
  }

  // Reset subcategory dropdown when category changes
  populateSubcategoryModalDropdown(selected, '');
}

// ─── SUBCATEGORY DROPDOWN (product modal) ────────────────────
function populateSubcategoryModalDropdown(categoryId, selectedSubId = '') {
  const sel = document.getElementById('p-subcategory');
  if (!sel) return;
  const subs = subcategoriesCache.filter(s => s.parentId === categoryId);
  sel.innerHTML = '<option value="">None</option>' +
    subs.map(s => `<option value="${s.id}" ${s.id === selectedSubId ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('');
}

// Handle "create new category" option in dropdown
document.getElementById('p-category').addEventListener('change', async function() {
  if (this.value === '__new__') {
    const name = prompt('Enter new category name:');
    if (name && name.trim()) {
      const ref = await db.collection('categories').add({ name: name.trim(), createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      await loadCategories();
      populateCategoryDropdown(ref.id);
      document.getElementById('p-category').value = ref.id;
    } else {
      this.value = '';
    }
  } else {
    populateSubcategoryModalDropdown(this.value);
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────
let productsCache = [];
let currentProductSearch = '';
let currentProductCatFilter = '';

// Product Search & Filter Listeners
document.getElementById('pm-search')?.addEventListener('input', e => {
  currentProductSearch = e.target.value.trim().toLowerCase();
  renderProducts();
});
document.getElementById('pm-filter-cat')?.addEventListener('change', e => {
  currentProductCatFilter = e.target.value;
  renderProducts();
});

async function loadProducts() {
  try {
    const snap = await db.collection('products').orderBy('createdAt', 'desc').get();
    productsCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderProducts();
  } catch (err) {
    console.error('Products load error:', err);
  }
}

function renderProducts() {
  const tbody = document.getElementById('products-body');
  
  let filtered = productsCache;
  if (currentProductSearch) {
    filtered = filtered.filter(p => p.name?.toLowerCase().includes(currentProductSearch) || p.description?.toLowerCase().includes(currentProductSearch));
  }
  if (currentProductCatFilter) {
    filtered = filtered.filter(p => p.categoryId === currentProductCatFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="6">
        <div class="empty-state">
          <i class="fa-solid fa-box-open"></i>
          <p>No products found.</p>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const thumb = p.images && p.images[0]
      ? `<img src="${p.images[0]}" class="product-img-thumb" alt="${p.name}">`
      : `<div style="width:48px;height:48px;background:#eef0fa;border-radius:8px;display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-image" style="color:#aaa;"></i></div>`;

    const stockNum = p.stock || 0;
    const stockClass = stockNum === 0 ? 'out-of-stock' : stockNum <= 5 ? 'low-stock' : 'in-stock';
    const stockLabel = stockNum === 0 ? 'Out of stock' : stockNum <= 5 ? `Low (${stockNum})` : stockNum;

    const catName = categoriesCache.find(c => c.id === p.categoryId)?.name || '—';

    return `<tr>
      <td>${thumb}</td>
      <td class="product-name-cell">${escapeHtml(p.name)}</td>
      <td><span class="category-tag">${escapeHtml(catName)}</span></td>
      <td><strong>R${Number(p.price).toFixed(2)}</strong></td>
      <td><span class="stock-badge ${stockClass}">${stockLabel}</span></td>
      <td>
        <div class="actions-cell">
          <button class="btn btn-edit btn-sm" onclick="openEditModal('${p.id}')">
            <i class="fa-solid fa-pen"></i> Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}', '${p.name.replace(/'/g,"\\'")}')">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

// ─── PRODUCT MODAL ────────────────────────────────────────────
const modal        = document.getElementById('product-modal');
const modalTitle   = document.getElementById('modal-title');
const saveBtnText  = document.getElementById('save-btn-text');
const imgPreview   = document.getElementById('img-preview');
const vidPreview   = document.getElementById('vid-preview');
let newImageFiles  = [];
let newVideoFile   = null;
let removedImages  = []; // URLs to remove from storage in edit mode
let removeVideo    = false;

function openAddModal() {
  clearModal();
  modalTitle.textContent  = 'Add New Product';
  saveBtnText.textContent = 'Save Product';
  document.getElementById('edit-product-id').value = '';
  document.getElementById('existing-images-wrap').style.display = 'none';
  document.getElementById('existing-video-wrap').style.display  = 'none';
  modal.classList.add('open');
}

function openEditModal(id) {
  const p = productsCache.find(x => x.id === id);
  if (!p) return;

  clearModal();
  modalTitle.textContent  = 'Edit Product';
  saveBtnText.textContent = 'Update Product';
  document.getElementById('edit-product-id').value = id;

  document.getElementById('p-name').value  = p.name  || '';
  document.getElementById('p-desc').value  = p.description || '';
  document.getElementById('p-price').value = p.price || '';
  document.getElementById('p-stock').value = p.stock || '';
  populateCategoryDropdown(p.categoryId || '');
  populateSubcategoryModalDropdown(p.categoryId || '', p.subcategoryId || '');

  // Show existing images
  if (p.images && p.images.length > 0) {
    const wrap = document.getElementById('existing-images-wrap');
    wrap.style.display = 'block';
    document.getElementById('existing-img-preview').innerHTML = p.images.map((url, i) => `
      <div class="preview-item" id="existing-img-${i}">
        <img src="${url}" alt="Image ${i+1}">
        <button class="remove-preview" onclick="markImageForRemoval('${url}', ${i})">×</button>
      </div>
    `).join('');
  }

  // Show existing video
  if (p.videoUrl) {
    const wrap = document.getElementById('existing-video-wrap');
    wrap.style.display = 'block';
    document.getElementById('existing-vid-preview').innerHTML = `
      <div class="preview-item">
        <video src="${p.videoUrl}" controls></video>
        <button class="remove-preview" onclick="markVideoForRemoval()">×</button>
      </div>`;
  }

  modal.classList.add('open');
}

function markImageForRemoval(url, index) {
  removedImages.push(url);
  document.getElementById(`existing-img-${index}`).remove();
}

function markVideoForRemoval() {
  removeVideo = true;
  document.getElementById('existing-video-wrap').style.display = 'none';
}

function clearModal() {
  newImageFiles  = [];
  newVideoFile   = null;
  removedImages  = [];
  removeVideo    = false;
  document.getElementById('p-name').value    = '';
  document.getElementById('p-desc').value    = '';
  document.getElementById('p-price').value   = '';
  document.getElementById('p-stock').value   = '';
  document.getElementById('p-category').value = '';
  document.getElementById('p-subcategory').value = '';
  document.getElementById('p-images').value  = '';
  document.getElementById('p-video').value   = '';
  imgPreview.innerHTML = '';
  vidPreview.innerHTML = '';
  document.getElementById('existing-img-preview').innerHTML = '';
  document.getElementById('existing-vid-preview').innerHTML = '';
}

document.getElementById('open-add-modal').addEventListener('click', openAddModal);
document.getElementById('close-modal').addEventListener('click', ()  => modal.classList.remove('open'));
document.getElementById('cancel-modal').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

// Image file selection
document.getElementById('p-images').addEventListener('change', function() {
  const files = Array.from(this.files);
  newImageFiles = files;
  imgPreview.innerHTML = files.map((f, i) => `
    <div class="preview-item" id="new-img-${i}">
      <img src="${URL.createObjectURL(f)}" alt="Preview">
      <button class="remove-preview" onclick="removeNewImage(${i})">×</button>
    </div>
  `).join('');
});

function removeNewImage(index) {
  newImageFiles.splice(index, 1);
  document.getElementById(`new-img-${index}`).remove();
}

// Video file selection
document.getElementById('p-video').addEventListener('change', function() {
  const file = this.files[0];
  if (!file) return;
  newVideoFile = file;
  vidPreview.innerHTML = `
    <div class="preview-item">
      <video src="${URL.createObjectURL(file)}" controls></video>
    </div>`;
});

// Drag & drop for images
const imgZone = document.getElementById('img-upload-zone');
imgZone.addEventListener('click', () => document.getElementById('p-images').click());
imgZone.addEventListener('dragover', e => { e.preventDefault(); imgZone.classList.add('drag-over'); });
imgZone.addEventListener('dragleave', () => imgZone.classList.remove('drag-over'));
imgZone.addEventListener('drop', e => {
  e.preventDefault();
  imgZone.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  newImageFiles = files;
  imgPreview.innerHTML = files.map((f, i) => `
    <div class="preview-item" id="new-img-${i}">
      <img src="${URL.createObjectURL(f)}" alt="Preview">
      <button class="remove-preview" onclick="removeNewImage(${i})">×</button>
    </div>`).join('');
});

// Drag & drop for video
const vidZone = document.getElementById('vid-upload-zone');
vidZone.addEventListener('click', () => document.getElementById('p-video').click());
vidZone.addEventListener('dragover', e => { e.preventDefault(); vidZone.classList.add('drag-over'); });
vidZone.addEventListener('dragleave', () => vidZone.classList.remove('drag-over'));
vidZone.addEventListener('drop', e => {
  e.preventDefault();
  vidZone.classList.remove('drag-over');
  const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('video/'));
  if (file) {
    newVideoFile = file;
    vidPreview.innerHTML = `<div class="preview-item"><video src="${URL.createObjectURL(file)}" controls></video></div>`;
  }
});

// ─── SAVE PRODUCT ─────────────────────────────────────────────
document.getElementById('save-product-btn').addEventListener('click', saveProduct);

async function saveProduct() {
  const name      = document.getElementById('p-name').value.trim();
  const desc      = document.getElementById('p-desc').value.trim();
  const price     = parseFloat(document.getElementById('p-price').value);
  const stock     = parseInt(document.getElementById('p-stock').value, 10);
  const catId     = document.getElementById('p-category').value;
  const subcatId  = document.getElementById('p-subcategory').value;
  const editId    = document.getElementById('edit-product-id').value;

  if (!name || !desc || isNaN(price) || isNaN(stock) || !catId) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  const saveBtn = document.getElementById('save-product-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  const progressWrap = document.getElementById('upload-progress');
  const progressBar  = document.getElementById('upload-progress-bar');
  progressWrap.style.display = 'block';
  progressBar.style.width    = '10%';

  try {
    // Determine existing images to keep (edit mode)
    let existingImages = [];
    let existingVideo  = null;

    if (editId) {
      const existing = productsCache.find(p => p.id === editId);
      if (existing) {
        existingImages = (existing.images || []).filter(url => !removedImages.includes(url));
        existingVideo  = removeVideo ? null : (existing.videoUrl || null);
      }
      // Delete removed images from storage
      for (const url of removedImages) {
        try { await storage.refFromURL(url).delete(); } catch (e) { /* ignore */ }
      }
      if (removeVideo && existing?.videoUrl) {
        try { await storage.refFromURL(existing.videoUrl).delete(); } catch (e) { /* ignore */ }
      }
    }

    // Use existing doc id or create placeholder to get ID
    const productId = editId || db.collection('products').doc().id;

    // Upload new images
    const uploadedImageURLs = [];
    const totalFiles = newImageFiles.length + (newVideoFile ? 1 : 0);
    let uploaded = 0;

    for (const file of newImageFiles) {
      const ext  = file.name.split('.').pop();
      const ref  = storage.ref(`products/${productId}/images/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
      await ref.put(file);
      const url = await ref.getDownloadURL();
      uploadedImageURLs.push(url);
      uploaded++;
      progressBar.style.width = `${10 + (uploaded / Math.max(totalFiles, 1)) * 80}%`;
    }

    // Upload video
    let videoURL = existingVideo;
    if (newVideoFile) {
      const ext = newVideoFile.name.split('.').pop();
      const ref = storage.ref(`products/${productId}/video/${Date.now()}.${ext}`);
      await ref.put(newVideoFile);
      videoURL = await ref.getDownloadURL();
      uploaded++;
      progressBar.style.width = '90%';
    }

    const allImages = [...existingImages, ...uploadedImageURLs];
    const catName    = categoriesCache.find(c => c.id === catId)?.name || '';
    const subcatName  = subcategoriesCache.find(s => s.id === subcatId)?.name || '';

    const productData = {
      name,
      description: desc,
      price,
      stock,
      categoryId: catId,
      categoryName: catName,
      subcategoryId: subcatId || null,
      subcategoryName: subcatName || null,
      images: allImages,
      videoUrl: videoURL || null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (editId) {
      await db.collection('products').doc(editId).update(productData);
    } else {
      productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('products').doc(productId).set(productData);
    }

    progressBar.style.width = '100%';
    await loadProducts();
    await loadDashboard();
    modal.classList.remove('open');
    showToast(editId ? 'Product updated successfully' : 'Product added successfully');

  } catch (err) {
    console.error('Save product error:', err);
    showToast('Error saving product: ' + err.message, 'error');
  } finally {
    progressWrap.style.display = 'none';
    progressBar.style.width    = '0%';
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> <span id="save-btn-text">${document.getElementById('edit-product-id').value ? 'Update Product' : 'Save Product'}</span>`;
  }
}

// ─── DELETE PRODUCT ───────────────────────────────────────────
async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    const p = productsCache.find(x => x.id === id);
    // Delete storage files
    if (p) {
      for (const url of (p.images || [])) {
        try { await storage.refFromURL(url).delete(); } catch (e) { /* ignore */ }
      }
      if (p.videoUrl) {
        try { await storage.refFromURL(p.videoUrl).delete(); } catch (e) { /* ignore */ }
      }
    }
    await db.collection('products').doc(id).delete();
    await loadProducts();
    await loadDashboard();
    showToast(`"${name}" deleted`);
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Error deleting product', 'error');
  }
}

