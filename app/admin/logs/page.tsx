"use client"
import { useState, useEffect } from 'react';
import { AdminGuard } from '@/components/auth-guard';
import { AdminLayout } from '@/components/admin-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Printer } from 'lucide-react';
import { DEPARTMENTS, getCurrentUser } from '@/lib/auth';
import { exportTableToPDF } from '@/lib/pdf-export';

function LogsTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    getCurrentUser().then(user => setCurrentUser(user)).catch(console.error);
  }, []);

  useEffect(() => { 
    fetch('/api/logs')
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching logs:', err);
        setLoading(false);
      });
  }, []);
  
  useEffect(() => {
    let result = logs;
    
    // Filter by department
    if (departmentFilter) {
      result = result.filter(l => l.department === departmentFilter);
    }
    
    // Filter by search
    if (search) {
      result = result.filter(l =>
      l.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      l.content?.toLowerCase().includes(search.toLowerCase()) ||
        l.date?.includes(search)
      );
    }
    
    setFiltered(result);
  }, [search, departmentFilter, logs]);

  const getFilterText = () => {
    if (departmentFilter) {
      return `Department: ${departmentFilter}`
    }
    return null
  }

  const handleExportPDF = () => {
    const filterText = getFilterText()
    
    exportTableToPDF({
      title: 'All Volume Logs',
      filterText: filterText || undefined,
      columns: [
        { header: 'Intern', accessor: 'fullName', width: 50 },
        { header: 'Department', accessor: 'department', width: 60 },
        { header: 'Date', accessor: 'date', width: 40 },
        { 
          header: 'Log Content', 
          accessor: (row: any) => {
            if (!row.content) return '-'
            const lines = row.content.split('\n').filter((line: string) => line.trim())
            return lines.map((line: string) => `- ${line.trim()}`).join('\n')
          },
          width: 100
        }
      ],
      data: filtered,
      filename: `volume-logs-${new Date().toISOString().split('T')[0]}.pdf`,
      userName: currentUser?.fullName,
      userDepartment: currentUser?.department
    })
  };
  
  const filterText = getFilterText()

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          body {
            background: white;
          }
        }
        .print-only {
          display: none;
        }
      `}</style>
      <div className="space-y-3">
        {/* Print-only title */}
        <div className="print-only mb-4">
          <h1 className="text-xl font-bold text-gray-900">All Volume Logs</h1>
          {filterText && (
            <p className="text-sm text-gray-600 mt-1">{filterText}</p>
          )}
        </div>

        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-xl font-bold text-turquoise-900">All Volume Logs</h1>
            <p className="text-xs text-gray-500 mt-1">Showing all volume logs from all interns</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" size="sm" className="h-8 text-xs">
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button onClick={() => {
              const printWindow = window.open('', '_blank')
              if (!printWindow) return
              
              const tableRows = filtered.map(row => {
                const content = (row.content || '').split('\n').filter((line: string) => line.trim()).map((line: string) => `- ${line.trim()}`).join('<br>')
                const date = row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'
                return `
                  <tr>
                    <td>${row.fullName || '-'}</td>
                    <td>${row.department || '-'}</td>
                    <td>${date}</td>
                    <td>${content || '-'}</td>
                  </tr>
                `
              }).join('')
              
              printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                  <head>
                    <title>All Volume Logs</title>
                    <style>
                      body { font-family: Arial, sans-serif; padding: 20px; }
                      h1 { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
                      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                      th { background-color: #f3f4f6; border: 1px solid #d1d5db; padding: 8px; text-align: left; font-weight: bold; font-size: 11px; }
                      td { border: 1px solid #d1d5db; padding: 8px; font-size: 11px; }
                      tr:nth-child(even) { background-color: #f9fafb; }
                    </style>
                  </head>
                  <body>
                    <h1>All Volume Logs</h1>
                    <p>Showing all volume logs from all interns</p>
                    <table>
                      <thead>
                        <tr>
                          <th>Intern</th>
                          <th>Department</th>
                          <th>Date</th>
                          <th>Log Content</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${tableRows}
                      </tbody>
                    </table>
                  </body>
                </html>
              `)
              printWindow.document.close()
              setTimeout(() => printWindow.print(), 250)
            }} variant="outline" size="sm" className="h-8 text-xs">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        <Card className="border-turquoise-200 no-print">
        <CardContent className="p-2.5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-turquoise-500" />
              <Input
                placeholder="Search by intern name, content, or date..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm border-turquoise-300 focus:border-turquoise-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-turquoise-500" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-8 rounded-md border border-turquoise-300 bg-white px-3 py-1 text-sm focus:border-turquoise-500 focus:outline-none focus:ring-2 focus:ring-turquoise-200"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
      </div>
        </CardContent>
      </Card>

      <Card className="border-turquoise-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading logs...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No logs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
          <thead>
                  <tr className="bg-turquoise-50 border-b border-turquoise-200">
                    <th className="text-left p-2 font-semibold text-xs text-turquoise-900">Intern</th>
                    <th className="text-left p-2 font-semibold text-xs text-turquoise-900">Department</th>
                    <th className="text-left p-2 font-semibold text-xs text-turquoise-900">Date</th>
                    <th className="text-left p-2 font-semibold text-xs text-turquoise-900">Log Content</th>
            </tr>
          </thead>
          <tbody>
                  {filtered.map((row, i) => {
                    const formatContent = (text: string) => {
                      if (!text) return '-'
                      const lines = text.split('\n').filter(line => line.trim())
                      if (lines.length === 0) return '-'
                      return (
                        <ul className="list-none space-y-1">
                          {lines.map((line, lineIdx) => (
                            <li key={lineIdx} className="flex items-start">
                              <span className="mr-2">-</span>
                              <span>{line.trim()}</span>
                            </li>
                          ))}
                        </ul>
                      )
                    }
                    
                    return (
                      <tr key={i} className="border-b border-turquoise-100 hover:bg-turquoise-50">
                        <td className="p-2 text-sm font-medium">{row.fullName || '-'}</td>
                        <td className="p-2 text-xs text-gray-600">{row.department || '-'}</td>
                        <td className="p-2 text-xs">{row.date ? new Date(row.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'}</td>
                        <td className="p-2 text-xs">{formatContent(row.content || '')}</td>
              </tr>
                    )
                  })}
          </tbody>
        </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <AdminGuard>
      <AdminLayout>
        <LogsTable />
      </AdminLayout>
    </AdminGuard>
  );
}




