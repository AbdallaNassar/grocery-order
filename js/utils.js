// دوال مساعدة عامة
const CART_KEY = 'grocery_cart_v1';
const N8N_WEBHOOK_URL = 'https://gokimol212.app.n8n.cloud/webhook-test/grocery-order';

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
}

function showCartPage() {
    $('#mainPage').classList.add('hidden');
    $('#cartPage').classList.remove('hidden');
    renderCartItems();
}