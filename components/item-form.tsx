"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"

export type ItemCategory = "General" | "Office" | "Industrial" | "IT" | "Logistics"

export interface Item {
  id: string
  sku: string
  name: string
  category: ItemCategory
  unit: string
  minStock: number
  location: string
  description?: string
}

const ITEM_STORAGE_KEY = "app.items"

function readItems(): Item[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ITEM_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Item[]) : []
  } catch {
    return []
  }
}

function writeItems(items: Item[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(items))
}

function upsertItem(item: Item) {
  const items = readItems()
  const idx = items.findIndex(i => i.id === item.id)
  if (idx >= 0) items[idx] = item
  else items.push(item)
  writeItems(items)
}

export function ItemForm() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const editingId = searchParams?.get("id") || ""

  const existing = useMemo(() => {
    if (!editingId) return undefined
    return readItems().find(i => i.id === editingId)
  }, [editingId])

  const [form, setForm] = useState<Item>(
    existing || {
      id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      sku: "",
      name: "",
      category: "General",
      unit: "pcs",
      minStock: 0,
      location: "Main",
      description: "",
    }
  )

  useEffect(() => {
    if (existing) setForm(existing)
    const current = readItems()
    if (current.length === 0) {
      writeItems([
        { id: "i1", sku: "ITM-001", name: "Safety Helmet", category: "Industrial", unit: "pcs", minStock: 20, location: "Main", description: "Protective gear" },
        { id: "i2", sku: "ITM-002", name: "Office Chair", category: "Office", unit: "pcs", minStock: 5, location: "Main", description: "Ergonomic chair" },
        { id: "i3", sku: "ITM-003", name: "Printer Paper A4", category: "Office", unit: "box", minStock: 10, location: "Store-2", description: "500 sheets" },
      ])
    }
  }, [existing])

  function handleChange<T extends keyof Item>(field: T, value: Item[T]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!form.sku || !form.name) {
      toast({ title: "Missing required fields", description: "SKU and Name are required" })
      return
    }
    upsertItem(form)
    toast({ title: existing ? "Item updated" : "Item registered", description: `${form.sku} - ${form.name}` })
    router.push("/item/list")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{existing ? "Update Item" : "Register Item"}</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={form.sku} onChange={e => handleChange("sku", e.target.value)} placeholder="ITM-001" />
            </div>
            <div>
              <Label htmlFor="name">Item Name</Label>
              <Input id="name" value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Safety Helmet" />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" value={form.category} onChange={e => handleChange("category", e.target.value as ItemCategory)}>
                <option>General</option>
                <option>Office</option>
                <option>Industrial</option>
                <option>IT</option>
                <option>Logistics</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" value={form.unit} onChange={e => handleChange("unit", e.target.value)} placeholder="pcs" />
            </div>
            <div>
              <Label htmlFor="minStock">Min Stock</Label>
              <Input id="minStock" type="number" value={form.minStock} onChange={e => handleChange("minStock", Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={e => handleChange("location", e.target.value)} placeholder="Main" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={form.description || ""} onChange={e => handleChange("description", e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSubmit}>{existing ? "Update" : "Save"}</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/item/list")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ItemForm








