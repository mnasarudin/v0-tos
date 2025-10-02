"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Settings, BarChart3, FileText, LogOut, ChevronLeft, ChevronRight, DollarSign, ChevronDown, Plus, List, ShoppingCart, Package, Boxes, Factory } from "lucide-react"
import { logout } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface MenuItem {
  icon: any
  label: string
  href?: string
  submenu?: { icon: any; label: string; href: string }[]
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
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
    icon: Boxes,
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
  { icon: Users, label: "Users", href: "/dashboard/users" },
  { icon: BarChart3, label: "Analytics", href: "/dashboard/analytics" },
  { icon: FileText, label: "Reports", href: "/dashboard/reports" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleSubmenu = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const handleNavigation = (href: string) => {
    router.push(href)
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
        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.label}>
              <Button
                variant="ghost"
                onClick={() => {
                  if (item.submenu) {
                    toggleSubmenu(item.label)
                  } else if (item.href) {
                    handleNavigation(item.href)
                  }
                }}
                className={cn(
                  "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  collapsed ? "px-2" : "px-3",
                )}
              >
                <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.submenu && (
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          expandedItems.includes(item.label) ? "rotate-180" : ""
                        )}
                      />
                    )}
                  </>
                )}
              </Button>

              {/* Submenu */}
              {item.submenu && !collapsed && expandedItems.includes(item.label) && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subItem) => (
                    <Button
                      key={subItem.href}
                      variant="ghost"
                      onClick={() => handleNavigation(subItem.href)}
                      className="w-full justify-start text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground px-3"
                    >
                      <subItem.icon className="h-4 w-4 mr-3" />
                      <span>{subItem.label}</span>
                    </Button>
                  ))}
                </div>
              )}
            </div>
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
