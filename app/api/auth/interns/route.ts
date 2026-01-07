import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get all users who are not admins (interns)
    const interns = db.prepare(`
      SELECT 
        id,
        fullName,
        username,
        email,
        address,
        department,
        emergencyContactName,
        emergencyContactPhone,
        phoneNumber,
        isPhoneVerified,
        profilePhoto,
        isAdmin,
        institution,
        lecturerContactName,
        lecturerContactPhone,
        createdAt,
        isActive
      FROM users 
      WHERE isAdmin = 0 OR isAdmin IS NULL OR isAdmin = '0'
      ORDER BY fullName ASC
    `).all() as any[]

    // Format the response
    const formattedInterns = interns.map(intern => ({
      id: intern.id,
      fullName: intern.fullName,
      username: intern.username,
      email: intern.email,
      address: intern.address,
      department: intern.department,
      emergencyContactName: intern.emergencyContactName,
      emergencyContactPhone: intern.emergencyContactPhone,
      phoneNumber: intern.phoneNumber,
      isPhoneVerified: intern.isPhoneVerified === 1,
      profilePhoto: intern.profilePhoto,
      isAdmin: intern.isAdmin === 1 || intern.isAdmin === true || String(intern.isAdmin) === '1',
      institution: intern.institution,
      lecturerContactName: intern.lecturerContactName,
      lecturerContactPhone: intern.lecturerContactPhone,
      createdAt: intern.createdAt,
      isActive: intern.isActive === 1 || intern.isActive === true || String(intern.isActive) === '1'
    }))

    return NextResponse.json({
      success: true,
      interns: formattedInterns
    })
  } catch (error: any) {
    console.error('Error fetching interns:', error)
    
    // Handle database locked error
    if (error.message?.includes('database is locked') || error.code === 'SQLITE_BUSY') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Database is temporarily busy. Please close any database viewing tools and try again.',
          interns: []
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'An error occurred while fetching interns.',
        interns: []
      },
      { status: 500 }
    )
  }
}
