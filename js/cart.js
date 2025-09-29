// إدارة العربة
function addToCart(sku) {
    console.log('🛒 محاولة إضافة منتج:', sku);
    console.log('📦 المنتجات المتاحة:', products);
    
    // تأكد من وجود المنتجات
    if (!products || products.length === 0) {
        console.error('❌ لا توجد منتجات محملة');
        alert('جاري تحميل المنتجات، يرجى المحاولة مرة أخرى');
        return;
    }

    const prod = products.find(p => String(p.sku) === String(sku));
    
    if (!prod) {
        console.error('❌ لم يتم العثور على المنتج:', sku);
        alert('حدث خطأ في إضافة المنتج');
        return;
    }

    console.log('✅ تم العثور على المنتج:', prod);

    const cart = loadCart();
    const idx = cart.findIndex(i => String(i.sku) === String(sku));
    
    if (idx > -1) {
        cart[idx].qty += 1;
        console.log('📈 تم زيادة الكمية للمنتج الموجود');
    } else {
        cart.push({ ...prod, qty: 1 });
        console.log('➕ تم إضافة منتج جديد للعربة');
    }
    
    saveCart(cart);
    
    // رسالة تأكيد للمستخدم
    showNotification(`تم إضافة ${prod.name} للعربة ✅`);
}

function showNotification(message) {
    // إنشاء إشعار بسيط
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
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
    const idx = cart.findIndex(i => String(i.sku) === String(sku));
    if (idx > -1) {
        cart[idx].qty = Math.max(1, parseInt(qty) || 1);
        saveCart(cart);
        renderCartItems();
    }
}

function removeFromCart(sku) {
    let cart = loadCart();
    cart = cart.filter(i => String(i.sku) !== String(sku));
    saveCart(cart);
    renderCartItems();
    showNotification('تم حذف المنتج من العربة ❌');
}

// إرسال الطلب
async function submitOrder(formData) {
    const cart = loadCart();
    if (cart.length === 0) {
        alert('🛒 العربة فارغة');
        return;
    }

    // رقم طلب عشوائي
    const orderId = Math.random().toString(36).substr(2, 9);

    // تحويل الوقت لشكل 12 ساعة مع AM/PM
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${hours}:${minutes} ${ampm}`;

    const order = {
        orderId,
        date: now.toISOString(),
        formattedDate,
        customer: {
            name: formData.get('name'),
            address: formData.get('address'),
            phone: formData.get('phone')
        },
        items: cart.map(i => ({ sku: i.sku, name: i.name, price: i.price, qty: i.qty })),
        total: cart.reduce((s, i) => s + i.price * i.qty, 0)
    };

    try {
        console.log('📤 إرسال الطلب:', order);
        
        const res = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json().catch(() => ({ success: true }));

        console.log('✅ تم إرسال الطلب بنجاح:', data);

        // مسح العربة
        localStorage.removeItem(CART_KEY);
        $('#orderResult').classList.remove('hidden');
        $('#orderResult').innerHTML = `
            <p>✅ تم إرسال الطلب بنجاح.</p>
            <p>رقم الطلب: <strong>${orderId}</strong></p>
            <p>تاريخ الطلب: ${formattedDate}</p>
        `;
        $('#checkoutForm').reset();
        renderCartItems();
        updateCartButton();

        showNotification('تم إرسال الطلب بنجاح! ✅');

    } catch (err) {
        console.error('❌ خطأ في إرسال الطلب:', err);
        alert('حدث خطأ أثناء إرسال الطلب: ' + err.message);
    }
}


