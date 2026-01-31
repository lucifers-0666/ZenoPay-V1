// State management
let currentFilters = {
  category: null,
  search: null,
  sort: 'newest',
  page: 1,
  limit: 12,
  min_price: null,
  max_price: null,
  in_stock: false,
  on_sale: false,
  featured: false
};

let cartData = { cartItems: [], summary: { itemCount: 0, total: 0 } };
let categories = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  loadCategories();
  loadProducts();
  loadCart();
});

// ============================================
// LOAD CATEGORIES
// ============================================
async function loadCategories() {
  try {
    const response = await fetch('/api/shop/categories');
    const data = await response.json();

    if (data.success) {
      categories = data.categories;
      renderCategories();
    }
  } catch (error) {
    console.error('Failed to load categories:', error);
  }
}

function renderCategories() {
  const container = document.getElementById('categories-filter');
  
  const html = categories.map(cat => `
    <div class="checkbox-item">
      <input type="checkbox" id="cat-${cat._id}" value="${cat._id}" onchange="toggleCategory('${cat._id}')">
      <i class="${cat.icon} category-icon"></i>
      <label for="cat-${cat._id}">${cat.name}</label>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

// ============================================
// LOAD PRODUCTS
// ============================================
async function loadProducts() {
  try {
    const container = document.getElementById('products-container');
    container.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i> Loading products...</div>';

    // Build query string
    const params = new URLSearchParams();
    Object.keys(currentFilters).forEach(key => {
      if (currentFilters[key] !== null && currentFilters[key] !== false && currentFilters[key] !== '') {
        params.append(key, currentFilters[key]);
      }
    });

    const response = await fetch(`/api/shop/products?${params.toString()}`);
    const data = await response.json();

    if (data.success) {
      renderProducts(data.products);
      renderPagination(data.pagination);
      updateProductCount(data.pagination.totalProducts);
      updateActiveFilters();
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error('Failed to load products:', error);
    showEmptyState('Error loading products');
  }
}

function renderProducts(products) {
  const container = document.getElementById('products-container');

  if (products.length === 0) {
    showEmptyState();
    return;
  }

  const html = products.map(product => {
    const discountPercent = product.discount_percentage || 0;
    const finalPrice = product.sale_price || product.price;
    const inStock = product.stock_quantity > 0;

    return `
      <div class="product-card" onclick="viewProduct('${product._id}')">
        <div class="product-image-wrapper">
          <img src="${product.images[0] || '/Images/placeholder.jpg'}" alt="${product.name}" class="product-image">
          ${discountPercent > 0 ? `<div class="badge badge-sale">${discountPercent}% OFF</div>` : ''}
          ${product.featured ? '<div class="badge badge-new">NEW</div>' : ''}
          ${!inStock ? '<div class="badge badge-sold-out">SOLD OUT</div>' : ''}
          <button class="wishlist-btn" onclick="event.stopPropagation();toggleWishlist('${product._id}')">
            <i class="far fa-heart"></i>
          </button>
        </div>
        <div class="product-info">
          <div class="category-tag">${product.category_id?.name || 'Uncategorized'}</div>
          <div class="product-name">${product.name}</div>
          ${product.rating > 0 ? `
            <div class="rating">
              <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))}</span>
              <span class="review-count">(${product.review_count})</span>
            </div>
          ` : ''}
          <div class="price-section">
            ${product.sale_price ? `<span class="original-price">₹${product.price.toFixed(2)}</span>` : ''}
            <span class="sale-price">₹${finalPrice.toFixed(2)}</span>
            ${discountPercent > 0 ? `<span class="discount-badge">Save ${discountPercent}%</span>` : ''}
          </div>
          <button class="add-to-cart-btn" onclick="event.stopPropagation();addToCart('${product._id}')" ${!inStock ? 'disabled' : ''}>
            <i class="fas fa-shopping-cart"></i> ${inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="products-grid">${html}</div>`;
}

function showEmptyState(message = 'No products found') {
  const container = document.getElementById('products-container');
  container.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-shopping-bag"></i>
      <h3>${message}</h3>
      <p>Try adjusting your filters or search terms</p>
      <button class="btn btn-primary" onclick="clearFilters()">Clear Filters</button>
    </div>
  `;
}

// ============================================
// PAGINATION
// ============================================
function renderPagination(pagination) {
  const container = document.getElementById('pagination');
  
  if (pagination.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  
  // Previous button
  html += `<button class="page-btn" onclick="changePage(${pagination.currentPage - 1})" ${!pagination.hasPrev ? 'disabled' : ''}>
    <i class="fas fa-chevron-left"></i> Prev
  </button>`;
  
  // Page numbers
  for (let i = 1; i <= Math.min(pagination.totalPages, 5); i++) {
    html += `<button class="page-btn ${i === pagination.currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }
  
  if (pagination.totalPages > 5) {
    html += '<span>...</span>';
    html += `<button class="page-btn" onclick="changePage(${pagination.totalPages})">${pagination.totalPages}</button>`;
  }
  
  // Next button
  html += `<button class="page-btn" onclick="changePage(${pagination.currentPage + 1})" ${!pagination.hasNext ? 'disabled' : ''}>
    Next <i class="fas fa-chevron-right"></i>
  </button>`;
  
  container.innerHTML = html;
}

function changePage(page) {
  currentFilters.page = page;
  loadProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// FILTERS
// ============================================
function toggleCategory(categoryId) {
  currentFilters.category = categoryId;
  currentFilters.page = 1;
  loadProducts();
}

function applyPriceFilter() {
  const minPrice = document.getElementById('min-price').value;
  const maxPrice = document.getElementById('max-price').value;
  
  currentFilters.min_price = minPrice || null;
  currentFilters.max_price = maxPrice || null;
  currentFilters.page = 1;
  
  loadProducts();
}

function applyFilters() {
  currentFilters.in_stock = document.getElementById('in-stock').checked;
  currentFilters.on_sale = document.getElementById('on-sale').checked;
  currentFilters.featured = document.getElementById('featured').checked;
  currentFilters.page = 1;
  
  loadProducts();
}

function applySort() {
  currentFilters.sort = document.getElementById('sort-select').value;
  currentFilters.page = 1;
  loadProducts();
}

function clearFilters() {
  // Reset filters
  currentFilters = {
    category: null,
    search: null,
    sort: 'newest',
    page: 1,
    limit: 12,
    min_price: null,
    max_price: null,
    in_stock: false,
    on_sale: false,
    featured: false
  };
  
  // Clear UI
  document.querySelectorAll('.checkbox-item input').forEach(input => input.checked = false);
  document.getElementById('min-price').value = '';
  document.getElementById('max-price').value = '';
  document.getElementById('sort-select').value = 'newest';
  
  loadProducts();
}

function updateProductCount(count) {
  document.getElementById('products-count').textContent = `${count} Products`;
  document.getElementById('result-count').textContent = `${count} products found`;
}

function updateActiveFilters() {
  const bar = document.getElementById('active-filters-bar');
  const pillsContainer = document.getElementById('active-filter-pills');
  
  const activeFilters = [];
  
  if (currentFilters.category) {
    const cat = categories.find(c => c._id === currentFilters.category);
    if (cat) activeFilters.push({ label: cat.name, key: 'category' });
  }
  
  if (currentFilters.in_stock) activeFilters.push({ label: 'In Stock', key: 'in_stock' });
  if (currentFilters.on_sale) activeFilters.push({ label: 'On Sale', key: 'on_sale' });
  if (currentFilters.featured) activeFilters.push({ label: 'Featured', key: 'featured' });
  if (currentFilters.min_price) activeFilters.push({ label: `Min: ₹${currentFilters.min_price}`, key: 'min_price' });
  if (currentFilters.max_price) activeFilters.push({ label: `Max: ₹${currentFilters.max_price}`, key: 'max_price' });
  
  if (activeFilters.length > 0) {
    bar.style.display = 'flex';
    pillsContainer.innerHTML = activeFilters.map(f => `
      <div class="filter-pill">
        ${f.label}
        <i class="fas fa-times" onclick="removeFilter('${f.key}')"></i>
      </div>
    `).join('');
  } else {
    bar.style.display = 'none';
  }
}

function removeFilter(key) {
  currentFilters[key] = null;
  if (key === 'in_stock' || key === 'on_sale' || key === 'featured') {
    currentFilters[key] = false;
    document.getElementById(key.replace('_', '-')).checked = false;
  } else if (key === 'min_price' || key === 'max_price') {
    document.getElementById(key.replace('_', '-')).value = '';
  } else if (key === 'category') {
    document.querySelectorAll('[id^="cat-"]').forEach(input => input.checked = false);
  }
  currentFilters.page = 1;
  loadProducts();
}

// ============================================
// CART OPERATIONS
// ============================================
async function loadCart() {
  try {
    const response = await fetch('/api/cart');
    const data = await response.json();

    if (data.success) {
      cartData = data;
      updateCartUI();
    }
  } catch (error) {
    console.error('Failed to load cart:', error);
  }
}

async function addToCart(productId) {
  try {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity: 1 })
    });

    const data = await response.json();

    if (data.success) {
      showToast('Added to cart successfully!', 'success');
      loadCart();
    } else {
      showToast(data.message || 'Failed to add to cart', 'error');
    }
  } catch (error) {
    console.error('Failed to add to cart:', error);
    showToast('Failed to add to cart', 'error');
  }
}

async function updateCartQuantity(cartItemId, quantity) {
  try {
    const response = await fetch(`/api/cart/update/${cartItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity })
    });

    const data = await response.json();

    if (data.success) {
      loadCart();
    } else {
      showToast(data.message || 'Failed to update cart', 'error');
    }
  } catch (error) {
    console.error('Failed to update cart:', error);
    showToast('Failed to update cart', 'error');
  }
}

