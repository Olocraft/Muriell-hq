
self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200, 100, 200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'complete', title: 'Complete Protocol' },
      { action: 'snooze', title: 'Snooze' }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'complete') {
    // Handle completion
    clients.openWindow('/');
  } else {
    // Default click
    clients.openWindow('/');
  }
});
