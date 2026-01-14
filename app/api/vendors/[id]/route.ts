import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/vendors/[id] - Get a single vendor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = `
      SELECT 
        VendorID as id,
        VendorName as name,
        ContactName as contactName,
        Category as category,
        Email as email,
        Phone as phone,
        City as city,
        Address as address,
        Country as country,
        Performance as performance
      FROM VendorManagement
      WHERE VendorID = ?
    `
    const vendors = await query(sql, [params.id]) as any[]

    if (vendors.length === 0) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(vendors[0])
  } catch (error: any) {
    console.error('Error fetching vendor:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor', message: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/vendors/[id] - Update a vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      contactName,
      category,
      email,
      phone,
      city,
      address,
      country,
      performance,
    } = body

    const sql = `
      UPDATE VendorManagement SET
        VendorName = ?,
        ContactName = ?,
        Category = ?,
        Email = ?,
        Phone = ?,
        City = ?,
        Address = ?,
        Country = ?,
        Performance = ?
      WHERE VendorID = ?
    `

    await query(sql, [
      name,
      contactName || null,
      category || null,
      email || null,
      phone || null,
      city || null,
      address || null,
      country || null,
      performance || null,
      params.id,
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to update vendor', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/vendors/[id] - Delete a vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await query('DELETE FROM VendorManagement WHERE VendorID = ?', [params.id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json(
      { error: 'Failed to delete vendor', message: error.message },
      { status: 500 }
    )
  }
}
