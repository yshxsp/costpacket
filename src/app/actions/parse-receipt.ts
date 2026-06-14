'use server'

import { createClient } from '@/lib/supabase-server'

export type FieldConfidence = 'high' | 'medium' | 'low'

/** Coerce whatever the model returns into our three-level enum (low = safe default). */
function normalizeConfidence(raw: unknown): FieldConfidence {
  return raw === 'high' || raw === 'medium' ? raw : 'low'
}

export async function parseReceipt(formData: FormData) {
  const file = formData.get('file') as File
  if (!file || typeof file === 'string') {
    return { error: 'No valid file provided' }
  }

  // Security: Max 10MB file size
  if (file.size > 10 * 1024 * 1024) {
    return { error: 'File size exceeds 10MB limit' }
  }

  // Security: Only allow images
  if (!file.type.startsWith('image/')) {
    return { error: 'Only images are allowed for receipts' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Unauthorized' }
  }

  // Receipts are private and company-scoped. Storage RLS requires the object's
  // first path segment to be the uploader's company_id, and we never expose a
  // public URL — the expense stores the PATH; previews use a short-lived signed URL.
  const { data: profile } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()
  if (!profile?.company_id) {
    return { error: 'No company on your account yet.' }
  }

  // 1. Upload to Supabase Storage under <company_id>/<uid>-<ts>.<ext>
  const fileExt = file.name.split('.').pop()
  const receiptPath = `${profile.company_id}/${user.id}-${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(receiptPath, file)

  if (uploadError) {
    console.error('Upload Error:', uploadError)
    return { error: 'Failed to upload receipt image' }
  }

  // Short-lived signed URL for the form preview only; the stored value is the path.
  const { data: signed } = await supabase.storage
    .from('receipts')
    .createSignedUrl(receiptPath, 60 * 60)
  const receiptUrl = signed?.signedUrl ?? null

  // 2. Process with Gemini Vision
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing from environment variables')
    return {
      error: 'AI parsing is unavailable (missing API key).',
      receiptPath,
      receiptUrl,
    }
  }

  try {
    const bytes = await file.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString('base64')

    // We ask the model to self-report per-field confidence and overall
    // legibility. This is NOT a claim of correctness — it drives the review
    // UX: low-confidence fields are flagged so the human verifies them before
    // the expense is saved. The receipt image is always stored as the source
    // of truth; the extracted values are a draft the submitter confirms.
    const prompt =
      "You are extracting expense data from a photo of a receipt. Return ONLY a raw JSON " +
      "object (no Markdown, no code fences) with these exact keys:\n" +
      "- vendor (string): merchant/store name, '' if you cannot read it\n" +
      "- amount (number): the FINAL total paid, 0 if you cannot read it\n" +
      "- description (string): a short 2-4 word category, e.g. 'Hardware supplies', 'Lunch meeting'\n" +
      "- confidence (object): { \"vendor\": level, \"amount\": level, \"description\": level } " +
      "where each level is exactly 'high', 'medium', or 'low', reflecting how clearly you could read that field\n" +
      "- legible (boolean): true if this is a clearly readable receipt, false if it is blurry, cropped, or not a receipt\n" +
      "If a value is unreadable, return the empty/zero value AND set its confidence to 'low'."

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type, data: base64Image } }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    })

    const data = await res.json()
    if (data.error) throw new Error(data.error.message)

    const jsonText = data.candidates[0].content.parts[0].text
    const parsed = JSON.parse(jsonText)

    return {
      success: true,
      receiptPath,
      receiptUrl,
      parsedData: {
        vendor: parsed.vendor || '',
        amount: parsed.amount || 0,
        description: parsed.description || '',
      },
      confidence: {
        vendor: normalizeConfidence(parsed.confidence?.vendor),
        amount: normalizeConfidence(parsed.confidence?.amount),
        description: normalizeConfidence(parsed.confidence?.description),
      },
      // Default to legible only when the model explicitly says so isn't false —
      // a missing flag shouldn't nag the user, but an explicit false should.
      legible: parsed.legible !== false,
    }
  } catch (err: unknown) {
    console.error("Gemini Parsing Error:", err)
    return {
      error: 'Failed to parse receipt with AI. You can still submit manually.',
      receiptPath,
      receiptUrl,
    }
  }
}
