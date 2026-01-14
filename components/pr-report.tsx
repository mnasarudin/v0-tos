"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { Download, FileText } from "lucide-react"
import { generatePDFReport, downloadCSVReport, type PDFReportData } from "@/lib/pdf-generator"

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
  requestDate: string
  approvalDate?: string
  approvedBy?: string
  priority: "low" | "medium" | "high"
  category: string
}

export function PRReport() {
  const { toast } = useToast()
  const [data, setData] = useState<PRItem[]>([])

  // Load PRs from localStorage
  useEffect(() => {
    const loadPRs = () => {
      try {
        const savedPRs = localStorage.getItem("app.prs")
        if (savedPRs) {
          const parsedPRs = JSON.parse(savedPRs)
          // Ensure all PRs have proper date formatting
          const formattedPRs = parsedPRs.map((pr: any) => ({
            ...pr,
            requestDate: pr.requestDate || pr.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
            approvalDate: pr.approvalDate || undefined,
            approvedBy: pr.approvedBy || undefined
          }))
          setData(formattedPRs)
        } else {
          // If no saved PRs, use mock data for demonstration
          const mockData: PRItem[] = [
    { 
      id: "1", 
      requestNo: "PR-1023", 
      department: "Administration", 
      requester: "Alice", 
      item: "Office Chairs", 
      quantity: 10, 
      unitPrice: 75, 
      status: "approved",
      requestDate: "2024-01-15",
      approvalDate: "2024-01-18",
      approvedBy: "John Manager",
      priority: "medium",
      category: "Office Equipment"
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
      requestDate: "2024-01-20",
      priority: "high",
      category: "Software"
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
      requestDate: "2024-01-22",
      priority: "low",
      category: "IT Equipment"
    },
    { 
      id: "4", 
      requestNo: "PR-1112", 
      department: "IT", 
      requester: "Dana", 
      item: "Monitors", 
      quantity: 6, 
      unitPrice: 180, 
      status: "approved",
      requestDate: "2024-01-10",
      approvalDate: "2024-01-12",
      approvedBy: "Jane Director",
      priority: "medium",
      category: "IT Equipment"
    },
    { 
      id: "5", 
      requestNo: "PR-1120", 
      department: "Operation", 
      requester: "Eve", 
      item: "Safety Helmets", 
      quantity: 50, 
      unitPrice: 22, 
      status: "rejected",
      requestDate: "2024-01-08",
      priority: "high",
      category: "Safety Equipment"
    }
          ]
          setData(mockData)
        }
      } catch (error) {
        console.error("Error loading PRs:", error)
        setData([])
      }
    }
    
    loadPRs()
  }, [])

  // Use all data since filters are removed
  const filteredData = data

  const summary = useMemo(() => {
    const byDepartment: Record<string, { count: number; total: number }> = {}
    const byStatus: Record<PRStatus, number> = { draft: 0, submitted: 0, approved: 0, rejected: 0 }
    const byCategory: Record<string, { count: number; total: number }> = {}
    const byPriority: Record<string, number> = { low: 0, medium: 0, high: 0 }
    let grandTotal = 0
    
    for (const pr of filteredData) {
      const total = pr.quantity * pr.unitPrice
      grandTotal += total
      
      byDepartment[pr.department] = byDepartment[pr.department] || { count: 0, total: 0 }
      byDepartment[pr.department].count += 1
      byDepartment[pr.department].total += total
      
      byStatus[pr.status] += 1
      
      byCategory[pr.category] = byCategory[pr.category] || { count: 0, total: 0 }
      byCategory[pr.category].count += 1
      byCategory[pr.category].total += total
      
      byPriority[pr.priority] += 1
    }
    return { byDepartment, byStatus, byCategory, byPriority, grandTotal }
  }, [filteredData])

  const generatePDF = () => {
    const reportData: PDFReportData = {
      title: "PR Report",
      generatedDate: new Date().toLocaleDateString(),
      filters: {},
      summary: {
        totalSpend: summary.grandTotal,
        totalPRs: filteredData.length,
        byStatus: summary.byStatus,
        byDepartment: summary.byDepartment,
        byCategory: summary.byCategory
      },
      data: filteredData.map(pr => ({
        requestNo: pr.requestNo,
        department: pr.department,
        requester: pr.requester,
        item: pr.item,
        category: pr.category,
        quantity: pr.quantity,
        unitPrice: pr.unitPrice,
        total: pr.quantity * pr.unitPrice,
        priority: pr.priority,
        status: pr.status,
        requestDate: pr.requestDate,
        approvalDate: pr.approvalDate,
        approvedBy: pr.approvedBy
      }))
    }

    toast({
      title: "Generating PDF Report",
      description: `Generating report with ${filteredData.length} records...`,
    })
    
    generatePDFReport(reportData)
    
    setTimeout(() => {
      toast({
        title: "PDF Generated",
        description: "Your report has been generated and is ready for printing!",
      })
    }, 1000)
  }

  const generateCSV = () => {
    const reportData: PDFReportData = {
      title: "PR Report",
      generatedDate: new Date().toLocaleDateString(),
      filters: {},
      summary: {
        totalSpend: summary.grandTotal,
        totalPRs: filteredData.length,
        byStatus: summary.byStatus,
        byDepartment: summary.byDepartment,
        byCategory: summary.byCategory
      },
      data: filteredData.map(pr => ({
        requestNo: pr.requestNo,
        department: pr.department,
        requester: pr.requester,
        item: pr.item,
        category: pr.category,
        quantity: pr.quantity,
        unitPrice: pr.unitPrice,
        total: pr.quantity * pr.unitPrice,
        priority: pr.priority,
        status: pr.status,
        requestDate: pr.requestDate,
        approvalDate: pr.approvalDate,
        approvedBy: pr.approvedBy
      }))
    }

    downloadCSVReport(reportData)
    toast({
      title: "CSV Downloaded",
      description: "Your CSV report has been downloaded successfully!",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">PR Reports</h2>
          <p className="text-muted-foreground">Generate comprehensive purchase requisition reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePDF} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Generate PDF
          </Button>
          <Button onClick={generateCSV} variant="outline" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Download CSV
          </Button>
        </div>
      </div>



      {/* Detailed Report Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Detailed Report ({filteredData.length} records)
          </CardTitle>
          <CardDescription>Complete list of purchase requisitions based on selected filters</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request No</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Approval Date</TableHead>
                <TableHead>Approved By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((pr) => (
                <TableRow key={pr.id}>
                  <TableCell className="font-medium">{pr.requestNo}</TableCell>
                  <TableCell>{pr.department}</TableCell>
                  <TableCell>{pr.requester}</TableCell>
                  <TableCell className="font-medium">${(pr.quantity * pr.unitPrice).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={
                      pr.priority === "high" ? "destructive" : 
                      pr.priority === "medium" ? "default" : "secondary"
                    }>
                      {pr.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      pr.status === "approved" ? "default" : 
                      pr.status === "rejected" ? "destructive" : 
                      pr.status === "submitted" ? "secondary" : "outline"
                    }>
                      {pr.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {pr.requestDate 
                      ? new Date(pr.requestDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        }) 
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {pr.approvalDate 
                      ? new Date(pr.approvalDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: '2-digit', 
                          day: '2-digit' 
                        }) 
                      : "-"}
                  </TableCell>
                  <TableCell className="font-medium">{pr.approvedBy || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}


