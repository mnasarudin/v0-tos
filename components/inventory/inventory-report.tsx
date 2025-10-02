"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type Item = { id: string; sku: string; name: string; quantity: number; unit: string; location: string }

export function InventoryReport() {
  const data: Item[] = [
    { id: "1", sku: "SKU-001", name: "Safety Helmet", quantity: 120, unit: "pcs", location: "Main" },
    { id: "2", sku: "SKU-002", name: "Office Chair", quantity: 35, unit: "pcs", location: "Main" },
    { id: "3", sku: "SKU-003", name: "Printer Paper A4", quantity: 80, unit: "box", location: "Store-2" },
    { id: "4", sku: "SKU-004", name: "Laptop", quantity: 10, unit: "pcs", location: "IT Room" },
  ]

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
        <p className="text-muted-foreground">Summary by location (mock data)</p>
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
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(i => (
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








