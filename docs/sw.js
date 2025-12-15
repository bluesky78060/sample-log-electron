// Service Worker for 시료 접수 대장 웹 앱
const CACHE_NAME = 'sample-log-v1';

// 캐시할 파일 목록
const urlsToCache = [
  './',
  './index.html',
  './index.css',
  './style.css',
  './bonghwaData.js',
  './cropData.js',
  './shared/file-api.js',
  './shared/toast.js',
  './shared/pagination.js',
  './shared/address.js',
  './soil/index.html',
  './soil/soil-script.js',
  './soil/soil-style.css',
  './water/index.html',
  './water/water-script.js',
  './water/water-style.css',
  './pesticide/index.html',
  './pesticide/pesticide-script.js',
  './pesticide/pesticide-style.css',
  './compost/index.html',
  './compost/compost-script.js',
  './compost/compost-style.css',
  './heavy-metal/index.html',
  './heavy-metal/heavy-metal-script.js',
  './heavy-metal/heavy-metal-style.css',
  './label-print/index.html',
  './label-print/label-app.js',
  './label-print/label-print.css'
];

// 설치 이벤트 - 파일 캐싱
self.addEventListener('install', event => {
  console.log('[SW] 설치 중...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] 파일 캐싱 중...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[SW] 설치 완료');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('[SW] 캐싱 실패:', err);
      })
  );
});

// 활성화 이벤트 - 이전 캐시 정리
self.addEventListener('activate', event => {
  console.log('[SW] 활성화 중...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => {
              console.log('[SW] 이전 캐시 삭제:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] 활성화 완료');
        return self.clients.claim();
      })
  );
});

// fetch 이벤트 - 캐시 우선, 네트워크 폴백
self.addEventListener('fetch', event => {
  // 외부 리소스는 네트워크 우선
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // 캐시에서 반환하면서 백그라운드에서 업데이트
          event.waitUntil(
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, networkResponse));
                }
              })
              .catch(() => {})
          );
          return cachedResponse;
        }

        // 캐시에 없으면 네트워크 요청
        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, responseToCache));

            return response;
          })
          .catch(() => {
            // 오프라인이고 캐시도 없으면 오프라인 페이지 반환 가능
            // 현재는 기본 동작 유지
          });
      })
  );
});
