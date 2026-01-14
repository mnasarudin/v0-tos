"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pencil, Plus } from "lucide-react"
import { useRouter } from "next/navigation"

type Item = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  price: number
  minStock: number
  location: string
  image?: string
  vendorId?: string
}

const ITEM_STORAGE_KEY = "app.items"

function isValidImageUrl(url: string | undefined): boolean {
  if (!url || url.trim() === "") return false
  // Check if it's an absolute Windows path (C:/ or C:\)
  if (url.match(/^[A-Z]:[/\\]/)) return false
  // Check if it's a valid URL or relative path
  return true
}

function sanitizeImageUrl(url: string | undefined): string {
  if (!url || url.trim() === "" || !isValidImageUrl(url)) {
    return "/placeholder.jpg"
  }
  return url
}

function readItems(): Item[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ITEM_STORAGE_KEY)
    const items = raw ? (JSON.parse(raw) as Item[]) : []
    // Sanitize image URLs
    const sanitizedItems = items.map(item => ({
      ...item,
      image: sanitizeImageUrl(item.image)
    }))
    
    // Update localStorage if images were sanitized
    const needsUpdate = sanitizedItems.some((item, idx) => 
      item.image !== (items[idx].image || undefined)
    )
    if (needsUpdate) {
      localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(sanitizedItems))
    }
    
    return sanitizedItems
  } catch {
    return []
  }
}

export function ItemList() {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    setItems(readItems())
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Items</h2>
          <p className="text-muted-foreground">Mocked item master data</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/item/add")}> <Plus className="w-4 h-4 mr-2" /> Register Item</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item List</CardTitle>
          <CardDescription>{items.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Min Stock</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(i => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                      <img 
                        src={i.image || "/placeholder.jpg"} 
                        alt={i.name}
                        className="w-full h-full object-cover object-center"
                        style={{ imageRendering: 'auto' }}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder.jpg";
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>{i.sku}</TableCell>
                  <TableCell>{i.name}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell>${i.price?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{i.minStock}</TableCell>
                  <TableCell>{i.location}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/item/add?id=${i.id}`)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ItemList








