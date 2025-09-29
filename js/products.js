
async function fetchProductsFromSheets() {
    try {
        const response = await fetch('https://gokimol212.app.n8n.cloud/webhook/get-products');
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('خطأ في تحميل المنتجات:', error);
        return SAMPLE_PRODUCTS; // fallback للمنتجات التجريبية
    }
}

// عرض الفئات
function renderCategories() {
    const cats = [...new Set(products.map(p => p.category))];
    const sel = $('#categoryFilter');
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
    container.innerHTML = '';
    
    list.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product';
        card.innerHTML = `
            <img src="${p.image}" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=صورة'">
            <h4>${p.name}</h4>
            <div class="meta">
                <div>${p.category}</div>
                <div>${p.price} ج</div>
            </div>
            <button onclick="addToCart('${p.sku}')">أضف للعربة</button>
        `;
        container.appendChild(card);
    });
}

// البحث والفلترة
function filterProducts() {
    const query = $('#search').value.trim().toLowerCase();
    const category = $('#categoryFilter').value;
    
    let filtered = products.filter(p => {
        const matchesQuery = p.name.toLowerCase().includes(query) || 
                           p.category.toLowerCase().includes(query);
        const matchesCategory = !category || p.category === category;
        return matchesQuery && matchesCategory;
    });
    
    renderProducts(filtered);
}
