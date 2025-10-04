// دوال مساعدة عامة
const N8N_WEBHOOK_URL = 'https://n8n.abdallav2ray.ggff.net/webhook/order';
const CART_KEY = 'grocery_cart_v1';

// المتغير العام للمنتجات
let products = [];
let isLoading = false;

// دوال مساعدة
function $(sel) { return document.querySelector(sel); }

function loadCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartButton();
}

function updateCartButton() {
    const cart = loadCart();
    const count = cart.reduce((s, i) => s + i.qty, 0);
    $('#viewCartBtn').textContent = `🛒 عربة (${count})`;
}

function showMainPage() {
    $('#cartPage').classList.add('hidden');
    $('#mainPage').classList.remove('hidden');
        // 🔹 اخفاء نتيجة الطلب
    const resultBox = document.getElementById('orderResult');
    if (resultBox) {
        resultBox.classList.add('hidden');
        resultBox.innerHTML = '';
    }

    // 🔹 Reset للفورم
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.reset();
    }
}

function showCartPage() {
    $('#mainPage').classList.add('hidden');
    $('#cartPage').classList.remove('hidden');
    renderCartItems();
}

// إضافة الـ CSS للـ Loading States
function addLoadingStyles() {
    if (document.getElementById('loading-styles')) return;
    
    const styles = document.createElement('style');
    document.head.appendChild(styles);
}
window.addEventListener('load', () => {
    const resultBox = document.getElementById('orderResult');
    if (resultBox) {
        resultBox.classList.add('hidden');
        resultBox.innerHTML = '';
    }
});