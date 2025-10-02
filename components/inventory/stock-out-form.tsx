"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface StockOutItem {
  id: string
  sku: string
  name: string
  quantity: number
  reason: string
}

export function StockOutForm() {
  const { toast } = useToast()
  const [items, setItems] = useState<StockOutItem[]>([])
  const [form, setForm] = useState({ sku: "", name: "", quantity: "", reason: "Usage" })

  const addItem = () => {
    if (!form.sku || !form.name || !form.quantity) {
      toast({ title: "Missing fields", description: "Please fill SKU, Name and Quantity" })
      return
    }
    setItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        sku: form.sku,
        name: form.name,
        quantity: Number(form.quantity),
        reason: form.reason,
      }
    ])
    setForm({ sku: "", name: "", quantity: "", reason: "Usage" })
  }

  const submit = () => {
    toast({ title: "Stock Out recorded", description: `${items.length} item(s) deducted from inventory` })
    setItems([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Stock Out</h2>
        <p className="text-muted-foreground">Record outgoing items (mock data)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Item</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>SKU</Label>
            <Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="SKU-001" />
          </div>
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Item name" />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="5" />
          </div>
          <div>
            <Label>Reason</Label>
            <Input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Usage" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="button" onClick={addItem}>Add to list</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items to deduct ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items added yet.</p>
          ) : (
            <ul className="list-disc pl-6 space-y-1">
              {items.map(i => (
                <li key={i.id}>{i.sku} - {i.name} — {i.quantity} pcs — {i.reason}</li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Button type="button" onClick={submit} disabled={items.length === 0}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}








