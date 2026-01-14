"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Pencil, Trash2 } from "lucide-react"

interface StockInItem {
  id: string
  sku: string
  name: string
  quantity: number
  unit: string
  location: string
  supplier: string
}

export function StockInForm() {
  const { toast } = useToast()
  const [items, setItems] = useState<StockInItem[]>([])
  const [form, setForm] = useState({ sku: "", name: "", quantity: "", unit: "pcs", location: "Main", supplier: "" })
  const [editingId, setEditingId] = useState<string | null>(null)

  const addItem = () => {
    if (!form.sku || !form.name || !form.quantity) {
      toast({ title: "Missing fields", description: "Please fill SKU, Name and Quantity" })
      return
    }

    if (editingId) {
      // Update existing item
      setItems(prev => prev.map(item => 
        item.id === editingId 
          ? {
              ...item,
              sku: form.sku,
              name: form.name,
              quantity: Number(form.quantity),
              unit: form.unit,
              location: form.location,
              supplier: form.supplier,
            }
          : item
      ))
      setEditingId(null)
      toast({ title: "Item updated", description: "Item has been updated in the list" })
    } else {
      // Add new item
      setItems(prev => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          sku: form.sku,
          name: form.name,
          quantity: Number(form.quantity),
          unit: form.unit,
          location: form.location,
          supplier: form.supplier,
        }
      ])
    }
    setForm({ sku: "", name: "", quantity: "", unit: "pcs", location: "Main", supplier: "" })
  }

  const editItem = (item: StockInItem) => {
    setForm({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      location: item.location,
      supplier: item.supplier,
    })
    setEditingId(item.id)
  }

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setForm({ sku: "", name: "", quantity: "", unit: "pcs", location: "Main", supplier: "" })
    }
    toast({ title: "Item removed", description: "Item has been removed from the list" })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm({ sku: "", name: "", quantity: "", unit: "pcs", location: "Main", supplier: "" })
  }

  const submit = () => {
    toast({ title: "Stock In recorded", description: `${items.length} item(s) added to inventory` })
    setItems([])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Stock In</h2>
        <p className="text-muted-foreground">Record incoming items (mock data)</p>
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
            <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="10" />
          </div>
          <div>
            <Label>Unit</Label>
            <Select value={form.unit} onValueChange={(v: string) => setForm({ ...form, unit: v })}>
              <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="hidden" />
            </Select>
            <div className="flex gap-2 mt-2">
              <Button type="button" variant="outline" onClick={() => setForm({ ...form, unit: "pcs" })}>pcs</Button>
              <Button type="button" variant="outline" onClick={() => setForm({ ...form, unit: "box" })}>box</Button>
              <Button type="button" variant="outline" onClick={() => setForm({ ...form, unit: "kg" })}>kg</Button>
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Main" />
          </div>
          <div>
            <Label>Supplier</Label>
            <Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Acme Corp" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <div className="flex gap-2">
              <Button type="button" onClick={addItem}>
                {editingId ? "Update Item" : "Add to list"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items to add ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items added yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className={editingId === item.id ? "bg-muted/50" : ""}>
                    <TableCell>{item.sku}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>{item.supplier || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => editItem(item)}
                          disabled={editingId === item.id}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4">
            <Button type="button" onClick={submit} disabled={items.length === 0}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}








