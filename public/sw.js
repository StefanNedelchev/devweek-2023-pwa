self.addEventListener('install', () => {
  console.log('Service worker is installing...');
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  console.log('Service worker has been activated!');
});

self.addEventListener('fetch', () => {
});

self.addEventListener('push', onPush);
self.addEventListener('notificationclick', onNotificationClick);
self.addEventListener('sync', onSync);

async function matchClient(urlToOpen) {
  const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
  return windowClients.find((windowClient) => windowClient.url.startsWith(urlToOpen));
}

async function focusOrOpenWindow() {
  const urlToOpen = self.location.origin;
  const matchingClient = await matchClient(urlToOpen);
  // Focus on opened window/tab or open new one
  return matchingClient?.focus() ?? clients.openWindow(urlToOpen);
}

function onPush(event) {
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
      // Set a badge to indicate that there is unread element
      if ('setAppBadge' in navigator) {
        navigator.setAppBadge(1);
      }
    }),
  );
}

function onNotificationClick(event) {
  // Close the notification popup
  event.notification.close();
  event.waitUntil(
    focusOrOpenWindow().then((windowClient) => {
      // Clear the app badge
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge();
      }
      // Notify the client about the notification click with a message
      windowClient.postMessage({ message: 'notification-clicked' })
    }),
  );
}

function onSync(event) {
  if (event.tag === 'sync-test') {
    event.waitUntil(
      matchClient(self.location.origin).then(async (windowClient) => {
        windowClient?.postMessage({ message: 'message-sync' });

        // If the user has already allowed notifications, show one to notify them
        if (Notification.permission === 'granted') {
          await self.registration.showNotification(
            'Welcome back!',
            { body: 'Your content is available now!' }
          );

          if ('setAppBadge' in navigator) {
            navigator.setAppBadge(1);
          }
        }
      })
    );
  }
}
