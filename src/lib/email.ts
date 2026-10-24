import type {RuntimeEnv} from './runtime'
/**
 * Tiny transactional-email adapter. Uses Resend over plain fetch if
 * RESEND_API_KEY is set; otherwise it no-ops and reports delivered:false so the
 * caller can fall back to showing a copyable link. SERVER-ONLY.
 */
export interface SendResult {
  delivered: boolean
  error?: string
}


export async function sendEmail(to: string, subject: string, html: string, env: RuntimeEnv = process.env): Promise<SendResult> {
  if (env.COSTPACKET_LOCAL === '1' && env.DEV_EMAIL_OUTBOX) {
    const {appendFile} = await import('node:fs/promises')
    await appendFile(String(env.DEV_EMAIL_OUTBOX), JSON.stringify({to,subject,html}) + '\n', {mode:0o600})
    return {delivered:true}
  }
  const apiKey = env.RESEND_API_KEY
  if (!apiKey) return { delivered: false, error: 'email not configured' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.EMAIL_FROM ?? 'CostPacket <onboarding@resend.dev>', to, subject, html }),
    })
    if (!res.ok) {
      return { delivered: false, error: `resend ${res.status}` }
    }
    return { delivered: true }
  } catch (e) {
    return { delivered: false, error: e instanceof Error ? e.message : 'send failed' }
  }
}

export function inviteEmail(companyName: string, role: string, link: string): { subject: string; html: string } {
  return {
    subject: `You've been invited to ${companyName} on CostPacket`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px">
        <h2>Join ${escapeHtml(companyName)} on CostPacket</h2>
        <p>You've been invited as <strong>${escapeHtml(role.toLowerCase())}</strong>.</p>
        <p><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:4px;text-decoration:none">Accept invite</a></p>
        <p style="color:#666;font-size:13px">Or paste this link: ${escapeHtml(link)}</p>
      </div>`,
  }
}

export function notifyEmail(subject: string, body: string): { subject: string; html: string } {
  return {
    subject,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px"><p>${escapeHtml(body)}</p></div>`,
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string
  )
}
