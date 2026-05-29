'use client'

import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExpenseForPdf } from './export-pdf-button'

interface ExportPdfButtonImplProps {
  expenses: ExpenseForPdf[]
}

export default function ExportPdfButtonImpl({ expenses }: ExportPdfButtonImplProps) {
  const handleExport = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Expenses Report', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)

    const tableColumn = ['Date', 'Vendor', 'Description', 'Amount', 'Status']
    const tableRows: string[][] = expenses.map((expense) => [
      new Date(expense.created_at).toLocaleDateString(),
      expense.vendor || 'N/A',
      expense.description || '',
      `$${Number(expense.amount).toFixed(2)}`,
      expense.status,
    ])

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save('expenses_report.pdf')
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
      type="button"
    >
      <Download className="w-4 h-4" />
      Export PDF
    </button>
  )
}
