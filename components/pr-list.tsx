"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type PRStatus = "draft" | "submitted" | "approved" | "rejected"

interface PRItem {
  id: string
  requestNo: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  status: PRStatus
}

const statusColors: Record<PRStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

export function PRList() {
  const [prs, setPRs] = useState<PRItem[]>([
    { id: "1", requestNo: "PR-1023", department: "Administration", requester: "Alice", item: "Office Chairs", quantity: 10, unitPrice: 75, status: "approved" },
    { id: "2", requestNo: "PR-1058", department: "Finance", requester: "Bob", item: "Accounting Software License", quantity: 5, unitPrice: 120, status: "submitted" },
    { id: "3", requestNo: "PR-1101", department: "IT", requester: "Charlie", item: "Laptops", quantity: 3, unitPrice: 950, status: "draft" },
  ])

  const { toast } = useToast()
  const router = useRouter()

  const handleEdit = (pr: PRItem) => {
    toast({ title: "Edit PR", description: `Editing ${pr.requestNo}.` })
  }

  const handleDelete = (id: string) => {
    setPRs(prev => prev.filter(p => p.id !== id))
    toast({ title: "Deleted", description: "PR deleted successfully" })
  }

  const handleAdd = () => {
    router.push("/pr/add")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Purchasing Requisitions</h2>
          <p className="text-muted-foreground">Manage and track PRs</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add PR
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            PR List
          </CardTitle>
          <CardDescription>
            {prs.length} requisition(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request No</TableHead>
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
              {prs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No PRs yet.</TableCell>
                </TableRow>
              ) : (
                prs.map(pr => (
                  <TableRow key={pr.id}>
                    <TableCell className="font-medium">{pr.requestNo}</TableCell>
                    <TableCell>{pr.department}</TableCell>
                    <TableCell>{pr.requester}</TableCell>
                    <TableCell>{pr.item}</TableCell>
                    <TableCell>{pr.quantity}</TableCell>
                    <TableCell>${pr.unitPrice.toLocaleString()}</TableCell>
                    <TableCell>${(pr.quantity * pr.unitPrice).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[pr.status]}>{pr.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(pr)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(pr.id)}>
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


