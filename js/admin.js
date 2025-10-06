const CONFIG = {
    N8N_URL: 'https://n8n.abdallav2ray.ggff.net/webhook',
    AUTH_TOKEN: btoa('admin:DashboardSecure2025')
};

let allOrders = [];
let currentOrder = null;

// Login - يرسل للـ n8n للتحقق
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const error = document.getElementById('loginError');
    
    // إخفاء رسالة الخطأ السابقة
    error.textContent = '';
    
    // التحقق من ملء الحقول
    if (!email || !password) {
        error.textContent = '❌ يرجى ملء جميع الحقول';
        return;
    }

    try {
        // إرسال بيانات التسجيل إلى n8n
        const response = await fetch(`${CONFIG.N8N_URL}/admin-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${CONFIG.AUTH_TOKEN}`
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const result = await response.json();

        // التحقق من الاستجابة
        if (response.ok && result.success) {
            // تسجيل دخول ناجح
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('adminEmail', email);
            
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('dashboardPage').classList.add('active');
            loadOrders();
        } else {
            // فشل تسجيل الدخول
            error.textContent = result.message || '❌ البريد أو كلمة المرور غير صحيحة';
        }
    } catch (err) {
        console.error('خطأ في تسجيل الدخول:', err);
        error.textContent = '❌ حدث خطأ في الاتصال بالخادم';
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('adminEmail');
    location.reload();
}

// Check Login on Load
window.onload = function() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('dashboardPage').classList.add('active');
        loadOrders();
    }
    // 🔄 تحديث تلقائي كل 15 ثانية
    setInterval(loadOrders, 15000);
    // Add event listeners for search and filter
    document.getElementById('searchInput').addEventListener('input', renderOrders);
    document.getElementById('statusFilter').addEventListener('change', renderOrders);
};

// Load Orders from n8n
async function loadOrders() {
    try {
        const response = await fetch(`${CONFIG.N8N_URL}/get-orders`, {
            headers: {
                'Authorization': `Basic ${CONFIG.AUTH_TOKEN}`
            }
        });
        console.log('HTTP Status:', response.status);

        console.log(response);

        if (!response.ok) throw new Error('فشل تحميل الطلبات');

        const data = await response.json();
        console.log('📦 البيانات المستلمة من API:', data);
        allOrders = Array.isArray(data) ? data : [data];

        updateStats();
        renderOrders();
    } catch (error) {
        console.error('❌ خطأ في تحميل الطلبات:', error);
        showNotification('فشل تحميل الطلبات', 'error');
    }
}

// Update Statistics
function updateStats() {
    document.getElementById('totalOrders').textContent = allOrders.length;
    document.getElementById('pendingOrders').textContent = 
        allOrders.filter(o => o.Status === 'Pending').length;
    document.getElementById('acceptedOrders').textContent = 
        allOrders.filter(o => o.Status === 'Accepted').length;
    document.getElementById('rejectedOrders').textContent = 
        allOrders.filter(o => o.Status === 'Rejected').length;
}

