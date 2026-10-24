# Public work page checks — 24 October 2026

Page: `/work/accessibility`. This is a personal portfolio page, not a paid client
case or an assertion of full accessibility conformance.

Chromium checks at viewport widths 1440, 390 and 320 px found no horizontal page
overflow and zero axe violations in the selected `wcag2a`, `wcag2aa`, `wcag21a`,
`wcag21aa`, `wcag22aa` tags. Desktop and mobile screenshots were reviewed.

Keyboard checks exercised the first-tab skip link, focus on the main content,
the linked form's labelled input, native submit action, dialog and Escape.
The five distinct linked proof files returned 200; the PDF had a PDF signature.
The referenced stylesheet and images use local/static assets.

Anonymous access to `/dashboard` still redirects to login; the expenses export
still returns 401. Middleware makes only the exact work page and the
`/work/accessibility-demo/` assets public. Backend authorization remains in each
data operation.

Lint and the OpenNext Worker build passed. Build artifacts were checked against
the local application's secret values without printing those values. No matches
were found. The build ran with the private `.env.local` file temporarily removed.

These checks do not include screen-reader speech, every browser, every WCAG
criterion or inbox delivery of the contact address.

The same browser check passed against the deployed Cloudflare URL at 1440, 390
and 320 px. An initial live check submitted before the fixture script finished
loading; the fixture now disables its submit button until handlers are attached.
Its input fields have no form-submission names, so a browser fallback cannot
put their contents in a GET URL. The check waits for the loaded, enabled control
before exercising Enter and Escape. These guards apply to the corrected fixture
in both the source demonstration and the public copy.
