import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/vendors - Get all vendors
export async function GET(request: NextRequest) {
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
      ORDER BY VendorName
    `
    const vendors = await query(sql) as any[]

    return NextResponse.json(vendors)
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendors', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/vendors - Create a new vendor
export async function POST(request: NextRequest) {
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
      INSERT INTO VendorManagement (
        VendorName, ContactName, Category, Email, Phone,
        City, Address, Country, Performance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await query(sql, [
      name,
      contactName || null,
      category || null,
      email || null,
      phone || null,
      city || null,
      address || null,
      country || null,
      performance || null,
    ]) as any

    return NextResponse.json({ success: true, id: result.insertId })
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    return NextResponse.json(
      { error: 'Failed to create vendor', message: error.message },
      { status: 500 }
    )
  }
}
