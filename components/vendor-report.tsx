"use client"

import { useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Vendor } from "@/components/vendor-form"

const VENDOR_STORAGE_KEY = "app.vendors"
const VENDOR_DAMAGE_STORAGE_KEY = "app.vendorDamages"
const PO_STORAGE_KEY = "app.pos"

function readVendors(): Vendor[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(VENDOR_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Vendor[]) : []
  } catch {
    return []
  }
}

type VendorDamageRecord = {
  id: string
  vendorId: string
  vendorName: string
  item: string
  quantity: number
  unitCost: number
  reason: string
}

function readVendorDamages(): VendorDamageRecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(VENDOR_DAMAGE_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as VendorDamageRecord[]) : []
  } catch {
    return []
  }
}

function writeVendorDamages(records: VendorDamageRecord[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(VENDOR_DAMAGE_STORAGE_KEY, JSON.stringify(records))
}

type PORecord = {
  id: string
  orderNo: string
  supplier: string
  item: string
  quantity: number
  unitPrice: number
}

function readPOs(): PORecord[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(PO_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PORecord[]) : []
  } catch {
    return []
  }
}

export function VendorReport() {
  const vendors = readVendors()
  const tableRef = useRef<HTMLDivElement | null>(null)

  // Seed mock damage data if absent to enable reporting
  useEffect(() => {
    const existing = readVendorDamages()
    if (existing.length === 0 && vendors.length > 0) {
      const seed: VendorDamageRecord[] = vendors.slice(0, 3).flatMap((v, idx) => [
        {
          id: `d-${v.id}-1`,
          vendorId: v.id,
          vendorName: v.name,
          item: idx === 0 ? "Office Chair" : idx === 1 ? "Industrial Gloves" : "Laptop",
          quantity: 2 + idx,
          unitCost: 50 * (idx + 1),
          reason: "Damaged during transport",
        },
        {
          id: `d-${v.id}-2`,
          vendorId: v.id,
          vendorName: v.name,
          item: idx === 0 ? "Desk Lamp" : idx === 1 ? "Helmet" : "Monitor",
          quantity: 1,
          unitCost: 30 * (idx + 1),
          reason: "Faulty unit",
        },
      ])
      writeVendorDamages(seed)
    }
  }, [vendors])

  const summary = useMemo(() => {
    const byPerformance: Record<string, number> = { excellent: 0, good: 0, average: 0, poor: 0 }
    const byCategory: Record<string, { count: number; vendors: Vendor[] }> = {}
    const byCompany: Record<string, { count: number; vendors: Vendor[] }> = {}
    const damages = readVendorDamages()
    const pos = readPOs()
    const damageByVendorId: Record<string, number> = {}
    const purchaseByVendorName: Record<string, number> = {}
    let totalDamageAllVendors = 0
    
    for (const v of vendors) {
      byPerformance[v.performance] = (byPerformance[v.performance] || 0) + 1
      
      if (!byCategory[v.category]) {
        byCategory[v.category] = { count: 0, vendors: [] }
      }
      byCategory[v.category].count += 1
      byCategory[v.category].vendors.push(v)
      
      if (!byCompany[v.name]) {
        byCompany[v.name] = { count: 0, vendors: [] }
      }
      byCompany[v.name].count += 1
      byCompany[v.name].vendors.push(v)
    }

    for (const d of damages) {
      const cost = d.quantity * d.unitCost
      damageByVendorId[d.vendorId] = (damageByVendorId[d.vendorId] || 0) + cost
      totalDamageAllVendors += cost
    }

    for (const po of pos) {
      const total = po.quantity * po.unitPrice
      purchaseByVendorName[po.supplier] = (purchaseByVendorName[po.supplier] || 0) + total
    }
    
    const total = vendors.length
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1].count - a[1].count)[0]?.[0] || "-"
    const excellentPercent = total ? Math.round((byPerformance.excellent / total) * 100) : 0
    
    return { byPerformance, byCategory, byCompany, total, topCategory, excellentPercent, damageByVendorId, totalDamageAllVendors, purchaseByVendorName }
  }, [vendors])

  function handleExportPDF() {
    if (!tableRef.current) return
    const content = tableRef.current.innerHTML
    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) return
    printWindow.document.open()
    printWindow.document.write(`<!doctype html><html><head><title>Vendor Report</title>
      <style>
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, sans-serif; padding: 24px; }
        h1 { font-size: 20px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 8px 10px; font-size: 12px; }
        th { background: #f9fafb; text-align: left; }
        tfoot td { font-weight: 600; }
      </style>
    </head><body>
      <h1>Vendor Report</h1>
      <div>${content}</div>
    </body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Vendor Report</h2>
        <button
          type="button"
          onClick={handleExportPDF}
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Vendors</CardTitle>
            <CardDescription>Registered vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Category</CardTitle>
            <CardDescription>Largest vendor segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.topCategory}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Excellent Rate</CardTitle>
            <CardDescription>% of excellent vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.excellentPercent}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Damage Cost (All Vendors)</CardTitle>
            <CardDescription>Total cost from damage records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">${summary.totalDamageAllVendors.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>By Performance</CardTitle>
            <CardDescription>Excellent / Good / Average / Poor</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>Excellent: {summary.byPerformance.excellent}</li>
              <li>Good: {summary.byPerformance.good}</li>
              <li>Average: {summary.byPerformance.average}</li>
              <li>Poor: {summary.byPerformance.poor}</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
            <CardDescription>Distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {Object.entries(summary.byCategory).map(([cat, data]) => (
                <li key={cat} className="flex justify-between">
                  <span>{cat}</span>
                  <span>{data.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
          <CardHeader>
          <CardTitle>Vendor Report by Vendor</CardTitle>
          <CardDescription>Name, category, amount purchased and total damage</CardDescription>
          </CardHeader>
        <CardContent>
          <div ref={tableRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount Purchased</TableHead>
                  <TableHead className="text-right">Total Damage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No vendors found.</TableCell>
                  </TableRow>
                ) : (
                  vendors.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.category}</TableCell>
                      <TableCell className="text-right">${(summary.purchaseByVendorName[v.name] || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right">${(summary.damageByVendorId[v.id] || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Summary by Category</CardTitle>
          <CardDescription>Vendors grouped by category with performance breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(summary.byCategory).map(([category, data]) => (
              <div key={category} className="border rounded-lg p-4">
                <h4 className="font-semibold text-lg mb-2">{category} ({data.count} vendors)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                  {data.vendors.map(vendor => (
                    <div key={vendor.id} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">{vendor.name}</span>
                      <span className="capitalize text-muted-foreground">{vendor.performance}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VendorReport






