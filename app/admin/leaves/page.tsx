"use client"

import { useState, useEffect, useMemo } from 'react'
import { AdminGuard } from '@/components/auth-guard'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, Download, Printer, FileText, Eye, Filter } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { exportTableToPDF } from '@/lib/pdf-export'
import { toast } from 'sonner'
import { getCurrentUser, DEPARTMENTS } from '@/lib/auth'

export default function LeaveReviewQueuePage() {
  const [allLeaves, setAllLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [selectedLeaves, setSelectedLeaves] = useState<Set<string>>(new Set())
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    leaveId: string | null
    action: 'approve' | 'reject' | null
    bulk: boolean
  }>({ open: false, leaveId: null, action: null, bulk: false })
  const [viewLeaveDialog, setViewLeaveDialog] = useState<{
    open: boolean
    leave: any | null
  }>({ open: false, leave: null })
  const [reviewerNote, setReviewerNote] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [viewMcDialog, setViewMcDialog] = useState<{ open: boolean; mcFile: string | null }>({ open: false, mcFile: null })
  const [viewMode, setViewMode] = useState<'all' | 'mydept' | 'default'>('default')

  useEffect(() => {
    // Check URL parameters for view mode
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view') as 'all' | 'mydept' | null
    
    getCurrentUser().then(user => {
      setCurrentUser(user)
      
      // Determine default view based on user role
      // Supervisors (non-Pentadbiran HODs) should see their department's pending leaves by default
      // Encik Shap (Pentadbiran) should see all supervisor-approved leaves by default
      const isHOD = user?.department?.toLowerCase() === 'pentadbiran'
      const isEncikShap = user?.username === 'shap.hashim'
      
      let defaultView: 'all' | 'mydept' | 'default' = 'default'
      
      if (view === 'all' || view === 'mydept') {
        // URL parameter overrides
        defaultView = view
      } else if (!isHOD && !isEncikShap && user?.department) {
        // Supervisors (non-Pentadbiran) should see their department's pending leaves
        defaultView = 'mydept'
      } else if (isEncikShap) {
        // Encik Shap should see supervisor-approved leaves (not pending)
        defaultView = 'default'
      }
      
      setViewMode(defaultView)
      fetchLeaves(user, defaultView === 'default' ? null : defaultView)
    })
  }, [])

  const isHOD = currentUser?.department?.toLowerCase() === 'pentadbiran'
  const approverType = isHOD ? 'hod' : 'supervisor'

  const getLeaveTypeBadge = (leaveType: string) => {
    switch (leaveType) {
      case 'regular':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0.5">Regular</Badge>
      case 'emergency':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] px-1.5 py-0.5">Emergency</Badge>
      case 'mc':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0.5">MC</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{leaveType || 'Regular'}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] px-1.5 py-0.5">Pending</Badge>
      case 'supervisor_approved':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] px-1.5 py-0.5">Supervisor Approved</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] px-1.5 py-0.5">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0.5">Rejected</Badge>
      default:
        return <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">{status || 'Unknown'}</Badge>
    }
  }

  const fetchLeaves = async (user?: any, view?: string | null) => {
    try {
      const userToUse = user || currentUser
      if (!userToUse) return
      
      const params = new URLSearchParams()
      const isEncikShap = userToUse?.username === 'shap.hashim'
      
      // If view=all, fetch based on user role:
      // - Encik Shap: fetch supervisor_approved leaves (ready for final review)
      // - Supervisors: fetch ALL pending leaves (no department filter)
      if (view === 'all') {
        if (isEncikShap) {
          params.append('status', 'supervisor_approved')
          console.log('🔍 Encik Shap viewing all supervisor-approved leaves')
        } else {
          params.append('status', 'pending')
          console.log('🔍 Supervisor viewing all pending leaves')
        }
      } 
      // If view=mydept, fetch only department's pending leaves
      // For "My Dept" view, always show pending leaves from the department, regardless of user role
      else if (view === 'mydept') {
        params.append('status', 'pending')
        // Trim and normalize department name before sending
        const dept = (userToUse.department || '').trim()
        params.append('approverDept', dept)
        params.append('approverType', 'supervisor') // Use supervisor type to filter by department
        console.log('🔍 Fetching my dept leaves:', { department: dept, view: 'mydept' })
      }
      // Default behavior: 
      // - For Encik Shap: show supervisor_approved leaves (ready for final review)
      // - For others: show all leaves (admin view)
      else {
        const isEncikShap = userToUse?.username === 'shap.hashim'
        if (isEncikShap) {
          // Encik Shap should only see leaves that supervisor has approved
          params.append('status', 'supervisor_approved')
          console.log('🔍 Fetching supervisor-approved leaves for Encik Shap')
        } else {
          // Other admins see all leaves
          console.log('🔍 Fetching all leaves (admin view)')
        }
      }
      
      const res = await fetch(`/api/leaves?${params.toString()}`)
      const data = await res.json()
      if (data.success && data.leaves) {
        setAllLeaves(data.leaves || [])
        console.log('📋 Fetched leaves:', { count: data.leaves.length, view, params: params.toString() })
      } else {
        console.warn('⚠️ No leaves returned:', data)
        setAllLeaves([])
      }
    } catch (error) {
      console.error('Error fetching leaves:', error)
      toast.error('Failed to load leave applications')
      setAllLeaves([])
    } finally {
      setLoading(false)
    }
  }

  const pendingLeaves = useMemo(() => {
    // If view=all, show based on user role:
    // - Encik Shap: supervisor_approved leaves (ready for final review)
    // - Supervisors: pending leaves
    if (viewMode === 'all') {
      const isEncikShap = currentUser?.username === 'shap.hashim'
      if (isEncikShap) {
        return allLeaves.filter(leave => leave.status === 'supervisor_approved')
      } else {
        return allLeaves.filter(leave => leave.status === 'pending')
      }
    }
    // If view=mydept, show pending leaves from department (already filtered by API)
    if (viewMode === 'mydept') {
      return allLeaves.filter(leave => leave.status === 'pending')
    }
    // Default behavior:
    // - For Encik Shap: show supervisor_approved leaves (ready for final review)
    // - For others: show all leaves
    const isEncikShap = currentUser?.username === 'shap.hashim'
    if (isEncikShap) {
      return allLeaves.filter(leave => leave.status === 'supervisor_approved')
    }
    return allLeaves
  }, [allLeaves, viewMode, currentUser])

  const filteredLeaves = useMemo(() => {
    let result = pendingLeaves
    
    // Filter by department
    if (departmentFilter) {
      result = result.filter(leave => leave.department === departmentFilter)
    }
    
    // Filter by search
    if (search) {
    const searchLower = search.toLowerCase()
      result = result.filter(leave =>
      leave.fullName?.toLowerCase().includes(searchLower) ||
      leave.reason?.toLowerCase().includes(searchLower) ||
      leave.email?.toLowerCase().includes(searchLower)
    )
    }
    
    return result
  }, [pendingLeaves, search, departmentFilter])


  const getUrgencyLevel = (startDate: string) => {
    if (!startDate) return 'normal'
    const start = new Date(startDate)
    const today = new Date()
    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) return 'overdue' // Past date
    if (daysUntil <= 3) return 'urgent' // Within 3 days
    if (daysUntil <= 7) return 'soon' // Within a week
    return 'normal'
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'overdue': return 'border-red-300 bg-red-50'
      case 'urgent': return 'border-amber-300 bg-amber-50'
      case 'soon': return 'border-yellow-300 bg-yellow-50'
      default: return 'border-[#008B8B]/20 bg-white'
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeaves(new Set(filteredLeaves.map(l => l.id)))
    } else {
      setSelectedLeaves(new Set())
    }
  }

  const handleSelectLeave = (leaveId: string, checked: boolean) => {
    const newSelected = new Set(selectedLeaves)
    if (checked) {
      newSelected.add(leaveId)
    } else {
      newSelected.delete(leaveId)
    }
    setSelectedLeaves(newSelected)
  }

  const handleReview = async (leaveIds: string[], action: 'approve' | 'reject') => {
    if (!currentUser) {
      toast.error('User information not available')
      return
    }
    
    // Determine approver type based on view mode, user role, and department
    // For Pentadbiran department: HOD (Encik Shap) should use 'hod' to auto-complete both stages
    // For "My Dept" view with non-HOD users: use 'supervisor'
    // For default view (Encik Shap): use 'hod'
    // For default view (others): use 'supervisor' if they're viewing supervisor_approved leaves
    let finalApproverType = approverType
    
    // Check if user is HOD (Encik Shap)
    const isHOD = currentUser?.department?.toLowerCase() === 'pentadbiran'
    const isEncikShap = currentUser?.username === 'shap.hashim'
    
    if (viewMode === 'mydept' && isHOD) {
      // HOD viewing "My Dept" should use 'hod' to auto-complete both supervisor and final review
      finalApproverType = 'hod'
    } else if (viewMode === 'mydept' && !isHOD) {
      // Non-HOD viewing "My Dept" should use 'supervisor'
      finalApproverType = 'supervisor'
    } else if (viewMode === 'default' && isEncikShap) {
      // Encik Shap in default view (seeing supervisor_approved leaves) should use 'hod'
      finalApproverType = 'hod'
    } else if (viewMode === 'default' && !isHOD) {
      // Other supervisors in default view should use 'supervisor'
      finalApproverType = 'supervisor'
    }
    
    try {
      const promises = leaveIds.map(id =>
        fetch('/api/leaves', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leaveId: id,
            action,
            reviewerNote,
            approverType: finalApproverType,
            approverId: currentUser.id
          })
        })
      )

      const results = await Promise.all(promises.map(p => p.then(r => r.json()).catch(e => ({ success: false, error: e.message }))))
      
      // Check for errors
      const errors = results.filter(r => !r.success)
      if (errors.length > 0) {
        console.error('❌ Review errors:', errors)
        toast.error(errors[0].error || `Failed to ${action} some leave applications`)
        return
      }
      
      toast.success(`Successfully ${action}d ${leaveIds.length} leave application(s)`)
      setReviewDialog({ open: false, leaveId: null, action: null, bulk: false })
      setReviewerNote('')
      setSelectedLeaves(new Set())
      // Refresh leaves after a short delay to ensure DB is updated
      setTimeout(() => {
        fetchLeaves(currentUser, viewMode === 'all' ? 'all' : viewMode === 'mydept' ? 'mydept' : null)
      }, 300)
    } catch (error) {
      console.error('Error reviewing leaves:', error)
      toast.error(`Failed to ${action} leave application(s)`)
    }
  }

  const openReviewDialog = (action: 'approve' | 'reject', leaveId?: string) => {
    if (leaveId) {
      setReviewDialog({ open: true, leaveId, action, bulk: false })
    } else {
      if (selectedLeaves.size === 0) {
        toast.error('Please select at least one leave application')
        return
      }
      setReviewDialog({ open: true, leaveId: null, action, bulk: true })
    }
  }

  const getFilterText = () => {
    if (departmentFilter) {
      return `Department: ${departmentFilter}`
    }
    return null
  }

  const handleExportPDF = () => {
    const filterText = getFilterText()
    
    exportTableToPDF({
      title: 'Leave Review Queue',
      filterText: filterText || undefined,
      columns: [
        { header: 'Intern', accessor: 'fullName', width: 25 },
        { header: 'Department', accessor: 'department', width: 22 },
        { header: 'Type', accessor: (row: any) => {
          const type = row.leaveType || 'regular'
          return type === 'regular' ? 'Regular' : type === 'emergency' ? 'Emergency' : 'MC'
        }, width: 15 },
        { header: 'Start Date', accessor: (row: any) => {
          if (!row.startDate) return '-'
          return new Date(row.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
        }, width: 18 },
        { header: 'End Date', accessor: (row: any) => {
          if (!row.endDate) return '-'
          return new Date(row.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
        }, width: 18 },
        { header: 'Days', accessor: (row: any) => {
          const startDate = row.startDate ? new Date(row.startDate) : null
          const endDate = row.endDate ? new Date(row.endDate) : null
          if (!startDate || !endDate) return '-'
          const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
          return `${days} day${days !== 1 ? 's' : ''}`
        }, width: 15 },
        { header: 'Status', accessor: (row: any) => {
          const status = row.status || 'pending'
          if (status === 'approved_hod') return 'Approved'
          if (status === 'supervisor_approved') return 'Supervisor Approved'
          return status.charAt(0).toUpperCase() + status.slice(1)
        }, width: 25 },
        { header: 'Reason', accessor: 'reason', width: 35 },
        { header: 'Applied At', accessor: (row: any) => {
          if (!row.appliedAt) return '-'
          return new Date(row.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
        }, width: 18 }
      ],
      data: filteredLeaves,
      filename: `leave-review-queue-${new Date().toISOString().split('T')[0]}.pdf`
    })
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Failed to open print window. Please allow pop-ups.')
      return
    }

    const filterText = getFilterText()
    const tableRows = filteredLeaves.map(leave => {
      const startDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'
      const endDate = leave.endDate ? new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'
      const startDateObj = leave.startDate ? new Date(leave.startDate) : null
      const endDateObj = leave.endDate ? new Date(leave.endDate) : null
      const days = startDateObj && endDateObj 
        ? Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : 0
      const daysText = days > 0 ? `${days} day${days !== 1 ? 's' : ''}` : '-'
      
      const leaveType = leave.leaveType || 'regular'
      const typeText = leaveType === 'regular' ? 'Regular' : leaveType === 'emergency' ? 'Emergency' : 'MC'
      
      const status = leave.status || 'pending'
      const statusText = status === 'approved_hod' ? 'Approved' : status === 'supervisor_approved' ? 'Supervisor Approved' : status.charAt(0).toUpperCase() + status.slice(1)
      
      const appliedAt = leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/') : '-'
      
      return `
        <tr>
          <td>${leave.fullName || '-'}</td>
          <td>${leave.department || '-'}</td>
          <td>${typeText}</td>
          <td>${startDate}</td>
          <td>${endDate}</td>
          <td>${daysText}</td>
          <td>${statusText}</td>
          <td>${leave.reason || '-'}</td>
          <td>${appliedAt}</td>
        </tr>
      `
    }).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Leave Review Queue</title>
          <style>
            @media print {
              @page {
                margin: 15mm;
                size: A4;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            h1 {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 12px;
              text-align: center;
            }
            .metadata {
              margin-bottom: 15px;
              font-size: 13px;
            }
            .metadata p {
              margin: 4px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 10px;
            }
            th {
              background-color: #f3f4f6;
              border: 1px solid #d1d5db;
              padding: 8px 6px;
              text-align: left;
              font-weight: bold;
              font-size: 10px;
            }
            td {
              border: 1px solid #d1d5db;
              padding: 8px 6px;
              font-size: 10px;
              vertical-align: top;
              word-wrap: break-word;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            .reason-cell {
              max-width: 200px;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <h1>Leave Review Queue</h1>
          <div class="metadata">
            <p><strong>Printed By:</strong> ${currentUser?.fullName || 'Admin'}</p>
            ${filterText ? `<p><strong>Filter:</strong> ${filterText}</p>` : ''}
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')}</p>
            <p><strong>Total Records:</strong> ${filteredLeaves.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Intern</th>
                <th>Department</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Applied At</th>
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
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">Loading...</div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout>
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
            <h1 className="text-xl font-bold text-gray-900">Leave Review Queue</h1>
            {getFilterText() && (
              <p className="text-sm text-gray-600 mt-1">{getFilterText()}</p>
            )}
          </div>

          {/* Header */}
          <div className="flex items-center justify-between no-print">
            <div>
              <h1 className="text-xl font-bold text-[#008B8B]">Leave Review Queue</h1>
              {viewMode === 'all' && (
                <p className="text-xs text-gray-500 mt-1">
                  {currentUser?.username === 'shap.hashim' 
                    ? 'Showing all supervisor-approved leaves (Ready for Final Review)'
                    : 'Showing all pending leaves (Company Overview)'}
                </p>
              )}
              {viewMode === 'mydept' && (
                <p className="text-xs text-gray-500 mt-1">Showing pending leaves from your department</p>
              )}
              {viewMode === 'default' && (
                <p className="text-xs text-gray-500 mt-1">Showing all leave records including past ones</p>
              )}
            </div>
            <div className="flex gap-2">
              {selectedLeaves.size > 0 && (
                <>
                  <Button 
                    onClick={() => openReviewDialog('approve')} 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                  >
                    Approve Selected ({selectedLeaves.size})
                  </Button>
                  <Button 
                    onClick={() => openReviewDialog('reject')} 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-xs bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Reject Selected ({selectedLeaves.size})
                  </Button>
                </>
              )}
              <Button onClick={handleExportPDF} variant="outline" size="sm" className="h-8 text-xs">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={handlePrint} variant="outline" size="sm" className="h-8 text-xs">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>


          {/* Filters */}
          <Card className="border-[#008B8B]/20 no-print">
            <CardContent className="p-2.5">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-[#008B8B]" />
                  <Input
                    placeholder="Search by name, email, or reason..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 h-8 text-sm border-[#008B8B]/30 focus:border-[#008B8B]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-[#008B8B]" />
                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="h-8 rounded-md border border-[#008B8B]/30 bg-white px-3 py-1 text-sm focus:border-[#008B8B] focus:outline-none focus:ring-2 focus:ring-[#008B8B]/20"
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

          {/* List/Table View */}
          {filteredLeaves.length === 0 ? (
            <Card className="border-[#008B8B]/20">
              <CardContent className="p-6 text-center text-gray-500 text-sm">
                {pendingLeaves.length === 0
                  ? (viewMode === 'default' ? 'No leave applications found' : 'No pending leave applications')
                  : 'No leave applications match your search'}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[#008B8B]/20">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-[#008B8B]/10 border-b border-[#008B8B]/20">
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B] w-8">
                          <input
                            type="checkbox"
                            checked={filteredLeaves.length > 0 && filteredLeaves.every(l => selectedLeaves.has(l.id))}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="rounded border-[#008B8B]/30"
                          />
                        </th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">Intern</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">Department</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">Type</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">Start Date</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">End Date</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">Days</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">Status</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">Reason</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B]">Applied At</th>
                        <th className="text-left p-2 font-semibold text-xs text-[#008B8B] no-print">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeaves.map((leave) => {
                        const urgency = getUrgencyLevel(leave.startDate)
                        const startDate = leave.startDate ? new Date(leave.startDate) : null
                        const endDate = leave.endDate ? new Date(leave.endDate) : null
                        const daysDiff = startDate && endDate 
                          ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                          : 0

                        // Check if this leave can be approved/rejected
                        const isPending = leave.status === 'pending'
                        const isSupervisorApproved = leave.status === 'supervisor_approved'
                        const isEncikShap = currentUser?.username === 'shap.hashim'
                        
                        // Get supervisor for this leave's department
                        const supervisorMap: Record<string, string> = {
                          'Pentadbiran': 'shap.hashim',
                          'Kewangan': 'azmarina.aziz',
                          'Unit Teknologi Maklumat': 'nasarudin.roslan',
                          'Teknikal dan Penyelenggaraan': 'anuar.mansor',
                          'Keselamatan dan Kesihatan': 'shamsul.shaari',
                          'Operasi': 'engku.zamrin'
                        }
                        const leaveDeptSupervisor = supervisorMap[leave.department || '']
                        const isCurrentUserSupervisor = leaveDeptSupervisor === currentUser?.username
                        
                        // Supervisors can approve pending leaves from their department
                        // Encik Shap can approve supervisor_approved leaves
                        const showActions = (isPending && isCurrentUserSupervisor && !isEncikShap) || (isSupervisorApproved && isEncikShap)

                        return (
                          <tr key={leave.id} className="border-b border-[#008B8B]/10 hover:bg-[#008B8B]/10">
                            <td className="p-2">
                              {showActions && (
                                <input
                                  type="checkbox"
                                  checked={selectedLeaves.has(leave.id)}
                                  onChange={(e) => handleSelectLeave(leave.id, e.target.checked)}
                                  className="rounded border-[#008B8B]/30"
                                />
                              )}
                            </td>
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={leave.profilePhoto || '/placeholder-user.jpg'} />
                                  <AvatarFallback className="bg-[#008B8B]/20 text-[#008B8B] text-xs">
                                    {leave.fullName?.charAt(0) || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <div className="font-medium text-sm">{leave.fullName}</div>
                                    {urgency === 'urgent' && (
                                      <Badge variant="destructive" className="text-[10px] px-1 py-0">Urgent</Badge>
                                    )}
                                    {urgency === 'overdue' && (
                                      <Badge variant="destructive" className="text-[10px] px-1 py-0">Overdue</Badge>
                                    )}
                                    {urgency === 'soon' && (
                                      <Badge className="text-[10px] px-1 py-0 bg-yellow-500">Soon</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500">{leave.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2 text-xs text-gray-600">{leave.department || '-'}</td>
                            <td className="p-2">
                              {getLeaveTypeBadge(leave.leaveType || 'regular')}
                            </td>
                            <td className="p-2 text-xs">{startDate ? startDate.toLocaleDateString() : '-'}</td>
                            <td className="p-2 text-xs">{endDate ? endDate.toLocaleDateString() : '-'}</td>
                            <td className="p-2 text-xs text-gray-600">{daysDiff > 0 ? `${daysDiff} day${daysDiff !== 1 ? 's' : ''}` : '-'}</td>
                            <td className="p-2">
                              {getStatusBadge(leave.status || 'pending')}
                            </td>
                            <td className="p-2">
                              <button
                                onClick={() => setViewLeaveDialog({ open: true, leave })}
                                className="text-left text-[#008B8B] hover:text-[#006666] hover:underline text-xs max-w-xs truncate block w-full"
                                title="Click to view full reason"
                              >
                                {leave.reason ? (leave.reason.length > 50 ? leave.reason.substring(0, 50) + '...' : leave.reason) : 'No reason provided'}
                              </button>
                            </td>
                            <td className="p-2 text-xs text-gray-600">
                              {leave.appliedAt ? new Date(leave.appliedAt).toLocaleDateString() : '-'}
                            </td>
                            <td className="p-2 no-print">
                              <div className="flex gap-1">
                                {showActions ? (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openReviewDialog('approve', leave.id)}
                                      className="h-7 px-2 text-xs bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                                    >
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openReviewDialog('reject', leave.id)}
                                      className="h-7 px-2 text-xs bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                                    >
                                      Reject
                                    </Button>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Review Dialog */}
        <Dialog
          open={reviewDialog.open}
          onOpenChange={(open) => {
            if (!open) {
              setReviewDialog({ open: false, leaveId: null, action: null, bulk: false })
              setReviewerNote('')
            }
          }}
        >
          <DialogContent className="border-[#008B8B]/20">
            <DialogHeader>
              <DialogTitle className="text-[#008B8B]">
                {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'} Leave
                {reviewDialog.bulk && ` (${selectedLeaves.size} applications)`}
              </DialogTitle>
              <DialogDescription>
                {reviewDialog.action === 'approve'
                  ? 'Add an optional note for this approval'
                  : 'Please provide a reason for rejection'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reviewerNote">Reviewer Note</Label>
                <Textarea
                  id="reviewerNote"
                  value={reviewerNote}
                  onChange={(e) => setReviewerNote(e.target.value)}
                  placeholder={
                    reviewDialog.action === 'approve'
                      ? 'Optional approval note...'
                      : 'Please provide a reason for rejection...'
                  }
                  rows={4}
                  className="mt-2 border-[#008B8B]/30 focus:border-[#008B8B]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setReviewDialog({ open: false, leaveId: null, action: null, bulk: false })
                  setReviewerNote('')
                }}
                className="border-[#008B8B]/30 text-[#008B8B] hover:bg-[#008B8B]/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const leaveIds = reviewDialog.bulk
                    ? Array.from(selectedLeaves)
                    : reviewDialog.leaveId
                    ? [reviewDialog.leaveId]
                    : []
                  if (leaveIds.length > 0 && reviewDialog.action) {
                    handleReview(leaveIds, reviewDialog.action)
                  }
                }}
                variant={reviewDialog.action === 'reject' ? 'destructive' : 'default'}
                className={
                  reviewDialog.action === 'approve'
                    ? 'bg-[#008B8B] hover:bg-[#006666]'
                    : ''
                }
              >
                Submit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Leave Details Dialog */}
        <Dialog open={viewLeaveDialog.open} onOpenChange={(open) => setViewLeaveDialog({ open, leave: null })}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Leave Application Details</DialogTitle>
              <DialogDescription>
                Full details of the leave application
              </DialogDescription>
            </DialogHeader>
            {viewLeaveDialog.leave && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Intern</Label>
                  <p className="text-sm text-gray-900 mt-1">{viewLeaveDialog.leave.fullName}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Department</Label>
                  <p className="text-sm text-gray-900 mt-1">{viewLeaveDialog.leave.department || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Leave Type</Label>
                  <div className="mt-1">
                    {getLeaveTypeBadge(viewLeaveDialog.leave.leaveType || 'regular')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Start Date</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewLeaveDialog.leave.startDate ? new Date(viewLeaveDialog.leave.startDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">End Date</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {viewLeaveDialog.leave.endDate ? new Date(viewLeaveDialog.leave.endDate).toLocaleDateString() : '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Reason / Description</Label>
                  <p className="text-sm text-gray-900 mt-2 p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
                    {viewLeaveDialog.leave.reason || '-'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Applied At</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {viewLeaveDialog.leave.appliedAt ? new Date(viewLeaveDialog.leave.appliedAt).toLocaleString() : '-'}
                  </p>
                </div>
                {viewLeaveDialog.leave.reviewerNote && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Reviewer Note</Label>
                    <p className="text-sm text-gray-900 mt-2 p-3 bg-gray-50 rounded-md">
                      {viewLeaveDialog.leave.reviewerNote}
                    </p>
                  </div>
                )}
                {viewLeaveDialog.leave.mcFile && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Medical Certificate</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMcDialog({ open: true, mcFile: viewLeaveDialog.leave.mcFile })}
                        className="h-8 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View MC
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewLeaveDialog({ open: false, leave: null })}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
      </AdminLayout>
    </AdminGuard>
  )
}
