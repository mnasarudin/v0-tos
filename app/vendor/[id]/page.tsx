"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import type { Vendor } from "@/components/vendor-form"

const VENDOR_STORAGE_KEY = "app.vendors"
const ITEM_STORAGE_KEY = "app.items"

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
  vendorId?: string
  currentStock?: number
  description?: string
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

function VendorDetailsContent() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(params.id)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    setVendors(readVendors())
    setItems(readItems())
  }, [])

  const vendor = useMemo(() => vendors.find(v => v.id === id), [vendors, id])
  const suppliedItems = useMemo(() => items.filter(i => i.vendorId === id), [items, id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Details</h2>
          <p className="text-muted-foreground">{vendor?.name || "Unknown Vendor"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/vendor/list")}>Back to List</Button>
          <Button onClick={() => router.push(`/vendor/add?id=${encodeURIComponent(id)}`)}>Edit Vendor</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {vendor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium">Name:</span> {vendor.name}</div>
              <div><span className="font-medium">Category:</span> {vendor.category}</div>
              {vendor.ssmNumber && (
                <div className="md:col-span-2"><span className="font-medium">SSM Number:</span> {vendor.ssmNumber}</div>
              )}
              <div><span className="font-medium">Contact:</span> {vendor.contactName || <span className="text-muted-foreground">Not provided</span>}</div>
              <div><span className="font-medium">Email:</span> {vendor.email || <span className="text-muted-foreground">Not provided</span>}</div>
              <div><span className="font-medium">Phone:</span> {vendor.phone || <span className="text-muted-foreground">Not provided</span>}</div>
              <div className="md:col-span-2"><span className="font-medium">Address:</span> {vendor.address || <span className="text-muted-foreground">Not provided</span>}</div>
              <div><span className="font-medium">City:</span> {vendor.city || <span className="text-muted-foreground">Not provided</span>}</div>
              <div><span className="font-medium">Country:</span> {vendor.country || <span className="text-muted-foreground">Not provided</span>}</div>
              <div><span className="font-medium">Performance:</span> {vendor.performance}</div>
            </div>
          ) : (
            <div className="text-muted-foreground">Vendor not found.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Items</CardTitle>
        </CardHeader>
        <CardContent>
          {suppliedItems.length === 0 ? (
            <div className="text-muted-foreground text-sm">No items supplied by this vendor.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {suppliedItems.map(i => (
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
                    <div className="mt-2 space-y-1">
                      {i.currentStock !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          Stock: {i.currentStock}
                        </div>
                      )}
                      {i.minStock !== undefined && i.minStock > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Min Stock: {i.minStock}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function VendorDetailsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <VendorDetailsContent />
      </DashboardLayout>
    </AuthGuard>
  )
}


