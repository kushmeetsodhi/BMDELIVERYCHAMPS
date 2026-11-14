# BM Delivery Champs

The DA app, served from GitHub Pages so it can use the phone's camera
inside the app (Apps Script blocks that) and install to the home screen.

App link: https://kushmeetsodhi.github.io/BMDELIVERYCHAMPS/

## The one setting

`config.js` holds the Delivery Champs Apps Script web app address. In
Apps Script: Deploy → Manage deployments → copy the Web app URL. It
ends in `/exec`. That deployment must have **Execute as: Me** and
**Who has access: Anyone**.

## What is in here

| File | What it is |
|---|---|
| `index.html` | The app. Built from `da-app.html` - never edit it here. |
| `config.js` | The backend address. |
| `sw.js` | Keeps the app on the phone so it opens instantly and offline. |
| `manifest.webmanifest`, `icon-*.png` | Home-screen install. |
| `.nojekyll` | Stops GitHub reprocessing the files. |

## Releasing a change

Change `da-app.html`, then:

    python3 build_pages.py --exec-url https://script.google.com/macros/s/…/exec --out site

and commit what it writes. The new `sw.js` version is what makes phones
pick the release up on their next open.

The backend (sheets, Control Room, accounts) is untouched by any of
this: it stays in Apps Script.

## BM Ageing (`ageing/`)

Inventory ageing & expiry dashboard: https://kushmeetsodhi.github.io/BMDELIVERYCHAMPS/ageing/

Backend: `inventory-ageing/` in the private `bm-apps-script` repo (bound to the
Inventory_Ageing_Dashboard sheet). No login: anyone with the link can view and upload.

## BM Warehouse (`warehouse/`)

Warehouse beta: rack locations, QR labels on A4 sticker sheets, scan-to-lookup.
https://kushmeetsodhi.github.io/BMDELIVERYCHAMPS/warehouse/

Backend: `warehouse/` in the private `bm-apps-script` repo. Its web app link goes in
`warehouse/config.js` (printed by the "Create Warehouse project" action there).
No login or PIN. The backend makes its database Sheet and loads the slotting
plan by itself on first use.

## BM Picking demo (`picking/`)

Demo of the picking staff app: https://kushmeetsodhi.github.io/BMDELIVERYCHAMPS/picking/

Runs on its own with 12 mock orders (`picking/demo-data.js`, made from the slotting
plan and Sep–Oct sales); nothing is sent anywhere. Flow: log in → order alert →
pick list in walking order → scan each spot's QR → picked / short → bag count →
scan a staging line. Beverages are flagged to go straight to staging.
QR labels to scan: https://kushmeetsodhi.github.io/BMDELIVERYCHAMPS/picking/#qr
