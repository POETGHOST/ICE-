# ICE

ICE is a chat-app interface with conversations, community posts, updates, and study tools.

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm start
```

Then open [http://localhost:3000](http://localhost:3000).

## Install on a device

The installable web-app shell is available at `/install.html` when served from HTTPS. It includes a web app manifest, a basic service worker for offline caching, and an install button where the browser supports the install prompt. You can also use your browser's **Install app** or **Add to Home Screen** menu. GitHub Pages and most hosted Node services provide HTTPS.

The main app is shown inside the install shell. The service worker caches the app shell and core files for repeat visits; the current chat demo itself saves messages locally in each browser.

## Publish the web preview with GitHub Pages

A GitHub Actions workflow deploys the repository when changes are pushed to `main` and can also be started manually.

1. In the repository, open **Settings → Pages**.
2. Set **Build and deployment → Source** to **GitHub Actions**.
3. Run **Actions → Deploy ICE to GitHub Pages**, or push a commit to `main`.
4. After the workflow succeeds, the app is available at `https://poetghost.github.io/ICE-/install.html`.

## Google Play Store

A web app manifest alone does not publish an app in Google Play. A common route is to package the HTTPS site as an Android Trusted Web Activity (TWA), for example with Bubblewrap, then upload the signed Android App Bundle through a Google Play Console developer account. TWA setup also requires a stable production domain, an Android application ID and signing key, and a Digital Asset Links `assetlinks.json` file served from `/.well-known/` on that domain. Google Play reviews the submission; publication is not automatic.

Before a public release, complete and test the app's account/data, privacy, support, and store-listing requirements. This repository is currently a demo: messages and posts are browser-local, there are no user accounts or database, and the current page does not connect to its Socket.IO server. Installing it does not create shared real-time chat.
