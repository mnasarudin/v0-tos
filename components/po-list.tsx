"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, FileText, Bot, User, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

type POStatus = "draft" | "issued" | "received" | "cancelled"

export interface POItem {
  id: string
  orderNo: string
  supplier: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  status: POStatus
  prId?: string // Associated PR ID
  source?: "manual" | "auto" // Creation source
}

const statusColors: Record<POStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  issued: "bg-blue-100 text-blue-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

const PO_STORAGE_KEY = "app.purchase_orders"
const PR_STORAGE_KEY = "app.prs"

function readPOs(): POItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(PO_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as POItem[]) : []
  } catch {
    return []
  }
}

function writePOs(pos: POItem[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(pos))
}

function readPRs(): any[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(PR_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Generate PO number
function generatePONumber(): string {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `PO-${year}${month}${random}`
}

// Select supplier based on item
function selectSupplier(item: string): string {
  const suppliers = [
    "Acme Supplies",
    "SoftCo",
    "TechHub",
    "Office Depot",
    "Global Tech",
    "Supply Chain Co"
  ]
  const itemLower = item.toLowerCase()
  
  if (itemLower.includes('chair') || itemLower.includes('desk') || itemLower.includes('office')) {
    return suppliers[0]
  } else if (itemLower.includes('software') || itemLower.includes('license')) {
    return suppliers[1]
  } else if (itemLower.includes('laptop') || itemLower.includes('computer') || itemLower.includes('tech')) {
    return suppliers[2]
  } else if (itemLower.includes('training') || itemLower.includes('material')) {
    return suppliers[3]
  } else {
    return suppliers[Math.floor(Math.random() * suppliers.length)]
  }
}

// Calculate PO price (add markup to PR price)
function calculatePOPrice(prPrice: number): number {
  const markup = 1 + (Math.random() * 0.1 + 0.05) // 5-15% markup
  return Math.round(prPrice * markup)
}

// Create PO from approved PR
function createPOFromPR(pr: any): POItem[] {
  const pos: POItem[] = []
  
  // Handle PRs with multiple items
  if (pr.items && Array.isArray(pr.items) && pr.items.length > 0) {
    // Create a PO for each item in the PR
    pr.items.forEach((item: any, index: number) => {
      const poNumber = generatePONumber() + (index > 0 ? `-${index + 1}` : '')
      const supplier = selectSupplier(item.name || item.item)
      const poPrice = calculatePOPrice(item.unitPrice || pr.unitPrice || 0)
      
      pos.push({
        id: `po-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
        orderNo: poNumber,
        supplier: supplier,
        department: pr.department,
        requester: pr.requester,
        item: item.name || item.item || pr.item,
        quantity: item.quantity || pr.quantity || 1,
        unitPrice: poPrice,
        status: "draft",
        prId: pr.id,
        source: "auto"
      })
    })
  } else {
    // Single item PR
    const poNumber = generatePONumber()
    const supplier = selectSupplier(pr.item || "General Item")
    const poPrice = calculatePOPrice(pr.unitPrice || 0)
    
    pos.push({
      id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNo: poNumber,
      supplier: supplier,
      department: pr.department,
      requester: pr.requester,
      item: pr.item,
      quantity: pr.quantity || pr.totalItems || 1,
      unitPrice: poPrice,
      status: "draft",
      prId: pr.id,
      source: "auto"
    })
  }
  
  return pos
}

// Sync POs from approved PRs
function syncPOsFromApprovedPRs(): POItem[] {
  const existingPOs = readPOs()
  const approvedPRs = readPRs().filter((pr: any) => pr.status === "approved")
  
  // Get PR IDs that already have POs
  const existingPRIds = new Set(existingPOs.filter(po => po.prId).map(po => po.prId))
  
  // Create POs for approved PRs that don't have POs yet
  const newPOs: POItem[] = []
  approvedPRs.forEach((pr: any) => {
    if (!existingPRIds.has(pr.id)) {
      const posFromPR = createPOFromPR(pr)
      newPOs.push(...posFromPR)
    }
  })
  
  // Combine existing POs with new ones
  const allPOs = [...existingPOs, ...newPOs]
  
  // Save updated POs
  if (newPOs.length > 0) {
    writePOs(allPOs)
  }
  
  // Return only POs that come from approved PRs
  return allPOs.filter(po => {
    if (!po.prId) return false
    const pr = approvedPRs.find((p: any) => p.id === po.prId)
    return pr && pr.status === "approved"
  })
}

export function POList() {
  const [pos, setPOs] = useState<POItem[]>([])
  const [selectedPO, setSelectedPO] = useState<POItem | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  
  useEffect(() => {
    // Sync POs from approved PRs and load
    const loadPOs = () => {
      const syncedPOs = syncPOsFromApprovedPRs()
      setPOs(syncedPOs)
    }
    
    loadPOs()
    
    // Listen for PR approval events to refresh PO list
    const handlePRUpdate = () => {
      loadPOs()
    }
    
    // Listen for storage changes (when PRs are approved in another tab)
    window.addEventListener('storage', handlePRUpdate)
    
    // Check for PR updates periodically (in case of same-tab updates)
    const interval = setInterval(() => {
      loadPOs()
    }, 3000) // Check every 3 seconds
    
    return () => {
      window.removeEventListener('storage', handlePRUpdate)
      clearInterval(interval)
    }
  }, [])

  const { toast } = useToast()
  const router = useRouter()

  const handleEdit = (po: POItem) => {
    router.push(`/po/add?id=${po.id}`)
  }

  const handleDelete = (id: string) => {
    const updatedPOs = pos.filter(p => p.id !== id)
    setPOs(updatedPOs)
    writePOs(updatedPOs)
    toast({ title: "Deleted", description: "PO deleted successfully" })
  }
  
  const handleView = (po: POItem) => {
    setSelectedPO(po)
    setIsViewDialogOpen(true)
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
            {pos.length} order(s) - Automatically generated from approved Purchase Requisitions
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
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center text-muted-foreground py-8">No POs yet.</TableCell>
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
                      <Badge className={po.source === "auto" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                        {po.source === "auto" ? (
                          <>
                            <Bot className="w-3 h-3 mr-1" />
                            Auto Generated
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3 mr-1" />
                            Manual Created
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[po.status]}>{po.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleView(po)}
                          title="View PO details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => handleEdit(po)}
                          title="Edit PO"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete ${po.orderNo}?`)) {
                              handleDelete(po.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Delete PO"
                        >
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

      {/* PO Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Purchase Order Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {selectedPO?.orderNo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPO && (
            <div className="space-y-6 mt-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Order Number</p>
                  <p className="text-lg font-semibold">{selectedPO.orderNo}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={statusColors[selectedPO.status]}>{selectedPO.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                  <p className="text-base">{selectedPO.supplier}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Source</p>
                  <Badge className={selectedPO.source === "auto" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                    {selectedPO.source === "auto" ? (
                      <>
                        <Bot className="w-3 h-3 mr-1" />
                        Auto Generated
                      </>
                    ) : (
                      <>
                        <User className="w-3 h-3 mr-1" />
                        Manual Created
                      </>
                    )}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Department</p>
                  <p className="text-base">{selectedPO.department}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Requester</p>
                  <p className="text-base">{selectedPO.requester}</p>
                </div>
              </div>

              {/* Item Details */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Item Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Item Name</p>
                    <p className="text-base">{selectedPO.item}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Quantity</p>
                    <p className="text-base">{selectedPO.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Unit Price</p>
                    <p className="text-base">${selectedPO.unitPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-base font-semibold text-green-600">
                      ${(selectedPO.quantity * selectedPO.unitPrice).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false)
                  handleEdit(selectedPO)
                }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit PO
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}




