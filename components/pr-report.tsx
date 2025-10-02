"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type PRStatus = "draft" | "submitted" | "approved" | "rejected"

interface PRItem {
  id: string
  requestNo: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  status: PRStatus
}

export function PRReport() {
  const data: PRItem[] = [
    { id: "1", requestNo: "PR-1023", department: "Administration", requester: "Alice", item: "Office Chairs", quantity: 10, unitPrice: 75, status: "approved" },
    { id: "2", requestNo: "PR-1058", department: "Finance", requester: "Bob", item: "Accounting Software License", quantity: 5, unitPrice: 120, status: "submitted" },
    { id: "3", requestNo: "PR-1101", department: "IT", requester: "Charlie", item: "Laptops", quantity: 3, unitPrice: 950, status: "draft" },
    { id: "4", requestNo: "PR-1112", department: "IT", requester: "Dana", item: "Monitors", quantity: 6, unitPrice: 180, status: "approved" },
    { id: "5", requestNo: "PR-1120", department: "Operation", requester: "Eve", item: "Safety Helmets", quantity: 50, unitPrice: 22, status: "rejected" },
  ]

  const summary = useMemo(() => {
    const byDepartment: Record<string, { count: number; total: number }> = {}
    const byStatus: Record<PRStatus, number> = { draft: 0, submitted: 0, approved: 0, rejected: 0 }
    let grandTotal = 0
    for (const pr of data) {
      const total = pr.quantity * pr.unitPrice
      grandTotal += total
      byDepartment[pr.department] = byDepartment[pr.department] || { count: 0, total: 0 }
      byDepartment[pr.department].count += 1
      byDepartment[pr.department].total += total
      byStatus[pr.status] += 1
    }
    return { byDepartment, byStatus, grandTotal }
  }, [data])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">PR Reports</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Spend</CardTitle>
            <CardDescription>Sum of all PR totals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">${summary.grandTotal.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>Draft/Submitted/Approved/Rejected</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>Draft: {summary.byStatus.draft}</li>
              <li>Submitted: {summary.byStatus.submitted}</li>
              <li>Approved: {summary.byStatus.approved}</li>
              <li>Rejected: {summary.byStatus.rejected}</li>
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
    </div>
  )
}


