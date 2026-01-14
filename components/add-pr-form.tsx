"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { generateRequestNumber } from "@/lib/utils"

interface RegisteredItem {
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
}

interface PRItem {
  id: string
  requestNo: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  status: "draft" | "submitted" | "approved" | "rejected"
}

const ITEM_STORAGE_KEY = "app.items"

function readItems(): RegisteredItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(ITEM_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as RegisteredItem[]) : []
  } catch {
    return []
  }
}

export function AddPRForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [registeredItems, setRegisteredItems] = useState<RegisteredItem[]>([])
  const [form, setForm] = useState<Omit<PRItem, "id" | "status"> & { status?: PRItem["status"] }>(
    {
      requestNo: generateRequestNumber("Administration"),
      department: "Administration",
      requester: "",
      item: "",
      quantity: 1,
      unitPrice: 0,
      status: "draft",
    }
  )

  useEffect(() => {
    setRegisteredItems(readItems())
  }, [])

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      // Regenerate request number when department changes
      if (field === "department") {
        updated.requestNo = generateRequestNumber(value)
      }
      return updated
    })
  }

  const handleItemSelect = (itemId: string) => {
    const selectedItem = registeredItems.find(i => i.id === itemId)
    if (selectedItem) {
      setForm(prev => ({
        ...prev,
        item: selectedItem.name,
        unitPrice: selectedItem.price,
      }))
    }
  }

  const handleSubmit = () => {
    toast({
      title: "PR Saved",
      description: `Purchasing Requisition ${form.requestNo} saved as ${form.status}.`,
    })
    router.push("/pr/list")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Add Purchasing Requisition</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>PR Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requestNo">Request No</Label>
              <Input id="requestNo" value={form.requestNo} readOnly />
            </div>
            <div>
              <Label htmlFor="department">Department</Label>
              <select 
                id="department" 
                value={form.department} 
                onChange={(e) => handleChange("department", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option>Administration</option>
                <option>Finance</option>
                <option>Operation</option>
                <option>Safety</option>
                <option>Technical</option>
                <option>IT</option>
                <option>GM Office</option>
              </select>
            </div>
            <div>
              <Label htmlFor="requester">Requester</Label>
              <Input id="requester" placeholder="Enter requester name" value={form.requester} onChange={(e) => handleChange("requester", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="itemSelect">Select Item (Optional)</Label>
              <select 
                id="itemSelect" 
                onChange={(e) => handleItemSelect(e.target.value)}
                value=""
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">-- Select from registered items --</option>
                {registeredItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.sku} - {item.name} (${item.price?.toFixed(2) || '0.00'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="item">Item Description</Label>
              <Input id="item" placeholder="Item to purchase" value={form.item} onChange={(e) => handleChange("item", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min={1} value={form.quantity} onChange={(e) => handleChange("quantity", Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price ($)</Label>
              <Input id="unitPrice" type="number" min={0} step="0.01" value={form.unitPrice} onChange={(e) => handleChange("unitPrice", Number(e.target.value))} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" onClick={handleSubmit}>Save</Button>
            <Button type="button" variant="outline" onClick={() => router.push("/pr/list")}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


