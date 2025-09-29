// تحميل وتهيئة التطبيق
async function loadProducts() {
    try {
        console.log('🚀 بدء تحميل التطبيق...');
        
        // إضافة الـ Loading Styles
        addLoadingStyles();
        
        // إظهار loading وتحميل البيانات من الخادم
        await fetchProductsFromSheets();
        
        // تحديث زر العربة
        updateCartButton();
        
        console.log('✅ تم تحميل التطبيق بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل التطبيق:', error);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 تهيئة التطبيق...');
    
    // تحميل المنتجات من الخادم
    await loadProducts();

    // إعداد أحداث البحث والفلترة
    const searchInput = $('#search');
    const categoryFilter = $('#categoryFilter');
    
    if (searchInput) {
        // استخدام debounce للبحث لتحسين الأداء
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(filterProducts, 300);
        });
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }

    // إعداد نموذج الطلب
    const checkoutForm = $('#checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await submitOrder(formData);
        });
    }
    
    console.log('🚀 التطبيق جاهز!');
});