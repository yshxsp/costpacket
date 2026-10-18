<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CostPacket

This project is being repositioned from a broad construction dashboard into a
focused job-costed expense and approval product for small contractors.

## Skills

Skills load from user scope (no repo copies): `frontend-design` comes from the
`frontend-design@claude-plugins-official` plugin; `webapp-testing` and
`brand-guidelines` live in `~/.claude/skills/`.

- `frontend-design` — use before UI/UX work. Avoid generic AI SaaS styling,
  glow blobs, glassmorphism, and vague "autonomous operations" language.
- `webapp-testing` — use for browser/Playwright smoke checks after UI changes.
- `brand-guidelines` — use when creating or applying brand assets. It is not a
  naming skill.

## Product Direction

- Prefer the working brand `CostPacket` during repositioning unless a later
  trademark/domain search disqualifies it.
- Primary wedge: job-costed receipts, expense approvals, and payout packets for
  small contractors.
- Do not add fleet telemetry, real-time equipment tracking, GPS automations, or
  "AI completes construction tasks" flows.
- Keep AI focused on receipt parsing unless a feature has a clear short path to
  revenue.

## Naming Checks

Before finalizing a public rename, perform a knock-out availability pass:

- RDAP/domain check for `.com`.
- GitHub and npm handle/package check when relevant.
- USPTO/WIPO search for exact and confusingly similar marks.
- Web search for exact phrase and close variants.

This is a product screen, not legal clearance.
