"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

type MovementType = "in" | "out"

type StockInItem = {
  id: string
  sku: string
  name: string
  quantity: number
  unit: string
  location: string
  supplier: string
}

type StockOutItem = {
  id: string
  sku: string
  name: string
  quantity: number
  reason: string
}

export function StockMovement() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<MovementType>("in")

  useEffect(() => {
    const tabParam = (searchParams.get("tab") || "").toLowerCase()
    if (tabParam === "in" || tabParam === "out") {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  const [inForm, setInForm] = useState({ sku: "", name: "", quantity: "", unit: "pcs", location: "Main", supplier: "" })
  const [inItems, setInItems] = useState<StockInItem[]>([])

  const [outForm, setOutForm] = useState({ sku: "", name: "", quantity: "", reason: "Usage" })
  const [outItems, setOutItems] = useState<StockOutItem[]>([])

  const addInItem = () => {
    if (!inForm.sku || !inForm.name || !inForm.quantity) {
      toast({ title: "Missing fields", description: "Please fill SKU, Name and Quantity" })
      return
    }
    setInItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        sku: inForm.sku,
        name: inForm.name,
        quantity: Number(inForm.quantity),
        unit: inForm.unit,
        location: inForm.location,
        supplier: inForm.supplier,
      }
    ])
    setInForm({ sku: "", name: "", quantity: "", unit: "pcs", location: "Main", supplier: "" })
  }

  const addOutItem = () => {
    if (!outForm.sku || !outForm.name || !outForm.quantity) {
      toast({ title: "Missing fields", description: "Please fill SKU, Name and Quantity" })
      return
    }
    setOutItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        sku: outForm.sku,
        name: outForm.name,
        quantity: Number(outForm.quantity),
        reason: outForm.reason,
      }
    ])
    setOutForm({ sku: "", name: "", quantity: "", reason: "Usage" })
  }

  const submitIn = () => {
    toast({ title: "Stock In recorded", description: `${inItems.length} item(s) added to inventory` })
    setInItems([])
  }

  const submitOut = () => {
    toast({ title: "Stock Out recorded", description: `${outItems.length} item(s) deducted from inventory` })
    setOutItems([])
  }

  const header = useMemo(() => activeTab === "in" ? "Stock In" : "Stock Out", [activeTab])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{header}</h2>
          <p className="text-muted-foreground">Record stock movement (mock data)</p>
        </div>
        <div className="flex gap-2">
          <Button variant={activeTab === "in" ? "default" : "outline"} onClick={() => setActiveTab("in")}>Stock In</Button>
          <Button variant={activeTab === "out" ? "default" : "outline"} onClick={() => setActiveTab("out")}>Stock Out</Button>
        </div>
      </div>

      {activeTab === "in" ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Add Item</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>SKU</Label>
                <Input value={inForm.sku} onChange={e => setInForm({ ...inForm, sku: e.target.value })} placeholder="SKU-001" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={inForm.name} onChange={e => setInForm({ ...inForm, name: e.target.value })} placeholder="Item name" />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={inForm.quantity} onChange={e => setInForm({ ...inForm, quantity: e.target.value })} placeholder="10" />
              </div>
              <div>
                <Label>Unit</Label>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="outline" onClick={() => setInForm({ ...inForm, unit: "pcs" })}>pcs</Button>
                  <Button type="button" variant="outline" onClick={() => setInForm({ ...inForm, unit: "box" })}>box</Button>
                  <Button type="button" variant="outline" onClick={() => setInForm({ ...inForm, unit: "kg" })}>kg</Button>
                </div>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={inForm.location} onChange={e => setInForm({ ...inForm, location: e.target.value })} placeholder="Main" />
              </div>
              <div>
                <Label>Supplier</Label>
                <Input value={inForm.supplier} onChange={e => setInForm({ ...inForm, supplier: e.target.value })} placeholder="Acme Corp" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="button" onClick={addInItem}>Add to list</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items to add ({inItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {inItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items added yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Supplier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inItems.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>{i.sku}</TableCell>
                        <TableCell>{i.name}</TableCell>
                        <TableCell>{i.quantity}</TableCell>
                        <TableCell>{i.unit}</TableCell>
                        <TableCell>{i.location}</TableCell>
                        <TableCell>{i.supplier}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <Button type="button" onClick={submitIn} disabled={inItems.length === 0}>Submit</Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Add Item</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <Label>SKU</Label>
                <Input value={outForm.sku} onChange={e => setOutForm({ ...outForm, sku: e.target.value })} placeholder="SKU-001" />
              </div>
              <div>
                <Label>Name</Label>
                <Input value={outForm.name} onChange={e => setOutForm({ ...outForm, name: e.target.value })} placeholder="Item name" />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={outForm.quantity} onChange={e => setOutForm({ ...outForm, quantity: e.target.value })} placeholder="5" />
              </div>
              <div>
                <Label>Reason</Label>
                <Input value={outForm.reason} onChange={e => setOutForm({ ...outForm, reason: e.target.value })} placeholder="Usage" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <Button type="button" onClick={addOutItem}>Add to list</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items to deduct ({outItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {outItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items added yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outItems.map(i => (
                      <TableRow key={i.id}>
                        <TableCell>{i.sku}</TableCell>
                        <TableCell>{i.name}</TableCell>
                        <TableCell>{i.quantity}</TableCell>
                        <TableCell>{i.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <Button type="button" onClick={submitOut} disabled={outItems.length === 0}>Submit</Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}


