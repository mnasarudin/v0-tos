"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

const INVENTORY_STORAGE_KEY = "app.inventory"

interface InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  unit: string
  location: string
  supplier?: string
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

export function InventoryList() {
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])

  useEffect(() => {
    const loadInventory = () => {
      const inventoryItems = readInventory()
      setItems(inventoryItems)
    }

    loadInventory()

    // Listen for inventory updates
    const handleInventoryUpdate = () => {
      loadInventory()
    }

    window.addEventListener('inventory-updated', handleInventoryUpdate)
    window.addEventListener('storage', handleInventoryUpdate)

    return () => {
      window.removeEventListener('inventory-updated', handleInventoryUpdate)
      window.removeEventListener('storage', handleInventoryUpdate)
    }
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground">Current inventory items from stock movements</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/inventory/stock?tab=in")}>
            <Plus className="w-4 h-4 mr-2" /> Stock In
          </Button>
          <Button variant="outline" onClick={() => router.push("/inventory/stock?tab=out")}>
            <Plus className="w-4 h-4 mr-2" /> Stock Out
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>{items.length} item(s)</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No inventory items yet. Add items using Stock In.
                  </TableCell>
                </TableRow>
              ) : (
                items.map(i => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.sku}</TableCell>
                    <TableCell>{i.name}</TableCell>
                    <TableCell>{i.quantity}</TableCell>
                    <TableCell>{i.unit}</TableCell>
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








