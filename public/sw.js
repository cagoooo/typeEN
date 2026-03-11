// ⚠️ 版本號每次部署自動由 inject.py 或手動更新
// 改用 Network First 策略：確保每次都能取得最新 JS/CSS
const CACHE_VERSION = 'typeen-neon-v1.0.13';
const CACHE_NAME = CACHE_VERSION;

// 靜態資產（字體、圖示等）才快取
const STATIC_ASSETS = [
    './manifest.json',
    './favicon.png',
    './neon-icon-192.png',
    './neon-icon-512.png',
];

self.addEventListener('install', (event) => {
    // 立刻跳過等待，強制新 SW 取代舊的
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS.filter(async (url) => {
                // 只快取實際存在的靜態資源
                try {
                    const resp = await fetch(url, { method: 'HEAD' });
                    return resp.ok;
                } catch {
                    return false;
                }
            }));
        }).catch(() => {
            // 若靜態資源快取失敗也不影響 SW 安裝
        })
    );
});

self.addEventListener('activate', (event) => {
    // 立刻接管所有頁面
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // 清除所有舊版快取
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            console.log('[SW] 清除舊快取：', key);
                            return caches.delete(key);
                        }
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 只處理 http/https 請求，略過 chrome-extension:// 等不支援 Cache API 的協議
    if (!url.protocol.startsWith('http')) return;

    // 略過 Vite 開發工具、Firebase API、非 GET 請求
    if (
        url.pathname.includes('/@vite/') ||
        url.pathname.includes('/@react-refresh') ||
        url.pathname.includes('node_modules') ||
        url.host.includes('firebaseio.com') ||
        url.host.includes('googleapis.com') ||
        url.host.includes('firestore.googleapis.com') ||
        url.host.includes('identitytoolkit.googleapis.com') ||
        event.request.method !== 'GET'
    ) {
        return;
    }

    // JS / CSS / HTML：Network First（永遠先取最新版本）
    if (
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.html') ||
        url.pathname === '/' ||
        url.pathname.endsWith('/typeEN/')
    ) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 成功取得新版本，不快取（確保每次都是最新）
                    return response;
                })
                .catch(() => {
                    // 網路失敗才用快取（離線回退）
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 靜態資產（圖示、音效）：Cache First
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                if (response && response.status === 200) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});

// === Web Push Notifications ===
self.addEventListener('push', (event) => {
    let pushData = {
        title: '霓虹打字員',
        body: '您有一條新通知！',
        icon: './neon-icon-192.png'
    };

    if (event.data) {
        try {
            const data = event.data.json();
            pushData = { ...pushData, ...data };
        } catch (e) {
            pushData.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(pushData.title, {
            body: pushData.body,
            icon: pushData.icon,
            badge: './neon-icon-192.png',
            vibrate: [200, 100, 200],
            data: { url: '/' }
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('./');
        })
    );
});
