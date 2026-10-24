import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./proof.module.css";

const assets = "/work/accessibility-demo";
const source =
  "https://github.com/yshxsp/costpacket/tree/codex/costpacket-neon-migration/docs/accessibility-demo";

export const metadata: Metadata = {
  title: "A quote form, before and after | Dmytro Filonenko",
  description:
    "A controlled accessibility example: form labels, keyboard controls, dialog focus and the checks behind the change. By Dmytro Filonenko.",
  alternates: {
    canonical: "https://costpacket.yshxsp.workers.dev/work/accessibility",
  },
};

export default function AccessibilityWork() {
  return (
    <div className={styles.proof}>
      <a href="#work-content" className={styles.skip}>
        Skip to the example
      </a>
      <header className={styles.header}>
        <Link href="/work/accessibility" className={styles.name}>
          Dmytro Filonenko
        </Link>
        <nav aria-label="Portfolio">
          <a href="#evidence">The checks</a>
          <a href={source}>Source code</a>
          <a href="mailto:dmitry@porthatch.app">Email me</a>
        </nav>
      </header>
      <main id="work-content" tabIndex={-1}>
        <section className={styles.intro} aria-labelledby="case-title">
          <div>
            <p className={styles.context}>Personal work, October 2026</p>
            <h1 id="case-title">
              A quote form,
              <br />
              before and after.
            </h1>
            <p className={styles.lead}>
              The submit control worked with a mouse. It could not be reached
              with a keyboard. The form labels and dialog focus needed attention
              too.
            </p>
            <p>
              I fixed the controls, recorded the checks and kept both versions
              so you can inspect the change.
            </p>
            <div className={styles.actions}>
              <a className={styles.primary} href={`${assets}/after.html`}>
                Try the corrected form
              </a>
              <a
                className={styles.secondary}
                href={`${assets}/report-after.pdf`}
              >
                Read the report (PDF)
              </a>
            </div>
            <p className={styles.disclosure}>
              A fictional workshop form built for this demonstration. No order
              or email is sent by the form.
            </p>
          </div>
          <div className={styles.change} aria-label="The submit control change">
            <p className={styles.changeTitle}>One of the changes</p>
            <div className={styles.codeBefore}>
              <p>Before: pointer-only control</p>
              <pre>
                <code>
                  {
                    '<div id="review"\n  onclick="openQuote()">\n  Review quote\n</div>'
                  }
                </code>
              </pre>
            </div>
            <div className={styles.codeAfter}>
              <p>After: a native submit button</p>
              <pre>
                <code>
                  {
                    '<button id="review"\n  type="submit">\n  Review quote\n</button>'
                  }
                </code>
              </pre>
            </div>
            <p className={styles.changeNote}>
              Tab reaches the button. Enter submits the form. Invalid email
              moves focus to the field that needs correction.
            </p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="versions-title">
          <div className={styles.sectionIntro}>
            <h2 id="versions-title">Same task. Different behavior.</h2>
            <p>
              The changes preserve the form’s layout. The source and live
              versions show what the screenshots cannot: names, validation and
              keyboard interaction.
            </p>
          </div>
          <div className={styles.versions}>
            <figure>
              <figcaption>
                <strong>Before</strong>
                <span>Missing labels and a pointer-only action.</span>
              </figcaption>
              <a
                href={`${assets}/before.html`}
                aria-label="Open before version, intentionally contains accessibility defects"
              >
                <Image
                  src={`${assets}/before-desktop.png`}
                  width={1280}
                  height={1122}
                  unoptimized
                  alt="The original quote form with pale supporting text and its materials summary."
                />
              </a>
              <a className={styles.versionLink} href={`${assets}/before.html`}>
                Open the intentionally broken version
              </a>
            </figure>
            <figure>
              <figcaption>
                <strong>After</strong>
                <span>Named controls and a keyboard-tested dialog.</span>
              </figcaption>
              <a
                href={`${assets}/after.html`}
                aria-label="Open corrected quote form"
              >
                <Image
                  src={`${assets}/after-overview.png`}
                  width={1280}
                  height={1122}
                  unoptimized
                  alt="The corrected quote form with stronger supporting-text contrast and the same materials summary."
                />
              </a>
              <a className={styles.versionLink} href={`${assets}/after.html`}>
                Open the corrected version
              </a>
            </figure>
          </div>
        </section>

        <section
          id="evidence"
          className={styles.evidence}
          aria-labelledby="checks-title"
        >
          <div>
            <h2 id="checks-title">What I checked</h2>
            <p>
              Checks were run in Chromium. The report records the scope and the
              original findings.
            </p>
            <div className={styles.evidenceLinks}>
              <a href={`${assets}/report-after.html`}>HTML report</a>
              <a href={`${assets}/results.json`}>Raw browser results</a>
              <a href={source}>Source and method</a>
            </div>
          </div>
          <div>
            <dl className={styles.checks}>
              <div>
                <dt>Automated checks</dt>
                <dd>
                  Four failing axe rule groups before: contrast, image
                  alternatives, input labels and select naming. Zero violations
                  after in the selected WCAG A/AA checks, including the open
                  dialog.
                </dd>
              </div>
              <div>
                <dt>Keyboard</dt>
                <dd>
                  Tab order, Enter, invalid-email feedback, focus inside the
                  dialog, Escape and return focus.
                </dd>
              </div>
              <div>
                <dt>Small screens</dt>
                <dd>
                  A 320 px viewport, plus 200% text resizing at that width. Text
                  resizing is distinct from browser zoom.
                </dd>
              </div>
            </dl>
            <p className={styles.limit}>
              Screen-reader speech and interaction, other browsers and every
              WCAG criterion were not tested. A clean automated result does not
              establish full conformance.
            </p>
          </div>
        </section>

        <section
          className={styles.production}
          aria-labelledby="production-title"
        >
          <div>
            <p className={styles.context}>A separate application check</p>
            <h2 id="production-title">The same discipline in CostPacket.</h2>
          </div>
          <div>
            <p>
              I also corrected contrast, labels, list semantics and modal
              keyboard behavior in my expense-workflow project. The recorded
              checks cover eleven routes, a mobile view and four anonymous
              pages.
            </p>
            <p>
              CostPacket is a personal development project. Its source, deployed
              application and bounded test evidence are public.
            </p>
            <div className={styles.evidenceLinks}>
              <Link href="/">Open CostPacket</Link>
              <a href="https://github.com/yshxsp/costpacket/commit/97059ec75315b31a24db0850c42a6ff6b5a14d70">
                Read the actual patch
              </a>
              <a href="https://github.com/yshxsp/costpacket/blob/codex/costpacket-neon-migration/docs/ACCESSIBILITY-CHECK-2026-10-24.md">
                Application check notes
              </a>
            </div>
          </div>
        </section>

        <section className={styles.contact} aria-labelledby="contact-title">
          <h2 id="contact-title">Have a finding to implement?</h2>
          <p>
            Send the audit item or the page you want to discuss. I review the
            relevant code before proposing a scope or delivery date. I work
            through email and repository comments.
          </p>
          <a
            className={styles.primary}
            href="mailto:dmitry@porthatch.app?subject=Website%20fix%20enquiry"
          >
            dmitry@porthatch.app
          </a>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>Dmytro Filonenko</span>
        <a href="https://github.com/yshxsp/costpacket">Project source</a>
      </footer>
    </div>
  );
}
