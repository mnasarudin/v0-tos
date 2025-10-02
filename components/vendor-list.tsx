"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, FileText, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { Vendor } from "@/components/vendor-form"

const VENDOR_STORAGE_KEY = "app.vendors"

function readVendors(): Vendor[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(VENDOR_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Vendor[]) : []
  } catch {
    return []
  }
}

function writeVendors(vendors: Vendor[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(VENDOR_STORAGE_KEY, JSON.stringify(vendors))
}

export function VendorList() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const data = readVendors()
    setVendors(data)
  }, [])

  function handleAdd() {
    router.push("/vendor/add")
  }

  function handleEdit(v: Vendor) {
    router.push(`/vendor/add?id=${encodeURIComponent(v.id)}`)
  }

  function handleDelete(id: string) {
    const next = vendors.filter(v => v.id !== id)
    setVendors(next)
    writeVendors(next)
    toast({ title: "Vendor deleted" })
  }

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const v of vendors) counts[v.category] = (counts[v.category] || 0) + 1
    return counts
  }, [vendors])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Vendors</h2>
          <p className="text-muted-foreground">Manage registered vendors</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Register Vendor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Vendor List
          </CardTitle>
          <CardDescription>
            {vendors.length} vendor(s) • {Object.keys(countByCategory).length} category(ies)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No vendors yet.</TableCell>
                </TableRow>
              ) : (
                vendors.map(v => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>{v.contactName}</TableCell>
                    <TableCell>{v.phone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{v.name}</DialogTitle>
                              <DialogDescription>Vendor Details</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div>
                                <span className="font-medium">Category:</span> {v.category}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span> {v.email}
                              </div>
                              <div>
                                <span className="font-medium">Address:</span> {v.address}
                              </div>
                              <div>
                                <span className="font-medium">City:</span> {v.city}
                              </div>
                              <div>
                                <span className="font-medium">Country:</span> {v.country}
                              </div>
                              <div>
                                <span className="font-medium">Performance:</span> {v.performance}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(v)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(v.id)}>
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

export default VendorList






