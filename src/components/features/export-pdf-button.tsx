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
      className="inline-flex h-10 cursor-wait items-center gap-2 rounded-[3px] border border-rule bg-surface px-4 text-sm font-medium text-ink-muted opacity-60"
      type="button"
    >
      <Loader2 className="h-4 w-4 animate-spin" />
      PDF
    </button>
  ),
})

export function ExportPdfButton({ expenses }: ExportPdfButtonProps) {
  return <PdfButtonImpl expenses={expenses} />
}
