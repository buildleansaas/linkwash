# LinkWash

A Chrome extension that removes tracking junk from links when you copy them.

You copy `https://x.com/someone/status/2115497330082504960?a=jTJ6AphNO7lStihknsk&s=20`.
You paste `https://x.com/someone/status/2115497330082504960`.

It works when you:

- press Ctrl/Cmd+C on a selected link
- click a site's own "Copy link" or share button
- right-click a link and pick **Copy clean link**
- press **Alt+Shift+C** (or use the toolbar popup) to copy a clean link to the page you're on

The on/off switch controls the automatic cleaning (the first two). **Copy clean link** and Alt+Shift+C always clean, because that's what you asked for.

Copying from the address bar can't be changed by any extension, which is why the shortcut exists.

## What it removes

Not "everything after the `?`". That breaks YouTube (`?v=`), Google (`?q=`) and most search and shop pages. LinkWash removes known tracking parameters and keeps the rest:

- everywhere: `utm_*`, `fbclid`, `gclid`, `msclkid`, `igsh`, `mc_eid`, `_hsenc`, `ref_src` and about 40 more
- X / Twitter post links: the whole query (`s`, `t`, `a`)
- YouTube: `si`, `feature`, `pp`, `ab_channel` and other share codes (keeps `v`, `t`, `list`, `lc` and the rest)
- Amazon product pages: shortened to `amazon.com/dp/ASIN`
- Spotify, TikTok, Instagram, Reddit, LinkedIn, Facebook, Google, Bing, eBay, AliExpress, Medium, Substack: their share and tracking params

The full list is in [`src/clean.js`](src/clean.js). A link with nothing to remove is copied exactly as it was. Text that isn't a single link (a sentence with a link in it) is never touched.

## Privacy

LinkWash makes no network requests. Links are cleaned on your computer and nothing is collected, stored remotely or sent anywhere. It stores two things in Chrome's local storage: whether it's on, and how many links it has cleaned. See [PRIVACY.md](PRIVACY.md).

## Install from source

1. Download or clone this repo.
2. Open `chrome://extensions` and turn on **Developer mode**.
3. Click **Load unpacked** and pick this folder.

## Develop

```sh
npm install
npm test            # cleaning rules (node:test)
npm run test:e2e    # loads the extension in Chromium and checks the clipboard
npm run zip         # dist/linkwash-<version>.zip for the Chrome Web Store
```

Found a link it should clean but doesn't? [Open an issue](https://github.com/buildleansaas/linkwash/issues) with the link (remove anything personal first).

## Buy me a beer

LinkWash is free and stays free. If it saved you some hassle: [🍺 buy me a beer](https://donate.stripe.com/8x26oJ0iKdq0bLq8QS2VG06).

MIT licensed. Built by [Build Lean SaaS](https://vibehowto.com/projects/linkwash).
