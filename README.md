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

Fill in an ID, a class, or both; with both, an element must match both. Tick **regex** next to a field to treat it as a regular expression:

- ID regex is tested against the element's id, e.g. `^promo-\d+$`.
- Class regex matches if any single class on the element matches, e.g. `^ad-`.

Rules can be toggled or deleted from the popup and are synced via `chrome.storage.sync`.

Matching elements are hidden from the start of page load, removed once present, and kept removed as the page changes (lazy-loaded content, SPA navigation).
