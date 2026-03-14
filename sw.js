// 캐시 사용 안 함 - 항상 최신 파일 로드
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
