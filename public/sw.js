const CACHE_NAME = 'typeen-neon-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './vite.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Ignore Vite development server requests / external CDNs (like Google Fonts)
    const url = new URL(event.request.url);
    if (
        url.pathname.includes('/@vite/') ||
        url.pathname.includes('/@react-refresh') ||
        url.pathname.includes('node_modules') ||
        url.host !== location.host
    ) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// === Web Push Notifications ===
self.addEventListener('push', (event) => {
    let pushData = {
        title: '霓虹打字員',
        body: '您有一條新通知！',
        icon: '/neon-icon-192.png'
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
            badge: '/neon-icon-192.png',
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
            return clients.openWindow('/');
        })
    );
});
