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
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    transition: all 0.3s ease;
    font-weight: 600;
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
    container.innerHTML = `
      <div class="empty-cart-message">
        <p>🛒</p>
        <p>العربة فارغة</p>
      </div>
    `;
    $("#cartTotal").textContent = "المجموع: 0 ريال";
    return;
  }

  cart.forEach((item) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    
    const totalPrice = item.price * item.qty;
    
    row.innerHTML = `
      <img src="${item.image}" alt="${item.name}" class="cart-product-image"
           onerror="this.src='https://placehold.co/80x80?text=${encodeURIComponent(item.name)}'">
      
      <div class="cart-product-info">
        <div class="cart-product-name">${item.name}</div>
        <div class="cart-product-category">${item.category}</div>
        <div style="color: #999; font-size: 0.9rem;">${item.price} ريال / القطعة</div>
      </div>
      
      <div class="cart-quantity-section">
        <div class="quantity-control">
          <button onclick="decreaseQty('${item.sku}')">−</button>
          <input type="number" min="1" value="${item.qty}" 
                 onchange="updateQty('${item.sku}', this.value)" 
                 style="pointer-events: none;">
          <button onclick="increaseQty('${item.sku}')">+</button>
        </div>
        <div style="font-size: 0.85rem; color: #666;">الكمية: ${item.qty}</div>
      </div>
      
      <div class="cart-actions">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%;">
          <div class="cart-product-price">${totalPrice} ريال</div>
          <button class="cart-delete-btn" onclick="removeFromCart('${item.sku}')">🗑️ حذف</button>
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  $("#cartTotal").innerHTML = `
    <div class="total-label">إجمالي المشتريات</div>
    <p class="total-amount" style="margin: 0;">${total} ريال</p>
  `;
}

function increaseQty(sku) {
  const cart = loadCart();
  const idx = cart.findIndex((i) => String(i.sku) === String(sku));
  if (idx > -1) {
    cart[idx].qty += 1;
    saveCart(cart);
    renderCartItems();
  }
}

function decreaseQty(sku) {
  const cart = loadCart();
  const idx = cart.findIndex((i) => String(i.sku) === String(sku));
  if (idx > -1 && cart[idx].qty > 1) {
    cart[idx].qty -= 1;
    saveCart(cart);
    renderCartItems();
  }
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

// 🔐 إرسال الطلب - مع التأمين و GPS
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
  // ✅ استخراج بيانات GPS من input الموقع أو تلقائيًا إذا لم يضغط المستخدم
  let locationData = null;
  const addressInput = document.querySelector('input[name="address"]');

  if (addressInput && addressInput.dataset.gpsLocation) {
    try {
      // البيانات محفوظة كـ JSON كامل في dataset
      locationData = JSON.parse(addressInput.dataset.gpsLocation);
      console.log('📍 بيانات GPS (من المستخدم):', locationData);
    } catch (e) {
      console.warn('⚠️ خطأ في قراءة بيانات GPS من input');
    }
  }

  // 🧭 إذا ما فيش بيانات GPS من المستخدم — حاول تجيبها تلقائيًا
  if (!locationData && navigator.geolocation) {
    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 0
        });
      });

      locationData = {
        type: "Point",
        coordinates: [pos.coords.longitude, pos.coords.latitude],
        accuracy_meters: pos.coords.accuracy,
        altitude_meters: pos.coords.altitude,
        altitude_accuracy_meters: pos.coords.altitudeAccuracy,
        heading_degrees: pos.coords.heading,
        speed_kmh: pos.coords.speed ? pos.coords.speed * 3.6 : null,
        timestamp: pos.timestamp,
        address: formData.get("address") || "لم يتم إدخال عنوان يدوي",
        device_info: navigator.userAgent
      };

      console.log("📍 تم تحديد الموقع تلقائيًا:", locationData);
    } catch (err) {
      console.warn("⚠️ تعذر تحديد الموقع تلقائيًا:", err.message);
    }
  }


  const order = {
    orderId,
    date: now.toISOString(),
    formattedDate,
    customer: {
      name: formData.get("name"),
      phone: formData.get("phone"),
      addressInput: formData.get("address"), // العنوان المدخل من المستخدم
      
      // 📍 بيانات الموقع المنظمة بشكل JSON كامل
      location: locationData ? {
        type: locationData.type || "Point",
        coordinates: {
          latitude: locationData.coordinates[1],
          longitude: locationData.coordinates[0],
          formatted: `${locationData.coordinates[1].toFixed(6)}, ${locationData.coordinates[0].toFixed(6)}`
        },
        accuracy: {
          horizontal_meters: locationData.accuracy_meters,
          altitude_meters: locationData.altitude_meters,
          altitude_accuracy_meters: locationData.altitude_accuracy_meters
        },
        motion: {
          heading_degrees: locationData.heading_degrees,
          speed_kmh: locationData.speed_kmh
        },
        address: locationData.address,
        timestamp: locationData.timestamp,
        device_info: locationData.device_info
      } : null
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
    console.log("📤 إرسال الطلب مع بيانات GPS كاملة:", order);

    const res = await fetch(N8N_WEBHOOK_URL_POST, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + btoa(AUTH_HEADER),
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

    // عرض رسالة النجاح مع معلومات الموقع
    let successHtml = `
      <p>✅ <strong>تم إرسال الطلب بنجاح!</strong></p>
      <p>رقم الطلب: <strong>${orderId}</strong></p>
      <p>تاريخ الطلب: <strong>${formattedDate}</strong></p>
      <p>الإجمالي: <strong>${order.total} ريال</strong></p>
    `;

    // إضافة معلومات GPS إذا توفرت
    if (locationData && locationData.coordinates) {
      const mapLink = `https://maps.google.com/?q=${locationData.coordinates[1]},${locationData.coordinates[0]}`;
    }

    $("#orderResult").classList.remove("hidden");
    $("#orderResult").innerHTML = successHtml;

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
