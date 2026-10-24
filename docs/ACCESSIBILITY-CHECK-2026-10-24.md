# Scoped accessibility check — 24 October 2026

This is a check of a personal development project, not a full accessibility
conformance assessment. Findings in the previous deployed build were reproduced
in Chromium with axe-core and keyboard checks, then corrected in source.

Changes:

- Raised contrast for small neutral text while preserving the existing palette.
- Associated labels with read-only profile fields and named the receipt upload.
- Used list semantics for the homepage's example ledger.
- Named mobile menu/close buttons and converted navigation and settings overlays
  to native modal dialogs with keyboard loops, Escape and return focus.
- Added active-navigation state, a dashboard skip link and mobile staff routes.
- Clarified that automatic receipt suggestions depend on configuration.

Local browser check: homepage, dashboard, projects, new project, tasks, expenses,
new expense, payments, members, profile and billing, plus the mobile dashboard.
All returned zero violations in the selected WCAG A/AA axe tag set after the fix.
Dark/OLED settings and the dark dashboard were checked separately. Keyboard tests
covered both dialogs, repeated Tab, Escape, return focus and mobile staff links.

[Before observations](accessibility-check-2026-10-24/before.json),
[local after observations](accessibility-check-2026-10-24/after-local.json),
[keyboard and theme evidence](accessibility-check-2026-10-24/keyboard-and-themes.json).
A provider test address in source snippets was replaced with a generic test label.

Limits: these tests do not cover all WCAG criteria, all populated/errored states,
all browsers or screen-reader speech/interaction. A clean automated result does
not establish WCAG conformance. Live Cloudflare checks passed for the same twelve route/view observations and
keyboard/theme scenarios. Anonymous login, signup, privacy and invalid-invite
pages were checked separately. See [live route observations](accessibility-check-2026-10-24/after-cloud.json),
[live keyboard checks](accessibility-check-2026-10-24/keyboard-cloud.json) and
[anonymous public pages](accessibility-check-2026-10-24/public-pages.json).
