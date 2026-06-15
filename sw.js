// ===== لافيت - Service Worker (نسخة مطورة) =====
var CACHE = 'lafitte-v1';
// قمنا بإضافة الملفات الأساسية بشكل صريح لضمان تخزين الواجهة الرئيسية بنجاح
var URLS = [
  './',
  'index.html'
];

// 1. مرحلة التثبيت: تخزين الملفات الأساسية فوراً
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c) { 
        return c.addAll(URLS); 
      })
      .then(function() {
        return self.skipWaiting();
      })
  );
});

// 2. مرحلة التفعيل: تنظيف الكاش القديم لتجنب تعارض الملفات
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.map(function(n) { 
          if (n !== CACHE) return caches.delete(n); 
        })
      );
    }).then(function() { 
      return self.clients.claim(); 
    })
  );
});

// 3. مرحلة جلب البيانات (Fetch): التعامل الذكي مع الإنترنت وجوجل
self.addEventListener('fetch', function(e) {
  // استثناء روابط جوجل سكريبت تماماً من عمليات الكاش لضمان الأمان وعمل الـ API
  if (e.request.url.includes('script.google')) {
    return; // اترك المتصفح يتعامل مع الطلب بشكل طبيعي بدون تدخل
  }

  // استراتيجية: حاول جلب الملف من الإنترنت أولاً، إذا نجحت خزن نسخة احتياطية
  e.respondWith(
    fetch(e.request).then(function(r) {
      // التأكد من أن الاستجابة صالحة قبل تخزينها (تجنب تخزين أخطاء السيرفر)
      if (r.status === 200) {
        var clone = r.clone();
        caches.open(CACHE).then(function(c) { 
          c.put(e.request, clone); 
        });
      }
      return r;
    }).catch(function() {
      // في حال انقطاع الإنترنت: ابحث عن الملف في الكاش
      return caches.match(e.request).then(function(m) {
        // إذا وجد الملف في الكاش أرجعه، وإذا لم يجد (مثل طلب خارجي)، ارجع الصفحة الرئيسية لتظهر شاشة الأوفلاين الخاصة بك
        return m || caches.match('index.html') || caches.match('./');
      });
    })
  );
});
