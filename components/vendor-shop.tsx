"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// Role switcher removed from this page per request
import { useRouter } from "next/navigation"
import type { Vendor } from "@/components/vendor-form"

// Item typing aligned with item form
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

// No badge/cart indicators on the first page per request

export function VendorShop() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("All")
  const [selectedVendorId, setSelectedVendorId] = useState<string>("")

  useEffect(() => {
    setVendors(readVendors())
    setItems(readItems())
  }, [])

  const categories = useMemo(() => {
    return Array.from(new Set(vendors.map(v => v.category))).sort()
  }, [vendors])

  // country filtering removed per request

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const excluded = new Set(["Alpha Supplies Co.", "Beta Industrial", "Gamma Tech"]) // remove these cards on first page
    return vendors.filter(v => {
      if (excluded.has(v.name)) return false
      const matchesQuery = q
        ? (
            v.name.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            v.city.toLowerCase().includes(q) ||
            v.country.toLowerCase().includes(q)
          )
        : true
      const matchesCategory = category === "All" ? true : v.category === category
      return matchesQuery && matchesCategory
    })
  }, [vendors, query, category])

  const visibleItems = useMemo(() => {
    if (category === "All") return []
    // No explicit vendor linkage in items; show by category
    return items.filter(i => i.category === category)
  }, [items, category])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Shop</h2>
          <p className="text-muted-foreground">Browse vendors like an e-commerce catalog</p>
        </div>
      </div>

      {/* Top toolbar with Search and All Categories */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex gap-2 w-full md:w-auto">
          <Input
            placeholder="Search category (e.g., IT, Office)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button onClick={() => { if (query.trim()) router.push(`/vendor/shop/${encodeURIComponent(query.trim())}`) }}>Search</Button>
        </div>
      </div>

      {/* Shopee-like category quick buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(c => (
              <Button
                key={c}
                variant={"outline"}
                size="sm"
                onClick={() => router.push(`/vendor/shop/${encodeURIComponent(c)}`)}
              >
                {c}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* removed bottom white card */}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(v => (
            <Card
              key={v.id}
              className={`overflow-hidden hover:shadow-md transition-shadow ${selectedVendorId === v.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedVendorId(v.id)}
            >
              <div className="aspect-[16/9] bg-muted/50 flex items-center justify-center">
                <span className="text-muted-foreground">{v.name.charAt(0)}</span>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base leading-tight">{v.name}</CardTitle>
                    <div className="text-xs text-muted-foreground">{v.city}, {v.country}</div>
                  </div>
                  {/* Badge removed on first page */}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{v.category}</span>
                  <span>{v.phone}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="default">View</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>{v.name}</DialogTitle>
                        <DialogDescription>Vendor Details</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3 text-sm">
                        <div><span className="font-medium">Category:</span> {v.category}</div>
                        <div><span className="font-medium">Contact:</span> {v.contactName}</div>
                        <div><span className="font-medium">Email:</span> {v.email}</div>
                        <div><span className="font-medium">Phone:</span> {v.phone}</div>
                        <div><span className="font-medium">Address:</span> {v.address}</div>
                        <div><span className="font-medium">City:</span> {v.city}</div>
                        <div><span className="font-medium">Country:</span> {v.country}</div>
                        <div><span className="font-medium">Performance:</span> {v.performance}</div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  {/* Contact button removed on first page */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bottom items card removed per request */}
    </div>
  )
}

export default VendorShop


