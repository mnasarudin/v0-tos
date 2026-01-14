"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { Vendor } from "@/components/vendor-form"

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
}

const VENDOR_STORAGE_KEY = "app.vendors"
const ITEM_STORAGE_KEY = "app.items"

function isValidImageUrl(url: string | undefined): boolean {
  if (!url || url.trim() === "") return false
  if (url.match(/^[A-Z]:[/\\]/)) return false
  return true
}

function sanitizeImageUrl(url: string | undefined): string {
  if (!url || url.trim() === "" || !isValidImageUrl(url)) {
    return "/placeholder.jpg"
  }
  return url
}

function readVendors(): Vendor[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(VENDOR_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Vendor[]) : []
  } catch {
    return []
  }
}

function readItems(): Item[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ITEM_STORAGE_KEY)
    const items = raw ? (JSON.parse(raw) as Item[]) : []
    return items.map(i => ({ ...i, image: sanitizeImageUrl(i.image) }))
  } catch {
    return []
  }
}

function CategoryBrandItemsContent() {
  const router = useRouter()
  const params = useParams<{ category: string, vendorId: string }>()
  const category = decodeURIComponent(params.category)
  const vendorId = decodeURIComponent(params.vendorId)

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    setVendors(readVendors())
    setItems(readItems())
  }, [])

  const vendor = useMemo(() => vendors.find(v => v.id === vendorId), [vendors, vendorId])

  const visibleItems = useMemo(() => {
    // Show items of this brand only: match both category and vendorId (when present)
    return items.filter(i => i.category === category && i.vendorId === vendorId)
  }, [items, category, vendorId])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{vendor?.name || "Brand"} · {category}</h2>
          <p className="text-muted-foreground">Browse items under this brand and category</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/vendor/shop/${encodeURIComponent(category)}`)}>Back to Brands</Button>
          <Button variant="outline" onClick={() => router.push(`/vendor/shop`)}>Categories</Button>
        </div>
      </div>

      {vendor && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Name:</span> {vendor.name}</div>
              <div><span className="font-medium">Category:</span> {vendor.category}</div>
              <div><span className="font-medium">Contact:</span> {vendor.contactName}</div>
              <div><span className="font-medium">Email:</span> {vendor.email}</div>
              <div><span className="font-medium">Phone:</span> {vendor.phone}</div>
              <div><span className="font-medium">Address:</span> {vendor.address}</div>
              <div><span className="font-medium">City:</span> {vendor.city}</div>
              <div><span className="font-medium">Country:</span> {vendor.country}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {visibleItems.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No items found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No items registered in this category.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleItems.map(i => (
            <Card key={i.id} className="overflow-hidden">
              <div className="aspect-square bg-muted">
                <img
                  src={i.image || "/placeholder.jpg"}
                  alt={i.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.jpg" }}
                  loading="lazy"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-base leading-tight">{i.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">SKU: {i.sku}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm">{i.unit}</span>
                  <span className="font-semibold">${i.price?.toFixed(2) || "0.00"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoryBrandItemsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <CategoryBrandItemsContent />
      </DashboardLayout>
    </AuthGuard>
  )
}


