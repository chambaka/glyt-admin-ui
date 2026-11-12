# GoLyt Ops Console — Admin User Guide

Generated materials for the ADMIN walkthrough of every console menu.

## Deliverables

- `GoLyt-Ops-Console-Admin-User-Guide.pdf` — branded PDF with screenshots
- `GoLyt-Facilities-User-Guide.pdf` — facilities + storage slots (CRUD + integrity deletes)
- `GoLyt-Catalog-User-Guide.pdf` — service catalog + pricing (minor units)
- `GoLyt-Manifests-User-Guide.pdf` — manifests lifecycle + console PDF download
- `GoLyt-Customer-User-Guide.pdf` — traveller website guide (source lives in `glyt-website/docs/user-guide/`)
- `golyt-ops-console-user-guide.html` — source HTML used to print the PDF
- `golyt-facilities-user-guide.html` — facilities guide source
- `golyt-catalog-user-guide.html` — catalog guide source
- `golyt-manifests-user-guide.html` — manifests guide source
- `screenshots/` — captured UI screenshots for each menu
- `mock-api.mjs` — lightweight API stub for screenshot capture when MySQL/backend is unavailable
- `capture-screenshots.mjs` — Chromium script that refreshes auth/users screenshots

## Topics covered (Nov 2026 refresh)

- Sign-in, SMS password reset (no email link), and forced password change
- Nexus-aligned staff password rules (no 2FA)
- Users: required phone, welcome/reset SMS via chambaka-notification-service

## Regenerate screenshots (auth / users)

With Vite on `:5180` and either the real backend or `node mock-api.mjs` on `:8070`:

```bash
cd docs/user-guide
node capture-screenshots.mjs
```

## Regenerate PDF

```bash
cd docs/user-guide
google-chrome --headless --no-sandbox --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf=GoLyt-Ops-Console-Admin-User-Guide.pdf \
  "file://$PWD/golyt-ops-console-user-guide.html"
```
