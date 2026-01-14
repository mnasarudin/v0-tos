"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Vendor } from "@/components/vendor-form"

const VENDOR_STORAGE_KEY = "app.vendors"

function readVendors(): Vendor[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(VENDOR_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Vendor[]) : []
  } catch {
    return []
  }
}

function performanceColor(p: Vendor["performance"]) {
  switch (p) {
    case "excellent":
      return "bg-emerald-100 text-emerald-700"
    case "good":
      return "bg-blue-100 text-blue-700"
    case "average":
      return "bg-amber-100 text-amber-700"
    case "poor":
      return "bg-rose-100 text-rose-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

function CategoryBrandsContent() {
  const router = useRouter()
  const params = useParams<{ category: string }>()
  const category = decodeURIComponent(params.category)
  const [vendors, setVendors] = useState<Vendor[]>([])

  useEffect(() => {
    setVendors(readVendors())
  }, [])

  const brands = useMemo(() => {
    const cat = category.toLowerCase()
    const exact = vendors.filter(v => v.category === category)
    if (exact.length > 0) return exact
    // similar/related: includes match
    return vendors.filter(v => v.category.toLowerCase().includes(cat))
  }, [vendors, category])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{category} Brands</h2>
          <p className="text-muted-foreground">Select a brand to view items</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/vendor/shop")}>Back to Categories</Button>
      </div>

      {brands.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No brands found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No vendors registered for this category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {brands.map(v => (
            <Card key={v.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-[16/9] bg-muted/50 flex items-center justify-center">
                <span className="text-muted-foreground">{v.name.charAt(0)}</span>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base leading-tight">{v.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">{v.city}, {v.country}</div>
                  </div>
                  <Badge className={performanceColor(v.performance)}>{v.performance}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{v.category}</span>
                  <span>{v.phone}</span>
                </div>
                <div className="mt-4">
                  <Button size="sm" onClick={() => router.push(`/vendor/shop/${encodeURIComponent(category)}/${encodeURIComponent(v.id)}`)}>View Items</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoryBrandsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <CategoryBrandsContent />
      </DashboardLayout>
    </AuthGuard>
  )
}


