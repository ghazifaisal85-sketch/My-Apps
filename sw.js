
const CACHE_NAME = 'almomin-net-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap'
];

// تثبيت التطبيق وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// تنظيف النسخ القديمة عند التحديث
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// استراتيجية الاستجابة: البحث في الكاش أولاً، ثم الشبكة
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // تحديث الكاش بالملفات الجديدة المستلمة من الشبكة
        if (event.request.url.startsWith('http')) {
           return caches.open(CACHE_NAME).then((cache) => {
             cache.put(event.request, networkResponse.clone());
             return networkResponse;
           });
        }
        return networkResponse;
      });
    }).catch(() => {
      // إذا فشل كل شيء (أوفلاين تماماً لصفحة غير مخزنة)
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});
