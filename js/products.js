// تحميل المنتجات من Google Sheets
async function fetchProductsFromSheets() {
    try {
        console.log('🔄 جاري تحميل المنتجات من API...');
        
        const response = await fetch('https://gokimol212.app.n8n.cloud/webhook/get-products', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📦 البيانات المستلمة:', data);

        // تأكد إن البيانات في الصيغة الصحيحة
        if (!Array.isArray(data)) {
            throw new Error('البيانات المستلمة ليست مصفوفة');
        }

        // حول البيانات وتأكد من التنسيق الصحيح
        products = data.map(item => ({
            sku: String(item.sku || item.id || ''),  // تأكد من وجود sku
            name: String(item.name || item.product_name || ''),
            category: String(item.category || ''),
            price: Number(item.price || 0),
            image: String(item.image || item.image_url || 'https://via.placeholder.com/300x200?text=صورة')
        })).filter(item => item.sku && item.name); // فلتر المنتجات الناقصة

        console.log('✅ تم تحميل المنتجات بنجاح:', products.length);
        
        return products;

    } catch (error) {
        console.error('❌ خطأ في تحميل المنتجات:', error);
        console.log('🔄 استخدام البيانات التجريبية...');

    }
}

// عرض الفئات
function renderCategories() {
    const cats = [...new Set(products.map(p => p.category))].filter(Boolean);
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
    
    if (!list || list.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;">لا توجد منتجات للعرض</p>';
        return;
    }
    
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
            <button onclick="addToCart('${p.sku}')" data-sku="${p.sku}">أضف للعربة</button>
        `;
        container.appendChild(card);
    });
    
    console.log(`📋 تم عرض ${list.length} منتج`);
}

// البحث والفلترة
function filterProducts() {
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