# WhatsApp Privacy Blur

A Chrome extension that blurs WhatsApp Web. Hover anything to read it. Toggle categories on or off from the popup. Nothing leaves your browser.

Built for the person who shares their screen in meetings, works in public, or just doesn't want their chat history visible to whoever walks past.

[<img width="1891" height="897" alt="image" src="https://github.com/user-attachments/assets/8c9681fd-ff09-4537-8c25-b1ea16de382d" />
](https://syeddtaha.github.io/whatsapp-web-privacy-blur/)

---

## What it blurs

### Chat Messages
Every message bubble in the open conversation is blurred — incoming and outgoing. This targets the whole bubble row rather than the inner text node, which matters because WhatsApp's layout clips anything blurred at the span level. Hover the bubble to read it.

### Chat List Previews
The last message snippet shown under each contact name in the sidebar. If someone texts you something you'd rather not flash on screen, this hides it until you choose to look.

### Media Thumbnails
Images, videos, stickers, audio players, document previews, and link thumbnails inside chat bubbles — blurred separately from text. You can have messages visible but media still hidden, or vice versa.

### Media Gallery
The full-screen media viewer and lightbox. When you click a photo to expand it, it opens blurred. Hover to see it.

### Message Input
What you type in the compose box is blurred at rest. The field reveals automatically when you click into it or hover over it, so you can type normally. The blur returns when focus leaves.

### Contact and Group Names
Contact names in the sidebar list, the open chat header, group member names inside messages, and name fields in the contact/group info drawer. Uses `span[title]` attributes as the selector anchor — these have been stable in WhatsApp Web's DOM for years.

### Profile Pictures
Avatars in the sidebar, the open chat header, and inside message threads. The extension scans for small square images (roughly 28–82px) and tags their clip containers too, so the blur covers the full circle rather than leaking outside it.

---

## Reveal behaviour

### Per-item hover (default)
Move your mouse over any blurred element to reveal it. Move away and it blurs again. Everything else on the page stays blurred. This is the default mode.

### Instant Reveal
By default the blur fades in and out over 180ms. Turn on Instant Reveal to remove the transition entirely — the unblur is immediate on hover, which feels snappier if the animation bothers you.

### Hover App to Reveal All
When this is on, moving your mouse anywhere over the WhatsApp Web tab unblurs everything at once. Useful when you want to read normally for a bit without hovering item by item. Move your mouse off the browser window and everything blurs again.

---

## The popup

<img width="250" alt="image" src="https://github.com/user-attachments/assets/1538b5af-0509-4e2e-af59-ff7bf540f332" />

One master toggle at the top to turn the whole extension on or off. Below it, two sections:

**Blur Targets** — seven individual toggles, one per category. Turn off the things you don't need. Settings are saved to `chrome.storage.sync` so they persist across sessions and sync across Chrome profiles.

**Reveal Behaviour** — Instant Reveal and Hover App to Reveal All as separate toggles.

The status line at the bottom updates to show how many blur categories are active and which reveal mode is running.

---

## How it works

The extension injects a `<style>` tag into WhatsApp Web's `<head>` and rebuilds it whenever settings change. No per-element style attribute manipulation — everything runs through CSS classes.

**Message blur specifically:** Early versions tried to blur inner `<span>` text nodes. That doesn't work. WhatsApp's parent divs use `overflow: hidden`, which clips the blur glow at the container edge, making it look like nothing happened. The fix is blurring the entire `.message-in` / `.message-out` row elements. Those class names aren't obfuscated — WhatsApp has kept them stable and they're used by every WA automation library.

**Avatar blur:** Avatars use blob URLs that would match too broadly with a simple `img[src^="blob:"]` selector. Instead a `MutationObserver` runs a lightweight scan after each DOM change, tags small square images with `.wpb-av`, and CSS targets that class. The scan is debounced to 200ms so it doesn't hammer performance as messages stream in.

**Style self-healing:** A second `MutationObserver` watches `<head>`. If WhatsApp's own rendering removes the injected style tag, it gets re-injected immediately.

**Selectors used:** `data-testid` attributes where they exist (WA keeps these stable for their own E2E tests), `span[title]` for contact names, `.message-in` / `.message-out` for message rows, and `[role="listitem"]` structural selectors as fallbacks.

---

## Installation

1. Download the ZIP and unzip it
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top right)
4. Click **Load unpacked** and select the `whatsapp-privacy-blur/` folder
5. Open [web.whatsapp.com](https://web.whatsapp.com)

Works on Chrome, Edge, Brave, and any Chromium-based browser that supports Manifest V3.

> If you're updating from a previous version: remove the old extension first, then load the new folder. Chrome caches content scripts aggressively and a reload alone sometimes isn't enough.

---

## Files

```
whatsapp-privacy-blur/
├── manifest.json       Manifest V3 — scoped to web.whatsapp.com
├── content.js          CSS builder + MutationObserver + avatar scanner
├── blur.css            Base blur class loaded at document_start (prevents flash)
├── popup.html          Extension popup UI
├── popup.css           Popup styles (dark, monospace)
├── popup.js            Settings persistence via chrome.storage.sync
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Privacy

No data collection. No network requests from the extension. No analytics. All settings live in `chrome.storage.sync`, which is local to your browser (and optionally synced by Chrome across your own signed-in devices). The extension never reads message content — it only applies CSS filters to DOM elements.

---
