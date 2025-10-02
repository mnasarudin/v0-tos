"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type POStatus = "draft" | "issued" | "received" | "cancelled"

interface POItem {
  id: string
  orderNo: string
  supplier: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  status: POStatus
}

const statusColors: Record<POStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  issued: "bg-blue-100 text-blue-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export function POList() {
  const [pos, setPOs] = useState<POItem[]>([
    { id: "1", orderNo: "PO-2001", supplier: "Acme Supplies", department: "Administration", requester: "Alice", item: "Office Chairs", quantity: 10, unitPrice: 80, status: "received" },
    { id: "2", orderNo: "PO-2008", supplier: "SoftCo", department: "Finance", requester: "Bob", item: "Accounting Software", quantity: 5, unitPrice: 130, status: "issued" },
    { id: "3", orderNo: "PO-2015", supplier: "TechHub", department: "IT", requester: "Charlie", item: "Laptops", quantity: 3, unitPrice: 970, status: "draft" },
  ])

  const { toast } = useToast()
  const router = useRouter()

  const handleEdit = (po: POItem) => {
    toast({ title: "Edit PO", description: `Editing ${po.orderNo}.` })
  }

  const handleDelete = (id: string) => {
    setPOs(prev => prev.filter(p => p.id !== id))
    toast({ title: "Deleted", description: "PO deleted successfully" })
  }

  const handleAdd = () => {
    router.push("/po/add")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Purchase Orders</h2>
          <p className="text-muted-foreground">Manage and track POs</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add PO
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PO List
          </CardTitle>
          <CardDescription>
            {pos.length} order(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order No</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">No POs yet.</TableCell>
                </TableRow>
              ) : (
                pos.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{po.orderNo}</TableCell>
                    <TableCell>{po.supplier}</TableCell>
                    <TableCell>{po.department}</TableCell>
                    <TableCell>{po.requester}</TableCell>
                    <TableCell>{po.item}</TableCell>
                    <TableCell>{po.quantity}</TableCell>
                    <TableCell>${po.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>${(po.quantity * po.unitPrice).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[po.status]}>{po.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(po)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(po.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}




