/** Minimal, correct CSV serializer (RFC-4180 quoting). Pure + unit-tested. */
export type CsvCell = string | number | null | undefined

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return ''
  let s = String(value)
  // Prevent spreadsheet formulas in user-controlled text, preserving numeric cells.
  if (typeof value === 'string' && /^[\t\r\n ]*[=+@-]/.test(s)) s = "'" + s
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers.map(escapeCell).join(',')]
  for (const row of rows) lines.push(row.map(escapeCell).join(','))
  return lines.join('\r\n')
}
