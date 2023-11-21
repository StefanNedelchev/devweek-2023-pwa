self.addEventListener('install', () => {
  console.log('Service worker is installing...');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service worker has been activated!');
});

self.addEventListener('fetch', () => {
});

async function matchClient(urlToOpen) {
  const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  return windowClients.find((windowClient) => windowClient.url.startsWith(urlToOpen));
}

async function focusOrOpenWindow() {
  const urlToOpen = self.location.origin;
  const matchingClient = await matchClient(urlToOpen);
  // Focus on opened window/tab or open new one
  return matchingClient
    ? matchingClient.focus()
    : clients.openWindow(urlToOpen);
}

self.addEventListener('push', (event) => {
  const pushData = event.data.json();
  event.waitUntil(
    self.registration.showNotification(
      pushData.title, 
      {
        body: pushData.body,
        icon: pushData.icon,
        tag: 'web-push',
        data: pushData,
      }
    ).then(() => {
      if ('setAppBadge' in navigator) {
        navigator.setAppBadge(1);
      }
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  // Close the notification popup
  e.notification.close();
  // Get all the Window clients
  e.waitUntil(
    focusOrOpenWindow().then((windowClient) => {
      // Notify the client about the notification click with a message
      windowClient.postMessage({ message: 'notification-clicked' })
    }),
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-test') {
    event.waitUntil(
      matchClient(self.location.origin).then(async (windowClient) => {
        if ('setAppBadge' in navigator) {
          navigator.setAppBadge(1);
        }

        windowClient?.postMessage({ message: 'message-sync' });
        if (Notification.permission === 'granted') {
          await self.registration.showNotification(
            'Welcome back!',
            { body: 'Your content is available now!' }
          );
        }
      })
    );
  }
});
