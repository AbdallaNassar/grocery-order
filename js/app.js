async function loadProducts() {
    products = await fetchProductsFromSheets();
    renderCategories();
    renderProducts(products);
}

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartButton();
    
    $('#search').addEventListener('input', filterProducts);
    $('#categoryFilter').addEventListener('change', filterProducts);
    
    $('#checkoutForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await submitOrder(formData);
    });
});
