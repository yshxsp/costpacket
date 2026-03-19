'use server'

import { createClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function verifyTask(formData: FormData) {
  const taskId = formData.get('taskId') as string
  const file = formData.get('file') as File

  if (!taskId || !file || typeof file === 'string') {
    return { error: 'Invalid task ID or file' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // 1. Get task details for AI context
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('title, description')
    .eq('id', taskId)
    .single()

  if (taskError || !task) return { error: 'Task not found' }

  // 2. Upload photo proof
  const fileExt = file.name.split('.').pop()
  const fileName = `verify-${taskId}-${Date.now()}.${fileExt}`
  
  const { error: uploadError } = await supabase.storage
    .from('verifications')
    .upload(fileName, file)

  if (uploadError) return { error: 'Failed to upload proof' }

  const { data: { publicUrl } } = supabase.storage
    .from('verifications')
    .getPublicUrl(fileName)

  // 3. AI Verification with Gemini Vision
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return { error: 'AI Verification unavailable (key missing)' }
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
            { text: `Analyze this construction photo. The task is: "${task.title}". Description: "${task.description}".
            Is this task clearly completed based on the photo? 
            Return ONLY a raw JSON object with: 
            "verified" (boolean), 
            "confidence" (number 0-100), 
            "reason" (short string explaining what you see).` },
            { inlineData: { mimeType: file.type, data: base64Image } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    })

    const data = await res.json()
    const result = JSON.parse(data.candidates[0].content.parts[0].text)

    // 4. Update Task Record
    const updateData: any = {
      verification_image_url: publicUrl,
      ai_confidence: result.confidence,
      ai_verification_status: result.verified && result.confidence > 85 ? 'VERIFIED' : 'FAILED',
    }

    // Auto-complete if highly confident
    if (result.verified && result.confidence > 90) {
      updateData.status = 'COMPLETED'
    }

    const { error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)

    if (updateError) throw updateError

    revalidatePath(`/tasks/${taskId}`)
    revalidatePath('/tasks')
    
    return { 
      success: true, 
      verified: result.verified, 
      confidence: result.confidence,
      reason: result.reason 
    }

  } catch (err) {
    console.error("Verification Error:", err)
    return { error: 'AI verification failed during processing' }
  }
}
