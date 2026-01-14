import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET /api/cart - Get user's cart
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userEmail = searchParams.get('userEmail') || 'guest@example.com'

    const sql = `
      SELECT 
        c.CartID as cartId,
        c.SKUCode as skuCode,
        c.Quantity as quantity,
        c.SelectedColor as selectedColor,
        c.SelectedSize as selectedSize,
        i.SKUCode as 'item.id',
        i.SKUCode as 'item.sku',
        i.ItemName as 'item.name',
        i.Category as 'item.category',
        i.Unit as 'item.unit',
        i.Price as 'item.price',
        i.MinStock as 'item.minStock',
        i.CurrentStock as 'item.currentStock',
        i.Location as 'item.location',
        i.Description as 'item.description',
        i.Image as 'item.image',
        i.VendorID as 'item.vendorId'
      FROM Cart c
      INNER JOIN ItemManagement i ON c.SKUCode = i.SKUCode
      WHERE c.UserEmail = ?
    `

    const cartItems = await query(sql, [userEmail]) as any[]

    const formattedCart = cartItems.map((item: any) => ({
      item: {
        id: item['item.id'],
        sku: item['item.sku'],
        name: item['item.name'],
        category: item['item.category'],
        unit: item['item.unit'],
        price: parseFloat(item['item.price']) || 0,
        minStock: parseInt(item['item.minStock']) || 0,
        currentStock: parseInt(item['item.currentStock']) || 0,
        location: item['item.location'],
        description: item['item.description'],
        image: item['item.image'],
        vendorId: item['item.vendorId'],
      },
      quantity: parseInt(item.quantity) || 1,
      estimatedPrice: parseFloat(item['item.price']) || 0,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
    }))

    return NextResponse.json(formattedCart)
  } catch (error: any) {
    console.error('Error fetching cart:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cart', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userEmail = 'guest@example.com',
      itemId,
      quantity,
      selectedColor,
      selectedSize,
    } = body

    // Check if item already exists in cart
    const existingSql = `
      SELECT CartID, Quantity
      FROM Cart
      WHERE UserEmail = ? AND SKUCode = ? 
        AND (SelectedColor = ? OR (SelectedColor IS NULL AND ? IS NULL))
        AND (SelectedSize = ? OR (SelectedSize IS NULL AND ? IS NULL))
    `
    const existing = await query(existingSql, [
      userEmail,
      itemId,
      selectedColor || null,
      selectedColor || null,
      selectedSize || null,
      selectedSize || null,
    ]) as any[]

    if (existing.length > 0) {
      // Update quantity
      const newQuantity = existing[0].Quantity + (quantity || 1)
      await query(
        'UPDATE Cart SET Quantity = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE CartID = ?',
        [newQuantity, existing[0].CartID]
      )
    } else {
      // Insert new cart item
      await query(
        `INSERT INTO Cart (UserEmail, SKUCode, Quantity, SelectedColor, SelectedSize)
         VALUES (?, ?, ?, ?, ?)`,
        [userEmail, itemId, quantity || 1, selectedColor || null, selectedSize || null]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error adding to cart:', error)
    return NextResponse.json(
      { error: 'Failed to add to cart', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/cart - Clear cart or remove specific item
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userEmail = searchParams.get('userEmail') || 'guest@example.com'
    const itemId = searchParams.get('itemId')
    const selectedColor = searchParams.get('selectedColor')
    const selectedSize = searchParams.get('selectedSize')

    if (itemId) {
      // Remove specific item
      let sql = 'DELETE FROM Cart WHERE UserEmail = ? AND SKUCode = ?'
      const params: any[] = [userEmail, itemId]

      if (selectedColor !== null) {
        sql += ' AND (SelectedColor = ? OR (SelectedColor IS NULL AND ? IS NULL))'
        params.push(selectedColor || null, selectedColor || null)
      }
      if (selectedSize !== null) {
        sql += ' AND (SelectedSize = ? OR (SelectedSize IS NULL AND ? IS NULL))'
        params.push(selectedSize || null, selectedSize || null)
      }

      await query(sql, params)
    } else {
      // Clear entire cart
      await query('DELETE FROM Cart WHERE UserEmail = ?', [userEmail])
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting from cart:', error)
    return NextResponse.json(
      { error: 'Failed to delete from cart', message: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/cart - Update cart item quantity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userEmail = 'guest@example.com',
      itemId,
      quantity,
      selectedColor,
      selectedSize,
    } = body

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return DELETE(request)
    }

    let sql = `
      UPDATE Cart 
      SET Quantity = ?, UpdatedAt = CURRENT_TIMESTAMP
      WHERE UserEmail = ? AND SKUCode = ?
    `
    const params: any[] = [quantity, userEmail, itemId]

    if (selectedColor !== undefined) {
      sql += ' AND (SelectedColor = ? OR (SelectedColor IS NULL AND ? IS NULL))'
      params.push(selectedColor || null, selectedColor || null)
    }
    if (selectedSize !== undefined) {
      sql += ' AND (SelectedSize = ? OR (SelectedSize IS NULL AND ? IS NULL))'
      params.push(selectedSize || null, selectedSize || null)
    }

    await query(sql, params)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating cart:', error)
    return NextResponse.json(
      { error: 'Failed to update cart', message: error.message },
      { status: 500 }
    )
  }
}
