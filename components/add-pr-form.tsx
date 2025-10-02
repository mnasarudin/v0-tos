"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

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

export function AddPRForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [form, setForm] = useState<Omit<PRItem, "id" | "status"> & { status?: PRItem["status"] }>(
    {
      requestNo: `PR-${Math.floor(1000 + Math.random() * 9000)}`,
      department: "Administration",
      requester: "",
      item: "",
      quantity: 1,
      unitPrice: 0,
      status: "draft",
    }
  )

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }))
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
              <Select id="department" value={form.department} onChange={(e) => handleChange("department", e.target.value)}>
                <option>Administration</option>
                <option>Finance</option>
                <option>Operation</option>
                <option>Safety</option>
                <option>Technical</option>
                <option>IT</option>
                <option>GM Office</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="requester">Requester</Label>
              <Input id="requester" placeholder="Enter requester name" value={form.requester} onChange={(e) => handleChange("requester", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="item">Item</Label>
              <Input id="item" placeholder="Item to purchase" value={form.item} onChange={(e) => handleChange("item", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" min={1} value={form.quantity} onChange={(e) => handleChange("quantity", Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price</Label>
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


