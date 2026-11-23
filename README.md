# Snip

A Chrome extension that removes elements from web pages by **id** or **class**, scoped to a **URL prefix**.

## Install

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this folder.

## Usage

Click the Snip toolbar icon and add a rule:

- **URL prefix** — the rule applies to pages whose URL starts with this (prefilled with the current site; leave empty for all pages).
- **Type** — `id` or `class`.
- **Value** — e.g. `cookie-banner`. For class, `ad sticky` matches elements having both classes.

Rules can be toggled or deleted from the popup and are synced via `chrome.storage.sync`.

Matching elements are hidden from the start of page load, removed once present, and kept removed as the page changes (lazy-loaded content, SPA navigation).
