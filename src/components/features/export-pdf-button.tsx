'use client'

import { Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ExportPdfButtonProps {
  expenses: any[]
}

export function ExportPdfButton({ expenses }: ExportPdfButtonProps) {
  const handleExport = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.text('Expenses Report', 14, 22)
    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)

    const tableColumn = ["Date", "Vendor", "Description", "Amount", "Status"]
    const tableRows: any[] = []

    expenses.forEach(exp => {
      const expDate = new Date(exp.created_at).toLocaleDateString()
      const amount = `$${Number(exp.amount).toFixed(2)}`
      const expData = [
        expDate,
        exp.vendor || 'N/A',
        exp.description,
        amount,
        exp.status
      ]
      tableRows.push(expData)
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }, // Indigo 500
    })

    doc.save('expenses_report.pdf')
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-sm font-medium hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
    >
      <Download className="w-4 h-4" />
      Export PDF
    </button>
  )
}
