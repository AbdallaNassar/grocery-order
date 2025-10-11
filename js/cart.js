const N8N_WEBHOOK_URL_POST = 'https://n8n.abdallav2ray.ggff.net/webhook/order';
const AUTH_HEADER = 'client:Abdallasuper2025samysuper';
// إدارة العربة
function addToCart(sku) {
  console.log("🛒 محاولة إضافة منتج:", sku);
  console.log("📦 المنتجات المتاحة:", products);

  if (!products || products.length === 0) {
    console.error("❌ لا توجد منتجات محملة");
    alert("جاري تحميل المنتجات، يرجى المحاولة مرة أخرى");
    return;
  }

  const prod = products.find((p) => String(p.sku) === String(sku));

  if (!prod) {
    console.error("❌ لم يتم العثور على المنتج:", sku);
    alert("حدث خطأ في إضافة المنتج");
    return;
  }

  console.log("✅ تم العثور على المنتج:", prod);

  const cart = loadCart();
  const idx = cart.findIndex((i) => String(i.sku) === String(sku));

  if (idx > -1) {
    cart[idx].qty += 1;
    console.log("📈 تم زيادة الكمية للمنتج الموجود");
  } else {
    cart.push({ ...prod, qty: 1 });
    console.log("➕ تم إضافة منتج جديد للعربة");
  }

  saveCart(cart);
  showNotification(`تم إضافة ${prod.name} للعربة ✅`);
}

function showNotification(message) {
  const notification = document.createElement("div");
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

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function renderCartItems() {
  const container = $("#cartItems");
  container.innerHTML = "";
  const cart = loadCart();

  if (cart.length === 0) {
    container.innerHTML =
      '<p style="text-align:center;padding:2rem;background:white;border-radius:8px;">العربة فارغة</p>';
    $("#cartTotal").textContent = "المجموع: 0 ريال";
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <div style="margin-top:0.5rem;">${item.price} ج × 
          <input type="number" min="1" value="${item.qty}" 
                 style="width:60px" onchange="updateQty('${
                   item.sku
                 }', this.value)" />
        </div>
      </div>
      <div>
        <div style="margin-bottom:0.5rem;">المجموع: ${
          item.price * item.qty
        } ريال</div>
        <button onclick="removeFromCart('${item.sku}')">حذف</button>
      </div>
    `;
    container.appendChild(row);
  });

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  $("#cartTotal").textContent = `المجموع: ${total} ريال`;
}

function updateQty(sku, qty) {
  const cart = loadCart();
  const idx = cart.findIndex((i) => String(i.sku) === String(sku));
  if (idx > -1) {
    cart[idx].qty = Math.max(1, parseInt(qty) || 1);
    saveCart(cart);
    renderCartItems();
  }
}

function removeFromCart(sku) {
  let cart = loadCart();
  cart = cart.filter((i) => String(i.sku) !== String(sku));
  saveCart(cart);
  renderCartItems();
  showNotification("تم حذف المنتج من العربة ❌");
}

// 🔐 إرسال الطلب - مع التأمين
async function submitOrder(formData) {
  const cart = loadCart();
  if (cart.length === 0) {
    alert("🛒 العربة فارغة");
    return;
  }

  const orderId = Math.random().toString(36).substr(2, 9);
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedDate = `${now.getDate()}/${
    now.getMonth() + 1
  }/${now.getFullYear()} ${hours}:${minutes} ${ampm}`;

  const order = {
    orderId,
    date: now.toISOString(),
    formattedDate,
    customer: {
      name: formData.get("name"),
      address: formData.get("address"),
      phone: formData.get("phone"),
    },
    items: cart.map((i) => ({
      sku: i.sku,
      name: i.name,
      price: i.price,
      qty: i.qty,
    })),
    total: cart.reduce((s, i) => s + i.price * i.qty, 0),
  };

  try {
    console.log("📤 إرسال الطلب:", order);

    // ✅ الكود الصحيح - بدون Origin
    const res = await fetch(N8N_WEBHOOK_URL_POST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(AUTH_HEADER),
        // Origin يُرسل تلقائياً من البراوزر ✅
      },
      body: JSON.stringify(order),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json().catch(() => ({ success: true }));
    console.log("✅ تم إرسال الطلب بنجاح:", data);

    // مسح العربة
    localStorage.removeItem(CART_KEY);

    // عرض رسالة النجاح
    $("#orderResult").classList.remove("hidden");
    $("#orderResult").innerHTML = `
      <p>✅ تم إرسال الطلب بنجاح.</p>
      <p>رقم الطلب: <strong>${orderId}</strong></p>
      <p>تاريخ الطلب: ${formattedDate}</p>
      <p>الإجمالي: <strong>${order.total} ريال</strong></p>
    `;

    $("#checkoutForm").reset();
    renderCartItems();
    updateCartButton();
    showNotification("تم إرسال الطلب بنجاح! ✅");

    // التمرير للأعلى
    $("#orderResult").scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (err) {
    console.error("❌ خطأ في إرسال الطلب:", err);

    let errorMsg = "حدث خطأ أثناء إرسال الطلب";
    if (err.message.includes("Failed to fetch")) {
      errorMsg = "تعذر الاتصال بالخادم. تحقق من الإنترنت.";
    } else if (err.message.includes("401") || err.message.includes("403")) {
      errorMsg = "خطأ في المصادقة. تواصل مع الدعم.";
    }

    alert(errorMsg + "\n\n" + err.message);
  }
}
