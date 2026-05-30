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
    doc.text('CostPacket — Expense Packet', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(120)
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 14, 30)

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
      theme: 'grid',
      headStyles: { fillColor: [27, 26, 22], textColor: [241, 236, 225] },
      styles: { fontSize: 9, cellPadding: 3 },
    })

    doc.save('costpacket_expense_packet.pdf')
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex h-10 items-center gap-2 rounded-[3px] border border-rule bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-sunken"
      type="button"
    >
      <Download className="h-4 w-4" strokeWidth={1.75} />
      Export PDF
    </button>
  )
}
