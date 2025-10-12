const CONFIG = {
  N8N_URL: "https://n8n.abdallav2ray.ggff.net/webhook",
  AUTH_TOKEN: btoa("admin:DashboardSecure2025"),
};

let allOrders = [];
let currentOrder = null;

// Login
async function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  const error = document.getElementById("loginError");

  error.textContent = "";

  if (!email || !password) {
    error.textContent = "❌ يرجى ملء جميع الحقول";
    return;
  }

  try {
    const response = await fetch(`${CONFIG.N8N_URL}/admin-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${CONFIG.AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("adminEmail", email);

      document.getElementById("loginPage").style.display = "none";
      document.getElementById("dashboardPage").classList.add("active");
      loadOrders();
    } else {
      error.textContent =
        result.message || "❌ البريد أو كلمة المرور غير صحيحة";
    }
  } catch (err) {
    console.error("خطأ في تسجيل الدخول:", err);
    error.textContent = "❌ حدث خطأ في الاتصال بالخادم";
  }
}

function logout() {
  sessionStorage.removeItem("isLoggedIn");
  sessionStorage.removeItem("adminEmail");
  location.reload();
}

window.onload = function () {
  if (sessionStorage.getItem("isLoggedIn") === "true") {
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("dashboardPage").classList.add("active");
    loadOrders();
  }
  setInterval(loadOrders, 15000);
  document
    .getElementById("searchInput")
    .addEventListener("input", renderOrders);
  document
    .getElementById("statusFilter")
    .addEventListener("change", renderOrders);
};

async function loadOrders() {
  try {
    const response = await fetch(`${CONFIG.N8N_URL}/get-orders`, {
      headers: {
        Authorization: `Basic ${CONFIG.AUTH_TOKEN}`,
      },
    });

    if (!response.ok) throw new Error("فشل تحميل الطلبات");

    const data = await response.json();
    allOrders = Array.isArray(data) ? data : [data];

    updateStats();
    renderOrders();
  } catch (error) {
    console.error("❌ خطأ في تحميل الطلبات:", error);
    showNotification("فشل تحميل الطلبات", "error");
  }
}

function updateStats() {
  document.getElementById("totalOrders").textContent = allOrders.length;
  document.getElementById("pendingOrders").textContent = allOrders.filter(
    (o) => o.Status === "Pending"
  ).length;
  document.getElementById("acceptedOrders").textContent = allOrders.filter(
    (o) => o.Status === "Accepted"
  ).length;
  document.getElementById("rejectedOrders").textContent = allOrders.filter(
    (o) => o.Status === "Rejected"
  ).length;
}

function parseLocation(locationJSON) {
  try {
    if (typeof locationJSON === "string") {
      return JSON.parse(locationJSON);
    }
    return locationJSON;
  } catch (e) {
    console.error("خطأ في تحليل الموقع:", e);
    return null;
  }
}

let currentPage = 1;
const ordersPerPage = 15;

function renderOrders() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const statusFilter = document.getElementById("statusFilter").value;

  let filtered = allOrders.filter((order) => {
    const matchesSearch =
      order.OrderID.toLowerCase().includes(searchTerm) ||
      order.CustomerName.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || order.Status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  filtered.reverse();

  const totalPages = Math.ceil(filtered.length / ordersPerPage);
  const start = (currentPage - 1) * ordersPerPage;
  const end = start + ordersPerPage;
  const paginatedOrders = filtered.slice(start, end);

  const tbody = document.getElementById("ordersTableBody");
  tbody.innerHTML = "";

  if (paginatedOrders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:40px;">لا توجد طلبات</td></tr>';
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  paginatedOrders.forEach((order) => {
    const row = document.createElement("tr");
    const statusClass = order.Status.toLowerCase();

    row.innerHTML = `
      <td>${order.OrderID}</td>
      <td>${order.CustomerName}</td>
      <td>${order.Phone}</td>
      <td><strong>${order.Total} ريال</strong></td>
      <td>${order.Date}</td>
      <td><span class="status ${statusClass}">${getStatusText(order.Status)}</span></td>
      <td>
        <button class="action-btn view-btn" onclick="viewOrder('${order.OrderID}')">📋 عرض</button>
        ${
          order.Status === "Pending"
            ? `
            <button class="action-btn accept-btn" onclick="acceptOrder('${order.OrderID}')">✅ قبول</button>
            <button class="action-btn reject-btn" onclick="rejectOrder('${order.OrderID}')">❌ رفض</button>
          `
            : ""
        }
      </td>
    `;
    tbody.appendChild(row);
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const pagination = document.getElementById("pagination");
  pagination.innerHTML = "";

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.className = "page-btn";
    if (i === currentPage) btn.classList.add("active");
    btn.onclick = () => {
      currentPage = i;
      renderOrders();
    };
    pagination.appendChild(btn);
  }
}

function getStatusText(status) {
  const map = { Pending: "قيد الانتظار", Accepted: "مقبول", Rejected: "مرفوض" };
  return map[status] || status;
}

// View Order Details with Map
function viewOrder(orderId) {
  const order = allOrders.find((o) => o.OrderID === orderId);
  if (!order) return;

  const items = JSON.parse(order.OrderJSON);
  const location = parseLocation(order.Location);

  const statusEmoji = {
    Pending: "⏳",
    Accepted: "✅",
    Rejected: "❌"
  };

  let mapHTML = "";
  if (location && location.coordinates) {
    mapHTML = `
      <div class="detail-section map-section">
        <h3>📍 الموقع على الخريطة</h3>
        <div id="orderMap" style="width:100%;height:300px;border-radius:8px;overflow:hidden;"></div>
        <div class="location-info" style="margin-top:10px;padding:10px;background:#f0f0f0;border-radius:6px;">
          <p style="margin:5px 0;"><strong>📌 العنوان:</strong> ${location.address}</p>
          <p style="margin:5px 0;font-size:0.9em;color:#666;">
            <strong>📐 الإحداثيات:</strong> ${location.coordinates.latitude.toFixed(4)}, ${location.coordinates.longitude.toFixed(4)}
          </p>
        </div>
      </div>
    `;
  }

  const details = `
    <div class="order-modal-header">
      <h2>📦 تفاصيل الطلب #${order.OrderID}</h2>
      <button class="close-btn" onclick="closeModal()">✕</button>
    </div>

    <div class="order-modal-content">
      <div class="details-grid">
        <div class="detail-section">
          <h3>👤 معلومات العميل</h3>
          <div class="info-box">
            <p><strong>👤 الاسم:</strong> ${order.CustomerName}</p>
            <p><strong>📱 الهاتف:</strong> ${order.Phone}</p>
            <p><strong>🏠 العنوان:</strong> ${order.Address}</p>
          </div>
        </div>

        <div class="detail-section">
          <h3>📊 معلومات الطلب</h3>
          <div class="info-box">
            <p><strong>🆔 رقم الطلب:</strong> ${order.OrderID}</p>
            <p><strong>📅 التاريخ:</strong> ${order.Date}</p>
            <p><strong>🎯 الحالة:</strong> <span class="status-badge ${order.Status.toLowerCase()}">${statusEmoji[order.Status]} ${getStatusText(order.Status)}</span></p>
          </div>
        </div>
      </div>

      ${mapHTML}

      <div class="detail-section">
        <h3>🛒 المنتجات المطلوبة</h3>
        <div class="products-list">
          ${items
            .map(
              (item, idx) =>
                `
              <div class="product-item">
                <span class="product-num">${idx + 1}</span>
                <div class="product-info">
                  <strong>${item.name}</strong>
                  <p>الكمية: ${item.qty} | السعر: ${item.price} ريال</p>
                </div>
                <span class="product-total">${item.qty * item.price} ريال</span>
              </div>
            `
            )
            .join("")}
        </div>
      </div>

      <div class="detail-section">
        <h3>💰 ملخص الفاتورة</h3>
        <div class="invoice-summary">
          <div class="summary-row">
            <span>الإجمالي:</span>
            <strong>${order.Total} ريال</strong>
          </div>
          ${order.DeliveryTime ? `
            <div class="summary-row">
              <span>⏰ وقت التوصيل المتوقع:</span>
              <strong>${order.DeliveryTime}</strong>
            </div>
          ` : ""}
          ${order.RejectReason ? `
            <div class="summary-row reject">
              <span>❌ سبب الرفض:</span>
              <strong>${order.RejectReason}</strong>
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;

  document.getElementById("orderDetails").innerHTML = details;
  document.getElementById("orderModal").classList.add("active");

  // تحميل الخريطة بعد 100ms للتأكد من أن العنصر موجود
  if (location && location.coordinates) {
    setTimeout(() => loadOrderMap(location), 100);
  }
}

// تحميل خريطة Leaflet
function loadOrderMap(location) {
  const { latitude, longitude } = location.coordinates;
  
  // حذف خريطة قديمة إذا كانت موجودة
  if (window.orderMapInstance) {
    window.orderMapInstance.remove();
  }

  // إنشاء خريطة جديدة
  window.orderMapInstance = L.map("orderMap").setView([latitude, longitude], 15);

  // إضافة طبقة الخريطة
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
    maxZoom: 19,
  }).addTo(window.orderMapInstance);

  // إضافة علامة على الموقع
  L.marker([latitude, longitude])
    .addTo(window.orderMapInstance)
    .bindPopup(`<strong>📍 موقع الطلب</strong><br>${location.address}`)
    .openPopup();
}

function closeModal() {
  document.getElementById("orderModal").classList.remove("active");
  if (window.orderMapInstance) {
    window.orderMapInstance.remove();
    window.orderMapInstance = null;
  }
}

async function updateOrderStatus(
  orderId,
  status,
  deliveryTime = "",
  rejectReason = ""
) {
  try {
    const response = await fetch(`${CONFIG.N8N_URL}/update-order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${CONFIG.AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        orderId,
        status,
        deliveryTime,
        rejectReason,
      }),
    });

    if (!response.ok) throw new Error("فشل تحديث الطلب");

    showNotification("✅ تم تحديث الطلب بنجاح");
    closeModal();
    loadOrders();
  } catch (error) {
    console.error(error);
    showNotification("❌ فشل تحديث الطلب", "error");
  }
}

