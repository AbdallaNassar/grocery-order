const N8N_WEBHOOK_URL_GET = 'https://n8n.abdallav2ray.ggff.net/webhook/get-products';
// تحميل المنتجات من Google Sheets فقط
async function fetchProductsFromSheets() {
  try {
    console.log('🔄 بدء تحميل المنتجات من الخادم...');
    isLoading = true;
    showProductSkeletons();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(N8N_WEBHOOK_URL_GET, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(AUTH_HEADER),
      },
      mode: 'cors',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('HTTP Status:', response.status);
    if (!response.ok) throw new Error(`خطأ في الخادم: ${response.status} - ${response.statusText}`);

    const resData = await response.json();
    console.log('📦 البيانات المستلمة من API:', resData);

    // جرب استخراج المصفوفة الصحيحة من الرد
    const data = Array.isArray(resData)
      ? resData
      : resData.data || resData.items || [];

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('لم يتم العثور على منتجات');
    }

    products = data.map((item, index) => ({
      sku: String(item.sku || item.id || `auto_${index}`),
      name: String(item.name || item.product_name || `منتج ${index + 1}`),
      category: String(item.category || 'عام'),
      price: Number(item.price || 0),
      image: String(item.image || item.image_url || `https://placehold.co/300x200?text=${encodeURIComponent(item.name || 'منتج')}`)
    })).filter(p => p.name && p.price > 0);

    renderCategories();
    renderProducts(products);
    showSuccessMessage(`تم تحميل ${products.length} منتج بنجاح ✅`);

  } catch (error) {
    console.error('❌ خطأ في تحميل المنتجات:', error);
    showErrorMessage(error);
    products = [];
  } finally {
    isLoading = false;
  }
}


// إظهار رسالة خطأ مفصلة
function showErrorMessage(error) {
    const container = $('#productsSection');
    
    let errorMessage = 'حدث خطأ في تحميل المنتجات';
    let errorDetails = '';
    
    if (error.name === 'AbortError') {
        errorMessage = 'انتهت مهلة التحميل';
        errorDetails = 'يبدو أن الاتصال بالإنترنت بطيء أو أن الخادم لا يستجيب';
    } else if (error.message.includes('HTTP error')) {
        errorMessage = 'خطأ في الخادم';
        errorDetails = 'الخادم غير متاح حالياً، يرجى المحاولة لاحقاً';
    } else if (error.message.includes('fetch')) {
        errorMessage = 'خطأ في الاتصال';
        errorDetails = 'تأكد من الاتصال بالإنترنت وحاول مرة أخرى';
    } else {
        errorDetails = error.message;
    }
    
    container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">😕</div>
            <h3 class="error-title">${errorMessage}</h3>
            <p class="error-message">${errorDetails}</p>
            <button class="retry-button" onclick="retryLoadProducts()">
                🔄 إعادة المحاولة
            </button>
        </div>
    `;
}

// إظهار Loading Skeletons أثناء التحميل
function showProductSkeletons() {
    const container = $('#productsSection');
    let skeletons = '';
    
    // عرض 8 skeleton cards
    for (let i = 0; i < 8; i++) {
        skeletons += `
            <div class="product-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-text skeleton-title"></div>
                <div class="skeleton-text skeleton-category"></div>
                <div class="skeleton-text skeleton-price"></div>
                <div class="skeleton-button"></div>
            </div>
        `;
    }
    
    container.innerHTML = skeletons;
}

// إظهار رسالة نجاح
function showSuccessMessage(message) {
    const existingBadge = document.querySelector('.success-badge');
    if (existingBadge) {
        existingBadge.remove();
    }
    
    const badge = document.createElement('div');
    badge.className = 'success-badge';
    badge.textContent = message;
    document.body.appendChild(badge);
    
    setTimeout(() => {
        if (badge.parentNode) {
            badge.style.opacity = '0';
            setTimeout(() => badge.remove(), 300);
        }
    }, 4000);
}

// عرض الفئات
function renderCategories() {
    const cats = [...new Set(products.map(p => p.category))].filter(Boolean);
    const sel = $('#categoryFilter');
    
    if (!sel) return;
    
    sel.innerHTML = '<option value="">كل الفئات</option>';
    
    cats.forEach(c => {
        const o = document.createElement('option');
        o.value = c;
        o.textContent = c;
        sel.appendChild(o);
    });
}

// عرض المنتجات
function renderProducts(list) {
    const container = $('#productsSection');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!list || list.length === 0) {
        container.innerHTML = `
            <div class="error-container">
                <div class="error-icon">📦</div>
                <h3 class="error-title">لا توجد منتجات للعرض</h3>
                <p class="error-message">لم يتم العثور على أي منتجات تطابق البحث أو الفئة المحددة</p>
            </div>
        `;
        return;
    }
    
    list.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" 
                 onerror="this.src='https://placehold.co/300x200?text=${encodeURIComponent(p.name)}'"
                 loading="lazy">
            <h4>${p.name}</h4>
            <div class="meta">
                <div>${p.category}</div>
                <div>${p.price} ريال</div>
            </div>
            <button onclick="addToCart('${p.sku}')" data-sku="${p.sku}">أضف للعربة</button>
        `;
        container.appendChild(card);
    });
    
    console.log(`📋 تم عرض ${list.length} منتج`);
}

// إعادة محاولة تحميل المنتجات
async function retryLoadProducts() {
    console.log('🔄 إعادة المحاولة...');
    
    const container = $('#productsSection');
    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <div class="loading-text pulse-animation">جاري إعادة التحميل...</div>
            <div class="loading-subtext">يرجى الانتظار</div>
        </div>
    `;
    
    // انتظار قصير للـ animation
    setTimeout(async () => {
        await fetchProductsFromSheets();
    }, 500);
}

// البحث والفلترة
function filterProducts() {
    if (isLoading || !products || products.length === 0) return;
    
    const query = $('#search').value.trim().toLowerCase();
    const category = $('#categoryFilter').value;
    
    let filtered = products.filter(p => {
        const matchesQuery = !query || 
                           p.name.toLowerCase().includes(query) || 
                           p.category.toLowerCase().includes(query);
        const matchesCategory = !category || p.category === category;
        return matchesQuery && matchesCategory;
    });
    
    renderProducts(filtered);
}