// PDF Generator utility functions
export interface PDFReportData {
  title: string
  generatedDate: string
  filters: {
    department?: string
    status?: string
    dateRange?: { from: string; to: string }
  }
  summary: {
    totalSpend: number
    totalPRs: number
    byStatus: Record<string, number>
    byDepartment: Record<string, { count: number; total: number }>
    byCategory: Record<string, { count: number; total: number }>
  }
  data: Array<{
    requestNo: string
    department: string
    requester: string
    item: string
    category: string
    quantity: number
    unitPrice: number
    total: number
    priority: string
    status: string
    requestDate: string
    approvalDate?: string
    approvedBy?: string
  }>
}

export function generatePDFReport(reportData: PDFReportData): void {
  // Create a new window for PDF generation
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const htmlContent = generateHTMLReport(reportData)
  
  printWindow.document.write(htmlContent)
  printWindow.document.close()
  
  // Trigger print dialog
  setTimeout(() => {
    printWindow.print()
  }, 1000)
}

function generateHTMLReport(data: PDFReportData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin: 0;
          font-size: 28px;
        }
        .header p {
          color: #666;
          margin: 5px 0;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          text-align: center;
        }
        .summary-card h3 {
          margin: 0 0 10px 0;
          color: #374151;
          font-size: 14px;
        }
        .summary-card .value {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        .filters {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .filters h3 {
          margin: 0 0 10px 0;
          color: #374151;
        }
        .filters p {
          margin: 5px 0;
          color: #6b7280;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px 12px;
          text-align: left;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .status-approved {
          background-color: #dcfce7;
          color: #166534;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .status-rejected {
          background-color: #fef2f2;
          color: #dc2626;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .status-submitted {
          background-color: #eff6ff;
          color: #2563eb;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .status-draft {
          background-color: #f3f4f6;
          color: #6b7280;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .priority-high {
          background-color: #fef2f2;
          color: #dc2626;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .priority-medium {
          background-color: #eff6ff;
          color: #2563eb;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .priority-low {
          background-color: #f3f4f6;
          color: #6b7280;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.title}</h1>
        <p>Generated on: ${data.generatedDate}</p>
        <p>Purchase Requisition Management System</p>
      </div>

      <div class="filters">
        <h3>Report Filters</h3>
        ${data.filters.department && data.filters.department !== 'all' ? `<p><strong>Department:</strong> ${data.filters.department}</p>` : ''}
        ${data.filters.status && data.filters.status !== 'all' ? `<p><strong>Status:</strong> ${data.filters.status}</p>` : ''}
        ${data.filters.dateRange?.from ? `<p><strong>Date Range:</strong> ${data.filters.dateRange.from} to ${data.filters.dateRange.to || 'Present'}</p>` : ''}
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <h3>Total Spend</h3>
          <div class="value">$${data.summary.totalSpend.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Total PRs</h3>
          <div class="value">${data.summary.totalPRs}</div>
        </div>
        <div class="summary-card">
          <h3>Approved</h3>
          <div class="value">${data.summary.byStatus.approved || 0}</div>
        </div>
        <div class="summary-card">
          <h3>Pending</h3>
          <div class="value">${(data.summary.byStatus.submitted || 0) + (data.summary.byStatus.draft || 0)}</div>
        </div>
      </div>

      <h2>Detailed Report</h2>
      <table>
        <thead>
          <tr>
            <th>Request No</th>
            <th>Department</th>
            <th>Requester</th>
            <th>Total</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Request Date</th>
            <th>Approval Date</th>
            <th>Approved By</th>
          </tr>
        </thead>
        <tbody>
          ${data.data.map(item => `
            <tr>
              <td>${item.requestNo}</td>
              <td>${item.department}</td>
              <td>${item.requester}</td>
              <td>$${item.total.toLocaleString()}</td>
              <td><span class="priority-${item.priority}">${item.priority}</span></td>
              <td><span class="status-${item.status}">${item.status}</span></td>
              <td>${new Date(item.requestDate).toLocaleDateString()}</td>
              <td>${item.approvalDate ? new Date(item.approvalDate).toLocaleDateString() : '-'}</td>
              <td>${item.approvedBy || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated automatically by the Purchase Requisition Management System</p>
        <p>For questions or support, please contact your system administrator</p>
      </div>
    </body>
    </html>
  `
}

export function downloadCSVReport(data: PDFReportData): void {
  const csvContent = generateCSVReport(data)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function generateCSVReport(data: PDFReportData): string {
  const headers = [
    'Request No',
    'Department',
    'Requester',
    'Total',
    'Priority',
    'Status',
    'Request Date',
    'Approval Date',
    'Approved By'
  ]
  
  const csvRows = [headers.join(',')]
  
  data.data.forEach(item => {
    const row = [
      item.requestNo,
      item.department,
      item.requester,
      item.total,
      item.priority,
      item.status,
      item.requestDate,
      item.approvalDate || '',
      item.approvedBy || ''
    ]
    csvRows.push(row.join(','))
  })
  
  return csvRows.join('\n')
}
