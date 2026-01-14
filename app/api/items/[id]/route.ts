import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/items/[id] - Get a single item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = `
      SELECT 
        i.SKUCode as id,
        i.SKUCode as sku,
        i.ItemName as name,
        i.Category as category,
        i.Unit as unit,
        i.Price as price,
        i.MinStock as minStock,
        i.CurrentStock as currentStock,
        i.Location as location,
        i.Description as description,
        i.Image as image,
        i.VendorID as vendorId,
        i.AvailableSizes as availableSizes,
        i.AvailableColors as availableColors
      FROM ItemManagement i
      WHERE i.SKUCode = ?
    `
    const items = await query(sql, [params.id]) as any[]

    if (items.length === 0) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const item = items[0]

    // Get variants
    const variantsSql = `
      SELECT 
        Color as color,
        Size as size,
        Quantity as quantity,
        Image as image
      FROM ItemVariants
      WHERE SKUCode = ?
    `
    const variants = await query(variantsSql, [params.id]) as any[]

    return NextResponse.json({
      ...item,
      variants: variants.length > 0 ? variants : undefined,
      availableSizes: item.availableSizes ? JSON.parse(item.availableSizes) : [],
      availableColors: item.availableColors ? JSON.parse(item.availableColors) : [],
      price: parseFloat(item.price) || 0,
      minStock: parseInt(item.minStock) || 0,
      currentStock: parseInt(item.currentStock) || 0,
    })
  } catch (error: any) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item', message: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/items/[id] - Update an item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const {
      name,
      category,
      unit,
      price,
      minStock,
      location,
      description,
      image,
      vendorId,
      availableSizes,
      availableColors,
      variants,
      currentStock,
    } = body

    const updateSql = `
      UPDATE ItemManagement SET
        ItemName = ?,
        Category = ?,
        Unit = ?,
        Price = ?,
        MinStock = ?,
        Location = ?,
        Description = ?,
        Image = ?,
        VendorID = ?,
        CurrentStock = ?,
        AvailableSizes = ?,
        AvailableColors = ?,
        UpdatedAt = CURRENT_TIMESTAMP
      WHERE SKUCode = ?
    `

    await query(updateSql, [
      name,
      category,
      unit,
      price || 0,
      minStock || 0,
      location,
      description || null,
      image || null,
      vendorId || null,
      currentStock || 0,
      availableSizes ? JSON.stringify(availableSizes) : null,
      availableColors ? JSON.stringify(availableColors) : null,
      params.id,
    ])

    // Handle variants
    if (variants && Array.isArray(variants)) {
      // Delete existing variants
      await query('DELETE FROM ItemVariants WHERE SKUCode = ?', [params.id])

      // Insert new variants
      for (const variant of variants) {
        if (variant.color || variant.size) {
          await query(
            `INSERT INTO ItemVariants (SKUCode, Color, Size, Quantity, Image)
             VALUES (?, ?, ?, ?, ?)`,
            [
              params.id,
              variant.color || null,
              variant.size || null,
              variant.quantity || 0,
              variant.image || null,
            ]
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete an item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete variants first (cascade should handle this, but being explicit)
    await query('DELETE FROM ItemVariants WHERE SKUCode = ?', [params.id])
    
    // Delete item
    await query('DELETE FROM ItemManagement WHERE SKUCode = ?', [params.id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item', message: error.message },
      { status: 500 }
    )
  }
}
