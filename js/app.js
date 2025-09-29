// تحميل وتهيئة التطبيق
async function loadProducts() {
    try {
        console.log('🚀 بدء تحميل التطبيق...');
        
        // تحميل المنتجات
        await fetchProductsFromSheets();
        
        // عرض الفئات والمنتجات
        renderCategories();
        renderProducts(products);
        
        console.log('✅ تم تحميل التطبيق بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تحميل التطبيق:', error);
    }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 تهيئة التطبيق...');
    
    // تحميل المنتجات
    await loadProducts();
    
    // تحديث زر العربة
    updateCartButton();

    // إعداد أحداث البحث والفلترة
    $('#search').addEventListener('input', filterProducts);
    $('#categoryFilter').addEventListener('change', filterProducts);

    // إعداد نموذج الطلب
    const checkoutForm = $('#checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            await submitOrder(formData);
        });
    }
    
    console.log('✅ تم تهيئة التطبيق بنجاح');
});