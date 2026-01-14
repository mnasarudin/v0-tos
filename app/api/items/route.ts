import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/items - Get all items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const vendorId = searchParams.get('vendorId')

    let sql = `
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
      WHERE 1=1
    `
    const params: any[] = []

    if (category) {
      sql += ' AND i.Category = ?'
      params.push(category)
    }

    if (vendorId) {
      sql += ' AND i.VendorID = ?'
      params.push(vendorId)
    }

    sql += ' ORDER BY i.ItemName'

    const items = await query(sql, params) as any[]

    // Get variants for each item
    const itemsWithVariants = await Promise.all(
      items.map(async (item) => {
        const variantsSql = `
          SELECT 
            Color as color,
            Size as size,
            Quantity as quantity,
            Image as image
          FROM ItemVariants
          WHERE SKUCode = ?
        `
        const variants = await query(variantsSql, [item.id]) as any[]

        return {
          ...item,
          variants: variants.length > 0 ? variants : undefined,
          availableSizes: item.availableSizes ? JSON.parse(item.availableSizes) : [],
          availableColors: item.availableColors ? JSON.parse(item.availableColors) : [],
          price: parseFloat(item.price) || 0,
          minStock: parseInt(item.minStock) || 0,
          currentStock: parseInt(item.currentStock) || 0,
        }
      })
    )

    return NextResponse.json(itemsWithVariants)
  } catch (error: any) {
    console.error('Error fetching items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch items', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/items - Create a new item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      sku,
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

    const skuCode = id || sku

    // Insert or update item
    const insertSql = `
      INSERT INTO ItemManagement (
        SKUCode, ItemName, Category, Unit, Price, MinStock, Location,
        Description, Image, VendorID, CurrentStock, AvailableSizes, AvailableColors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ItemName = VALUES(ItemName),
        Category = VALUES(Category),
        Unit = VALUES(Unit),
        Price = VALUES(Price),
        MinStock = VALUES(MinStock),
        Location = VALUES(Location),
        Description = VALUES(Description),
        Image = VALUES(Image),
        VendorID = VALUES(VendorID),
        CurrentStock = VALUES(CurrentStock),
        AvailableSizes = VALUES(AvailableSizes),
        AvailableColors = VALUES(AvailableColors),
        UpdatedAt = CURRENT_TIMESTAMP
    `

    await query(insertSql, [
      skuCode,
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
    ])

    // Handle variants
    if (variants && Array.isArray(variants)) {
      // Delete existing variants
      await query('DELETE FROM ItemVariants WHERE SKUCode = ?', [skuCode])

      // Insert new variants
      for (const variant of variants) {
        if (variant.color || variant.size) {
          await query(
            `INSERT INTO ItemVariants (SKUCode, Color, Size, Quantity, Image)
             VALUES (?, ?, ?, ?, ?)`,
            [
              skuCode,
              variant.color || null,
              variant.size || null,
              variant.quantity || 0,
              variant.image || null,
            ]
          )
        }
      }
    }

    return NextResponse.json({ success: true, id: skuCode })
  } catch (error: any) {
    console.error('Error creating item:', error)
    return NextResponse.json(
      { error: 'Failed to create item', message: error.message },
      { status: 500 }
    )
  }
}
