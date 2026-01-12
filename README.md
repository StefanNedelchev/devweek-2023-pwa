# PWA DevWeek Example 🚀

A minimal Progressive Web App (PWA) demo that combines:
- Web Push notifications 🔔
- Background Sync for queued actions 🔄
- App shortcuts ⚡
- Share target handling 🤝
- File handling through the web manifest 📁

## Project structure 🗂️

The project consists of a small Node.js server that uses [Express](https://expressjs.com/) to expose a few API endpoints and serve the front-end web page.

### Back-end 🔧

The back-end lives in `/api` and uses three main libraries:
- [Express](https://expressjs.com/) for the API and static file hosting
- [web-push](https://github.com/web-push-libs/web-push) for sending notifications
- [SQLite3 for Node](https://github.com/TryGhost/node-sqlite3) for storing subscriptions

File structure:
- `app.js` - bootstraps the server and registers routes
- `db.js` - encapsulates the SQLite database operations
- `webPush.js` - encapsulates the web push logic

### Front-end 🎨

The front-end is a simple static page in `/public`. It does not use any frameworks or third-party libraries.

File structure:
- `index.html` - entry point with the UI and action buttons
- `styles.css` - styles for the demo UI
- `scripts.js` - client-side logic for subscribing, syncing, and handling share/file data
- `sw.js` - service worker that handles push notifications and background sync
- `manifest.webmanifest` - PWA manifest with shortcuts, share target, and file handlers
- `/assets` - icons and splash assets

## Installation and usage ⚙️

### Prerequisites ✅

- Node.js v22 or higher with npm

### Project setup 🛠️

1. Install dependencies:
   ```shell
   npm install
   ```
2. Create or update `.env` in the root directory and copy values from `.env.example`.
   - `PORT` is optional and defaults to `8080`.
   - Generate VAPID keys with:
     ```shell
     npm run vapid-keys
     ```
   - Set `VAPID_PRIVATE_KEY` and `VAPID_PUBLIC_KEY` in `.env`.
3. Update the client configuration in `public/scripts.js`:
   - Replace the `<public-key>` placeholder in `applicationServerKey` with your VAPID public key.
   - If you changed `PORT`, update `apiPort` to match.
4. Start the server:
   ```shell
   npm start
   ```

You should see:

```shell
Server is running on http://localhost:8080.
```

Open this URL in your browser and you should see the following page:

![image](https://github.com/StefanNedelchev/devweek-2023-pwa/assets/15238282/9b47a48f-b5e4-45fa-833b-d497a12c68e7)

Note: Service workers, push notifications, and related APIs require a secure context (HTTPS). `localhost` is treated as secure for development.

To subscribe for push notifications, click the button and allow notifications in the browser.

![image](https://github.com/StefanNedelchev/pwa-push-example/assets/15238282/526ec4ae-bad8-4f30-9f42-ecf04da6a633)

### Pushing a notification 📣

To push a notification, send a POST request to the `/send-message` endpoint. The `test-push.http` file in the root directory contains an example request you can run with Postman or the [REST Client extension for VSCode](https://marketplace.visualstudio.com/items?itemName=humao.rest-client). Update the port and JSON body as needed. After sending a request, all subscribers should receive a push notification.

### Requesting a background sync 🔄

Click the "Sync Test" button. If you are offline, the sync is queued and runs once you go back online.

### Handling files 📁

The web manifest defines file handlers for common image and audio formats. After installing the PWA, use your OS "Open with" dialog to open an image or audio file with the app.

### Handling shared data 🤝

The web manifest defines a share target handler. After installing the PWA, use your OS share dialog to share text or a URL to the app and it will display the shared data.

### App shortcuts ⚡

The web manifest defines app shortcuts that open the app with a character query string. After installing the PWA, use the app icon context menu and choose a shortcut to see the character label update.

## API endpoints 🔌

- `POST /subscribe` stores a PushSubscription in the local SQLite database.
- `POST /send-message` sends a push notification to all stored subscriptions.

## Further reading 📚

- https://web.dev/push-notifications-overview/
- https://web.dev/patterns/web-apps/periodic-background-sync
- https://developer.mozilla.org/en-US/docs/Web/Manifest/shortcuts
- https://developer.mozilla.org/en-US/docs/Web/Manifest/share_target
- https://developer.mozilla.org/en-US/docs/Web/Manifest/file_handlers
