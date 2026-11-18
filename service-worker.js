
/* =========================================================
   VELVET DAY - SERVICE WORKER
   ---------------------------------------------------------
   Handles:
   - App shell caching
   - Offline support
   - Cache updates
   - Navigation fallback
   - Notification clicks

   IMPORTANT:
   Service workers require localhost or HTTPS.
   ========================================================= */

// ---------------------------------------------------------
// Cache Version
// ---------------------------------------------------------

const CACHE_NAME = "velvet-day-v1";

// ---------------------------------------------------------
// Files to Cache
// ---------------------------------------------------------

const APP_FILES = [
    "./",
    "./index.html",
    "./manifest.json",

    // CSS
    "./css/style.css",
    "./css/responsive.css",
    "./css/animations.css",

    // Core JavaScript
    "./js/storage.js",
    "./js/utils.js",
    "./js/theme.js",
    "./js/navigation.js",
    "./js/tasks.js",
    "./js/brain-dump.js",
    "./js/notes.js",
    "./js/checklist.js",
    "./js/calendar.js",
    "./js/recurring.js",
    "./js/reminders.js",
    "./js/progress.js",
    "./js/settings.js",
    "./js/search.js",
    "./js/toast.js",
    "./js/pwa.js",
    "./js/init.js"
];

// ---------------------------------------------------------
// INSTALL
// ---------------------------------------------------------

self.addEventListener("install", event => {
    console.log("Velvet Day service worker installing.");

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(APP_FILES);
            })
            .then(() => {
                // Activate the new worker without waiting
                // for the previous worker to disappear.
                return self.skipWaiting();
            })
            .catch(error => {
                console.error(
                    "Velvet Day cache installation failed:",
                    error
                );
            })
    );
});

// ---------------------------------------------------------
// ACTIVATE
// ---------------------------------------------------------

self.addEventListener("activate", event => {
    console.log("Velvet Day service worker activated.");

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Delete old Velvet Day caches.
                        if (
                            cacheName.startsWith("velvet-day-") &&
                            cacheName !== CACHE_NAME
                        ) {
                            return caches.delete(cacheName);
                        }

                        return Promise.resolve(false);
                    })
                );
            })
            .then(() => {
                // Allow the new worker to control open tabs.
                return self.clients.claim();
            })
    );
});

// ---------------------------------------------------------
// FETCH
// ---------------------------------------------------------

self.addEventListener("fetch", event => {
    const request = event.request;

    // Only handle GET requests.
    if (request.method !== "GET") {
        return;
    }

    // Ignore requests to other origins.
    const requestURL = new URL(request.url);

    if (requestURL.origin !== self.location.origin) {
        return;
    }

    // Navigation requests:
    // Try network first so the user can receive updated HTML.
    // Fall back to cached index.html when offline.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    // Cache successful navigation responses.
                    if (response && response.ok) {
                        const responseClone = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(request, responseClone);
                            });
                    }

                    return response;
                })
                .catch(async () => {
                    const cachedPage = await caches.match(request);

                    if (cachedPage) {
                        return cachedPage;
                    }

                    const offlinePage = await caches.match(
                        "./index.html"
                    );

                    if (offlinePage) {
                        return offlinePage;
                    }

                    return new Response(
                        "Velvet Day is currently offline.",
                        {
                            status: 503,
                            headers: {
                                "Content-Type": "text/plain"
                            }
                        }
                    );
                })
        );

        return;
    }

    // Static assets:
    // Cache first, then network.
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then(networkResponse => {
                        if (
                            networkResponse &&
                            networkResponse.ok
                        ) {
                            const responseClone =
                                networkResponse.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(
                                        request,
                                        responseClone
                                    );
                                });
                        }

                        return networkResponse;
                    });
            })
            .catch(() => {
                // Asset could not be loaded while offline.
                return new Response("", {
                    status: 503,
                    statusText: "Offline"
                });
            })
    );
});

// ---------------------------------------------------------
// NOTIFICATION CLICK
// ---------------------------------------------------------

self.addEventListener("notificationclick", event => {
    event.notification.close();

    const targetURL =
        event.notification.data?.url || "./index.html";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true
        })
            .then(windowClients => {
                // If Velvet Day is already open, focus it.
                for (const client of windowClients) {
                    if ("focus" in client) {
                        return client.focus();
                    }
                }

                // Otherwise open a new window.
                if (clients.openWindow) {
                    return clients.openWindow(targetURL);
                }
            })
    );
});

// ---------------------------------------------------------
// NOTIFICATION CLOSE
// ---------------------------------------------------------

self.addEventListener("notificationclose", event => {
    console.log(
        "Velvet Day notification dismissed:",
        event.notification.tag
    );
});
