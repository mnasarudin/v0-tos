"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, FileText, LogOut, ChevronLeft, ChevronRight, ChevronDown, Plus, List, ShoppingCart, Package, Boxes, Factory, Store, ClipboardCheck, Workflow, User } from "lucide-react"
import { logout, getCurrentUser, canAccessResource } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

// Define menu items with role-based visibility
const getMenuItems = (userRole: string) => {
  const allMenuItems = [
    { 
      icon: LayoutDashboard, 
      label: "Dashboard", 
      href: "/dashboard",
      roles: ["HOD", "AHOD", "Staff", "Approval", "Maker"]
    },
    { 
      icon: Store, 
      label: "Product Selection", 
      href: "/product-selection",
      roles: ["HOD", "AHOD", "Staff", "Maker"]
    },
    {
      icon: Factory,
      label: "Proponents",
      roles: ["HOD", "AHOD", "Staff", "Approval", "Maker", "Vendor"],
      submenu: [
        {
          icon: Plus,
          label: "Register Item",
          href: "/proponents/item",
          roles: ["HOD", "AHOD", "Staff", "Approval", "Maker", "Vendor"]
        },
      ]
    },
    {
      icon: ShoppingCart,
      label: "Purchasing Requisition",
      roles: ["HOD", "AHOD", "Staff", "Approval", "Maker"],
      submenu: [
        { 
          icon: Plus, 
          label: "Add PR", 
          href: "/pr/add",
          roles: ["HOD", "AHOD", "Staff", "Maker"]
        },
        { 
          icon: List, 
          label: "PR List", 
          href: "/pr/list",
          roles: ["HOD", "AHOD", "Approval"]
        },
        { 
          icon: FileText, 
          label: "Report", 
          href: "/pr/report",
          roles: ["HOD", "AHOD"]
        },
      ]
    },
    {
      icon: Package,
      label: "Purchase Orders",
      roles: ["HOD", "AHOD"],
      submenu: [
        { 
          icon: Plus, 
          label: "Add PO", 
          href: "/po/add",
          roles: ["HOD", "AHOD"]
        },
        { 
          icon: List, 
          label: "PO List", 
          href: "/po/list",
          roles: ["HOD", "AHOD"]
        },
        { 
          icon: FileText, 
          label: "Report", 
          href: "/po/report",
          roles: ["HOD", "AHOD"]
        },
      ]
    },
    {
      icon: ClipboardCheck,
      label: "Order Documents",
      roles: ["HOD", "AHOD", "Approval"],
      submenu: [
        { 
          icon: ClipboardCheck, 
          label: "Approval", 
          href: "/order-documents/approval",
          roles: ["HOD", "AHOD", "Approval"]
        },
        { 
          icon: Workflow, 
          label: "Workflow", 
          href: "/order-documents/workflow",
          roles: ["HOD", "AHOD"]
        },
      ]
    },
    {
      icon: Package,
      label: "Items",
      roles: ["HOD", "AHOD"],
      submenu: [
        { 
          icon: Plus, 
          label: "Register Item", 
          href: "/item/add",
          roles: ["HOD", "AHOD"]
        },
        { 
          icon: List, 
          label: "Item List", 
          href: "/item/list",
          roles: ["HOD", "AHOD"]
        },
        { 
          icon: FileText, 
          label: "Usage Report", 
          href: "/item/report",
          roles: ["HOD", "AHOD"]
        },
      ]
    },
    {
      icon: Boxes,
      label: "Inventory",
      roles: ["HOD", "AHOD"],
      submenu: [
        { 
          icon: List, 
          label: "Stock Movement", 
          href: "/inventory/stock",
          roles: ["HOD", "AHOD"]
        },
        { 
          icon: List, 
          label: "Inventory List", 
          href: "/inventory/list",
          roles: ["HOD", "AHOD"]
        },
        { 
          icon: FileText, 
          label: "Report", 
          href: "/inventory/report",
          roles: ["HOD", "AHOD"]
        },
      ]
    },
    
    {
      icon: User,
      label: "Profile",
      href: "/vendor/profile",
      roles: ["Vendor"]
    },
    {
      icon: Factory,
      label: "Vendors",
      roles: ["HOD", "AHOD", "Vendor"],
      submenu: [
        { 
          icon: Plus, 
          label: "Register Vendor", 
          href: "/vendor/add",
          roles: ["HOD", "AHOD"]
        },
        { 
          icon: List, 
          label: "Vendor List", 
          href: "/vendor/list",
          roles: ["HOD", "AHOD"]
        },
        {
          icon: Factory,
          label: "Register Business",
          href: "/propenents/register",
          roles: ["Vendor"]
        },
        { 
          icon: FileText, 
          label: "Vendor Report", 
          href: "/vendor/report",
          roles: ["HOD", "AHOD"]
        },
        
      ]
    },
  ]

  // Filter menu items based on user role
  return allMenuItems.filter(item => {
    if (!item.roles.includes(userRole)) return false
    
    // If item has submenu, filter submenu items too
    if (item.submenu) {
      item.submenu = item.submenu.filter(subItem => 
        subItem.roles.includes(userRole)
      )
      // Only show parent item if it has visible submenu items
      return item.submenu.length > 0
    }
    
    return true
  })
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [user, setUser] = useState(getCurrentUser())
  const [menuItems, setMenuItems] = useState(getMenuItems(user?.role || ""))

  useEffect(() => {
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setMenuItems(getMenuItems(currentUser?.role || ""))
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleExpanded = (label: string) => {
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
        <nav className="flex-1 space-y-1 p-2">
          {menuItems.map((item) => (
            <div key={item.label}>
              {item.submenu ? (
                // Menu item with submenu
                <>
                  <Button
                    variant="ghost"
                    onClick={() => !collapsed && toggleExpanded(item.label)}
                    className={cn(
                      "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed ? "px-2" : "px-3",
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItems.includes(item.label) ? "rotate-180" : ""
                          )} 
                        />
                      </>
                    )}
                  </Button>
                  {!collapsed && expandedItems.includes(item.label) && (
                    <div className="ml-4 space-y-1">
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
                </>
              ) : (
                // Simple menu item
                <Button
                  variant="ghost"
                  onClick={() => handleNavigation(item.href!)}
                  className={cn(
                    "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    collapsed ? "px-2" : "px-3",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
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
