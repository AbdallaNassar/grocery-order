// إدارة العربة
function addToCart(sku) {
    const prod = products.find(p => p.sku === sku);
    if (!prod) return;

    const cart = loadCart();
    const idx = cart.findIndex(i => i.sku === sku);
    
    if (idx > -1) {
        cart[idx].qty += 1;
    } else {
        cart.push({ ...prod, qty: 1 });
    }
    
    saveCart(cart);
}

function renderCartItems() {
    const container = $('#cartItems');
    container.innerHTML = '';
    const cart = loadCart();

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:2rem;background:white;border-radius:8px;">العربة فارغة</p>';
        $('#cartTotal').textContent = 'المجموع: 0 ج';
        return;
    }

    cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <div style="margin-top:0.5rem;">${item.price} ج × 
                    <input type="number" min="1" value="${item.qty}" style="width:60px" onchange="updateQty('${item.sku}', this.value)" />
                </div>
            </div>
            <div>
                <div style="margin-bottom:0.5rem;">المجموع: ${item.price * item.qty} ج</div>
                <button onclick="removeFromCart('${item.sku}')">حذف</button>
            </div>
        `;
        container.appendChild(row);
    });

    const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
    $('#cartTotal').textContent = `المجموع: ${total} ج`;
}

function updateQty(sku, qty) {
    const cart = loadCart();
    const idx = cart.findIndex(i => i.sku === sku);
    if (idx > -1) {
        cart[idx].qty = Math.max(1, parseInt(qty) || 1);
        saveCart(cart);
        renderCartItems();
    }
}

function removeFromCart(sku) {
    let cart = loadCart();
    cart = cart.filter(i => i.sku !== sku);
    saveCart(cart);
    renderCartItems();
}

// إرسال الطلب
async function submitOrder(formData) {
    const cart = loadCart();
    if (cart.length === 0) {
        alert('🛒 العربة فارغة');
        return;
    }

    const order = {
        date: new Date().toISOString(),
        customer: {
            name: formData.get('name'),
            address: formData.get('address'),
            phone: formData.get('phone')
        },
        items: cart.map(i => ({ sku: i.sku, name: i.name, price: i.price, qty: i.qty })),
        total: cart.reduce((s, i) => s + i.price * i.qty, 0)
    };

    try {
        // محاكاة إرسال الطلب
        console.log('Order submitted:', order);
        
        // في الواقع، ستحتاج لاستخدام هذا الكود مع رابط N8N الحقيقي:
        /*
        const res = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        
        if (!res.ok) throw new Error('خطأ في الإرسال');
        const data = await res.json().catch(() => ({}));
        */

        // محاكاة نجح الإرسال
        localStorage.removeItem(CART_KEY);
        $('#orderResult').classList.remove('hidden');
        $('#orderResult').innerHTML = `<p>✅ تم إرسال الطلب بنجاح. رقم الطلب: ${Math.random().toString(36).substr(2, 9)}</p>`;
        $('#checkoutForm').reset();
        renderCartItems();
        updateCartButton();
        
    } catch (err) {
        alert('حدث خطأ أثناء إرسال الطلب: ' + err.message);
    }
}