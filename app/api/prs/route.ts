import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/prs - Get all purchase requisitions
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    let sql = `
      SELECT 
        pr.RequestNum as id,
        pr.RequestNo as requestNo,
        pr.RequesterName as requester,
        pr.Dept as department,
        pr.RequestDate as requestDate,
        pr.Status as status,
        pr.Priority as priority,
        pr.Category as category,
        pr.Justification as justification,
        pr.Remarks as remarks,
        pr.ApprovalDate as approvalDate,
        pr.ApprovedBy as approvedBy,
        pr.TotalItems as totalItems,
        pr.EstimatedTotal as estimatedTotal,
        pr.CreatedAt as createdAt,
        pr.UpdatedAt as updatedAt
      FROM PurchaseRequisition pr
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      sql += ' AND pr.Status = ?'
      params.push(status)
    }

    sql += ' ORDER BY pr.RequestDate DESC, pr.RequestNum DESC'

    const prs = await query(sql, params) as any[]

    // Get items for each PR
    const prsWithItems = await Promise.all(
      prs.map(async (pr) => {
        const itemsSql = `
          SELECT 
            pri.SKUCode as id,
            i.ItemName as name,
            pri.SKUCode as sku,
            i.Category as category,
            i.Unit as unit,
            pri.Quantity as quantity,
            pri.UnitPrice as unitPrice,
            pri.Total as total,
            i.Location as location,
            i.MinStock as minStock,
            i.CurrentStock as currentStock,
            pri.SelectedColor as selectedColor,
            pri.SelectedSize as selectedSize
          FROM PRItems pri
          INNER JOIN ItemManagement i ON pri.SKUCode = i.SKUCode
          WHERE pri.RequestNum = ?
        `
        const items = await query(itemsSql, [pr.id]) as any[]

        return {
          ...pr,
          items: items.map((item: any) => ({
            ...item,
            unitPrice: parseFloat(item.unitPrice) || 0,
            total: parseFloat(item.total) || 0,
            quantity: parseInt(item.quantity) || 0,
            minStock: parseInt(item.minStock) || 0,
            currentStock: parseInt(item.currentStock) || 0,
          })),
          estimatedTotal: parseFloat(pr.estimatedTotal) || 0,
          totalItems: parseInt(pr.totalItems) || 0,
        }
      })
    )

    return NextResponse.json(prsWithItems)
  } catch (error: any) {
    console.error('Error fetching PRs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PRs', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/prs - Create a new purchase requisition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      requestNo,
      requester,
      department,
      requestDate,
      status = 'submitted',
      priority = 'medium',
      category = 'General',
      justification,
      remarks,
      items,
      totalItems,
      estimatedTotal,
    } = body

    // Insert PR
    const prSql = `
      INSERT INTO PurchaseRequisition (
        RequestNo, RequesterName, Dept, RequestDate, Status,
        Priority, Category, Justification, Remarks,
        TotalItems, EstimatedTotal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await query(prSql, [
      requestNo,
      requester,
      department,
      requestDate || new Date().toISOString().split('T')[0],
      status,
      priority,
      category,
      justification || null,
      remarks || null,
      totalItems || 0,
      estimatedTotal || 0,
    ]) as any

    const requestNum = result.insertId

    // Insert PR items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query(
          `INSERT INTO PRItems (
            RequestNum, SKUCode, Quantity, UnitPrice, Total,
            SelectedColor, SelectedSize
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            requestNum,
            item.id || item.sku,
            item.quantity,
            item.unitPrice || item.estimatedPrice || 0,
            item.total || (item.unitPrice || item.estimatedPrice || 0) * item.quantity,
            item.selectedColor || null,
            item.selectedSize || null,
          ]
        )
      }
    }

    return NextResponse.json({ success: true, id: requestNum, requestNo })
  } catch (error: any) {
    console.error('Error creating PR:', error)
    return NextResponse.json(
      { error: 'Failed to create PR', message: error.message },
      { status: 500 }
    )
  }
}
