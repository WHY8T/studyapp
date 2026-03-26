self.addEventListener("push", (event) => {
    const data = event.data?.json() ?? {};
    const title = data.title || "Nahda";
    const options = {
        body: data.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        vibrate: [200, 100, 200],
        data: data.url ? { url: data.url } : {},
        actions: data.actions || [],
    };

    // Play sound via a client message
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((clients) => {
            clients.forEach((client) => client.postMessage({ type: "PUSH_SOUND" }));
        }).then(() => self.registration.showNotification(title, options))
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = event.notification.data?.url || "/friends";
    event.waitUntil(
        self.clients.matchAll({ type: "window" }).then((clients) => {
            const existing = clients.find((c) => c.url.includes(url) && "focus" in c);
            if (existing) return existing.focus();
            return self.clients.openWindow(url);
        })
    );
});