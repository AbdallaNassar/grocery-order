const CONFIG = {
    N8N_URL: "https://n8n.abdallav2ray.ggff.net/webhook",
    AUTH_TOKEN: btoa("admin:DashboardSecure2025"),
};

// توليد SKU فريد من 10 أرقام
function generateSKU() {
    // الوقت الحالي بـ milliseconds - آخر 8 أرقام
    const timestamp = Date.now().toString().slice(-8);

    // رقمين عشوائيين إضافيين
    const random = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0");

    // SKU نهائي = 10 أرقام
    const sku =  random +timestamp ;

    document.getElementById("sku").value = sku;
    return sku;
}

// توليد SKU عند تحميل الصفحة
window.addEventListener("load", () => {
    generateSKU();
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

    // التحقق من البيانات
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

        // توليد SKU جديد بعد الإضافة
        generateSKU();

        // رجوع للصفحة الرئيسية بعد ثانية
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

// التحقق من حالة تسجيل الدخول
if (sessionStorage.getItem("isLoggedIn") !== "true") {
    // إذا المستخدم مش مسجل دخول، نحوله إلى صفحة تسجيل الدخول
    window.location.href = "admin.html";
}