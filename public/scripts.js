const applicationServerKey = '<public-key>';
const apiPort = 8080;
const swInfoEl = document.getElementById('sw_info');
const subInfoEl = document.getElementById('sub_info');
const characterInfoEl = document.getElementById('character_info');
const shareInfoEl = document.getElementById('share_info');
const syncinfoEl = document.getElementById('sync_info');
const installBtn = document.getElementById('install_btn');

let deferredInstallPrompt = null

window.addEventListener('load', () => {
  clearBadge();
  initializeServiceWorker();
  handleSharedData();
  handleInputFiles();
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installBtn.removeAttribute('hidden');
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installBtn.hidden = true;
});

async function install() {
  if (!deferredInstallPrompt) {
    return;
  }

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;

  if (outcome === 'accepted') {
    deferredInstallPrompt = null;
  }
}

function initializeServiceWorker() {
  if (!('serviceWorker' in window.navigator)) {
    swInfoEl.className = 'alert error';
    swInfoEl.textContent = 'Servie Worker is not supported by your browser 🙁';
    return;
  }

  swInfoEl.className = 'alert info';
  swInfoEl.textContent = 'Registering service worker...';

  // Check if the notifications are denied by the user and update the UI
  if (window.Notification.permission === 'denied') {
    subInfoEl.textContent = '❌ Notifications have been disabled!';
  }

  window.navigator.serviceWorker.register('sw.js').then(() => {
    swInfoEl.className = 'alert success';
    swInfoEl.textContent = 'Service Worker has been registered successfully 🙂';

    navigator.serviceWorker.addEventListener('message', (event) => {
      switch (event.data.message) {
        case 'notification-clicked':
          // listen for notification click messages from the service worker and update the UI
          subInfoEl.textContent = '🖱️ The notification was clicked! 🖱️';
          setTimeout(() => { subInfoEl.textContent = ''; }, 5000);
          break;
        case 'message-sync':
          // Listen for messages from background sync and update the UI
          syncinfoEl.textContent = '✔️ Messages have been synced!';
          setTimeout(() => { syncinfoEl.textContent = '' }, 5000);
          break;
      }
    });
  });
}

async function requestPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported!');;
  }

  return window.Notification.permission === 'default'
    ? window.Notification.requestPermission()
    : window.Notification.permission;
}

async function subscribeToNotifications() {
  if ((await requestPermission()) === 'denied') {
    subInfoEl.textContent = '❌ Notifications have been disabled!';
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const pushSubscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  const response = await fetch(`http://localhost:${apiPort}/subscribe`, {
    method: 'POST',
    body: JSON.stringify(pushSubscription),
    headers: {
      'content-type': 'application/json',
    },
  });
  subInfoEl.textContent = (await response.json()).message;
}

async function syncMessagesLater() {
  // await ensurePermission();
  const registration = await navigator.serviceWorker.ready;

  if (!('sync' in registration)) {
    syncinfoEl.textContent = '❌ Background Sync API not supported!';
    return;
  }

  const tags = await registration.sync.getTags();

  if (tags.includes('sync-test')) {
    syncinfoEl.textContent = 'Messages sync already requested';
    return;
  }

  await registration.sync.register('sync-test');
  syncinfoEl.textContent = '🔄 Messages sync was registered!';
}

function clearBadge() {
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge();
  }
}

function handleSharedData() {
  const currentLocation = new URL(location.href);

  if (currentLocation.searchParams.has('character')) {
    // The app has been opened from the pre-defined shortcuts
    const characterName = currentLocation.searchParams.get('character');
    characterInfoEl.textContent = `Your character is ${characterName}!`;
    characterInfoEl.removeAttribute('hidden')
  }

  if (
    currentLocation.searchParams.has('shareTitle')
    || currentLocation.searchParams.has('shareText')
    || currentLocation.searchParams.has('shareLink')
  ) {
    // The app has been open as a share target
    shareInfoEl.querySelector('.share-info').innerHTML = `<dl>
      <dt>Title</dt>
      <dd>${currentLocation.searchParams.get('shareTitle') || 'N/A'}</dd>
      <dt>Text</dt>
      <dd>${currentLocation.searchParams.get('shareText') || 'N/A'}</dd>
      <dt>Link</dt>
      <dd><a href="${currentLocation.searchParams.get('shareLink') || '#'}" target="_blank" rel="nofollow">
        ${currentLocation.searchParams.get('shareLink') || 'N/A'}
      </a></dd>
    </dl>`;
    shareInfoEl.removeAttribute('hidden');
  }
}

function handleInputFiles() {
  if ('launchQueue' in window) {
    window.launchQueue.setConsumer((launchParams) => {
      if (launchParams?.files.length) {
        const fileHandle = launchParams.files[0];
        fileHandle.getFile().then((file) => {
          const fileUrl = URL.createObjectURL(file);

          if (file.type.startsWith('audio/')) {
            const audioEl = document.createElement('audio');
            audioEl.src = fileUrl;
            audioEl.autoplay = false;
            audioEl.controls = true;
            document.querySelector('.container').appendChild(audioEl);
            audioEl.play();
          } else if (file.type.startsWith('image/')) {
            const imgEl = document.createElement('img');
            imgEl.src = fileUrl;
            imgEl.className = 'test-img';
            document.querySelector('.container').appendChild(imgEl);
          }
        });
      }
    })
  }
}
