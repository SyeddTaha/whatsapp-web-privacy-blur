/* ================================================================
   WhatsApp Privacy Blur — content.js  v3.0
   ================================================================

   KEY INSIGHT (why v1 & v2 failed for messages):
   ────────────────────────────────────────────────
   Blurring inner <span> text nodes doesn't work because WA's
   parent divs have overflow:hidden — the blur glow is clipped
   and nothing looks blurred.

   SOLUTION: blur at the MESSAGE ROW level (.message-in / .message-out).
   These class names are NOT obfuscated — WA has kept them stable for
   years and they're used by every WA library (whatsapp-web.js etc).
   Hovering anywhere on the bubble row reveals the whole message.

   For everything else we use data-testid selectors which WA also
   keeps stable (they use them for their own E2E tests).
   ================================================================ */

(function () {
  'use strict';

  const DEFAULTS = {
    enabled:          true,
    blurMessages:     true,
    blurPreviews:     true,
    blurMedia:        true,
    blurGallery:      true,
    blurInput:        true,
    blurNames:        true,
    blurAvatars:      true,
    noTransition:     false,
    revealOnAppHover: false,
  };

  let S = { ...DEFAULTS };
  let styleEl  = null;
  let mutObs   = null;
  let headObs  = null;
  let scanTimer= null;
  const STYLE_ID = 'wpb-v3';

  /* ── CSS builder ────────────────────────────────────────────── */
  function buildCSS() {
    if (!S.enabled) return '';

    const BLR  = 'filter:blur(8px)!important;border-radius:4px;';
    const BLR4 = 'filter:blur(4px)!important;border-radius:4px;';
    const CLR  = 'filter:blur(0)!important;';
    const T    = S.noTransition ? '' : 'transition:filter .18s ease!important;';
    const TF   = S.noTransition ? '' : 'transition:filter .15s ease!important;';
    const rev  = S.revealOnAppHover ? 'body.wpb-rev:hover ' : '';

    // rule(selector, blurStyle, revealOnHover)
    const rule = (sel, style = BLR, hover = true) => {
      let css = `${sel}{${style}${T}}\n`;
      if (hover) css += `${sel}:hover{${CLR}}\n`;
      if (rev)   css += `${rev}${sel}{${CLR}}\n`;
      return css;
    };

    let css = '';

    /* ── 1. CHAT MESSAGES ───────────────────────────────────── */
    // Blur the entire message row — avoids overflow:hidden clipping.
    // .message-in / .message-out are stable, non-obfuscated class names.
    if (S.blurMessages) {
      css += rule('.message-in');
      css += rule('.message-out');
      // data-testid fallback
      css += rule('[data-testid="msg-container"]');
      // System messages ("This chat is end-to-end encrypted" etc)
      css += rule('[data-testid="system-message"]');
    }

    /* ── 2. SIDEBAR CHAT PREVIEWS ───────────────────────────── */
    // Blur the secondary line (last message) inside each row.
    if (S.blurPreviews) {
      css += rule('[data-testid="cell-frame-primary-detail"]');
    }

    /* ── 3. MEDIA THUMBNAILS (in-chat) ──────────────────────── */
    if (S.blurMedia) {
      [
        '[data-testid="image-thumb"]',
        '[data-testid="video-thumb"]',
        '[data-testid="sticker-img"]',
        '[data-testid="audio-player"]',
        '[data-testid="document-thumb"]',
        '[data-testid="msg-container"] img',
        '[data-testid="msg-container"] [data-testid="link-preview"]',
        '.message-in img',
        '.message-out img',
      ].forEach(sel => { css += rule(sel); });
    }

    /* ── 4. MEDIA GALLERY / VIEWER ──────────────────────────── */
    if (S.blurGallery) {
      [
        '[data-testid="media-viewer-image"]',
        '[data-testid="media-modal"] img',
        '[data-testid="media-viewer-container"]',
      ].forEach(sel => {
        css += `${sel}{${BLR}${T}}\n${sel}:hover{${CLR}}\n`;
        if (rev) css += `${rev}${sel}{${CLR}}\n`;
      });
    }

    /* ── 5. MESSAGE INPUT / COMPOSE BOX ─────────────────────── */
    if (S.blurInput) {
      [
        'footer [contenteditable="true"]',
        '[data-testid="conversation-compose-box"] [contenteditable="true"]',
        '.copyable-area footer [contenteditable]',
      ].forEach(sel => {
        css += `${sel}{${BLR4}${TF}}\n`;
        css += `${sel}:focus,${sel}:hover{${CLR}}\n`;
        if (rev) css += `${rev}${sel}{${CLR}}\n`;
      });
    }

    /* ── 6. CONTACT / GROUP NAMES ───────────────────────────── */
    if (S.blurNames) {
      [
        // Sidebar list — each row's title
        '[data-testid="cell-frame-title"]',
        '[data-testid="cell-frame-title"] span',
        // Open chat header
        'header [data-testid="conversation-info-header-chat-title"]',
        'header [data-testid="conversation-info-header-chat-title"] span',
        // In-message author name (group chats)
        '[data-testid="msg-container"] [data-testid="author"]',
        // Contact / group info drawers
        '[data-testid="contact-info-drawer"] [data-testid="contact-info-subtitle"]',
        // Structural fallback: span[title] inside list rows
        '[role="listitem"] span[title]',
        '[role="row"] span[title]',
      ].forEach(sel => { css += rule(sel); });
    }

    /* ── 7. PROFILE PICTURES / AVATARS ──────────────────────── */
    if (S.blurAvatars) {
      [
        // data-testid
        '[data-testid="avatar"]',
        '[data-testid="avatar"] img',
        '[data-testid="default-user"]',
        '[data-testid="photo"] img',
        // Header
        'header [data-testid="avatar"]',
        'header img',
        // Sidebar list rows
        '[role="listitem"] [data-testid="avatar"]',
        '[role="listitem"] img',
        '[role="row"] img',
        // JS-tagged avatars (.wpb-av added by scanAvatars())
        'img.wpb-av',
        '.wpb-av',
      ].forEach(sel => { css += rule(sel); });
    }

    return css;
  }

  /* ── Style injection ────────────────────────────────────────── */
  function injectStyle() {
    let el = document.getElementById(STYLE_ID);
    if (!el) {
      el = document.createElement('style');
      el.id = STYLE_ID;
      (document.head || document.documentElement).appendChild(el);
    }
    styleEl = el;
    el.textContent = buildCSS();
  }

  // Re-inject if WA removes our style tag
  function watchHead() {
    if (headObs) return;
    headObs = new MutationObserver(() => {
      if (!document.getElementById(STYLE_ID)) injectStyle();
    });
    headObs.observe(document.head || document.documentElement, { childList: true });
  }

  /* ── Body classes ───────────────────────────────────────────── */
  function syncBody() {
    document.body.classList.toggle('wpb-rev', !!(S.enabled && S.revealOnAppHover));
  }

  /* ── Avatar tagging ─────────────────────────────────────────── */
  // Tag small-circle imgs with .wpb-av so CSS can target them.
  // Needed because img[src^="blob:"] would also catch media.
  function scanAvatars() {
    if (!S.enabled || !S.blurAvatars) {
      document.querySelectorAll('.wpb-av').forEach(el => el.classList.remove('wpb-av'));
      return;
    }
    document.querySelectorAll('img').forEach(img => {
      const r = img.getBoundingClientRect();
      if (r.width < 28 || r.width > 82 || r.height < 28 || r.height > 82) return;
      if (Math.abs(r.width - r.height) > 8) return;
      img.classList.add('wpb-av');
      const p = img.parentElement;
      if (p && p !== document.body) {
        const br = parseFloat(getComputedStyle(p).borderRadius || '0');
        if (br > 10) p.classList.add('wpb-av');
      }
    });
  }

  /* ── Full sync ──────────────────────────────────────────────── */
  function sync() {
    injectStyle();
    syncBody();
    scanAvatars();
  }

  /* ── Mutation observer ──────────────────────────────────────── */
  function scheduleScan() {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = setTimeout(() => { scanTimer = null; scanAvatars(); }, 200);
  }

  function startMutObs() {
    if (mutObs) return;
    mutObs = new MutationObserver(scheduleScan);
    mutObs.observe(document.body, { childList: true, subtree: true });
  }

  /* ── Boot ───────────────────────────────────────────────────── */
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    S = { ...DEFAULTS, ...stored };
    injectStyle();
    watchHead();
    syncBody();
    startMutObs();
    setTimeout(scanAvatars, 800);
    setTimeout(scanAvatars, 2500);
  });

  chrome.storage.onChanged.addListener((changes) => {
    for (const [k, { newValue }] of Object.entries(changes)) S[k] = newValue;
    sync();
  });

  // Safety re-syncs after WA async rendering settles
  setTimeout(sync, 1200);
  setTimeout(sync, 4000);

})();
