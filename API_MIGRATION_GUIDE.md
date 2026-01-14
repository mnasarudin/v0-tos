# API Migration Guide

This guide explains how to migrate components from localStorage to database API calls.

## Overview

The application now has a complete database backend with API routes. Components should be updated to use the API client (`lib/api-client.ts`) instead of direct localStorage operations.

## API Client Usage

### Items

**Before (localStorage):**
```typescript
const items = readItems() // from localStorage
writeItems(items) // to localStorage
```

**After (API):**
```typescript
import { itemsApi } from '@/lib/api-client'

// Get all items
const items = await itemsApi.getAll()

// Get items by category
const items = await itemsApi.getAll('IT')

// Get single item
const item = await itemsApi.getById('ITM-001')

// Create item
await itemsApi.create({
  id: 'ITM-001',
  sku: 'ITM-001',
  name: 'Item Name',
  category: 'IT',
  // ... other fields
})

// Update item
await itemsApi.update('ITM-001', {
  name: 'Updated Name',
  // ... other fields
})

// Delete item
await itemsApi.delete('ITM-001')
```

### Cart

**Before (localStorage):**
```typescript
const cart = JSON.parse(localStorage.getItem('app.cart') || '[]')
localStorage.setItem('app.cart', JSON.stringify(cart))
```

**After (API):**
```typescript
import { cartApi, getCurrentUserEmail } from '@/lib/api-client'

const userEmail = getCurrentUserEmail()

// Get cart
const cart = await cartApi.getAll(userEmail)

// Add to cart
await cartApi.add({
  userEmail,
  itemId: 'ITM-001',
  quantity: 1,
  selectedColor: 'Red',
  selectedSize: 'M'
})

// Update quantity
await cartApi.update({
  userEmail,
  itemId: 'ITM-001',
  quantity: 2,
  selectedColor: 'Red',
  selectedSize: 'M'
})

// Remove item
await cartApi.remove(userEmail, 'ITM-001', 'Red', 'M')

// Clear cart
await cartApi.clear(userEmail)
```

### Vendors

**Before (localStorage):**
```typescript
const vendors = readVendors()
writeVendors(vendors)
```

**After (API):**
```typescript
import { vendorsApi } from '@/lib/api-client'

// Get all vendors
const vendors = await vendorsApi.getAll()

// Get single vendor
const vendor = await vendorsApi.getById('1')

// Create vendor
await vendorsApi.create({
  name: 'Vendor Name',
  contactName: 'John Doe',
  // ... other fields
})

// Update vendor
await vendorsApi.update('1', {
  name: 'Updated Name',
  // ... other fields
})

// Delete vendor
await vendorsApi.delete('1')
```

### Purchase Requisitions

**Before (localStorage):**
```typescript
const prs = JSON.parse(localStorage.getItem('app.prs') || '[]')
localStorage.setItem('app.prs', JSON.stringify(prs))
```

**After (API):**
```typescript
import { prsApi } from '@/lib/api-client'

// Get all PRs
const prs = await prsApi.getAll()

// Get PRs by status
const prs = await prsApi.getAll('submitted')

// Create PR
await prsApi.create({
  requestNo: '241215-001',
  requester: 'John Doe',
  department: 'Operations',
  items: [
    {
      id: 'ITM-001',
      quantity: 5,
      unitPrice: 10.00,
      // ... other fields
    }
  ],
  totalItems: 5,
  estimatedTotal: 50.00
})
```

## Component Update Example

Here's an example of updating a component:

**Before:**
```typescript
'use client'

import { useState, useEffect } from 'react'

export function ItemList() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const loadedItems = readItems() // localStorage
    setItems(loadedItems)
  }, [])

  const handleDelete = (id: string) => {
    const updated = items.filter(item => item.id !== id)
    writeItems(updated) // localStorage
    setItems(updated)
  }

  // ... rest of component
}
```

**After:**
```typescript
'use client'

import { useState, useEffect } from 'react'
import { itemsApi } from '@/lib/api-client'

export function ItemList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await itemsApi.getAll()
      setItems(data)
    } catch (error) {
      console.error('Failed to load items:', error)
      // Handle error (show toast, etc.)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await itemsApi.delete(id)
      await loadItems() // Reload from API
    } catch (error) {
      console.error('Failed to delete item:', error)
      // Handle error
    }
  }

  if (loading) return <div>Loading...</div>

  // ... rest of component
}
```

## Error Handling

Always wrap API calls in try-catch blocks and provide user feedback:

```typescript
try {
  await itemsApi.create(item)
  toast({ title: 'Success', description: 'Item created successfully' })
} catch (error: any) {
  toast({
    title: 'Error',
    description: error.message || 'Failed to create item',
    variant: 'destructive'
  })
}
```

## Migration Checklist

- [ ] Update `item-form.tsx` to use `itemsApi`
- [ ] Update `item-list.tsx` to use `itemsApi`
- [ ] Update `product-selection.tsx` to use `itemsApi` and `cartApi`
- [ ] Update `product-detail.tsx` to use `itemsApi` and `cartApi`
- [ ] Update `vendor-form.tsx` to use `vendorsApi`
- [ ] Update `vendor-list.tsx` to use `vendorsApi`
- [ ] Update PR components to use `prsApi`
- [ ] Remove localStorage read/write functions
- [ ] Test all CRUD operations
- [ ] Add loading states
- [ ] Add error handling

## Notes

- The API client automatically handles JSON serialization
- User email is retrieved from localStorage for now (can be updated to use auth context)
- All API calls are async and should be awaited
- Consider adding loading states and error boundaries
- API routes are in `app/api/` directory
- Database connection is configured in `lib/db.ts`
