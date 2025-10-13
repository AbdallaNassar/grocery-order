const CONFIG = {
    N8N_URL: "https://n8n.abdallav2ray.ggff.net/webhook",
    AUTH_TOKEN: btoa("admin:DashboardSecure2025"),
};

let categories = []; // لتخزين الكاتيجوريات

// جلب الكاتيجوريات من الـ webhook
async function fetchCategories() {
    try {
        const response = await fetch(`${CONFIG.N8N_URL}/get-category`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${CONFIG.AUTH_TOKEN}`,
            },
        });

        if (response.ok) {
            categories = await response.json();
        }
    } catch (error) {
        console.error("خطأ في جلب الكاتيجوريات:", error);
    }
}

// إظهار الـ suggestions
function showSuggestions(value) {
    const suggestionsList = document.getElementById("categorySuggestions");
    
    if (!value.trim()) {
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";
        return;
    }

    // تصفية الكاتيجوريات بناءً على ما كتبه المستخدم
    const filtered = categories.filter(item =>
        item.category.includes(value)
    );

    if (filtered.length === 0) {
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";
        return;
    }

    // عرض الـ suggestions
    suggestionsList.innerHTML = filtered
        .map(item => `<div class="suggestion-item">${item.category}</div>`)
        .join("");
    suggestionsList.style.display = "block";

    // إضافة event listeners للـ suggestions
    document.querySelectorAll(".suggestion-item").forEach(item => {
        item.addEventListener("click", () => {
            document.getElementById("category").value = item.textContent;
            suggestionsList.style.display = "none";
        });
    });
}

// توليد SKU فريد من 10 أرقام
function generateSKU() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0");
    const sku = random + timestamp;
    document.getElementById("sku").value = sku;
    return sku;
}

// عند تحميل الصفحة
window.addEventListener("load", () => {
    generateSKU();
    fetchCategories();
});

// Event listener لـ category input
document.getElementById("category").addEventListener("input", (e) => {
    showSuggestions(e.target.value);
});

// إخفاء الـ suggestions عند الضغط خارجها
document.addEventListener("click", (e) => {
    const categoryInput = document.getElementById("category");
    const suggestionsList = document.getElementById("categorySuggestions");
    
    if (e.target !== categoryInput && !e.target.closest("#categorySuggestions")) {
        suggestionsList.style.display = "none";
    }
});

document.getElementById("dataForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
        sku: document.getElementById("sku").value,
        name: document.getElementById("name").value,
        category: document.getElementById("category").value,
        price: parseFloat(document.getElementById("price").value),
        image: document.getElementById("image").value,
    };

    if (
        !formData.sku ||
        !formData.name ||
        !formData.category ||
        !formData.price
    ) {
        showNotification("يرجى ملء جميع الحقول المطلوبة", "error");
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${CONFIG.N8N_URL}/add-product`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${CONFIG.AUTH_TOKEN}`,
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error("فشل إرسال البيانات");
        }

        const result = await response.json();
        showNotification("✅ تم إضافة المنتج بنجاح", "success");
        document.getElementById("dataForm").reset();
        generateSKU();

        setTimeout(() => {
            // window.location.href = "admin.html";
        }, 1500);
    } catch (error) {
        console.error("خطأ:", error);
        showNotification("❌ حدث خطأ في إرسال البيانات", "error");
    } finally {
        showLoading(false);
    }
});

function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
        ${message}
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showLoading(show) {
    const loading = document.getElementById("loading");
    if (show) {
        loading.classList.add("active");
    } else {
        loading.classList.remove("active");
    }
}

function goBack() {
    window.location.href = "admin.html";
}

if (sessionStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "admin.html";
}