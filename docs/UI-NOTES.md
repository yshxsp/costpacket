# CostPacket interface direction

Subject: receipts, expense approvals and payout records for small contractors.
The migration preserves the existing paper-ledger interface and its working layouts.

- Palette: paper `#f1ece1`, surface `#faf6ee`, ink `#1b1a16`, muted ink `#6c6557`, blue `#2348cf`, approval green `#1f7a3d`.
- Type: Fraunces for titles; IBM Plex Sans for forms and prose; IBM Plex Mono for amounts. Serve the same families locally.
- Layout: left navigation with a wide work area on desktop; compact header and a single content column on mobile. Keep expense rows and data tables appropriate to their content.
- New invitation controls follow existing form spacing and visible focus treatment. Use actual labels and status messages.
- Copy names the operation and its outcome. Manual payout records must not imply a bank transfer occurred. Optional receipt extraction must not be described as always available.

Review: preserve the established visual identity rather than introducing a new design system during a backend migration. No fabricated customers, results, testimonials or decorative KPI figures. Browser screenshots use explicitly synthetic demonstration data.
