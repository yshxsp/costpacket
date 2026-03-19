'use client'

import { useState } from 'react'
import { Camera, CheckCircle2, Upload, Loader2, Info } from 'lucide-react'
import { verifyTask } from '@/app/actions/verify-task'
import { toast } from 'sonner'
import Image from 'next/image'

interface TaskVerificationProps {
  taskId: string
  taskTitle: string
  existingImageUrl?: string | null
  aiStatus?: string | null
  aiConfidence?: number | null
}

export function TaskVerification({ 
  taskId, 
  taskTitle,
  existingImageUrl,
  aiStatus,
  aiConfidence
}: TaskVerificationProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setLoading(true)

    const formData = new FormData()
    formData.append('taskId', taskId)
    formData.append('file', file)

    try {
      const result = await verifyTask(formData)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`AI Verification: ${result.verified ? 'Success' : 'Low Confidence'}`)
        if (result.reason) toast.info(result.reason)
      }
    } catch (err) {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-5 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white flex items-center gap-2">
          <Camera className="w-5 h-5 text-indigo-400" />
          AI Photo Proof
        </h2>
        {aiStatus === 'VERIFIED' && (
          <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            AI VERIFIED ({aiConfidence}%)
          </span>
        )}
      </div>

      <div className="space-y-4">
        {preview ? (
          <div className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group">
            <Image 
              src={preview} 
              alt="Proof" 
              fill 
              className="object-cover transition-opacity group-hover:opacity-50"
            />
            {!loading && (
              <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <div className="bg-black/60 px-4 py-2 rounded-lg text-white text-xs font-medium flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Replace Photo
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
              </label>
            )}
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-white font-medium">AI Analyzing...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6 text-indigo-400" />
            </div>
            <p className="text-sm text-zinc-300 font-medium">Upload photo proof</p>
            <p className="text-xs text-zinc-500 mt-1">Our AI will verify task completion</p>
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
        )}

        <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex gap-3">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            <span className="text-indigo-300 font-medium">BuildOps AI Protection:</span> This feature prevents payment fraud by requiring visual evidence of work. If the AI confidence exceeds 90%, the task status will automatically update to "Completed".
          </p>
        </div>
      </div>
    </div>
  )
}
