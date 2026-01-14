"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Eye, FileText, Clock, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getCurrentUser } from "@/lib/auth"

type ApprovalStatus = "pending" | "approved" | "rejected"

interface PRForApproval {
  id: string
  requestNo: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  status: ApprovalStatus
  submittedDate: string
  priority: "low" | "medium" | "high"
  approvedBy?: string
  approvalDate?: string
}

const statusColors: Record<ApprovalStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const priorityColors = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-red-100 text-red-800",
}

export function OrderDocumentApproval() {
  const [prs, setPRs] = useState<PRForApproval[]>([])
  const [selectedPR, setSelectedPR] = useState<PRForApproval | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  // Load PRs from localStorage
  useEffect(() => {
    const loadPRs = () => {
      try {
        const savedPRs = localStorage.getItem("app.prs")
        if (savedPRs) {
          const parsedPRs = JSON.parse(savedPRs)
          // Transform the data to match the approval interface
          // Show all PRs including drafts for approval management
          const transformedPRs = parsedPRs.map((pr: any) => ({
            id: pr.id,
            requestNo: pr.requestNo,
            department: pr.department,
            requester: pr.requester,
            item: pr.items && pr.items.length > 0 ? pr.items[0].name : pr.item || "Multiple Items",
            quantity: pr.totalItems || pr.quantity || 0,
            unitPrice: pr.estimatedTotal ? pr.estimatedTotal / (pr.totalItems || 1) : pr.unitPrice || 0,
            total: pr.estimatedTotal || pr.total || 0,
            status: pr.status === "approved" ? "approved" : pr.status === "rejected" ? "rejected" : pr.status === "draft" ? "pending" : "pending",
            submittedDate: pr.requestDate,
            priority: pr.priority || "medium",
            approvedBy: pr.approvedBy,
            approvalDate: pr.approvalDate
          }))
          setPRs(transformedPRs)
        } else {
          // If no saved PRs, use mock data for demonstration
          const mockPRs: PRForApproval[] = [
    {
      id: "1",
      requestNo: "PR-1023",
      department: "Administration",
      requester: "Alice Johnson",
      item: "Office Chairs",
      quantity: 10,
      unitPrice: 75,
      total: 750,
      status: "pending",
      submittedDate: "2024-01-15",
      priority: "medium"
    },
    {
      id: "2",
      requestNo: "PR-1058",
      department: "Finance",
      requester: "Bob Smith",
      item: "Accounting Software License",
      quantity: 5,
      unitPrice: 120,
      total: 600,
      status: "pending",
      submittedDate: "2024-01-14",
      priority: "high"
    },
    {
      id: "3",
      requestNo: "PR-1101",
      department: "IT",
      requester: "Charlie Brown",
      item: "Laptops",
      quantity: 3,
      unitPrice: 950,
      total: 2850,
      status: "approved",
      submittedDate: "2024-01-13",
      priority: "high"
    },
    {
      id: "4",
      requestNo: "PR-1125",
      department: "HR",
      requester: "Diana Prince",
      item: "Training Materials",
      quantity: 20,
      unitPrice: 25,
      total: 500,
      status: "rejected",
      submittedDate: "2024-01-12",
      priority: "low"
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

  const { toast } = useToast()

  const handleApprove = (id: string) => {
    // Update localStorage with approval details
    try {
      const savedPRs = localStorage.getItem("app.prs")
      if (savedPRs) {
        const parsedPRs = JSON.parse(savedPRs)
        const today = new Date().toISOString().split('T')[0]
        const currentUser = getCurrentUser()
        const approvedBy = currentUser?.name || "Admin"
        
        const updatedSavedPRs = parsedPRs.map((pr: any) => 
          pr.id === id ? { 
            ...pr, 
            status: "approved", 
            approvalDate: today,
            approvedBy: approvedBy
          } : pr
        )
        localStorage.setItem("app.prs", JSON.stringify(updatedSavedPRs))
        
        // Reload the transformed PRs with the updated approval information
        const transformedPRs = updatedSavedPRs.map((pr: any) => ({
            id: pr.id,
            requestNo: pr.requestNo,
            department: pr.department,
            requester: pr.requester,
            item: pr.items && pr.items.length > 0 ? pr.items[0].name : pr.item || "Multiple Items",
            quantity: pr.totalItems || pr.quantity || 0,
            unitPrice: pr.estimatedTotal ? pr.estimatedTotal / (pr.totalItems || 1) : pr.unitPrice || 0,
            total: pr.estimatedTotal || pr.total || 0,
            status: pr.status === "approved" ? "approved" : pr.status === "rejected" ? "rejected" : pr.status === "draft" ? "pending" : "pending",
            submittedDate: pr.requestDate,
            priority: pr.priority || "medium",
            approvedBy: pr.approvedBy,
            approvalDate: pr.approvalDate
          }))
        setPRs(transformedPRs)
      }
    } catch (error) {
      console.error("Error updating localStorage:", error)
    }
    
    toast({ 
      title: "Approved", 
      description: "Purchase requisition has been approved" 
    })
  }

  const handleReject = (id: string) => {
    const updatedPRs = prs.map(pr => 
      pr.id === id ? { ...pr, status: "rejected" as ApprovalStatus } : pr
    )
    setPRs(updatedPRs)
    
    // Update localStorage
    try {
      const savedPRs = localStorage.getItem("app.prs")
      if (savedPRs) {
        const parsedPRs = JSON.parse(savedPRs)
        const updatedSavedPRs = parsedPRs.map((pr: any) => 
          pr.id === id ? { ...pr, status: "rejected" } : pr
        )
        localStorage.setItem("app.prs", JSON.stringify(updatedSavedPRs))
      }
    } catch (error) {
      console.error("Error updating localStorage:", error)
    }
    
    toast({ 
      title: "Rejected", 
      description: "Purchase requisition has been rejected" 
    })
  }

  const handleViewDetails = (pr: PRForApproval) => {
    setSelectedPR(pr)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedPR(null)
  }

  const pendingCount = prs.filter(pr => pr.status === "pending").length
  const approvedCount = prs.filter(pr => pr.status === "approved").length
  const rejectedCount = prs.filter(pr => pr.status === "rejected").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Order Document Approval</h2>
          <p className="text-muted-foreground">Approve purchase requisitions and automatically create purchase orders</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Pending</span>
            </div>
            <div className="text-lg font-bold text-yellow-600">{pendingCount}</div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Approved</span>
            </div>
            <div className="text-lg font-bold text-green-600">{approvedCount}</div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Rejected</span>
            </div>
            <div className="text-lg font-bold text-red-600">{rejectedCount}</div>
          </div>
        </Card>
        
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <div className="text-lg font-bold">{prs.length}</div>
          </div>
        </Card>
      </div>

      {/* PR Approval List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Purchase Requisition Approval List
          </CardTitle>
          <CardDescription>
            Approve purchase requisitions, approved PRs will automatically create purchase orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request No</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No purchase requisitions yet
                  </TableCell>
                </TableRow>
              ) : (
                prs.map(pr => (
                  <TableRow key={pr.id}>
                    <TableCell className="font-medium">{pr.requestNo}</TableCell>
                    <TableCell>{pr.department}</TableCell>
                    <TableCell>{pr.requester}</TableCell>
                    <TableCell>
                      <Badge className={priorityColors[pr.priority]}>
                        {pr.priority === "low" ? "Low" : pr.priority === "medium" ? "Medium" : "High"}
                      </Badge>
                    </TableCell>
                    <TableCell>{pr.submittedDate}</TableCell>
                    <TableCell>
                      <Badge className={statusColors[pr.status]}>
                        {pr.status === "pending" ? "Pending" : pr.status === "approved" ? "Approved" : "Rejected"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleViewDetails(pr)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {pr.status === "pending" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(pr.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleReject(pr.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              PR Details - {selectedPR?.requestNo}
            </DialogTitle>
            <DialogDescription>
              Detailed information about the purchase requisition
            </DialogDescription>
          </DialogHeader>

          {selectedPR && (
            <div className="space-y-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Request Number</label>
                      <p className="text-lg font-semibold">{selectedPR.requestNo}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Department</label>
                      <p className="text-lg font-semibold">{selectedPR.department}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Requester</label>
                      <p className="text-lg font-semibold">{selectedPR.requester}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <p className="mt-1">
                        <Badge className={statusColors[selectedPR.status]}>
                          {selectedPR.status.charAt(0).toUpperCase() + selectedPR.status.slice(1)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Priority</label>
                      <p className="mt-1">
                        <Badge className={priorityColors[selectedPR.priority]}>
                          {selectedPR.priority.charAt(0).toUpperCase() + selectedPR.priority.slice(1)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Submitted Date</label>
                      <p className="text-lg">{selectedPR.submittedDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Item Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Item Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Item Name</label>
                      <p className="text-lg">{selectedPR.item}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                      <p className="text-lg">{selectedPR.quantity}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Unit Price</label>
                      <p className="text-lg">${selectedPR.unitPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Amount</label>
                      <p className="text-2xl font-bold text-green-600">${selectedPR.total.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Approval Information - Only show if approved */}
              {selectedPR.status === "approved" && selectedPR.approvedBy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Approval Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approved By</label>
                        <p className="text-lg font-semibold text-green-600">{selectedPR.approvedBy}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Approval Date</label>
                        <p className="text-lg">{selectedPR.approvalDate || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={handleCloseDetail}>
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
