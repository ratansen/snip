# Chrome Web Store listing — Snip

Copy each field into the Developer Dashboard (https://chrome.google.com/webstore/devconsole).

---

## Package

Upload `dist/snip-<version>.zip`, built with `store/package.sh`.

## Store listing tab

**Name** (from manifest)

Snip

**Summary** (from manifest description, max 132 characters)

Remove elements from pages by id or class, scoped to URL prefixes.

**Description**

```
Snip removes the parts of web pages you don't want to see — cookie banners, sidebars, promos, sticky headers, "recommended" panels — using simple rules you control.

HOW IT WORKS
Click the Snip icon and add a rule:
• URL prefix — the rule applies to pages whose address starts with this (prefilled with the current site; leave empty for every site).
• ID and/or class — the element to remove. Fill in either one, or both to require an element to match both.

WILDCARDS
Use * to match any run of characters:
• ad-*  — classes or ids starting with "ad-"
• *-banner — ending with "-banner"
• *promo* — containing "promo"
Several class names, like "big ad-* sticky", must all be present on the element.

FEATURES
• Matching elements are hidden as the page loads, so they don't flash on screen.
• Keeps working on pages that load content later, including single-page apps.
• Turn rules on and off or delete them from the popup.
• Rules sync across your Chrome browsers via Chrome sync.

PRIVACY
Snip collects no data, makes no network requests, and contains no analytics. Your rules stay in your browser.

Open source: https://github.com/ratansen/snip
```

**Category**

Productivity → Tools (or "Workflow & Planning" if Tools isn't offered)

**Language**

English

**Graphic assets** (in `store/`)

- Store icon 128×128: `icons/icon128.png`
- Screenshots 1280×800: `store/screenshot-1.png`, `store/screenshot-2.png`
- Small promo tile 440×280: `store/promo-tile.png`

**Official URL / Homepage URL**

https://github.com/ratansen/snip

**Support URL**

https://github.com/ratansen/snip/issues

## Privacy tab

**Single purpose description**

```
Snip removes elements from web pages that the user specifies by id or class name, limited to the URL prefixes the user chooses.
```

**Permission justifications**

- `storage`
  ```
  Saves the user's removal rules (URL prefix, id/class pattern, enabled state) with chrome.storage.sync so they persist and sync across the user's browsers.
  ```
- `activeTab`
  ```
  Reads the current tab's URL when the user opens the popup, to prefill the URL prefix field with the current site.
  ```
- Host permission (content script on `<all_urls>`)
  ```
  Snip's content script must run on any site the user writes a rule for, since rules can target any URL prefix, including all sites. On each page it only compares element ids and class names against the user's rules locally and removes matches. It reads no other page content and sends nothing off the device.
  ```

**Remote code**

No, I am not using remote code.

**Data usage**

- What user data do you plan to collect: tick **nothing**.
- Certify all three disclosures:
  - I do not sell or transfer user data to third parties, outside of the approved use cases.
  - I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
  - I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL**

https://github.com/ratansen/snip/blob/main/PRIVACY.md

## Distribution tab

- Visibility: Public (or Unlisted to share by link only)
- Regions: All regions
- Pricing: Free
