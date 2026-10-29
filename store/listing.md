# Chrome Web Store listing (paste into the developer dashboard)

**Name:** LinkWash: Copy Links Without Trackers
**Category:** Tools (Productivity: Tools)
**Language:** English

## Summary (132 chars max; same as the manifest description)
Strips tracking junk (?s=20, si=, utm_, fbclid) from links you copy, share buttons included. Nothing leaves your browser.

## Description
Copy a link, paste a clean link.

Sites now stuff tracking codes into every link you share: ?s=20&t=… on X, ?si=… on YouTube and Spotify, utm_source on newsletters, fbclid on Facebook, a paragraph of ref= junk on Amazon. They tell the site who shared what with whom.

LinkWash removes them the moment you copy:

• Ctrl/Cmd+C on a link
• A site's own "Copy link" or Share button
• Right-click a link → Copy clean link
• Alt+Shift+C copies a clean link to the page you're on

It doesn't just delete everything after the "?". That breaks YouTube, Google and most shop and search pages. LinkWash removes known tracking parameters and keeps the ones the link needs. A link with nothing to remove copies exactly as it was, and a sentence with a link in it is left alone.

Covers X/Twitter, YouTube, Amazon (shortened to /dp/ASIN), Spotify, TikTok, Instagram, Reddit, LinkedIn, Facebook, Google, Bing, eBay, AliExpress, Medium, Substack, plus utm_*, fbclid, gclid, msclkid and 40+ trackers on every site.

Private by design: no network requests, no data collected. Free and open source (MIT): https://github.com/buildleansaas/linkwash

How it works: https://vibehowto.com/projects/linkwash

Free forever. If it saves you some hassle, buy me a beer: https://donate.stripe.com/8x26oJ0iKdq0bLq8QS2VG06

## Privacy tab
**Single purpose:** Remove tracking parameters from links when the user copies them.

**Permission justifications**
- storage: remembers whether LinkWash is turned on and how many links it has cleaned, on this device only.
- contextMenus: adds "Copy clean link" to the right-click menu.
- offscreen: the right-click and keyboard-shortcut copies need a hidden page to write to the clipboard, because the background service worker has no clipboard.
- clipboardWrite: puts the cleaned link on the clipboard when you use the right-click menu, the keyboard shortcut or the popup button.
- activeTab: reads the current tab's address only when you press the shortcut or use the popup, to copy a clean link to that page.
- Host permission (all sites): share buttons and copied links exist on every site. The content script only looks at copied text, only at the moment you copy, and only changes it when it is a single link with tracking parameters.

**Remote code:** No, I am not using remote code.

**Data usage:** Does not collect any user data (check none of the boxes). Certify all three statements.

**Privacy policy URL:** https://vibehowto.com/projects/linkwash/privacy

## Store assets
- Icon 128×128: icons/128.png
- Screenshots 1280×800: store/screenshot-*.png
- Small promo tile 440×280: store/promo-small.png
