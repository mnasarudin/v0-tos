"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Trash2, FileText, Eye, Download, X, Search, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { RoleGuard, PermissionGuard } from "@/components/role-guard"
import { canAccessResource } from "@/lib/auth"
import { generatePDFReport, type PDFReportData } from "@/lib/pdf-generator"

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
  remarks?: string
  requestDate: string
  approvalDate?: string
  approvedBy?: string
  priority: "low" | "medium" | "high"
  category: string
  justification: string
  items?: Array<{
    id: string
    name: string
    sku: string
    category: string
    unit: string
    quantity: number
    unitPrice: number
    total: number
    location: string
    minStock: number
    currentStock: number
  }>
  totalItems?: number
  estimatedTotal?: number
}

const statusColors: Record<PRStatus, string> = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

export function PRList() {
  const [prs, setPRs] = useState<PRItem[]>([])

  // Load PRs from localStorage on component mount
  useEffect(() => {
    const loadPRs = () => {
      try {
        const savedPRs = localStorage.getItem("app.prs")
        if (savedPRs) {
          const parsedPRs = JSON.parse(savedPRs)
          // Filter out draft PRs - only show submitted/approved/rejected
          const filteredPRs = parsedPRs.filter((pr: any) => pr.status !== "draft")
          setPRs(filteredPRs)
        } else {
          // If no saved PRs, use mock data for demonstration
          const mockPRs = [
            { 
              id: "1", 
              requestNo: "PR-1023", 
              department: "Administration", 
              requester: "Alice", 
              item: "Office Chairs", 
              quantity: 10, 
              unitPrice: 75, 
              status: "approved",
              remarks: "Current chairs are worn out and causing back pain for employees",
              requestDate: "2024-01-15",
              approvalDate: "2024-01-18",
              approvedBy: "John Manager",
              priority: "medium",
              category: "Office Equipment",
              justification: "Improve employee comfort and productivity",
              items: [{
                id: "item-1",
                name: "Office Chairs",
                sku: "SKU-001",
                category: "Office Equipment",
                unit: "pcs",
                quantity: 10,
                unitPrice: 75,
                total: 750,
                location: "Main Warehouse",
                minStock: 5,
                currentStock: 20
              }],
              totalItems: 1, // Count of different items
              estimatedTotal: 750
            },
            { 
              id: "2", 
              requestNo: "PR-1058", 
              department: "Finance", 
              requester: "Bob", 
              item: "Accounting Software License", 
              quantity: 5, 
              unitPrice: 120, 
              status: "submitted",
              remarks: "Need to upgrade to latest version for compliance",
              requestDate: "2024-01-20",
              priority: "high",
              category: "Software",
              justification: "Regulatory compliance requirement",
              items: [{
                id: "item-2",
                name: "Accounting Software License",
                sku: "SKU-002",
                category: "Software",
                unit: "license",
                quantity: 5,
                unitPrice: 120,
                total: 600,
                location: "Digital",
                minStock: 0,
                currentStock: 10
              }],
              totalItems: 1, // Count of different items
              estimatedTotal: 600
            },
            { 
              id: "3",
              requestNo: "PR-1101", 
              department: "IT", 
              requester: "Charlie", 
              item: "Laptops", 
              quantity: 3, 
              unitPrice: 950, 
              status: "draft",
              remarks: "New laptops for development team",
              requestDate: "2024-01-22",
              priority: "low",
              category: "IT Equipment",
              justification: "Replace outdated hardware for better performance",
              items: [{
                id: "item-3",
                name: "Laptops",
                sku: "SKU-003",
                category: "IT Equipment",
                unit: "pcs",
                quantity: 3,
                unitPrice: 950,
                total: 2850,
                location: "IT Room",
                minStock: 2,
                currentStock: 8
              }],
              totalItems: 1, // Count of different items
              estimatedTotal: 2850
            }
          ]
          setPRs(mockPRs)
        }
      } catch (error) {
        console.error("Error loading PRs:", error)
        setPRs([])
      }
    }
    
    loadPRs()
  }, [])

  const [selectedPR, setSelectedPR] = useState<PRItem | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingPR, setEditingPR] = useState<PRItem | null>(null)
  const [availableItems, setAvailableItems] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  const { toast } = useToast()
  const router = useRouter()

  const handleEdit = (pr: PRItem) => {
    if (pr.status !== "draft" && pr.status !== "submitted") {
      toast({
        title: "Cannot Edit",
        description: "Only draft and submitted PRs can be edited.",
        variant: "destructive"
      })
      return
    }
    setEditingPR(pr)
    setIsEditOpen(true)
    loadAvailableItems()
  }

  const loadAvailableItems = () => {
    try {
      // Load items from localStorage
      const ITEM_STORAGE_KEY = "app.items"
      const raw = localStorage.getItem(ITEM_STORAGE_KEY)
      if (raw) {
        const items = JSON.parse(raw)
        // Convert to format expected by the component
        const formattedItems = items.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          unit: item.unit || "pcs",
          unitPrice: item.price || 0,
          stock: item.currentStock || Math.floor(Math.random() * 100) + 1
        }))
        setAvailableItems(formattedItems)
      } else {
        // Fallback to mock data if no items in localStorage
        const mockItems = [
          { id: "1", name: "Office Chairs", category: "Office Equipment", unit: "pcs", unitPrice: 75, stock: 50 },
          { id: "2", name: "Laptops", category: "IT Equipment", unit: "pcs", unitPrice: 950, stock: 25 },
          { id: "3", name: "Monitors", category: "IT Equipment", unit: "pcs", unitPrice: 180, stock: 30 },
          { id: "4", name: "Desks", category: "Office Equipment", unit: "pcs", unitPrice: 200, stock: 15 },
          { id: "5", name: "Printers", category: "Office Equipment", unit: "pcs", unitPrice: 300, stock: 10 },
          { id: "6", name: "Software License", category: "Software", unit: "license", unitPrice: 120, stock: 100 },
          { id: "7", name: "Safety Helmets", category: "Safety Equipment", unit: "pcs", unitPrice: 22, stock: 200 },
          { id: "8", name: "Training Materials", category: "Training", unit: "set", unitPrice: 25, stock: 50 },
        ]
        setAvailableItems(mockItems)
      }
    } catch (error) {
      console.error("Error loading available items:", error)
      setAvailableItems([])
    }
  }

  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddItemToPR = (item: any) => {
    if (!editingPR) return

    // Check if PR can be edited
    if (editingPR.status !== "draft" && editingPR.status !== "submitted") {
      toast({
        title: "Cannot Add Items",
        description: "Only draft and submitted PRs can have items added.",
        variant: "destructive"
      })
      return
    }

    // Create new item to add to existing PR
    const newItem = {
      id: `item-${Date.now()}`,
      name: item.name,
      sku: `SKU-${Date.now()}`,
      category: item.category,
      unit: item.unit,
      quantity: 1, // Default quantity
      unitPrice: item.unitPrice,
      total: item.unitPrice,
      location: "Warehouse",
      minStock: 0,
      currentStock: item.stock
    }

    // Add item to existing PR
    const existingItems = editingPR.items || []
    const updatedItems = [...existingItems, newItem]
    
    // Calculate updated totals
    const updatedTotalItems = updatedItems.reduce((sum, i) => sum + i.quantity, 0)
    const updatedEstimatedTotal = updatedItems.reduce((sum, i) => sum + i.total, 0)

    // Update the PR with new item
    const updatedPR: PRItem = {
      ...editingPR,
      items: updatedItems,
      totalItems: updatedTotalItems,
      estimatedTotal: updatedEstimatedTotal,
      // Update the main item field to show first item or combined info
      item: updatedItems.length > 1 ? `${updatedItems.length} items` : updatedItems[0]?.name || editingPR.item,
      quantity: updatedTotalItems,
      unitPrice: updatedEstimatedTotal / updatedTotalItems || editingPR.unitPrice
    }

    // Update PRs list
    const updatedPRs = prs.map(p => p.id === editingPR.id ? updatedPR : p)
    setPRs(updatedPRs)
    
    // Update localStorage
    localStorage.setItem("app.prs", JSON.stringify(updatedPRs))
    
    // Update editingPR state to reflect the new item
    setEditingPR(updatedPR)
    
    toast({
      title: "Item Added",
      description: `${item.name} has been added to PR ${editingPR.requestNo}.`,
    })
  }

  const handleAddMoreItems = (pr: PRItem) => {
    if (pr.status !== "draft" && pr.status !== "submitted") {
      toast({
        title: "Cannot Add Items",
        description: "Only draft and submitted PRs can have items added.",
        variant: "destructive"
      })
      return
    }
    // Open edit dialog to add items
    setEditingPR(pr)
    setIsEditOpen(true)
    loadAvailableItems()
  }

  const handleDelete = (id: string) => {
    const updatedPRs = prs.filter(p => p.id !== id)
    setPRs(updatedPRs)
    localStorage.setItem("app.prs", JSON.stringify(updatedPRs))
    toast({ title: "Deleted", description: "PR deleted successfully" })
  }

  const handleAdd = () => {
    router.push("/pr/add")
  }

  const handleView = (pr: PRItem) => {
    setSelectedPR(pr)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedPR(null)
  }

  const handleExportPDF = () => {
    if (!selectedPR) {
      toast({
        title: "No PR selected",
        description: "Open a PR detail first before exporting.",
        variant: "destructive",
      })
      return
    }

    const lineItems =
      selectedPR.items && selectedPR.items.length > 0
        ? selectedPR.items.map((it) => ({
            requestNo: selectedPR.requestNo,
            department: selectedPR.department,
            requester: selectedPR.requester,
            item: it.name,
            category: it.category,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            priority: selectedPR.priority,
            status: selectedPR.status,
            requestDate: selectedPR.requestDate,
            approvalDate: selectedPR.approvalDate,
            approvedBy: selectedPR.approvedBy,
          }))
        : [
            {
              requestNo: selectedPR.requestNo,
              department: selectedPR.department,
              requester: selectedPR.requester,
              item: selectedPR.item,
              category: selectedPR.category,
              quantity: selectedPR.quantity,
              unitPrice: selectedPR.unitPrice,
              total: selectedPR.quantity * selectedPR.unitPrice,
              priority: selectedPR.priority,
              status: selectedPR.status,
              requestDate: selectedPR.requestDate,
              approvalDate: selectedPR.approvalDate,
              approvedBy: selectedPR.approvedBy,
            },
          ]

    const totalSpend = lineItems.reduce((sum, l) => sum + (l.total || 0), 0)

    const report: PDFReportData = {
      title: `PR ${selectedPR.requestNo}`,
      generatedDate: new Date().toLocaleDateString(),
      filters: {
        status: selectedPR.status,
        department: selectedPR.department,
        requester: selectedPR.requester,
      },
      summary: {
        totalSpend,
        totalPRs: 1,
        byStatus: { [selectedPR.status]: 1 },
        byDepartment: { [selectedPR.department]: 1 },
        byCategory: { [selectedPR.category]: 1 },
      },
      data: lineItems,
    }

    toast({
      title: "Generating PDF",
      description: `Preparing ${selectedPR.requestNo} for download...`,
    })

    generatePDFReport(report)

    setTimeout(() => {
      toast({
        title: "PDF Ready",
        description: "The PDF opened in a new tab. Use the browser Save/Print to download.",
      })
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Purchasing Requisitions</h2>
          <p className="text-muted-foreground">Manage and track PRs</p>
        </div>
        <RoleGuard resource="pr" action="create">
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add PR
          </Button>
        </RoleGuard>
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
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">No PRs yet.</TableCell>
                </TableRow>
              ) : (
                prs.map(pr => (
                  <TableRow key={pr.id}>
                    <TableCell className="font-medium">{pr.requestNo}</TableCell>
                    <TableCell>{pr.department}</TableCell>
                    <TableCell>{pr.requester}</TableCell>
                    <TableCell>{pr.item}</TableCell>
                    <TableCell>{new Date(pr.requestDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[pr.status]}>{pr.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <RoleGuard resource="pr" action="view">
                          <Button size="sm" variant="outline" onClick={() => handleView(pr)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </RoleGuard>
                        <RoleGuard resource="pr" action="edit">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleEdit(pr)}
                            disabled={pr.status === "approved" || pr.status === "rejected"}
                            title={pr.status === "approved" || pr.status === "rejected" ? "Cannot edit approved or rejected PRs" : "Edit PR"}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </RoleGuard>
                        <RoleGuard resource="pr" action="edit">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleAddMoreItems(pr)}
                            disabled={pr.status === "approved" || pr.status === "rejected"}
                            title={pr.status === "approved" || pr.status === "rejected" ? "Cannot add items to approved or rejected PRs" : "Add More Items"}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </RoleGuard>
                        <RoleGuard resource="pr" action="delete">
                          <Button size="sm" variant="outline" onClick={() => handleDelete(pr.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </RoleGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PR Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Purchase Requisition Details - {selectedPR?.requestNo}
            </DialogTitle>
            <DialogDescription>
              Complete information and history for this purchase requisition
            </DialogDescription>
          </DialogHeader>

          {selectedPR && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Request Number</label>
                      <p className="text-lg font-semibold">{selectedPR.requestNo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="mt-1">
                        <Badge className={statusColors[selectedPR.status]}>{selectedPR.status}</Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
                      <p className="text-lg">{selectedPR.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Requester</label>
                      <p className="text-lg">{selectedPR.requester}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Request Date</label>
                      <p className="text-lg">{new Date(selectedPR.requestDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Priority</label>
                      <div className="mt-1">
                        <Badge variant={selectedPR.priority === 'high' ? 'destructive' : selectedPR.priority === 'medium' ? 'default' : 'secondary'}>
                          {selectedPR.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Item Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Item Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                      <p className="text-lg font-semibold">{selectedPR.item}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Category</label>
                      <p className="text-lg">{selectedPR.category}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                      <p className="text-lg">{selectedPR.quantity}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Unit Price</label>
                      <p className="text-lg">${(selectedPR.unitPrice || 0).toLocaleString()}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                      <p className="text-2xl font-bold text-green-600">${((selectedPR.quantity || 0) * (selectedPR.unitPrice || 0)).toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Justification and Remarks */}
              <Card>
                <CardHeader>
                  <CardTitle>Justification & Remarks</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Justification</label>
                    <p className="text-lg mt-1 p-3 bg-muted rounded-md">{selectedPR.justification}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Remarks</label>
                    <p className="text-lg mt-1 p-3 bg-muted rounded-md">{selectedPR.remarks}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Approval Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedPR.status === 'approved' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approved By</label>
                        <p className="text-lg font-semibold text-green-600">{selectedPR.approvedBy}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approval Date</label>
                        <p className="text-lg">{selectedPR.approvalDate ? new Date(selectedPR.approvalDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Badge variant="outline" className="text-orange-600 border-orange-600">
                        {selectedPR.status === 'submitted' ? 'Pending Approval' : 'Draft - Not Submitted'}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button variant="outline" onClick={handleCloseDetail}>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <RoleGuard resource="pr" action="export">
                  <Button onClick={handleExportPDF}>
                    <Download className="w-4 h-4 mr-2" />
                    Export as PDF
                  </Button>
                </RoleGuard>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit PR Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Purchase Requisition: {editingPR?.requestNo}
            </DialogTitle>
            <DialogDescription>
              Add more items to this purchase requisition
            </DialogDescription>
          </DialogHeader>

          {editingPR && (
            <div className="space-y-6">
              {/* 1. PR Information Header */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Edit className="w-6 h-6" />
                    Purchase Requisition Details
                  </CardTitle>
                  <CardDescription>
                    Review and modify items for {editingPR.requestNo}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Request Number</label>
                            <p className="text-lg font-semibold">{editingPR.requestNo}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Department</label>
                            <p className="text-lg font-semibold">{editingPR.department}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Requester</label>
                            <p className="text-lg font-semibold">{editingPR.requester}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Request Date</label>
                            <p className="text-lg font-semibold">{new Date(editingPR.requestDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Priority</label>
                            <div className="flex items-center gap-2">
                              <Badge className={editingPR.priority === "high" ? "bg-red-100 text-red-800" : 
                                              editingPR.priority === "medium" ? "bg-blue-100 text-blue-800" : 
                                              "bg-gray-100 text-gray-800"}>
                                {editingPR.priority}
                              </Badge>
                              <span className="text-lg font-semibold capitalize">{editingPR.priority}</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                            <Badge className={editingPR.status === "approved" ? "bg-green-100 text-green-800" : 
                                            editingPR.status === "submitted" ? "bg-blue-100 text-blue-800" : 
                                            editingPR.status === "rejected" ? "bg-red-100 text-red-800" : 
                                            "bg-gray-100 text-gray-800"}>
                              {editingPR.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Summary Statistics */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Summary Statistics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Total Items</p>
                              <p className="text-2xl font-bold">{editingPR.totalItems || editingPR.quantity}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Package className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Estimated Total</p>
                              <p className="text-2xl font-bold text-green-600">
                                ${(editingPR.estimatedTotal || (editingPR.quantity * editingPR.unitPrice)).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Items in PR</p>
                              <p className="text-2xl font-bold">{editingPR.items?.length || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. Current Items in PR */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Current Items in PR ({editingPR.items?.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Items already added to this purchase requisition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {editingPR.items && editingPR.items.length > 0 ? (
                    <div className="space-y-3">
                      {editingPR.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.category} • {item.unit} • SKU: {item.sku}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity} • Unit Price: ${item.unitPrice.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-lg">${item.total.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Total</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-4 pt-4 border-t bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-lg">Total Items:</span>
                          <span className="font-bold text-xl">{editingPR.totalItems || editingPR.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-lg">Estimated Total:</span>
                          <span className="font-bold text-2xl text-green-600">${(editingPR.estimatedTotal || (editingPR.quantity * editingPR.unitPrice)).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No items added yet</h3>
                      <p>Add items from the available items list below</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 3. Available Items to Add */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Available Items to Add
                  </CardTitle>
                  <CardDescription>
                    Search and select items to add to this purchase requisition
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search items by name or category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No items found</h3>
                        <p>Try adjusting your search terms or check if items are available</p>
                      </div>
                    ) : (
                      filteredItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.category} • {item.unit}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ${(item.unitPrice || 0).toLocaleString()} per unit • {item.stock} available
                            </p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handleAddItemToPR(item)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to PR
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 4. Action Buttons */}
              <div className="flex gap-4 justify-end pt-6 border-t">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} size="lg">
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


