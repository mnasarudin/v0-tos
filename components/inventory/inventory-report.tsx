"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const INVENTORY_STORAGE_KEY = "app.inventory"
const ITEM_STORAGE_KEY = "app.items"

interface InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  unit: string
  location: string
  supplier?: string
}

interface ItemMaster {
  id: string
  sku: string
  name: string
  price: number
  image?: string
}

type ReportItem = { 
  id: string
  sku: string
  name: string
  quantity: number
  unit: string
  location: string
  price: number
  image?: string
}

function readInventory(): InventoryItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(INVENTORY_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as InventoryItem[]) : []
  } catch {
    return []
  }
}

function readItems(): ItemMaster[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ITEM_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ItemMaster[]) : []
  } catch {
    return []
  }
}

export function InventoryReport() {
  const [data, setData] = useState<ReportItem[]>([])

  useEffect(() => {
    const loadData = () => {
      const inventoryItems = readInventory()
      const itemMaster = readItems()
      
      // Combine inventory data with item master data (for price and image)
      const reportData: ReportItem[] = inventoryItems.map(invItem => {
        // Find matching item in master data by SKU
        const masterItem = itemMaster.find(item => item.sku === invItem.sku)
        
        return {
          id: invItem.id,
          sku: invItem.sku,
          name: invItem.name,
          quantity: invItem.quantity,
          unit: invItem.unit,
          location: invItem.location,
          price: masterItem?.price || 0, // Get price from item master, default to 0
          image: masterItem?.image || "/placeholder.jpg"
        }
      })
      
      setData(reportData)
    }

    loadData()

    // Listen for inventory updates
    const handleInventoryUpdate = () => {
      loadData()
    }

    window.addEventListener('inventory-updated', handleInventoryUpdate)
    window.addEventListener('storage', handleInventoryUpdate)

    return () => {
      window.removeEventListener('inventory-updated', handleInventoryUpdate)
      window.removeEventListener('storage', handleInventoryUpdate)
    }
  }, [])

  const summary = useMemo(() => {
    const byLocation: Record<string, number> = {}
    let grandTotal = 0
    for (const i of data) {
      grandTotal += i.quantity
      byLocation[i.location] = (byLocation[i.location] || 0) + i.quantity
    }
    return { grandTotal, byLocation }
  }, [data])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Inventory Report</h2>
        <p className="text-muted-foreground">Summary by location - real data from stock movements</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.grandTotal}</div>
          </CardContent>
        </Card>

        {Object.entries(summary.byLocation).map(([location, qty]) => (
          <Card key={location}>
            <CardHeader>
              <CardTitle>{location}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{qty}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No inventory items yet. Add items using Stock In to see them in the report.
                  </TableCell>
                </TableRow>
              ) : (
                data.map(i => (
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
                    <TableCell className="font-medium">{i.sku}</TableCell>
                    <TableCell>{i.name}</TableCell>
                    <TableCell>{i.quantity}</TableCell>
                    <TableCell>{i.unit}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {i.price > 0 ? `$${i.price.toFixed(2)}` : "N/A"}
                    </TableCell>
                    <TableCell>{i.location}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}








