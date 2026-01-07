"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock, AlertCircle, Printer, Edit2, Save, X } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "sonner"
import { format } from "date-fns"
import { checkDirectAccess } from "@/lib/navigation-guard"

export default function VolumeLogsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [content, setContent] = useState("")
  const [todayLog, setTodayLog] = useState<any>(null)
  const [allLogs, setAllLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState<string>("")

  // Format content to display with bullet points (dashes)
  const formatContentWithBullets = (text: string) => {
    if (!text) return <span className="text-muted-foreground">No content</span>
    const lines = text.split('\n').filter(line => line.trim())
    return (
      <ul className="list-none space-y-1">
        {lines.map((line, index) => (
          <li key={index} className="flex items-start">
            <span className="mr-2">-</span>
            <span>{line.trim()}</span>
          </li>
        ))}
      </ul>
    )
  }

  useEffect(() => {
    // Check for direct URL access - redirect to homepage
    try {
      if (checkDirectAccess()) {
        console.log('[VolumeLogsPage] Direct access detected, redirecting to homepage')
        router.replace('/')
        return
      }
    } catch (error) {
      console.error('[VolumeLogsPage] Error checking direct access:', error)
    }

    const fetchData = async () => {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        
        try {
          const today = new Date().toISOString().split('T')[0]
          const todayResponse = await fetch(`/api/logs?userId=${currentUser.id}&date=${today}`)
          const todayData = await todayResponse.json()
          
          if (todayData.success && todayData.log) {
            setTodayLog(todayData.log)
            setContent(todayData.log.content || "")
          }
          
          const logsResponse = await fetch(`/api/logs?userId=${currentUser.id}`)
          const logsData = await logsResponse.json()
          
          if (logsData.success && logsData.logs) {
            setAllLogs(logsData.logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()))
          }
        } catch (error) {
          console.error('Error fetching logs:', error)
        }
      }
    }
    fetchData()
  }, [router])
  
  // Calculate time restrictions (done here so it's available to handlers)
  // Use state to ensure it recalculates on each render
  const [timeRestrictions, setTimeRestrictions] = useState(() => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinute
    return {
      currentTimeInMinutes,
      isInAccessTime: currentTimeInMinutes >= 480 && currentTimeInMinutes < 1140, // 8am to 7pm
      isBefore7PM: currentTimeInMinutes < 1140, // Before 7pm
    }
  })

  // Update time restrictions periodically (every minute)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeInMinutes = currentHour * 60 + currentMinute
      setTimeRestrictions({
        currentTimeInMinutes,
        isInAccessTime: currentTimeInMinutes >= 480 && currentTimeInMinutes < 1140,
        isBefore7PM: currentTimeInMinutes < 1140,
      })
    }
    
    // Update immediately
    updateTime()
    
    // Update every minute
    const interval = setInterval(updateTime, 60000)
    return () => clearInterval(interval)
  }, [])

  const { isInAccessTime, isBefore7PM } = timeRestrictions
  
  // Check if today's log can still be edited
  // Can edit if: within access time (8am-7pm) AND before 7pm
  // This allows multiple edits throughout the day until 7pm
  const today = new Date().toISOString().split('T')[0]
  const canEditToday = isInAccessTime && isBefore7PM
  
  // Check if a specific log can be edited
  const canEditLog = (logDate: string) => {
    if (logDate !== today) return false
    return canEditToday
  }
  
  // Start editing a log from the table
  const handleStartEdit = (log: any) => {
    if (!canEditLog(log.date)) {
      toast.error('This log cannot be edited. Logs can only be edited before 7:00 PM on the same day.')
      return
    }
    setEditingLogId(log.id)
    setEditingContent(log.content || "")
  }
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingLogId(null)
    setEditingContent("")
  }
  
  // Save edited log from table
  const handleSaveEdit = async () => {
    if (!user || !editingLogId) return
    
    if (!canEditToday) {
      toast.error('Cannot edit log. Volume logs can only be edited between 8:00 AM and 7:00 PM.')
      return
    }
    
    setLoading(true)
    try {
      // Find the log being edited
      const log = allLogs.find(l => l.id === editingLogId)
      if (!log) {
        toast.error('Log not found')
        return
      }
      
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content: editingContent, date: log.date })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Refresh logs
        const logsResponse = await fetch(`/api/logs?userId=${user.id}`)
        const logsData = await logsResponse.json()
        
        if (logsData.success && logsData.logs) {
          setAllLogs(logsData.logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()))
        }
        
        // Update today's log if it was today
        if (log.date === today) {
          const todayResponse = await fetch(`/api/logs?userId=${user.id}&date=${today}`)
          const todayData = await todayResponse.json()
          
          if (todayData.success && todayData.log) {
            setTodayLog(todayData.log)
            setContent(todayData.log.content || "")
          }
        }
        
        setEditingLogId(null)
        setEditingContent("")
        toast.success("Volume log updated successfully!")
      } else {
        toast.error(result.error || "Failed to update volume log")
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error("Failed to update volume log")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    // Double-check client-side restrictions before attempting to save
    if (!canEditToday) {
      toast.error('Cannot edit log. Volume logs can only be edited between 8:00 AM and 7:00 PM.')
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Clear the form after successful save - keep it blank
        setContent("")
        
        // Refresh all logs to show the saved log in the table below
        const logsResponse = await fetch(`/api/logs?userId=${user.id}`)
        const logsData = await logsResponse.json()
        
        if (logsData.success && logsData.logs) {
          setAllLogs(logsData.logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()))
          
          // Update todayLog state but don't populate the form
          const today = new Date().toISOString().split('T')[0]
          const todayLogEntry = logsData.logs.find((log: any) => log.date === today)
          if (todayLogEntry) {
            setTodayLog(todayLogEntry)
          }
        }
        
        toast.success("Volume log saved successfully! You can edit it in the table below.")
      } else {
        toast.error(result.error || "Failed to save volume log")
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error("Failed to save volume log")
    } finally {
      setLoading(false)
    }
  }

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
  <title>Volume Logs - ${user?.fullName || 'Intern'}</title>
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
    .company-info {
      text-align: center;
      margin-bottom: 8px;
    }
    .company-info h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 3px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .company-info p {
      font-size: 9pt;
      color: #333;
    }
    .document-info {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
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
    .content-cell {
      white-space: pre-wrap;
      max-width: 400px;
      line-height: 1.5;
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
          <p><span class="label">Total Records:</span> ${allLogs.length}</p>
        </div>
      </div>
    </div>

    <div class="document-title">Volume Logs</div>

    <table>
      <thead>
        <tr>
          <th style="width: 15%;">Date</th>
          <th style="width: 10%;">Day</th>
          <th style="width: 75%;">Content</th>
        </tr>
      </thead>
      <tbody>
        ${allLogs.length === 0 ? '<tr><td colspan="3" style="text-align: center; padding: 20px;">No logs found</td></tr>' : allLogs.map(log => {
          const content = log.content ? log.content.split('\n').filter((line: string) => line.trim()).map((line: string) => `• ${line.trim()}`).join('<br>') : 'No content'
          const logDate = new Date(log.date)
          return `
          <tr>
            <td style="text-align: center;">${logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="text-align: center;">${logDate.toLocaleDateString('en-US', { weekday: 'short' })}</td>
            <td class="content-cell">${content}</td>
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


  if (user?.isAdmin) {
    return <div className="p-12 text-center text-xl text-cyan-800">Admins do not submit volume logs. Log writing is for interns only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Volume Logs</h1>
          <p className="text-muted-foreground">Record your daily tasks and activities</p>
        </div>
        <Button onClick={handlePrint} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </div>

      {!isInAccessTime && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">
                Volume logs are only accessible between 8:00 AM - 7:00 PM. Current time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {todayLog && todayLog.date === today && !isBefore7PM && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">
                Today's log can only be edited until 7:00 PM. It is now read-only. (Current time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })})
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Today's Log - {format(new Date(), 'MMMM d, yyyy')}
          </CardTitle>
          <CardDescription>
            Record your tasks and activities for today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={`Enter your tasks and activities, one per line:
- Task 1
- Task 2
- Task 3`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            disabled={!canEditToday}
            className="resize-none font-mono"
          />
          <Button
            onClick={handleSave}
            disabled={!canEditToday || loading}
            className="w-full"
          >
            {loading ? "Saving..." : !isInAccessTime ? "Not Available (Outside 8AM-7PM)" : !isBefore7PM ? "Cannot Edit (After 7:00 PM)" : "Save Log"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            All Logs
          </CardTitle>
          <CardDescription>
            View all your volume logs. Today's log can be edited before 7:00 PM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allLogs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Day</th>
                    <th className="text-left p-3 font-semibold">Content</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allLogs.map((log) => {
                    const isEditing = editingLogId === log.id
                    const canEdit = canEditLog(log.date)
                    const isToday = log.date === today
                    
                    return (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {format(new Date(log.date), 'MMM dd, yyyy')}
                            {isToday && (
                              <Badge variant="outline" className="text-xs">Today</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {format(new Date(log.date), 'EEE')}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <Textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              rows={6}
                              className="w-full max-w-2xl font-mono text-sm"
                              placeholder="Enter your tasks and activities, one per line"
                            />
                          ) : (
                            <div className="text-sm max-w-2xl">
                              {formatContentWithBullets(log.content || '')}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={loading}
                                className="h-8"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                disabled={loading}
                                className="h-8"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          ) : canEdit ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStartEdit(log)}
                              className="h-8"
                            >
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                          ) : (
                            <span className="text-muted-foreground text-sm">Read-only</span>
                          )}
                        </td>
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
  )
}