'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamically import the implementation with SSR disabled.
// This prevents jspdf/fflate Node.js code from being bundled for the server pre-render.
const PdfButtonImpl = dynamic(
  () => import('./export-pdf-button-impl'),
  { 
    ssr: false,
    loading: () => (
      <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-medium border border-indigo-500/20 opacity-50 cursor-wait">
        <Loader2 className="w-4 h-4 animate-spin" />
        PDF
      </button>
    )
  }
)

interface ExportPdfButtonProps {
  expenses: any[]
}

export function ExportPdfButton({ expenses }: ExportPdfButtonProps) {
  return <PdfButtonImpl expenses={expenses} />
}
