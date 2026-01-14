"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowRight, CheckCircle, Clock, FileText, Package, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type WorkflowStatus = "pr_submitted" | "pr_approved" | "po_created" | "po_issued" | "goods_received" | "completed"

interface WorkflowItem {
  id: string
  requestNo: string
  orderNo?: string
  department: string
  requester: string
  item: string
  quantity: number
  unitPrice: number
  total: number
  status: WorkflowStatus
  prDate: string
  approvalDate?: string
  poDate?: string
  issueDate?: string
  receivedDate?: string
}

const statusConfig: Record<WorkflowStatus, { label: string; color: string; icon: any }> = {
  pr_submitted: { label: "PR Submitted", color: "bg-blue-100 text-blue-800", icon: FileText },
  pr_approved: { label: "PR Approved", color: "bg-green-100 text-green-800", icon: CheckCircle },
  po_created: { label: "PO Created", color: "bg-purple-100 text-purple-800", icon: Package },
  po_issued: { label: "PO Issued", color: "bg-orange-100 text-orange-800", icon: ArrowRight },
  goods_received: { label: "Goods Received", color: "bg-cyan-100 text-cyan-800", icon: CheckCircle },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
}

export function OrderDocumentWorkflow() {
  const [workflowItems, setWorkflowItems] = useState<WorkflowItem[]>([
    {
      id: "1",
      requestNo: "PR-1023",
      orderNo: "PO-2001",
      department: "Administration",
      requester: "Alice Johnson",
      item: "Office Chairs",
      quantity: 10,
      unitPrice: 75,
      total: 750,
      status: "completed",
      prDate: "2024-01-15",
      approvalDate: "2024-01-16",
      poDate: "2024-01-16",
      issueDate: "2024-01-17",
      receivedDate: "2024-01-20"
    },
    {
      id: "2",
      requestNo: "PR-1058",
      orderNo: "PO-2008",
      department: "Finance",
      requester: "Bob Smith",
      item: "Accounting Software License",
      quantity: 5,
      unitPrice: 120,
      total: 600,
      status: "po_issued",
      prDate: "2024-01-14",
      approvalDate: "2024-01-15",
      poDate: "2024-01-15",
      issueDate: "2024-01-16"
    },
    {
      id: "3",
      requestNo: "PR-1101",
      orderNo: "PO-2015",
      department: "IT",
      requester: "Charlie Brown",
      item: "Laptops",
      quantity: 3,
      unitPrice: 950,
      total: 2850,
      status: "po_created",
      prDate: "2024-01-13",
      approvalDate: "2024-01-14",
      poDate: "2024-01-14"
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
      status: "pr_approved",
      prDate: "2024-01-12",
      approvalDate: "2024-01-13"
    }
  ])

  const { toast } = useToast()

  const getStatusIcon = (status: WorkflowStatus) => {
    const config = statusConfig[status]
    const IconComponent = config.icon
    return <IconComponent className="w-4 h-4" />
  }

  const getProgressPercentage = (status: WorkflowStatus) => {
    const statusOrder = ["pr_submitted", "pr_approved", "po_created", "po_issued", "goods_received", "completed"]
    const currentIndex = statusOrder.indexOf(status)
    return ((currentIndex + 1) / statusOrder.length) * 100
  }

  const handleStatusUpdate = (id: string, newStatus: WorkflowStatus) => {
    setWorkflowItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ))
    
    const statusLabel = statusConfig[newStatus].label
    toast({ 
      title: "Status Updated", 
      description: `Order status updated to: ${statusLabel}` 
    })
  }

  const getNextStatus = (currentStatus: WorkflowStatus): WorkflowStatus | null => {
    const statusOrder = ["pr_submitted", "pr_approved", "po_created", "po_issued", "goods_received", "completed"]
    const currentIndex = statusOrder.indexOf(currentStatus)
    return currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] as WorkflowStatus : null
  }

  const getNextStatusLabel = (currentStatus: WorkflowStatus): string | null => {
    const nextStatus = getNextStatus(currentStatus)
    return nextStatus ? statusConfig[nextStatus].label : null
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Order Document Workflow</h2>
          <p className="text-muted-foreground">Track the complete process from PR to PO completion</p>
        </div>
      </div>

      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Workflow Overview
          </CardTitle>
          <CardDescription>
            Complete process from purchase requisition to purchase order completion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-4 overflow-x-auto">
            {Object.entries(statusConfig).map(([status, config]) => {
              const IconComponent = config.icon
              return (
                <div key={status} className="flex flex-col items-center space-y-2 min-w-[120px]">
                  <div className={`p-3 rounded-full ${config.color}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-center">{config.label}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Workflow Tracking
          </CardTitle>
          <CardDescription>
            View current status and progress of all orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request No</TableHead>
                <TableHead>Order No</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflowItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                    No workflow items yet
                  </TableCell>
                </TableRow>
              ) : (
                workflowItems.map(item => {
                  const config = statusConfig[item.status]
                  const progress = getProgressPercentage(item.status)
                  const nextStatus = getNextStatus(item.status)
                  const nextStatusLabel = getNextStatusLabel(item.status)
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.requestNo}</TableCell>
                      <TableCell>{item.orderNo || "-"}</TableCell>
                      <TableCell>{item.department}</TableCell>
                      <TableCell>{item.requester}</TableCell>
                      <TableCell>{item.item}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={config.color}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{config.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {nextStatus && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(item.id, nextStatus)}
                            >
                              {nextStatusLabel}
                            </Button>
                          )}
                          {item.status === "completed" && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