// Render Orders Table
function renderOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = allOrders.filter(order => {
        const matchesSearch = order.OrderID.toLowerCase().includes(searchTerm) ||
                            order.CustomerName.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || order.Status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">لا توجد طلبات</td></tr>';
        return;
    }


    filtered.reverse().forEach(order => {
        const row = document.createElement('tr');
        const statusClass = order.Status.toLowerCase();
        
        row.innerHTML = `
            <td>${order.OrderID}</td>
            <td>${order.CustomerName}</td>
            <td>${order.Phone}</td>
            <td><strong>${order.Total} ج</strong></td>
            <td>${order.Date}</td>
            <td><span class="status ${statusClass}">${getStatusText(order.Status)}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewOrder('${order.OrderID}')">عرض</button>
                ${order.Status === 'Pending' ? `
                    <button class="action-btn accept-btn" onclick="acceptOrder('${order.OrderID}')">قبول</button>
                    <button class="action-btn reject-btn" onclick="rejectOrder('${order.OrderID}')">رفض</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}


// ====== Pagination ======
let currentPage = 1;
const ordersPerPage = 15;

function renderOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    let filtered = allOrders.filter(order => {
        const matchesSearch = order.OrderID.toLowerCase().includes(searchTerm) ||
                              order.CustomerName.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || order.Status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // ترتيب الطلبات الجديدة أولاً
    filtered.reverse();

    const totalPages = Math.ceil(filtered.length / ordersPerPage);
    const start = (currentPage - 1) * ordersPerPage;
    const end = start + ordersPerPage;
    const paginatedOrders = filtered.slice(start, end);

    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    if (paginatedOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;">لا توجد طلبات</td></tr>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    paginatedOrders.forEach(order => {
        const row = document.createElement('tr');
        const statusClass = order.Status.toLowerCase();
        row.innerHTML = `
            <td>${order.OrderID}</td>
            <td>${order.CustomerName}</td>
            <td>${order.Phone}</td>
            <td><strong>${order.Total} ج</strong></td>
            <td>${order.Date}</td>
            <td><span class="status ${statusClass}">${getStatusText(order.Status)}</span></td>
            <td>
                <button class="action-btn view-btn" onclick="viewOrder('${order.OrderID}')">عرض</button>
                ${order.Status === 'Pending' ? `
                    <button class="action-btn accept-btn" onclick="acceptOrder('${order.OrderID}')">قبول</button>
                    <button class="action-btn reject-btn" onclick="rejectOrder('${order.OrderID}')">رفض</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });

    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = 'page-btn';
        if (i === currentPage) btn.classList.add('active');
        btn.onclick = () => {
            currentPage = i;
            renderOrders();
        };
        pagination.appendChild(btn);
    }
}
// ====== End Pagination ======
























function getStatusText(status) {
    const map = { 'Pending': 'قيد الانتظار', 'Accepted': 'مقبول', 'Rejected': 'مرفوض' };
    return map[status] || status;
}

// View Order Details
function viewOrder(orderId) {
    const order = allOrders.find(o => o.OrderID === orderId);
    if (!order) return;

    const items = JSON.parse(order.OrderJSON);
    const details = `
        <div class="detail"><strong>رقم الطلب:</strong> ${order.OrderID}</div>
        <div class="detail"><strong>العميل:</strong> ${order.CustomerName}</div>
        <div class="detail"><strong>الهاتف:</strong> ${order.Phone}</div>
        <div class="detail"><strong>العنوان:</strong> ${order.Address}</div>
        <div class="detail"><strong>التاريخ:</strong> ${order.Date}</div>
        <div class="detail"><strong>الحالة:</strong> ${getStatusText(order.Status)}</div>
        <div class="detail">
            <strong>المنتجات:</strong><br>
            ${items.map(item => `• ${item.name} - الكمية: ${item.qty} - السعر: ${item.price} ج`).join('<br>')}
        </div>
        <div class="detail"><strong>الإجمالي:</strong> ${order.Total} ج</div>
    `;

    document.getElementById('orderDetails').innerHTML = details;
    document.getElementById('orderModal').classList.add('active');
}

function closeModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// Accept Order
async function acceptOrder(orderId) {
    let minutes = prompt('⏰ أدخل وقت التوصيل المتوقع بالرقم فقط (مثال: 30):');
    if (!minutes) return;

    minutes = minutes.trim();
    if (isNaN(minutes) || minutes <= 0) {
        alert('❌ يرجى إدخال رقم صالح');
        return;
    }

    const deliveryTime = `${minutes} دقيقة`;
    await updateOrderStatus(orderId, 'Accepted', deliveryTime);
}

// Reject Order
async function rejectOrder(orderId) {
    const reason = prompt('❌ أدخل سبب الرفض:');
    if (!reason) return;

    await updateOrderStatus(orderId, 'Rejected', null, reason);
}

// Update Order Status
async function updateOrderStatus(orderId, status, deliveryTime = '', rejectReason = '') {
    try {
        const response = await fetch(`${CONFIG.N8N_URL}/update-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${CONFIG.AUTH_TOKEN}`
            },
            body: JSON.stringify({
                orderId,
                status,
                deliveryTime,
                rejectReason
            })
        });

        if (!response.ok) throw new Error('فشل تحديث الطلب');

        showNotification('✅ تم تحديث الطلب بنجاح');
        loadOrders();
    } catch (error) {
        console.error(error);
        showNotification('❌ فشل تحديث الطلب', 'error');
    }
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    if (type === 'error') notification.style.background = '#d63031';
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}