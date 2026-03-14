// 해들녘 TAROT - Service Worker
// 버전 바꾸면 캐시 갱신됨
const CACHE_NAME = 'haedulnyeok-tarot-v1';

// 오프라인에서도 보여줄 파일 목록
const CACHE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
  // 구글 폰트는 네트워크 우선, 실패하면 캐시에서
];

// ── 설치: 핵심 파일 미리 캐시 ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// ── 활성화: 구버전 캐시 삭제 ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ── 요청 처리: 네트워크 우선, 실패 시 캐시 ──
self.addEventListener('fetch', (event) => {
  // Firebase / 외부 API 요청은 캐시 안 함
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('gstatic.com') ||
    event.request.url.includes('kakao')
  ) {
    return; // 그냥 네트워크로
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 성공하면 캐시에도 저장 (GET 요청만)
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 → 캐시에서 찾기
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // 캐시도 없으면 index.html 반환 (오프라인 폴백)
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
