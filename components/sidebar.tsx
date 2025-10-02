"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
<<<<<<< Updated upstream
import { LayoutDashboard, Users, Settings, BarChart3, FileText, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
=======
import { LayoutDashboard, Users, Settings, BarChart3, FileText, LogOut, ChevronLeft, ChevronRight, DollarSign, ChevronDown, Plus, List, ShoppingCart, Package, Boxes, Factory } from "lucide-react"
>>>>>>> Stashed changes
import { logout } from "@/lib/auth"
import { useRouter } from "next/navigation"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
<<<<<<< Updated upstream
=======
  { 
    icon: DollarSign, 
    label: "Budget", 
    submenu: [
      { icon: Plus, label: "Add Budget", href: "/budget/add" },
      { icon: List, label: "Budget List", href: "/budget/list" }
    ]
  },
  {
    icon: ShoppingCart,
    label: "Purchasing Requisition",
    submenu: [
      { icon: Plus, label: "Add PR", href: "/pr/add" },
      { icon: List, label: "PR List", href: "/pr/list" },
      { icon: FileText, label: "Report", href: "/pr/report" },
    ]
  },
  {
    icon: Package,
    label: "Purchase Orders",
    submenu: [
      { icon: Plus, label: "Add PO", href: "/po/add" },
      { icon: List, label: "PO List", href: "/po/list" },
      { icon: FileText, label: "Report", href: "/po/report" },
    ]
  },
  {
    icon: Package,
    label: "Items",
    submenu: [
      { icon: Plus, label: "Register Item", href: "/item/add" },
      { icon: List, label: "Item List", href: "/item/list" },
      { icon: FileText, label: "Usage Report", href: "/item/report" },
    ]
  },
  {
    icon: Boxes,
    label: "Inventory",
    submenu: [
      { icon: List, label: "Stock Movement", href: "/inventory/stock" },
      { icon: List, label: "Inventory List", href: "/inventory/list" },
      { icon: FileText, label: "Report", href: "/inventory/report" },
    ]
  },
  {
    icon: Factory,
    label: "Vendors",
    submenu: [
      { icon: Plus, label: "Register Vendor", href: "/vendor/add" },
      { icon: List, label: "Vendor List", href: "/vendor/list" },
          { icon: FileText, label: "Vendor Report", href: "/vendor/report" },
    ]
  },
>>>>>>> Stashed changes
  { icon: Users, label: "Users", href: "/dashboard/users" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: FileText, label: "Reports", href: "/dashboard/reports" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-sidebar-primary-foreground rounded-sm"></div>
              </div>
              <span className="text-lg font-semibold text-sidebar-foreground">AdminHub</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-2">
          {menuItems.map((item) => (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                collapsed ? "px-2" : "px-3",
              )}
            >
              <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
              {!collapsed && <span>{item.label}</span>}
            </Button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-sidebar-border">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed ? "px-2" : "px-3",
            )}
          >
            <LogOut className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  )
}
