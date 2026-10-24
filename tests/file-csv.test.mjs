// Beta-essentials unit tests (run with `npm run test:files`).
import assert from 'node:assert/strict'
import { toCsv } from '../src/lib/csv.ts'
import { sniffImageMime, validateReceipt, MAX_RECEIPT_BYTES } from '../src/lib/file-validation.ts'

// --- CSV escaping (RFC-4180) ---
assert.equal(toCsv(['a', 'b'], [[1, 2]]), 'a,b\r\n1,2')
assert.equal(toCsv(['x'], [['has,comma']]), 'x\r\n"has,comma"')
assert.equal(toCsv(['x'], [['he said "hi"']]), 'x\r\n"he said ""hi"""')
assert.equal(toCsv(['x'], [['line1\nline2']]), 'x\r\n"line1\nline2"')
assert.equal(toCsv(['x'], [[null]]), 'x\r\n')

assert.equal(toCsv(['x'], [['=1+1']]), "x\r\n'=1+1")
assert.equal(toCsv(['x'], [[' @SUM(A1)']]), "x\r\n' @SUM(A1)")
assert.equal(toCsv(['x'], [[-10]]), 'x\r\n-10')

// --- magic-byte sniffing ---
assert.equal(sniffImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0])), 'image/jpeg')
assert.equal(sniffImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'image/png')
assert.equal(
  sniffImageMime(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])),
  'image/webp'
)
assert.equal(sniffImageMime(new Uint8Array([0x25, 0x50, 0x44, 0x46])), null, 'a PDF is not an image')
assert.equal(sniffImageMime(new Uint8Array([0, 1, 2, 3])), null, 'random bytes rejected')

// --- validateReceipt ---
const jpegHead = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
assert.equal(validateReceipt(1024, jpegHead).ok, true)
assert.equal(validateReceipt(0, jpegHead).ok, false, 'empty rejected')
assert.equal(validateReceipt(MAX_RECEIPT_BYTES + 1, jpegHead).ok, false, 'oversize rejected')
assert.equal(validateReceipt(1024, new Uint8Array([0x25, 0x50, 0x44, 0x46])).ok, false, 'non-image (spoofed) rejected')

console.log('✓ csv + file-validation tests passed')
