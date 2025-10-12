// ملف جديد: js/location.js
// دوال التعامل مع GPS والموقع

let currentLocation = null;
let locationAccuracy = null;
let isLocationVerified = false;

// 📍 طلب إذن الوصول للموقع من المستخدم
async function requestLocationPermission() {
  try {
    if (!navigator.geolocation) {
      throw new Error('المتصفح لا يدعم GPS');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
          
          currentLocation = {
            latitude: parseFloat(latitude.toFixed(8)),
            longitude: parseFloat(longitude.toFixed(8)),
            accuracy: Math.round(accuracy),
            altitude: altitude ? Math.round(altitude) : null,
            altitudeAccuracy: altitudeAccuracy ? Math.round(altitudeAccuracy) : null,
            heading: heading ? Math.round(heading) : null,
            speed: speed ? Math.round(speed * 3.6) : null, // تحويل من m/s إلى km/h
            timestamp: new Date().toISOString(),
            address: null
          };
          
          locationAccuracy = Math.round(accuracy);
          
          console.log('✅ تم الحصول على الموقع الكامل:', currentLocation);
          resolve(currentLocation);
        },
        (error) => {
          console.error('❌ خطأ في الحصول على الموقع:', error);
          
          let errorMsg = 'حدث خطأ في الوصول للموقع';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'تم رفض إذن الوصول للموقع. يرجى السماح بالوصول من إعدادات المتصفح';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'لا يمكن تحديد الموقع حالياً';
              break;
            case error.TIMEOUT:
              errorMsg = 'انتهت مهلة البحث عن الموقع';
              break;
          }
          
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0
        }
      );
    });
  } catch (error) {
    console.error('❌ خطأ في طلب الموقع:', error);
    throw error;
  }
}

// 🗺️ محاولة الحصول على اسم العنوان من الموقع
async function getAddressFromCoordinates(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'ar' }
      }
    );
    
    if (!response.ok) throw new Error('فشل الحصول على العنوان');
    
    const data = await response.json();
    const address = data.address;
    
    const parts = [
      address.road || address.street,
      address.neighbourhood || address.suburb,
      address.city || address.town,
      address.county
    ].filter(Boolean);
    
    return parts.join(', ') || `خط عرض: ${lat}, خط طول: ${lng}`;
  } catch (error) {
    console.warn('⚠️ لا يمكن الحصول على اسم العنوان:', error);
    return `خط عرض: ${lat.toFixed(6)}, خط طول: ${lng.toFixed(6)}`;
  }
}

// ⚠️ عرض تحذير العنوان
function showAddressWarning(addressInput) {
  // حذف التحذير القديم إن وجد
  const oldWarning = document.querySelector('.address-warning');
  if (oldWarning) {
    oldWarning.remove();
  }

  const warning = document.createElement('div');
  warning.className = 'address-warning';
  warning.style.cssText = `
    background: #fff3cd;
    border: 2px solid #ffc107;
    border-radius: 6px;
    padding: 12px;
    margin-bottom: 8px;
    text-align: right;
    color: #856404;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: slideIn 0.3s ease;
  `;
  warning.innerHTML = `
    <span style="font-size: 20px;">⚠️</span>
    <span>
      <strong>تحذير:</strong> تأكد من أن العنوان صحيح قبل إرسال الطلب
    </span>
  `;
  
  addressInput.parentNode.insertBefore(warning, addressInput.nextSibling);
  
  // إضافة animation
  const style = document.createElement('style');
  if (!document.getElementById('address-warning-style')) {
    style.id = 'address-warning-style';
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// ⚠️ عرض تحذير العنوان - الدالة القديمة (للحفاظ على compatibility)
function addAddressWarning() {
  const addressInput = document.querySelector('input[name="address"]');
  if (!addressInput) return;

  addressInput.addEventListener('change', () => {
    const gpsData = addressInput.dataset.gpsLocation;
    
    if (gpsData && isLocationVerified) {
      showAddressWarning(addressInput);
    }
  });
}

// 🎯 عرض زر طلب الموقع
function addLocationButton() {
  const checkoutForm = document.getElementById('checkoutForm');
  if (!checkoutForm) return;
  
  const addressInput = checkoutForm.querySelector('input[name="address"]');
  if (!addressInput) return;
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
    align-items: center;
    margin-bottom: 1rem;
  `;
  
  const locationBtn = document.createElement('button');
  locationBtn.type = 'button';
  locationBtn.className = 'location-btn';
  locationBtn.textContent = '📍 استخدم موقعك الحالي';
  locationBtn.style.cssText = `
    flex: 1;
    padding: 12px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.3s ease;
    font-family: inherit;
  `;
  
  locationBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const originalText = locationBtn.textContent;
    locationBtn.textContent = '⏳ جاري تحديد الموقع...';
    locationBtn.disabled = true;
    isLocationVerified = false;
    
    try {
      const location = await requestLocationPermission();
      
      locationBtn.textContent = '⏳ جاري الحصول على اسم العنوان...';
      
      const addressName = await getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );
      
      addressInput.value = addressName;
      
      // 🔑 حفظ البيانات الكاملة كـ JSON
      const fullLocationData = {
        type: "Point",
        coordinates: [location.longitude, location.latitude],
        accuracy_meters: location.accuracy,
        altitude_meters: location.altitude,
        altitude_accuracy_meters: location.altitudeAccuracy,
        heading_degrees: location.heading,
        speed_kmh: location.speed,
        timestamp: location.timestamp,
        address: addressName,
        device_info: {
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      addressInput.dataset.gpsLocation = JSON.stringify(fullLocationData);
      isLocationVerified = true;
      
      // إظهار التحذير فوراً
      showAddressWarning(addressInput);
      
      locationBtn.textContent = `✅ تم تحديد الموقع (دقة: ±${location.accuracy}م)`;
      locationBtn.style.background = 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)';
      
      showNotification(`✅ تم تحديد موقعك بدقة ±${location.accuracy} متر`);
      
      setTimeout(() => {
        locationBtn.textContent = originalText;
        locationBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        locationBtn.disabled = false;
      }, 3000);
      
    } catch (error) {
      locationBtn.textContent = originalText;
      locationBtn.style.background = 'linear-gradient(135deg, #f44336 0%, #e53935 100%)';
      locationBtn.disabled = false;
      isLocationVerified = false;
      
      setTimeout(() => {
        locationBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }, 3000);
      
      alert('❌ ' + error.message);
    }
  });
  
  addressInput.parentNode.insertBefore(buttonContainer, addressInput);
  buttonContainer.appendChild(locationBtn);
}

window.addEventListener('load', () => {
  setTimeout(addLocationButton, 500);
});

