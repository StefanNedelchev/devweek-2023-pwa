const APPLICATION_SERVER_KEY = '<public-key>';
const API_PORT = 8080;
const CLEAR_MESSAGE_DELAY_MS = 5000;
const SW_MESSAGE_NOTIFICATION_CLICKED = 'notification-clicked';
const SW_MESSAGE_SYNC = 'message-sync';
const SYNC_TAG = 'sync-test';

const swInfoEl = document.getElementById('sw_info');
const subInfoEl = document.getElementById('sub_info');
const characterInfoEl = document.getElementById('character_info');
const shareInfoEl = document.getElementById('share_info');
const syncInfoEl = document.getElementById('sync_info');
const installBtn = document.getElementById('install_btn');

let deferredInstallPrompt = null;

function setSwInfo(type, text) {
  swInfoEl.className = `alert ${type}`;
  swInfoEl.textContent = text;
}

function setSubInfo(text) {
  subInfoEl.textContent = text;
}

function setSyncInfo(text) {
  syncInfoEl.textContent = text;
}

function setHidden(el, isHidden) {
  el.hidden = isHidden;
}

function showTransientText(el, text) {
  el.textContent = text;
  setTimeout(() => {
    el.textContent = '';
  }, CLEAR_MESSAGE_DELAY_MS);
}

function handleDeniedNotifications() {
  setSubInfo('🔕 Notifications have been disabled!');
}

function isNotificationDenied() {
  return window.Notification.permission === 'denied';
}

window.addEventListener('load', () => {
  clearBadge();
  initServiceWorker();
  handleSharedData();
  handleInputFiles();
});

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  setHidden(installBtn, false);
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  setHidden(installBtn, true);
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

function handleServiceWorkerMessage(event) {
  const message = event.data?.message;

  switch (message) {
    case SW_MESSAGE_NOTIFICATION_CLICKED:
      showTransientText(subInfoEl, '🖱️ The notification was clicked!');
      break;
    case SW_MESSAGE_SYNC:
      showTransientText(syncInfoEl, '✅ Messages have been synced!');
      break;
    default:
      break;
  }
}

function initServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    setSwInfo('error', '📵 Service Worker is not supported by your browser 🙁');
    return;
  }

  setSwInfo('info', '⚙️ Registering service worker...');

  if (isNotificationDenied()) {
    handleDeniedNotifications();
  }

  navigator.serviceWorker.register('sw.js').then(() => {
    setSwInfo('success', 'Service Worker has been registered successfully 🙂');
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
  });
}

async function requestPermission() {
  if (!('Notification' in window)) {
    throw new Error('Notifications not supported!');
  }

  if (window.Notification.permission === 'default') {
    return window.Notification.requestPermission();
  }

  return window.Notification.permission;
}

async function subscribeToNotifications() {
  const permission = await requestPermission();
  if (permission === 'denied') {
    handleDeniedNotifications();
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const pushSubscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: APPLICATION_SERVER_KEY,
  });

  const response = await fetch(`http://localhost:${API_PORT}/subscribe`, {
    method: 'POST',
    body: JSON.stringify(pushSubscription.toJSON()),
    headers: {
      'content-type': 'application/json',
    },
  });

  const { message } = await response.json();
  setSubInfo(message);
}

async function syncMessagesLater() {
  const registration = await navigator.serviceWorker.ready;

  if (!('sync' in registration)) {
    setSyncInfo('📵 Background Sync API not supported!');
    return;
  }

  const tags = await registration.sync.getTags();
  if (tags.includes(SYNC_TAG)) {
    setSyncInfo('Messages sync already requested');
    return;
  }

  await registration.sync.register(SYNC_TAG);
  setSyncInfo('🔄 Messages sync was registered!');
}

function clearBadge() {
  if ('clearAppBadge' in navigator) {
    navigator.clearAppBadge();
  }
}

function handleSharedData() {
  const searchParams = new URLSearchParams(window.location.search);

  if (searchParams.has('character')) {
    const characterName = searchParams.get('character');
    characterInfoEl.textContent = `Your character is ${characterName}!`;
    setHidden(characterInfoEl, false);
  }

  const hasShareParams =
    searchParams.has('shareTitle') ||
    searchParams.has('shareText') ||
    searchParams.has('shareLink');

  if (!hasShareParams) {
    return;
  }

  const shareInfoBodyEl = shareInfoEl.querySelector('.share-info');
  if (!shareInfoBodyEl) {
    return;
  }

  const shareTitle = searchParams.get('shareTitle') || 'N/A';
  const shareText = searchParams.get('shareText') || 'N/A';
  const shareLink = searchParams.get('shareLink');
  const shareLinkHref = shareLink || '#';
  const shareLinkText = shareLink || 'N/A';

  shareInfoBodyEl.innerHTML = `<dl>
      <dt>Title</dt>
      <dd>${shareTitle}</dd>
      <dt>Text</dt>
      <dd>${shareText}</dd>
      <dt>Link</dt>
      <dd><a href="${shareLinkHref}" target="_blank" rel="nofollow">${shareLinkText}</a></dd>
    </dl>`;
  setHidden(shareInfoEl, false);
}

function createAudioElement(fileUrl) {
  const audioEl = document.createElement('audio');
  audioEl.src = fileUrl;
  audioEl.autoplay = false;
  audioEl.controls = true;
  return audioEl;
}

function createImageElement(fileUrl) {
  const imgEl = document.createElement('img');
  imgEl.src = fileUrl;
  imgEl.className = 'test-img';
  return imgEl;
}

function handleInputFiles() {
  if (!('launchQueue' in window)) {
    return;
  }

  const containerEl = document.querySelector('.container');
  if (!containerEl) {
    return;
  }

  window.launchQueue.setConsumer((launchParams) => {
    if (!launchParams?.files.length) {
      return;
    }

    const [fileHandle] = launchParams.files;
    fileHandle.getFile().then((file) => {
      const fileUrl = URL.createObjectURL(file);

      if (file.type.startsWith('audio/')) {
        const audioEl = createAudioElement(fileUrl);
        containerEl.appendChild(audioEl);
        audioEl.play();
        return;
      }

      if (file.type.startsWith('image/')) {
        const imgEl = createImageElement(fileUrl);
        containerEl.appendChild(imgEl);
      }
    });
  });
}
