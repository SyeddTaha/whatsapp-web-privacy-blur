# WhatsApp Privacy Blur

A Chrome/Edge extension that adds fine-grained privacy blurring to WhatsApp Web.  
Hover any blurred element to reveal it instantly.

---

## Features

| Feature | What it blurs |
|---|---|
| **Chat Messages** | All text in the active conversation |
| **Chat Previews** | Last message snippets in the sidebar |
| **Media Thumbnails** | Images and videos inside chats |
| **Media Gallery** | Full-size lightbox / media viewer |
| **Message Input** | What you're typing (reveals on focus/hover) |
| **Names** | Contact and group names everywhere |
| **Profile Pictures** | All avatars on the page |

### Reveal Behaviour
- **Default** — hover any individual blurred element to see it
- **Instant Reveal** — disables the fade transition for a snappier feel
- **Hover App to Reveal All** — move your mouse anywhere over the page to unblur everything at once

---

## Installation (Developer Mode)

1. Download and unzip this folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select this folder (`whatsapp-privacy-blur/`)
6. Open [web.whatsapp.com](https://web.whatsapp.com) — blur is active immediately

> For Edge: go to `edge://extensions/` → same steps.

---

## Usage

Click the extension icon in your toolbar to open the control panel.

- Use the **master toggle** in the header to enable/disable all blurring
- Toggle individual blur targets on/off
- Switch reveal behaviour between per-item hover or whole-app hover

Settings sync via `chrome.storage.sync` and persist across browser restarts.

---

## How it works

A single `<style>` tag is injected into WhatsApp Web's `<head>` containing all blur CSS rules. When you hover an element, its `:hover` state removes the blur. When settings change in the popup, the style tag is regenerated instantly — no page reload needed.

WhatsApp Web dynamically renders content, but because the CSS targets elements by their data attributes and ARIA roles (not ephemeral class names), it works reliably across updates.

---

## Privacy

- No data ever leaves your browser
- No network requests made by this extension
- No analytics, no tracking
- All settings stored locally via `chrome.storage.sync`

---

by Taha Jaffri  
Follow @tahajaffriii for more techniques