function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  if (type === "error") notification.style.background = "#d63031";

  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

let inputCallback = null;
function openInputModal(title, placeholder, callback) {
  document.getElementById("inputModalTitle").textContent = title;
  document.getElementById("inputModalField").placeholder = placeholder;
  document.getElementById("inputModalField").value = "";
  document.getElementById("inputModal").classList.add("active");
  inputCallback = callback;
}

function closeInputModal() {
  document.getElementById("inputModal").classList.remove("active");
  inputCallback = null;
}

function confirmInput() {
  const value = document.getElementById("inputModalField").value.trim();
  if (inputCallback) inputCallback(value);
  closeInputModal();
}

async function acceptOrder(orderId) {
  openInputModal(
    "⏰ أدخل وقت التوصيل المتوقع (بالدقائق)",
    "مثال: 30",
    async (minutes) => {
      if (!minutes || isNaN(minutes) || minutes <= 0) {
        showNotification("❌ يرجى إدخال رقم صالح", "error");
        return;
      }
      await updateOrderStatus(orderId, "Accepted", `${minutes} دقيقة`);
    }
  );
}

async function rejectOrder(orderId) {
  openInputModal(
    "❌ أدخل سبب الرفض",
    "مثال: العنوان غير واضح",
    async (reason) => {
      if (!reason) {
        showNotification("❌ يرجى إدخال سبب الرفض", "error");
        return;
      }
      await updateOrderStatus(orderId, "Rejected", "", reason);
    }
  );
}

function goToDataEntry() {
  if (sessionStorage.getItem("isLoggedIn") === "true") {
    window.location.href = "data-entry.html";
  } else {
    alert("❌ يجب تسجيل الدخول أولاً");
  }
}