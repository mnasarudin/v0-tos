"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type ItemUsage = { id: string; sku: string; name: string; category: string; usedQty: number; period: string }

export function ItemReport() {
  const data: ItemUsage[] = [
    { id: "u4", sku: "ITM-004", name: "Laptop", category: "IT", usedQty: 2, period: "2025-09" },
  ]

  const summary = useMemo(() => {
    const byCategory: Record<string, number> = {}
    let totalUsed = 0
    for (const row of data) {
      totalUsed += row.usedQty
      byCategory[row.category] = (byCategory[row.category] || 0) + row.usedQty
    }
    return { totalUsed, byCategory }
  }, [data])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Item Usage Report</h2>
        <p className="text-muted-foreground">Mock usage by category and detailed lines</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Used (period)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalUsed}</div>
          </CardContent>
        </Card>

        {Object.entries(summary.byCategory).map(([category, qty]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{qty}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Used Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(i => (
                <TableRow key={i.id}>
                  <TableCell>{i.period}</TableCell>
                  <TableCell>{i.sku}</TableCell>
                  <TableCell>{i.name}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell>{i.usedQty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ItemReport








