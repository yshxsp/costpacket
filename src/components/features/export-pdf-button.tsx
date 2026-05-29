'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

export interface ExpenseForPdf {
  amount: number | string
  created_at: string
  description: string | null
  status: string
  vendor: string | null
}

interface ExportPdfButtonProps {
  expenses: ExpenseForPdf[]
}

const PdfButtonImpl = dynamic(() => import('./export-pdf-button-impl'), {
  ssr: false,
  loading: () => (
    <button
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/10 text-secondary text-sm font-medium border border-secondary/20 opacity-50 cursor-wait"
      type="button"
    >
      <Loader2 className="w-4 h-4 animate-spin" />
      PDF
    </button>
  ),
})

export function ExportPdfButton({ expenses }: ExportPdfButtonProps) {
  return <PdfButtonImpl expenses={expenses} />
}
