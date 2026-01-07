import { NextRequest, NextResponse } from 'next/server'
import { 
  getLeaveApplicationsByUser, 
  createLeaveApplication, 
  updateLeaveApplication,
  deleteLeaveApplication,
  getSupervisorByDepartment,
  getLeaveApplications,
  getLeaveApplicationById,
  getUserById,
  getUserByUsername
} from '@/lib/db-utils'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET: Fetch leave applications
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const leaveId = searchParams.get('leaveId')
    const approverDept = searchParams.get('approverDept')
    const approverType = searchParams.get('approverType')

    // If leaveId is provided, delete the leave
    if (leaveId && userId) {
      try {
        deleteLeaveApplication(leaveId)
        return NextResponse.json({ success: true, message: 'Leave application deleted successfully' })
      } catch (error: any) {
        console.error('Delete leave error:', error)
        return NextResponse.json(
          { success: false, error: 'Failed to delete leave application' },
          { status: 500 }
        )
      }
    }

    // Fetch leaves based on filters
    const filters: any = {}
    if (userId) filters.userId = userId
    if (status) filters.status = status
    if (approverDept) filters.approverDept = approverDept
    if (approverType) filters.approverType = approverType

    const leaves = getLeaveApplications(filters)

    // Format leaves for response
    const formattedLeaves = leaves.map((leave: any) => ({
      id: leave.id,
      userId: leave.userId,
      fullName: leave.fullName,
      department: leave.department,
      email: leave.email,
      leaveType: leave.leaveType || 'regular',
      startDate: leave.startDate,
      endDate: leave.endDate,
      reason: leave.reason,
      status: leave.status,
      mcFile: leave.mcFile,
      appliedAt: leave.appliedAt,
      supervisorApprovedAt: leave.supervisorApprovedAt,
      hodApprovedAt: leave.hodApprovedAt,
      rejectedAt: leave.rejectedAt,
      rejectedBy: leave.rejectedBy,
      reviewerNote: leave.reviewerNote,
      supervisorRejectedAt: leave.supervisorRejectedAt,
      supervisorRejectedBy: leave.supervisorRejectedBy,
    }))

    return NextResponse.json({
      success: true,
      leaves: formattedLeaves
    })
  } catch (error: any) {
    console.error('Get leaves error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred while fetching leave applications.' },
      { status: 500 }
    )
  }
}

// PUT: Create new leave application
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, leaveType, startDate, endDate, reason, mcFile } = body

    // Validate required fields
    if (!userId || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate leave type specific requirements
    if (leaveType === 'mc' && !mcFile) {
      return NextResponse.json(
        { success: false, error: 'Medical certificate is required for MC leave' },
        { status: 400 }
      )
    }

    if ((leaveType === 'regular' || leaveType === 'emergency') && !reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required for this leave type' },
        { status: 400 }
      )
    }

    // Get user to check department
    const user = getUserById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate unique leave ID
    const leaveId = `leave-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create leave application
    createLeaveApplication({
      id: leaveId,
      userId,
      leaveType,
      startDate,
      endDate,
      reason: leaveType === 'mc' ? 'Medical Certificate' : reason,
      status: 'pending',
      mcFile: mcFile || null,
      appliedAt: new Date().toISOString()
    })

    console.log('✅ Leave application created:', leaveId)

    return NextResponse.json({
      success: true,
      message: 'Leave application submitted successfully',
      leaveId
    })
  } catch (error: any) {
    console.error('Create leave error:', error)
    
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { success: false, error: 'Leave application already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'An error occurred while creating leave application.' },
      { status: 500 }
    )
  }
}

// POST: Approve/Reject leave application
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leaveId, action, reviewerNote, approverType, approverId } = body

    if (!leaveId || !action || !approverId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Get leave application
    const leave = getLeaveApplicationById(leaveId)
    if (!leave) {
      return NextResponse.json(
        { success: false, error: 'Leave application not found' },
        { status: 404 }
      )
    }

    // Get approver
    const approver = getUserById(approverId)
    if (!approver) {
      return NextResponse.json(
        { success: false, error: 'Approver not found' },
        { status: 404 }
      )
    }

    // Get intern user
    const intern = getUserById(leave.userId)
    if (!intern) {
      return NextResponse.json(
        { success: false, error: 'Intern not found' },
        { status: 404 }
      )
    }

    const updates: any = {}
    const now = new Date().toISOString()

    // Get supervisor for intern's department
    const supervisor = getSupervisorByDepartment(intern.department || '')
    const isInternSupervisor = supervisor && supervisor.username === approver.username
    
    // Determine if this is supervisor or HOD approval
    const isSupervisor = approverType === 'supervisor' || isInternSupervisor
    const isHOD = approver.username === 'shap.hashim' || approverType === 'hod'

    // Special case: If intern is from Pentadbiran and Encik Shap approves, auto-approve both stages
    const isPentadbiran = (intern.department || '').toLowerCase() === 'pentadbiran'
    const isEncikShap = approver.username === 'shap.hashim'

    if (action === 'approve') {
      if (isHOD || (isPentadbiran && isEncikShap)) {
        // Final approval (HOD) - or Encik Shap approving Pentadbiran (auto-approves both)
        updates.status = 'approved_hod'
        updates.hodApprovedAt = now
        
        // If Pentadbiran and Encik Shap, also set supervisor approval
        if (isPentadbiran && isEncikShap) {
          updates.supervisorApprovedAt = now
        }
      } else if (isSupervisor) {
        // Supervisor approval
        updates.status = 'supervisor_approved'
        updates.supervisorApprovedAt = now
      }
      
      if (reviewerNote) {
        updates.reviewerNote = reviewerNote
      }
    } else {
      // Reject
      updates.status = 'rejected'
      updates.rejectedAt = now
      updates.rejectedBy = approver.username
      
      if (isSupervisor) {
        updates.supervisorRejectedAt = now
        updates.supervisorRejectedBy = approver.username
      }
      
      if (reviewerNote) {
        updates.reviewerNote = reviewerNote
      }
    }

    // Update leave application
    updateLeaveApplication(leaveId, updates)

    console.log(`✅ Leave ${leaveId} ${action}d by ${approver.username} (${isSupervisor ? 'Supervisor' : 'HOD'})`)

    return NextResponse.json({
      success: true,
      message: `Leave application ${action}d successfully`,
      leave: {
        ...leave,
        ...updates
      }
    })
  } catch (error: any) {
    console.error('Review leave error:', error)
    return NextResponse.json(
      { success: false, error: 'An error occurred while reviewing leave application.' },
      { status: 500 }
    )
  }
}