async function removeFromCart(cartItemId) {
  if (!confirm('Remove this item from cart?')) return;

  try {
    const response = await fetch(`/api/cart/remove/${cartItemId}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (data.success) {
      showToast('Item removed from cart', 'success');
      loadCart();
    } else {
      showToast(data.message || 'Failed to remove item', 'error');
    }
  } catch (error) {
    console.error('Failed to remove item:', error);
    showToast('Failed to remove item', 'error');
  }
}

function updateCartUI() {
  const count = cartData.summary?.itemCount || 0;
  const badge = document.getElementById('cart-count');
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';

  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('cart-items-container');
  const footer = document.getElementById('cart-footer');
  const items = cartData.cartItems || [];

  if (items.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-shopping-cart"></i>
        <h3>Your cart is empty</h3>
        <p>Start shopping to add items</p>
      </div>
    `;
    footer.style.display = 'none';
    return;
  }

  const html = items.map(item => `
    <div class="cart-item">
      <img src="${item.product.images[0] || '/Images/placeholder.jpg'}" alt="${item.product.name}" class="cart-item-image">
      <div class="cart-item-details">
        <div class="cart-item-name">${item.product.name}</div>
        <div class="cart-item-price">₹${(item.product.sale_price || item.product.price).toFixed(2)} each</div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateCartQuantity('${item._id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQuantity('${item._id}', ${item.quantity + 1})">+</button>
        </div>
      </div>
      <div>
        <div style="font-weight:700;margin-bottom:8px">₹${item.subtotal.toFixed(2)}</div>
        <i class="fas fa-trash remove-item" onclick="removeFromCart('${item._id}')"></i>
      </div>
    </div>
  `).join('');

  container.innerHTML = html;
  footer.style.display = 'block';

  // Update summary
  const summary = cartData.summary || {};
  document.getElementById('cart-subtotal').textContent = `₹${(summary.subtotal || 0).toFixed(2)}`;
  document.getElementById('cart-tax').textContent = `₹${(summary.tax || 0).toFixed(2)}`;
  document.getElementById('cart-shipping').textContent = summary.shipping === 0 ? 'FREE' : `₹${(summary.shipping || 0).toFixed(2)}`;
  document.getElementById('cart-total').textContent = `₹${(summary.total || 0).toFixed(2)}`;
}

function openCart() {
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('cart-overlay').classList.add('show');
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('show');
}

function proceedToCheckout() {
  if (!cartData.cartItems || cartData.cartItems.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }
  
  // For now, show alert. In production, navigate to checkout page
  alert('Checkout functionality will be implemented next!');
  // window.location.href = '/checkout';
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function viewProduct(productId) {
  // For now, show alert. In production, navigate to product detail page
  alert(`Product detail page will be implemented next!\nProduct ID: ${productId}`);
  // window.location.href = `/product/${productId}`;
}

function toggleWishlist(productId) {
  showToast('Wishlist feature coming soon!', 'info');
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
  const color = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
  
  toast.innerHTML = `<i class="fas ${icon}" style="color:${color}"></i> ${message}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Close cart on ESC key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeCart();
  }
});
