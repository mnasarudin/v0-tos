"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, CheckCircle, XCircle, Printer, ZoomIn } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { checkDirectAccess } from "@/lib/navigation-guard"

export default function AttendanceHistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageType, setImageType] = useState<'clockin' | 'clockout'>('clockin')

  useEffect(() => {
    // Check if this is a legitimate login redirect (has auth params)
    const urlParams = new URLSearchParams(window.location.search)
    const isLoginRedirect = urlParams.get('auth') === 'true' && urlParams.get('userId')
    
    // Only check for direct access if this is NOT a login redirect
    if (!isLoginRedirect) {
      try {
        if (checkDirectAccess()) {
          console.log('[AttendanceHistoryPage] Direct access detected, redirecting to homepage')
          router.replace('/')
          return
        }
      } catch (error) {
        console.error('[AttendanceHistoryPage] Error checking direct access:', error)
      }
    }

    // Check for logout flag - prevent forward navigation after logout
    try {
      if (typeof sessionStorage !== 'undefined') {
        const logoutFlag = sessionStorage.getItem('logoutFlag')
        if (logoutFlag === 'true') {
          sessionStorage.removeItem('logoutFlag')
          router.replace('/login')
          return
        }
      }
    } catch (error) {
      // Ignore errors
    }

    // Replace history to prevent forward navigation
    window.history.replaceState(null, '', window.location.href)

    const fetchData = async () => {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        
        try {
          const response = await fetch(`/api/attendance?userId=${currentUser.id}`)
          const data = await response.json()
          
          if (data.success && data.records) {
            setRecords(data.records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()))
          }
        } catch (error) {
          console.error('Error fetching attendance:', error)
        } finally {
          setLoading(false)
        }
      }
    }
    fetchData()
  }, [])

  const handlePrint = () => {
    const printDate = new Date().toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Attendance History - ${user?.fullName || 'Intern'}</title>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Times New Roman', serif; 
      font-size: 12pt;
      line-height: 1.6;
      color: #000;
      padding: 0;
    }
    .document {
      max-width: 210mm;
      margin: 0 auto;
      padding: 10mm 15mm;
    }
    .header-section {
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .document-info {
      display: flex;
      justify-content: space-between;
      font-size: 10pt;
    }
    .document-info .left, .document-info .right {
      width: 48%;
    }
    .document-info .label {
      font-weight: bold;
      display: inline-block;
      min-width: 80px;
    }
    .document-title {
      text-align: center;
      font-size: 16pt;
      font-weight: bold;
      margin: 12px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      page-break-inside: auto;
    }
    thead {
      display: table-header-group;
    }
    tbody {
      display: table-row-group;
    }
    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
    th, td {
      padding: 10px 12px;
      text-align: left;
      border: 1px solid #000;
      vertical-align: top;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
      text-align: center;
      font-size: 11pt;
      text-transform: uppercase;
    }
    td {
      font-size: 11pt;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #000;
      font-size: 10pt;
      text-align: center;
      color: #666;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .document {
        padding: 8mm 10mm;
      }
      @page {
        size: A4;
        margin: 10mm 10mm;
      }
      .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      tfoot { display: table-footer-group; }
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header-section">
      <div class="document-info">
        <div class="left">
          <p><span class="label">Name:</span> ${user?.fullName || 'N/A'}</p>
          <p><span class="label">Department:</span> ${user?.department || 'N/A'}</p>
        </div>
        <div class="right">
          <p><span class="label">Printed:</span> ${printDate}</p>
          <p><span class="label">Total Records:</span> ${records.length}</p>
        </div>
      </div>
    </div>

    <div class="document-title">Attendance History</div>

    <table>
      <thead>
        <tr>
          <th style="width: 12%;">Date</th>
          <th style="width: 8%;">Day</th>
          <th style="width: 12%;">Clock In Time</th>
          <th style="width: 12%;">Clock Out Time</th>
          <th style="width: 12%;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${records.length === 0 ? '<tr><td colspan="5" style="text-align: center; padding: 20px;">No records found</td></tr>' : records.map(record => {
          const recordDate = new Date(record.date)
          return `
          <tr>
            <td style="text-align: center;">${recordDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="text-align: center;">${recordDate.toLocaleDateString('en-US', { weekday: 'short' })}</td>
            <td style="text-align: center;">${record.clockInTime || '-'}</td>
            <td style="text-align: center;">${record.clockOutTime || '-'}</td>
            <td style="text-align: center;">${record.status === 'on-time' ? 'On Time' : record.status === 'late' ? 'Late' : record.status === 'absent' ? 'Absent' : record.status || '-'}</td>
          </tr>
        `
        }).join('')}
      </tbody>
    </table>

    <div class="footer">
      <p>This document was generated electronically on ${printDate}</p>
    </div>
  </div>
</body>
</html>
    `
    
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Attendance History</h1>
          <p className="text-muted-foreground">View your attendance records in tabular format</p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Records
          </CardTitle>
          <CardDescription>
            Complete attendance history with photos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading attendance records...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No attendance records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Day</th>
                    <th className="text-left p-3 font-semibold">Clock In Time</th>
                    <th className="text-left p-3 font-semibold">Clock In Photo</th>
                    <th className="text-left p-3 font-semibold">Clock Out Time</th>
                    <th className="text-left p-3 font-semibold">Clock Out Photo</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-3">
                        {format(new Date(record.date), 'EEE')}
                      </td>
                      <td className="p-3">
                        {record.clockInTime || (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        {record.clockInImage ? (
                          <button
                            onClick={() => {
                              setSelectedImage(record.clockInImage)
                              setImageType('clockin')
                            }}
                            className="group relative"
                          >
                            <img
                              src={record.clockInImage}
                              alt="Clock In"
                              className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded transition-opacity">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        {record.clockOutTime || (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        {record.clockOutImage ? (
                          <button
                            onClick={() => {
                              setSelectedImage(record.clockOutImage)
                              setImageType('clockout')
                            }}
                            className="group relative"
                          >
                            <img
                              src={record.clockOutImage}
                              alt="Clock Out"
                              className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 rounded transition-opacity">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </div>
                          </button>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            record.status === 'on-time' ? 'default' :
                            record.status === 'late' ? 'destructive' :
                            'secondary'
                          }
                          className="capitalize"
                        >
                          {record.status === 'on-time' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {record.status === 'late' && <XCircle className="h-3 w-3 mr-1" />}
                          {record.status === 'absent' && <XCircle className="h-3 w-3 mr-1" />}
                          {record.status === 'on-time' ? 'On Time' :
                           record.status === 'late' ? 'Late' : 'Absent'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {imageType === 'clockin' ? 'Clock In Photo' : 'Clock Out Photo'}
            </DialogTitle>
            <DialogDescription>
              Click outside to close
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="flex items-center justify-center">
              <img
                src={selectedImage}
                alt={imageType === 'clockin' ? 'Clock In' : 'Clock Out'}
                className="max-w-full max-h-[70vh] rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}