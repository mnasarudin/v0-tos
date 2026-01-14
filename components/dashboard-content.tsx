"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, FileText, Package, UserPlus, Plus, Eye, CheckCircle, Clock, ShoppingCart } from "lucide-react"
import { useRouter } from "next/navigation"
import { getCurrentUser, canAccessResource } from "@/lib/auth"
import { useEffect, useState } from "react"

export function DashboardContent() {
  const router = useRouter()
  const [user, setUser] = useState(getCurrentUser())

  useEffect(() => {
    setUser(getCurrentUser())
  }, [])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  // Mock data for demonstration
  const lowStockItems = [
    { name: "Office Paper A4", currentStock: 5, minStock: 20, unit: "reams" },
    { name: "Printer Ink Cartridge", currentStock: 2, minStock: 10, unit: "pieces" },
    { name: "Stapler Pins", currentStock: 3, minStock: 15, unit: "boxes" },
  ]

  const newPRs = [
    { id: "PR-2024-001", requestor: "John Doe", department: "IT", items: 5, date: "2024-01-15" },
    { id: "PR-2024-002", requestor: "Jane Smith", department: "HR", items: 3, date: "2024-01-14" },
    { id: "PR-2024-003", requestor: "Mike Johnson", department: "Finance", items: 8, date: "2024-01-13" },
  ]

  const pendingPOs = [
    { id: "PO-2024-001", vendor: "Office Supplies Co.", amount: "$2,450", status: "Pending Approval", date: "2024-01-12" },
    { id: "PO-2024-002", vendor: "Tech Solutions Ltd.", amount: "$5,200", status: "Pending Delivery", date: "2024-01-10" },
    { id: "PO-2024-003", vendor: "Stationery Plus", amount: "$890", status: "Pending Payment", date: "2024-01-08" },
  ]

  const newVendors = [
    { name: "Global Supplies Inc.", contact: "Sarah Wilson", email: "sarah@globalsupplies.com", registeredDate: "2024-01-15" },
    { name: "Premium Office Solutions", contact: "David Chen", email: "david@premiumoffice.com", registeredDate: "2024-01-14" },
    { name: "Quick Delivery Services", contact: "Maria Garcia", email: "maria@quickdelivery.com", registeredDate: "2024-01-13" },
  ]

  const getRoleBasedTitle = () => {
    switch (user?.role) {
      case "HOD": return "Head of Department Dashboard"
      case "AHOD": return "Assistant Head Dashboard"
      case "Staff": return "Staff Dashboard"
      case "Approval": return "Approval Dashboard"
      case "Maker": return "Maker Dashboard"
      default: return "Dashboard"
    }
  }

  const getRoleBasedDescription = () => {
    switch (user?.role) {
      case "HOD": return "Full system access - manage all operations and approvals."
      case "AHOD": return "Management access - approve PRs and manage department data."
      case "Staff": return "Create purchase requisitions for your department needs."
      case "Approval": return "Review and approve pending purchase requisitions."
      case "Maker": return "Create and manage purchase requisitions."
      default: return "Monitor your activities and tasks."
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{getRoleBasedTitle()}</h1>
        <p className="text-muted-foreground mt-2">{getRoleBasedDescription()}</p>
      </div>

      {/* Role-based Dashboard Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Low Stock Items - Only for HOD and AHOD */}
        {canAccessResource("inventory", "view") && (
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Low Stock Items
              </CardTitle>
              <CardDescription>Items below minimum stock level</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleNavigation('/inventory/list')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Current: {item.currentStock} {item.unit} | Min: {item.minStock} {item.unit}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Low Stock
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* New Purchase Requisitions - For all roles except Approval */}
        {canAccessResource("pr", "create") && (
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                New Purchase Requisitions
              </CardTitle>
              <CardDescription>Recent PR submissions</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleNavigation('/pr/add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New PR
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newPRs.map((pr, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{pr.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {pr.requestor} • {pr.department} • {pr.items} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{pr.date}</p>
                    <Badge variant="default" className="text-xs">
                      New
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Pending Purchase Orders - Only for HOD and AHOD */}
        {canAccessResource("pr", "view") && user?.role !== "Approval" && (
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-500" />
                Pending Purchase Orders
              </CardTitle>
              <CardDescription>POs awaiting action</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleNavigation('/po/list')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPOs.map((po, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{po.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {po.vendor} • {po.amount}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{po.date}</p>
                    <Badge variant="secondary" className="text-xs">
                      {po.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* New Registered Vendors - Only for HOD and AHOD */}
        {canAccessResource("items", "view") && (
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-500" />
                New Registered Vendors
              </CardTitle>
              <CardDescription>Recently registered vendors</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleNavigation('/vendor/add')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Register Vendor
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {newVendors.map((vendor, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {vendor.contact} • {vendor.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{vendor.registeredDate}</p>
                    <Badge variant="default" className="text-xs bg-green-500">
                      New
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* Approval-specific cards */}
        {user?.role === "Approval" && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    Pending Approvals
                  </CardTitle>
                  <CardDescription>PRs awaiting your approval</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleNavigation('/pr/list')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Review All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {newPRs.map((pr, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{pr.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {pr.requestor} • {pr.department} • {pr.items} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{pr.date}</p>
                        <Badge variant="secondary" className="text-xs bg-yellow-500">
                          Pending
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Recent Approvals
                  </CardTitle>
                  <CardDescription>Recently approved PRs</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex-1">
                      <p className="text-sm font-medium">PR-2024-004</p>
                      <p className="text-xs text-muted-foreground">
                        Alice Johnson • IT • 2 items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">2024-01-16</p>
                      <Badge variant="default" className="text-xs bg-green-500">
                        Approved
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Staff-specific cards */}
        {user?.role === "Staff" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-500" />
                  Create New PR
                </CardTitle>
                <CardDescription>Submit a new purchase requisition</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigation('/pr/add')}
              >
                <Plus className="h-4 w-4 mr-2" />
                New PR
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create a new purchase requisition for your department needs. 
                Your PR will be reviewed by the approval team.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Maker-specific cards */}
        {user?.role === "Maker" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  My PRs
                </CardTitle>
                <CardDescription>Manage your purchase requisitions</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigation('/pr/add')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create PR
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium">PR-2024-005</p>
                    <p className="text-xs text-muted-foreground">
                      Office Supplies • 3 items • Draft
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Draft
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
