"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface InventoryItem {
  id: string
  sku: string
  name: string
  quantity: number
  unit: string
  location: string
}

export function InventoryList() {
  const router = useRouter()
  const [items] = useState<InventoryItem[]>([
    { id: "1", sku: "SKU-001", name: "Safety Helmet", quantity: 120, unit: "pcs", location: "Main" },
    { id: "2", sku: "SKU-002", name: "Office Chair", quantity: 35, unit: "pcs", location: "Main" },
    { id: "3", sku: "SKU-003", name: "Printer Paper A4", quantity: 80, unit: "box", location: "Store-2" },
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory</h2>
          <p className="text-muted-foreground">Mocked inventory listing</p>
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
              {items.map(i => (
                <TableRow key={i.id}>
                  <TableCell>{i.sku}</TableCell>
                  <TableCell>{i.name}</TableCell>
                  <TableCell>{i.quantity}</TableCell>
                  <TableCell>{i.unit}</TableCell>
                  <TableCell>{i.location}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}








