"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type POStatus = "draft" | "issued" | "received" | "cancelled"

interface POItem {
  id: string
  orderNo: string
  supplier: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  status: POStatus
}

export function POReport() {
  const data: POItem[] = [
    { id: "1", orderNo: "PO-2001", supplier: "Acme Supplies", department: "Administration", requester: "Alice", item: "Office Chairs", quantity: 10, unitPrice: 80, status: "received" },
    { id: "2", orderNo: "PO-2008", supplier: "SoftCo", department: "Finance", requester: "Bob", item: "Accounting Software", quantity: 5, unitPrice: 130, status: "issued" },
    { id: "3", orderNo: "PO-2015", supplier: "TechHub", department: "IT", requester: "Charlie", item: "Laptops", quantity: 3, unitPrice: 970, status: "draft" },
    { id: "4", orderNo: "PO-2019", supplier: "ViewTech", department: "IT", requester: "Dana", item: "Monitors", quantity: 6, unitPrice: 185, status: "received" },
    { id: "5", orderNo: "PO-2024", supplier: "SafetyFirst", department: "Operation", requester: "Eve", item: "Safety Helmets", quantity: 50, unitPrice: 24, status: "cancelled" },
  ]

  const summary = useMemo(() => {
    const byDepartment: Record<string, { count: number; total: number }> = {}
    const byStatus: Record<POStatus, number> = { draft: 0, issued: 0, received: 0, cancelled: 0 }
    const bySupplier: Record<string, { count: number; total: number }> = {}
    let grandTotal = 0
    for (const po of data) {
      const total = po.quantity * po.unitPrice
      grandTotal += total
      byDepartment[po.department] = byDepartment[po.department] || { count: 0, total: 0 }
      byDepartment[po.department].count += 1
      byDepartment[po.department].total += total
      byStatus[po.status] += 1
      bySupplier[po.supplier] = bySupplier[po.supplier] || { count: 0, total: 0 }
      bySupplier[po.supplier].count += 1
      bySupplier[po.supplier].total += total
    }
    return { byDepartment, byStatus, bySupplier, grandTotal }
  }, [data])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">PO Reports</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Spend</CardTitle>
            <CardDescription>Sum of all PO totals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">${summary.grandTotal.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>Draft/Issued/Received/Cancelled</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>Draft: {summary.byStatus.draft}</li>
              <li>Issued: {summary.byStatus.issued}</li>
              <li>Received: {summary.byStatus.received}</li>
              <li>Cancelled: {summary.byStatus.cancelled}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Count and total spend</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {Object.entries(summary.byDepartment).map(([dept, stats]) => (
                <li key={dept} className="flex justify-between">
                  <span>{dept} ({stats.count})</span>
                  <span>${stats.total.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>PO count and totals by supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            {Object.entries(summary.bySupplier).map(([supplier, stats]) => (
              <li key={supplier} className="flex justify-between">
                <span>{supplier} ({stats.count})</span>
                <span>${stats.total.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}




