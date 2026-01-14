"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getCurrentSupplier } from "@/lib/supplier-auth"
import { CorporateHeader } from "@/components/corporate-header"
import { ArrowLeft } from "lucide-react"

interface SupplierItem {
  id: string
  supplierId: string
  itemName: string
  description: string
  category: string
  unit: string
  price: number
  quantity: number
  minStock: number
  sku?: string
}

type Item = {
  id: string
  sku: string
  name: string
  category: string
  unit: string
  price: number
  minStock: number
  location: string
  description?: string
  image?: string
  vendorId?: string
  currentStock?: number
}

const SUPPLIER_ITEMS_KEY = "app.supplierItems"
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

function saveSupplierItem(item: SupplierItem) {
  if (typeof window === "undefined") return
  const supplierItems = getSupplierItems()
  supplierItems.push(item)
  localStorage.setItem(SUPPLIER_ITEMS_KEY, JSON.stringify(supplierItems))

  // Also save to main items list with vendorId
  const items = readItems()
  const newItem: Item = {
    id: item.id,
    sku: item.sku || `SKU-${item.id.slice(0, 8)}`,
    name: item.itemName,
    category: item.category,
    unit: item.unit,
    price: item.price,
    minStock: item.minStock,
    location: "Supplier", // Default location
    description: item.description,
    vendorId: item.supplierId, // Link to vendor
    currentStock: item.quantity, // Current stock quantity
  }

  // Check if item with same SKU already exists
  const existingIndex = items.findIndex(i => i.sku === newItem.sku && i.vendorId === newItem.vendorId)
  if (existingIndex >= 0) {
    items[existingIndex] = newItem
  } else {
    items.push(newItem)
  }

  writeItems(items)
}

function getSupplierItems(): SupplierItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(SUPPLIER_ITEMS_KEY)
    return raw ? (JSON.parse(raw) as SupplierItem[]) : []
  } catch {
    return []
  }
}

export default function AddItemPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [supplier, setSupplier] = useState<ReturnType<typeof getCurrentSupplier>>(null)
  const [form, setForm] = useState<Omit<SupplierItem, "id" | "supplierId">>({
    itemName: "",
    description: "",
    category: "General",
    unit: "piece",
    price: 0,
    quantity: 0,
    minStock: 0,
    sku: "",
  })

  useEffect(() => {
    const currentSupplier = getCurrentSupplier()
    if (!currentSupplier) {
      router.push("/supplier/login")
      return
    }
    setSupplier(currentSupplier)
  }, [router])

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.itemName || !form.description || form.price <= 0 || form.quantity < 0 || form.minStock < 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid values.",
        variant: "destructive",
      })
      return
    }

    if (!supplier) {
      toast({
        title: "Error",
        description: "You must be logged in to add items.",
        variant: "destructive",
      })
      return
    }

    const item: SupplierItem = {
      id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
      supplierId: supplier.id,
      ...form,
    }

    saveSupplierItem(item)

    toast({
      title: "Item Added",
      description: `${form.itemName} has been added successfully.`,
    })

    // Reset form
    setForm({
      itemName: "",
      description: "",
      category: "General",
      unit: "piece",
      price: 0,
      quantity: 0,
      minStock: 0,
      sku: "",
    })

    // Optionally redirect back to profile
    setTimeout(() => {
      router.push("/supplier/profile")
    }, 1500)
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <CorporateHeader />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => router.push("/supplier/profile")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="itemName">
                    Item Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="itemName"
                    value={form.itemName}
                    onChange={(e) => handleChange("itemName", e.target.value)}
                    placeholder="Enter item name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="sku">SKU Code</Label>
                  <Input
                    id="sku"
                    value={form.sku || ""}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    placeholder="e.g. SKU-001"
                  />
                </div>

                <div>
                  <Label htmlFor="category">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="category"
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    required
                  >
                    <option value="General">General</option>
                    <option value="Office">Office Supplies</option>
                    <option value="Industrial">Industrial Equipment</option>
                    <option value="IT">IT & Technology</option>
                    <option value="Logistics">Logistics & Transportation</option>
                    <option value="Construction">Construction Materials</option>
                    <option value="Food">Food & Beverages</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="unit">
                    Unit <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    id="unit"
                    value={form.unit}
                    onChange={(e) => handleChange("unit", e.target.value)}
                    required
                  >
                    <option value="piece">Piece</option>
                    <option value="box">Box</option>
                    <option value="carton">Carton</option>
                    <option value="pack">Pack</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="liter">Liter</option>
                    <option value="meter">Meter</option>
                    <option value="set">Set</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">
                    Price (per unit) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price || ""}
                    onChange={(e) => handleChange("price", parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">
                    Quantity (Stock) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={form.quantity || ""}
                    onChange={(e) => handleChange("quantity", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minStock">
                    Minimum Stock <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={form.minStock || ""}
                    onChange={(e) => handleChange("minStock", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Enter item description..."
                    className="w-full min-h-[100px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    rows={4}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/supplier/profile")}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Item</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

