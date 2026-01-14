"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { FileText, Plus, Download } from "lucide-react"
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

export function GeneratePRForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [registeredItems, setRegisteredItems] = useState<RegisteredItem[]>([])
  const [form, setForm] = useState<Omit<PRItem, "id" | "status"> & { status?: PRItem["status"] }>({
    requestNo: generateRequestNumber("Administration"),
    department: "Administration",
    requester: "",
    item: "",
    quantity: 1,
    unitPrice: 0,
    status: "draft",
  })

  const [items, setItems] = useState<Array<Omit<PRItem, "id" | "status" | "requestNo">>>([])

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

  const addItem = () => {
    if (form.item && form.quantity > 0) {
      setItems(prev => [...prev, {
        department: form.department,
        requester: form.requester,
        item: form.item,
        quantity: form.quantity,
        unitPrice: form.unitPrice,
      }])
      
      // Reset item fields
      setForm(prev => ({
        ...prev,
        item: "",
        quantity: 1,
        unitPrice: 0,
      }))
    }
  }

  const removeItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const generatePR = () => {
    if (items.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item before generating PR.",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "PR Generated",
      description: `Generated PR ${form.requestNo} with ${items.length} item(s).`,
    })
    router.push("/pr/list")
  }

  const downloadTemplate = () => {
    toast({
      title: "Template Downloaded",
      description: "PR template has been downloaded.",
    })
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Generate Purchasing Requisition</h2>
          <p className="text-muted-foreground">Create a new PR with multiple items</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PR Header Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              PR Header
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
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
                <Input 
                  id="requester" 
                  placeholder="Enter requester name" 
                  value={form.requester} 
                  onChange={(e) => handleChange("requester", e.target.value)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Item Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
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
                <Input 
                  id="item" 
                  placeholder="Item to purchase" 
                  value={form.item} 
                  onChange={(e) => handleChange("item", e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min={1} 
                    value={form.quantity} 
                    onChange={(e) => handleChange("quantity", Number(e.target.value))} 
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Unit Price ($)</Label>
                  <Input 
                    id="unitPrice" 
                    type="number" 
                    min={0} 
                    step="0.01" 
                    value={form.unitPrice} 
                    onChange={(e) => handleChange("unitPrice", Number(e.target.value))} 
                  />
                </div>
              </div>
              <Button onClick={addItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Items List ({items.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{item.item}</div>
                    <div className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ${item.unitPrice.toLocaleString()} = ${(item.quantity * item.unitPrice).toLocaleString()}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => removeItem(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total Amount:</span>
                  <span>${totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={generatePR} disabled={items.length === 0}>
          Generate PR
        </Button>
        <Button variant="outline" onClick={() => router.push("/pr/list")}>
          Cancel
        </Button>
      </div>
    </div>
  )
}






