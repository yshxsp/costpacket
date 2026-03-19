'use server'

import { createClient } from '@/lib/supabase-server'

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

  // 1. Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}-${Date.now()}.${fileExt}`
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Upload Error:', uploadError)
    return { error: 'Failed to upload receipt image' }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('receipts')
    .getPublicUrl(fileName)

  // 2. Process with Gemini Vision
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is missing from environment variables')
    return { 
      error: 'AI parsing is unavailable (missing API key).', 
      receiptUrl: publicUrl 
    }
  }

  try {
    const bytes = await file.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString('base64')

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Extract the vendor name, total amount, and a short description (e.g. 'Hardware supplies', 'Lunch meeting') from this receipt. Return ONLY a valid, raw JSON object (not wrapped in Markdown or codeblocks) with the exact keys: 'vendor' (string), 'amount' (number), and 'description' (string)." },
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
      receiptUrl: publicUrl,
      parsedData: {
        vendor: parsed.vendor || '',
        amount: parsed.amount || 0,
        description: parsed.description || '',
      }
    }
  } catch (err: any) {
    console.error("Gemini Parsing Error:", err)
    return { 
      error: 'Failed to parse receipt with AI. You can still submit manually.', 
      receiptUrl: publicUrl 
    }
  }
}
