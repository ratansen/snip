# Snip

A Chrome extension that removes elements from web pages by **id** or **class**, scoped to a **URL prefix**.

## Install

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.

## Usage

Click the Snip toolbar icon and add a rule:

- **URL prefix** — the rule applies to pages whose URL starts with this (prefilled with the current site; leave empty for all pages).
- **ID** (optional) — e.g. `cookie-banner`.
- **Class** (optional) — e.g. `ad sticky` matches elements having both classes.

Fill in an ID, a class, or both; with both, an element must match both.

Use `*` as a wildcard matching any run of characters:

- `ad-*` starts with, `*-banner` ends with, `*promo*` contains, `ad-*-top` both ends.
- For classes, each name is matched against the element's individual classes, so `big ad-* sticky` means the element has `big`, `sticky`, and some class starting with `ad-`.

Rules saved with the regex option from v1.1 are converted to wildcards automatically; ones that can't be expressed as wildcards are disabled so you can fix or delete them.

Rules can be toggled or deleted from the popup and are synced via `chrome.storage.sync`.

Matching elements are hidden from the start of page load, removed once present, and kept removed as the page changes (lazy-loaded content, SPA navigation).
