/**
 * Magic-byte image sniffing. The browser-supplied Content-Type / extension is
 * spoofable, so receipt uploads are validated by their actual file signature
 * before they touch storage or the AI vision call.
 */
export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'] as const

export function sniffImageMime(buf: Uint8Array): string | null {
  const at = (sig: number[], off = 0) => sig.every((b, i) => buf[off + i] === b)
  if (at([0xff, 0xd8, 0xff])) return 'image/jpeg'
  if (at([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  if (at([0x47, 0x49, 0x46, 0x38])) return 'image/gif'
  if (at([0x52, 0x49, 0x46, 0x46]) && at([0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp'
  // HEIC/HEIF: `ftyp` box at offset 4, brand follows
  if (at([0x66, 0x74, 0x79, 0x70], 4)) return 'image/heic'
  return null
}

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024

export interface FileCheck {
  ok: boolean
  /** The sniffed MIME (trustworthy), when ok. */
  mime?: string
  error?: string
}

/** Validate a receipt upload by size + real magic bytes (not the claimed type). */
export function validateReceipt(size: number, head: Uint8Array): FileCheck {
  if (size > MAX_RECEIPT_BYTES) return { ok: false, error: 'File size exceeds 10MB limit' }
  if (size === 0) return { ok: false, error: 'File is empty' }
  const mime = sniffImageMime(head)
  if (!mime) return { ok: false, error: 'File does not look like a supported image (JPEG, PNG, WebP, GIF, HEIC)' }
  return { ok: true, mime }
}
