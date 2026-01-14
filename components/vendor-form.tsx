"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"

export type VendorPerformanceRating = "excellent" | "good" | "average" | "poor"

export interface Vendor {
  id: string
  name: string
  category: string
  ssmNumber?: string
  contactName: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  performance: VendorPerformanceRating
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

function writeVendors(vendors: Vendor[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(vendors))
}

function upsertVendor(vendor: Vendor) {
  const vendors = readVendors()
  const idx = vendors.findIndex(v => v.id === vendor.id)
  if (idx >= 0) vendors[idx] = vendor
  else vendors.push(vendor)
  writeVendors(vendors)
}

export function VendorForm() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editingId = searchParams?.get("id") || ""

  const existing = useMemo(() => {
    if (!editingId) return undefined
    return readVendors().find(v => v.id === editingId)
  }, [editingId])

  const [form, setForm] = useState<Vendor>(
    existing || {
      id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      name: "",
      category: "General",
      ssmNumber: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      performance: "good",
    }
  )

  useEffect(() => {
    if (existing) setForm(existing)
    // Preload mock data if none exists
    const current = readVendors()
    if (current.length === 0) {
      writeVendors([
        {
          id: "v1",
          name: "Alpha Supplies Co.",
          category: "Office",
          contactName: "Jane Alpha",
          email: "sales@alpha.example.com",
          phone: "+1 555-0101",
          address: "123 Alpha St",
          city: "New York",
          country: "USA",
          performance: "excellent",
        },
        {
          id: "v2",
          name: "Beta Industrial",
          category: "Industrial",
          contactName: "Bob Beta",
          email: "contact@beta.example.com",
          phone: "+1 555-0202",
          address: "45 Beta Ave",
          city: "Chicago",
          country: "USA",
          performance: "good",
        },
        {
          id: "v3",
          name: "Gamma Tech",
          category: "IT",
          contactName: "Gina Gamma",
          email: "info@gamma.example.com",
          phone: "+1 555-0303",
          address: "9 Gamma Blvd",
          city: "San Jose",
          country: "USA",
          performance: "average",
        },
      ])
    }
  }, [existing])

  function handleChange<T extends keyof Vendor>(field: T, value: Vendor[T]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    upsertVendor(form)
    toast({ title: existing ? "Vendor updated" : "Vendor created", description: form.name })
    router.push("/vendor/list")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{existing ? "Update Vendor" : "Register Vendor"}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Vendor Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Vendor Name</Label>
              <Input id="name" value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <Label htmlFor="ssmNumber">SSM Number</Label>
              <Input id="ssmNumber" value={form.ssmNumber || ""} onChange={e => handleChange("ssmNumber", e.target.value)} placeholder="e.g. 202401234567 (Malaysia)" />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={form.category} onChange={e => handleChange("category", e.target.value)}>
                <option>General</option>
                <option>Office</option>
                <option>Industrial</option>
                <option>IT</option>
                <option>Logistics</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="contactName">Contact Name</Label>
              <Input id="contactName" value={form.contactName} onChange={e => handleChange("contactName", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={e => handleChange("phone", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={e => handleChange("address", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={e => handleChange("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={e => handleChange("country", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="performance">Performance</Label>
              <Select id="performance" value={form.performance} onChange={e => handleChange("performance", e.target.value as VendorPerformanceRating)}>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="average">Average</option>
                <option value="poor">Poor</option>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSubmit}>{existing ? "Update" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/vendor/list")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default VendorForm








