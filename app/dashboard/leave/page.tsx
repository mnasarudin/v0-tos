"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, FileText, Send, Clock, CheckCircle2, XCircle, Printer, Download, Upload, X, Eye, Trash2, RefreshCw } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { exportTableToPDF, exportTableToCSV } from '@/lib/pdf-export'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { checkDirectAccess } from "@/lib/navigation-guard"

export default function LeavePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [leaves, setLeaves] = useState<any[]>([])
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'regular' as 'regular' | 'emergency' | 'mc',
    startDate: '',
    endDate: '',
    reason: '',
    mcFile: null as File | null
  })
  const [mcPreview, setMcPreview] = useState<string | null>(null)
  const [viewMcDialog, setViewMcDialog] = useState<{ open: boolean; mcFile: string | null; fileName?: string }>({ open: false, mcFile: null })
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; leaveId: string | null }>({ open: false, leaveId: null })
  const [deleting, setDeleting] = useState(false)
  const myLeavesRef = useRef<HTMLDivElement>(null)
  const isSubmittingRef = useRef<boolean>(false)

  useEffect(() => {
    // Check if this is a legitimate login redirect (has auth params)
    const urlParams = new URLSearchParams(window.location.search)
    const isLoginRedirect = urlParams.get('auth') === 'true' && urlParams.get('userId')
    
    // Only check for direct access if this is NOT a login redirect
    if (!isLoginRedirect) {
      try {
        if (checkDirectAccess()) {
          console.log('[LeavePage] Direct access detected, redirecting to homepage')
          router.replace('/')
          return
        }
      } catch (error) {
        console.error('[LeavePage] Error checking direct access:', error)
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
        fetchLeaves(currentUser.id)
      }
      setLoading(false)
    }
    fetchData()
    
    // Set up automatic refresh every 10 seconds to check for leave status updates
    const refreshInterval = setInterval(async () => {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        fetchLeaves(currentUser.id)
      }
    }, 10000) // Refresh every 10 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval)
  }, [])

  const fetchLeaves = async (userId: string) => {
    try {
      const res = await fetch(`/api/leaves?userId=${userId}`)
      const data = await res.json()
      if (data.success && data.leaves) {
        // Deduplicate leaves by ID to prevent duplicate keys
        const uniqueLeaves = data.leaves.reduce((acc: any[], leave: any) => {
          const existing = acc.find(l => l.id === leave.id)
          if (!existing) {
            acc.push(leave)
          } else {
            console.warn('⚠️ Duplicate leave found, keeping first:', leave.id)
          }
          return acc
        }, [])
        console.log('📋 Fetched leaves:', { total: data.leaves.length, unique: uniqueLeaves.length })
        
        // Debug: Log approved_hod leaves to verify data structure
        const approvedLeaves = uniqueLeaves.filter((l: any) => l.status === 'approved_hod')
        if (approvedLeaves.length > 0) {
          console.log('✅ Approved HOD leaves found:', approvedLeaves.map((l: any) => ({
            id: l.id,
            status: l.status,
            supervisorApprovedAt: l.supervisorApprovedAt,
            hodApprovedAt: l.hodApprovedAt,
            supervisorRejectedAt: l.supervisorRejectedAt,
            rejectedAt: l.rejectedAt
          })))
        }
        
        setLeaves(uniqueLeaves)
      }
    } catch (error) {
      console.error('Error fetching leaves:', error)
    }
  }

  const getLeaveTypeBadge = (leaveType: string) => {
    switch (leaveType) {
      case 'regular':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Regular Leave</Badge>
      case 'emergency':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Emergency Leave</Badge>
      case 'mc':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">MC</Badge>
      default:
        return <Badge variant="outline">{leaveType || 'Regular Leave'}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending Supervisor Review</Badge>
      case 'supervisor_approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pending Final Review (Encik Shap)</Badge>
      case 'approved_hod':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getStatusSteps = (leave: any) => {
    // Determine which stage we're at
    const isPending = leave.status === 'pending'
    
    // Supervisor is approved if: 
    // - status is supervisor_approved OR 
    // - supervisorApprovedAt is set OR 
    // - status is approved_hod (HOD auto-completed both stages for Pentadbiran)
    const isSupervisorApproved = leave.status === 'supervisor_approved' || 
                                 !!leave.supervisorApprovedAt || 
                                 leave.status === 'approved_hod'
    
    // HOD is approved if: 
    // - status is approved_hod OR 
    // - hodApprovedAt is set
    const isHODApproved = leave.status === 'approved_hod' || !!leave.hodApprovedAt
    
    const isRejected = leave.status === 'rejected'
    
    // Determine who rejected
    // Supervisor rejected: rejected status + supervisorRejectedAt set + no supervisorApprovedAt
    const isSupervisorRejected = isRejected && !!leave.supervisorRejectedAt && !leave.supervisorApprovedAt
    
    // HOD rejected: rejected status + (supervisorApprovedAt set OR hodApprovedAt was set) OR rejectedAt is set without supervisorRejectedAt
    const isHODRejected = isRejected && (!!leave.supervisorApprovedAt || !!leave.hodApprovedAt || (!!leave.rejectedAt && !leave.supervisorRejectedAt))
    
    const steps = [
      { 
        label: 'Applied', 
        completed: true, 
        icon: CheckCircle2,
        rejected: false
      },
      { 
        label: 'Supervisor Review', 
        // Completed if: supervisor approved, HOD approved (auto-completed), or rejected
        completed: isSupervisorApproved || isSupervisorRejected || isHODApproved || isHODRejected, 
        icon: isSupervisorRejected ? XCircle : (isSupervisorApproved || isHODApproved || isHODRejected ? CheckCircle2 : Clock),
        rejected: isSupervisorRejected,
        current: isPending && !isSupervisorRejected && !isHODApproved && !isHODRejected
      },
      { 
        label: 'Final Review (Encik Shap)', 
        // Completed if: HOD approved (status is approved_hod OR hodApprovedAt is set) or HOD rejected
        // Force boolean conversion to ensure it's always a boolean
        completed: Boolean(isHODApproved || isHODRejected), 
        icon: isHODRejected ? XCircle : (isHODApproved ? CheckCircle2 : (isSupervisorApproved ? Clock : Clock)),
        rejected: Boolean(isHODRejected),
        current: Boolean(isSupervisorApproved && !isHODApproved && !isHODRejected)
      }
    ]
    
    // Enhanced debug logging for ALL leaves to help diagnose the issue
    console.log('🔍 Step Calculation Debug for leave:', leave.id, {
      status: leave.status,
      supervisorApprovedAt: leave.supervisorApprovedAt,
      hodApprovedAt: leave.hodApprovedAt,
      supervisorRejectedAt: leave.supervisorRejectedAt,
      rejectedAt: leave.rejectedAt,
      isSupervisorApproved,
      isHODApproved,
      isSupervisorRejected,
      isHODRejected,
      supervisorStepCompleted: steps[1].completed,
      finalReviewStepCompleted: steps[2].completed,
      finalReviewIcon: steps[2].icon === CheckCircle2 ? 'CheckCircle2' : steps[2].icon === XCircle ? 'XCircle' : 'Clock',
      finalReviewCompleted: steps[2].completed
    })
    
    return steps
  }

  if (user?.isAdmin) {
    return <div className="p-12 text-center text-xl text-cyan-800">Admins do not apply for leave. Leave applications are for interns only.</div>;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type (PDF, JPG, PNG)
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF, JPG, or PNG file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      
      setLeaveForm({ ...leaveForm, mcFile: file })
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setMcPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setMcPreview(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setLeaveForm({ ...leaveForm, mcFile: null })
    setMcPreview(null)
  }

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Use ref for immediate synchronous check to prevent double submission
    if (isSubmittingRef.current) {
      console.log('⚠️ Submission already in progress (ref check), ignoring duplicate submit')
      e.preventDefault()
      e.stopPropagation()
      return false
    }
    
    // Also check state as backup
    if (submitting) {
      console.log('⚠️ Submission already in progress (state check), ignoring duplicate submit')
      e.preventDefault()
      e.stopPropagation()
      return false
    }
    
    // Disable the form to prevent any further submissions
    const form = e.currentTarget as HTMLFormElement
    if (form) {
      form.style.pointerEvents = 'none'
      const inputs = form.querySelectorAll('input, button, select, textarea')
      inputs.forEach((input: any) => {
        input.disabled = true
      })
    }
    
    if (!user || !user.id) {
      toast.error('User information not available. Please refresh the page.')
      console.error('User not available:', user)
      return
    }
    
    if (!leaveForm.startDate || !leaveForm.endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    if (new Date(leaveForm.startDate) > new Date(leaveForm.endDate)) {
      toast.error('End date must be after start date')
      return
    }

    // For MC leave type, MC file is required (reason is not needed)
    if (leaveForm.leaveType === 'mc') {
      if (!leaveForm.mcFile) {
        toast.error('Medical Certificate is required for MC leave')
        return
      }
    } else {
      // For regular and emergency leave, reason is required
      if (!leaveForm.reason) {
        toast.error('Please provide a reason for your leave')
        return
      }
    }

    // Set both ref and state immediately to prevent double submission
    isSubmittingRef.current = true
    setSubmitting(true)
    
    try {
      let mcFileBase64 = null
      if (leaveForm.mcFile) {
        mcFileBase64 = await convertFileToBase64(leaveForm.mcFile)
      }

      // Generate unique request ID to track this specific submission
      const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      console.log('📤 Submitting leave application:', {
        requestId,
        userId: user.id,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
        hasMcFile: !!mcFileBase64,
        timestamp: new Date().toISOString()
      })

      const response = await fetch('/api/leaves', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Request-ID': requestId // Add request ID header
        },
        body: JSON.stringify({
          userId: user.id,
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.leaveType === 'mc' ? 'Medical Certificate' : leaveForm.reason,
          mcFile: mcFileBase64,
          requestId // Include in body too
        })
      })
      
      console.log('📥 Response received for request:', requestId, 'Status:', response.status)

      console.log('Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API error response:', errorText)
        try {
          const errorData = JSON.parse(errorText)
          toast.error(errorData.error || `Server error: ${response.status}`)
        } catch {
          toast.error(`Server error: ${response.status} - ${errorText}`)
        }
        // Reset on error so user can retry
        isSubmittingRef.current = false
        setSubmitting(false)
        const form = document.getElementById('leave-application-form') as HTMLFormElement
        if (form) {
          form.style.pointerEvents = 'auto'
          const inputs = form.querySelectorAll('input, button, select, textarea')
          inputs.forEach((input: any) => {
            input.disabled = false
          })
        }
        return
      }
      
      const data = await response.json()
      console.log('Response data:', data)

      if (data.success) {
        toast.success('Leave application submitted successfully!')
        setLeaveForm({ leaveType: 'regular', startDate: '', endDate: '', reason: '', mcFile: null })
        setMcPreview(null)
        // Reset submission state immediately
        isSubmittingRef.current = false
        setSubmitting(false)
        // Re-enable form
        const form = document.getElementById('leave-application-form') as HTMLFormElement
        if (form) {
          form.style.pointerEvents = 'auto'
          const inputs = form.querySelectorAll('input, button, select, textarea')
          inputs.forEach((input: any) => {
            input.disabled = false
          })
        }
        // Refresh leave applications list after a short delay to ensure DB is updated
        setTimeout(() => {
          fetchLeaves(user.id)
        }, 500)
        // Scroll to "My Leave Applications" section
        setTimeout(() => {
          myLeavesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 1000)
      } else {
        console.error('API error:', data.error)
        toast.error(data.error || 'Failed to submit leave application')
      }
    } catch (error: any) {
      console.error('Error submitting leave application:', error)
      toast.error(`Failed to submit leave application: ${error.message || 'Network error'}`)
    } finally {
      // Re-enable the form
      const form = document.getElementById('leave-application-form') as HTMLFormElement
      if (form) {
        form.style.pointerEvents = 'auto'
        const inputs = form.querySelectorAll('input, button, select, textarea')
        inputs.forEach((input: any) => {
          input.disabled = false
        })
      }
      
      // Reset both ref and state
      isSubmittingRef.current = false
      setSubmitting(false)
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
  <title>Leave Applications - ${user?.fullName || 'Intern'}</title>
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
    .content-cell {
      white-space: pre-wrap;
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
          <p><span class="label">Total Records:</span> ${leaves.length}</p>
        </div>
      </div>
    </div>

    <div class="document-title">Leave Applications</div>

    <table>
      <thead>
        <tr>
          <th style="width: 12%;">Leave Type</th>
          <th style="width: 12%;">Start Date</th>
          <th style="width: 12%;">End Date</th>
          <th style="width: 32%;">Reason</th>
          <th style="width: 16%;">Status</th>
          <th style="width: 16%;">Reviewer Note</th>
        </tr>
      </thead>
      <tbody>
        ${leaves.length === 0 ? '<tr><td colspan="6" style="text-align: center; padding: 20px;">No leave applications found</td></tr>' : leaves.map(leave => {
          const startDate = new Date(leave.startDate)
          const endDate = new Date(leave.endDate)
          const leaveType = leave.leaveType || 'regular'
          const leaveTypeText = leaveType === 'regular' ? 'Regular Leave' : leaveType === 'emergency' ? 'Emergency Leave' : 'MC'
          const statusText = leave.status === 'pending' ? 'Pending Supervisor Review' : 
                            leave.status === 'supervisor_approved' ? 'Pending Final Review (Encik Shap)' : 
                            leave.status === 'approved_hod' ? 'Approved' : 
                            leave.status === 'rejected' ? 'Rejected' : leave.status || 'N/A'
          return `
          <tr>
            <td style="text-align: center;">${leaveTypeText}</td>
            <td style="text-align: center;">${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td style="text-align: center;">${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            <td class="content-cell">${leave.reason || '-'}</td>
            <td style="text-align: center;">${statusText}</td>
            <td class="content-cell">${leave.reviewerNote || '-'}</td>
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

  const handleExportPDF = () => {
    exportTableToPDF({
      title: 'Leave Applications',
      columns: [
        { header: 'Leave Type', accessor: (row: any) => {
          const type = row.leaveType || 'regular'
          return type === 'regular' ? 'Regular Leave' : type === 'emergency' ? 'Emergency Leave' : 'MC'
        }, width: 20 },
        { header: 'Start Date', accessor: (row: any) => row.startDate ? new Date(row.startDate).toLocaleDateString() : '-', width: 30 },
        { header: 'End Date', accessor: (row: any) => row.endDate ? new Date(row.endDate).toLocaleDateString() : '-', width: 30 },
        { header: 'Reason', accessor: 'reason', width: 80 },
        { header: 'Status', accessor: (row: any) => {
          const status = row.status
          return status === 'pending' ? 'Pending Supervisor Review' : 
                 status === 'supervisor_approved' ? 'Pending Final Review (Encik Shap)' : 
                 status === 'approved_hod' ? 'Approved' : 
                 status === 'rejected' ? 'Rejected' : status || 'N/A'
        }, width: 50 },
        { header: 'Reviewer Note', accessor: (row: any) => row.reviewerNote || '-', width: 60 }
      ],
      data: leaves,
      filename: `leave-applications-${user?.fullName || 'intern'}-${new Date().toISOString().split('T')[0]}.pdf`,
      userName: user?.fullName,
      userDepartment: user?.department
    })
  }

  const handleDeleteLeave = async () => {
    const leaveIdToDelete = deleteDialog.leaveId
    if (!leaveIdToDelete || !user) {
      return
    }

    // Prevent multiple simultaneous deletions
    if (deleting) {
      return
    }

    setDeleting(true)
    try {
      console.log('🗑️ Deleting leave application:', leaveIdToDelete)
      const response = await fetch(`/api/leaves?leaveId=${encodeURIComponent(leaveIdToDelete)}&userId=${encodeURIComponent(user.id)}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Leave application deleted successfully')
        setDeleteDialog({ open: false, leaveId: null })
        // Refresh leave applications list
        await fetchLeaves(user.id)
      } else {
        toast.error(data.error || 'Failed to delete leave application')
      }
    } catch (error: any) {
      console.error('Error deleting leave application:', error)
      toast.error('Failed to delete leave application')
    } finally {
      setDeleting(false)
    }
  }

  const handleExportCSV = () => {
    exportTableToCSV({
      title: 'Leave Applications',
      columns: [
        { header: 'Leave Type', accessor: (row: any) => {
          const type = row.leaveType || 'regular'
          return type === 'regular' ? 'Regular Leave' : type === 'emergency' ? 'Emergency Leave' : 'MC'
        }},
        { header: 'Start Date', accessor: (row: any) => row.startDate ? new Date(row.startDate).toLocaleDateString() : '-' },
        { header: 'End Date', accessor: (row: any) => row.endDate ? new Date(row.endDate).toLocaleDateString() : '-' },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Status', accessor: (row: any) => {
          const status = row.status
          return status === 'pending' ? 'Pending Supervisor Review' : 
                 status === 'supervisor_approved' ? 'Pending Final Review (Encik Shap)' : 
                 status === 'approved_hod' ? 'Approved' : 
                 status === 'rejected' ? 'Rejected' : status || 'N/A'
        }},
        { header: 'Reviewer Note', accessor: (row: any) => row.reviewerNote || '-' }
      ],
      data: leaves,
      filename: `leave-applications-${user?.fullName || 'intern'}-${new Date().toISOString().split('T')[0]}.csv`,
      userName: user?.fullName,
      userDepartment: user?.department
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold">Leave Applications</h1>
        <p className="text-sm text-muted-foreground">Apply for leave and track your applications</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Apply for Leave
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <form 
            onSubmit={handleSubmit} 
            className="space-y-3"
            id="leave-application-form"
            noValidate
          >
            <div className="space-y-1">
              <Label htmlFor="leaveType" className="text-sm">Leave Type *</Label>
              <select
                id="leaveType"
                value={leaveForm.leaveType}
                onChange={(e) => {
                  const newType = e.target.value as 'regular' | 'emergency' | 'mc'
                  setLeaveForm({ 
                    ...leaveForm, 
                    leaveType: newType,
                    // Clear MC file if switching away from MC
                    mcFile: newType !== 'mc' ? null : leaveForm.mcFile
                  })
                  if (newType !== 'mc') {
                    setMcPreview(null)
                  }
                }}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="regular">Regular Leave</option>
                <option value="emergency">Emergency Leave</option>
                <option value="mc">MC (Medical Certificate)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-sm">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={leaveForm.startDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-sm">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={leaveForm.endDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                  required
                  className="h-9 text-sm"
                />
              </div>

              {leaveForm.leaveType === 'mc' ? (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="mcFile" className="text-sm">
                    Medical Certificate *
                  </Label>
                  <div className="space-y-2">
                  {!leaveForm.mcFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-2">
                        <Upload className="h-5 w-5 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Click to upload MC</p>
                        <p className="text-xs text-gray-400">PDF, JPG, or PNG (max 5MB)</p>
                      </div>
                      <input
                        id="mcFile"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                      {mcPreview ? (
                        <img src={mcPreview} alt="MC Preview" className="h-16 w-16 object-cover rounded" />
                      ) : (
                        <FileText className="h-8 w-8 text-gray-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{leaveForm.mcFile.name}</p>
                        <p className="text-xs text-gray-500">{(leaveForm.mcFile.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const fileInput = document.getElementById('mcFile') as HTMLInputElement
                            if (fileInput) fileInput.click()
                          }}
                          className="h-7 text-xs"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Change
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="h-7 text-xs text-red-600 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <input
                        id="mcFile"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="reason" className="text-sm">Reason *</Label>
                  <textarea
                    id="reason"
                    rows={3}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Please provide a reason for your leave..."
                    required
                  />
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full gap-2 h-9 text-sm" 
              disabled={submitting || isSubmittingRef.current}
            >
              <Send className="h-3 w-3" />
              {submitting || isSubmittingRef.current ? 'Submitting...' : 'Submit Leave Application'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div ref={myLeavesRef}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                My Leave Applications
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => user && fetchLeaves(user.id)} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                  title="Refresh leave applications"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Refresh
                </Button>
                {leaves.length > 0 && (
                  <>
                    <Button onClick={handleExportPDF} variant="outline" size="sm" className="h-8 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button onClick={handleExportCSV} variant="outline" size="sm" className="h-8 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                    <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 text-xs">
                      <Printer className="h-3 w-3 mr-1" />
                      Print
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
          {leaves.length === 0 ? (
            <p className="text-center text-muted-foreground py-4 text-sm">
              No leave applications yet
            </p>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => {
                const steps = getStatusSteps(leave)
                return (
                  <div key={leave.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-500" />
                          <span className="font-semibold text-sm">
                            {new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')} - {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, ' / ')}
                          </span>
                          {getLeaveTypeBadge(leave.leaveType || 'regular')}
                        </div>
                        <p className="text-xs text-gray-600 mb-1.5 line-clamp-2">{leave.reason}</p>
                        <div className="mb-1.5">
                          {leave.status === 'pending' ? (
                            <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                              Pending Supervisor Review
                            </span>
                          ) : leave.status === 'supervisor_approved' ? (
                            <span className="text-xs text-blue-600 hover:underline cursor-pointer">
                              Pending Final Review (Encik Shap)
                            </span>
                          ) : leave.status === 'approved_hod' ? (
                            <span className="text-xs text-green-600 font-medium">
                              Approved
                            </span>
                          ) : leave.status === 'rejected' ? (
                            <span className="text-xs text-red-600 font-medium">
                              Rejected
                            </span>
                          ) : (
                            <span className="text-xs text-gray-600">{leave.status}</span>
                          )}
                        </div>
                      </div>
                      {leave.status === 'pending' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            console.log('🗑️ Delete button clicked for leave:', leave.id)
                            setDeleteDialog({ open: true, leaveId: leave.id })
                          }}
                          className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                    
                    {/* Approval Stages */}
                    <div className="space-y-1.5 pt-1.5 border-t">
                      <p className="text-xs font-medium text-gray-500 mb-2">Approval Progress:</p>
                      <div className="flex items-center gap-1.5">
                        {steps.map((step, index) => {
                          const Icon = step.icon
                          const isLast = index === steps.length - 1
                          return (
                            <div key={index} className="flex items-center flex-1">
                              <div className="flex flex-col items-center">
                                <div className={`rounded-full p-1 ${
                                  step.completed 
                                    ? step.rejected
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  <Icon className="h-3 w-3" />
                                </div>
                                <span className={`text-[10px] mt-0.5 ${step.completed ? 'text-gray-700' : 'text-gray-400'}`}>
                                  {step.label}
                                </span>
                              </div>
                              {!isLast && (
                                <div className={`flex-1 h-0.5 mx-1.5 ${
                                  step.completed && !step.rejected ? 'bg-green-200' : 'bg-gray-200'
                                }`} />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    {leave.reviewerNote && (
                      <div className="pt-1.5 border-t">
                        <p className="text-[10px] text-gray-500">Note:</p>
                        <p className="text-xs text-gray-700">{leave.reviewerNote}</p>
                      </div>
                    )}
                    
                    {leave.mcFile && (
                      <div className="pt-1.5 border-t">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-gray-500" />
                          <span className="text-[10px] text-gray-500">Medical Certificate:</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMcDialog({ open: true, mcFile: leave.mcFile })}
                            className="h-6 text-xs text-[#008B8B] hover:text-[#006666] hover:underline p-0"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View MC
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        </Card>
      </div>

      {/* MC View Dialog */}
      <Dialog open={viewMcDialog.open} onOpenChange={(open) => setViewMcDialog({ open, mcFile: null })}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Medical Certificate</DialogTitle>
            <DialogDescription>View medical certificate</DialogDescription>
          </DialogHeader>
          {viewMcDialog.mcFile && (
            <div className="mt-4">
              {viewMcDialog.mcFile.startsWith('data:image/') ? (
                <img 
                  src={viewMcDialog.mcFile} 
                  alt="Medical Certificate" 
                  className="max-w-full h-auto rounded-lg border border-gray-200"
                />
              ) : viewMcDialog.mcFile.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewMcDialog.mcFile}
                  className="w-full h-[70vh] border border-gray-200 rounded-lg"
                  title="Medical Certificate PDF"
                />
              ) : (
                <div className="flex items-center justify-center p-8 border border-gray-200 rounded-lg">
                  <p className="text-gray-500">Unable to display file. Please download to view.</p>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    const link = document.createElement('a')
                    link.href = viewMcDialog.mcFile!
                    link.download = 'medical-certificate'
                    link.click()
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, leaveId: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Leave Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this leave application? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, leaveId: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLeave}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

