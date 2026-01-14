"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getCurrentUser, setCurrentUser, type UserRole, type User } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { User as UserIcon, ChevronDown } from "lucide-react"

const ROLE_DESCRIPTIONS = {
  HOD: "Head of Department - Full system access, can manage everything",
  AHOD: "Assistant Head - Can approve PRs and manage department data",
  Staff: "Staff member - Can only create PRs, no other access",
  Approval: "Approval role - Can only view and approve PRs, no other access",
  Maker: "Maker role - Can create and edit PRs, no approval rights",
  Vendor: "Vendor role - Can register/manage vendor info only"
} as const

const ROLE_COLORS = {
  HOD: "bg-red-100 text-red-800",
  AHOD: "bg-blue-100 text-blue-800", 
  Staff: "bg-green-100 text-green-800",
  Approval: "bg-purple-100 text-purple-800",
  Maker: "bg-orange-100 text-orange-800",
  Vendor: "bg-teal-100 text-teal-800"
} as const

export function RoleSwitcher() {
  const [currentUser, setCurrentUserState] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentUserState(getCurrentUser())
  }, [])

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleRoleChange = (newRole: UserRole) => {
    if (!currentUser) return

    const updatedUser: User = {
      ...currentUser,
      role: newRole,
      department: newRole === "HOD" ? "Head Office" : 
                 newRole === "AHOD" ? "Assistant Head Office" : 
                 newRole === "Staff" ? "Operations" : 
                 newRole === "Approval" ? "Finance" : 
                 newRole === "Vendor" ? "Vendors" : "Procurement"
    }

    setCurrentUser(updatedUser)
    setCurrentUserState(updatedUser)
    setIsOpen(false)

    toast({
      title: "Role Changed",
      description: `Switched to ${newRole} role. Page will refresh to apply permissions.`,
    })

    // Refresh the page to apply new permissions
    setTimeout(() => {
      window.location.reload()
    }, 1500)
  }

  if (!currentUser) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 min-w-fit hover:bg-muted relative z-50"
      >
        <UserIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{currentUser.name}</span>
        <Badge className={ROLE_COLORS[currentUser.role]}>
          {currentUser.role}
        </Badge>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div 
          className="fixed w-80 bg-white border-2 border-gray-300 rounded-lg shadow-2xl z-[99999] animate-in slide-in-from-top-2 duration-200"
          style={{
            top: dropdownRef.current ? `${dropdownRef.current.getBoundingClientRect().bottom + 8}px` : '64px',
            right: '16px',
            backgroundColor: '#ffffff'
          }}>
          <div className="p-4 border-b border-gray-100 bg-white" style={{ backgroundColor: '#ffffff' }}>
            <h3 className="font-semibold text-sm text-gray-900">Switch User Role</h3>
            <p className="text-xs text-gray-500 mt-1">
              Current: {currentUser.email}
            </p>
          </div>
          
          <div className="p-2 max-h-64 overflow-y-auto bg-white" style={{ backgroundColor: '#ffffff' }}>
            {Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => (
              <button
                key={role}
                onClick={() => handleRoleChange(role as UserRole)}
                className={`w-full text-left p-3 rounded-md hover:bg-gray-50 transition-colors duration-150 ${
                  currentUser.role === role ? 'bg-blue-50 border border-blue-200' : 'bg-white'
                }`}
                style={{ backgroundColor: currentUser.role === role ? '#eff6ff' : '#ffffff' }}
              >
                <div className="flex items-start gap-3 w-full">
                  <Badge className={ROLE_COLORS[role as UserRole]} style={{ flexShrink: 0 }}>
                    {role}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize break-words">{role}</p>
                    <p className="text-xs text-gray-500 mt-1 break-words">{description}</p>
                  </div>
                  {currentUser.role === role && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="bg-white rounded-b-lg overflow-hidden">
            <div className="p-3 border-t border-gray-100 bg-white rounded-b-lg">
            <p className="text-xs text-gray-500">
              💡 This is for demonstration purposes. In production, roles would be managed by administrators.
            </p>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[99998] bg-transparent" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

