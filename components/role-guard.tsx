"use client"

import type React from "react"
import { canAccessResource, hasPermission, type UserRole } from "@/lib/auth"
import { Shield, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface RoleGuardProps {
  children: React.ReactNode
  resource: string
  action: string
  fallback?: React.ReactNode
  showAccessDenied?: boolean
}

export function RoleGuard({ 
  children, 
  resource, 
  action, 
  fallback,
  showAccessDenied = false 
}: RoleGuardProps) {
  const hasAccess = canAccessResource(resource, action)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showAccessDenied) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Access Denied</p>
              <p className="text-sm text-muted-foreground">
                You don't have permission to {action} {resource}.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  return <>{children}</>
}

interface PermissionGuardProps {
  children: React.ReactNode
  permission: keyof typeof import("@/lib/auth").ROLE_PERMISSIONS.HOD
  fallback?: React.ReactNode
  showAccessDenied?: boolean
}

export function PermissionGuard({ 
  children, 
  permission, 
  fallback,
  showAccessDenied = false 
}: PermissionGuardProps) {
  const hasAccess = hasPermission(permission)

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    if (showAccessDenied) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Permission Required</p>
              <p className="text-sm text-muted-foreground">
                You don't have the required permission: {permission}.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  return <>{children}</>
}

// Utility component for conditional rendering based on role
interface RoleBasedRenderProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

export function RoleBasedRender({ 
  children, 
  allowedRoles, 
  fallback 
}: RoleBasedRenderProps) {
  const { getCurrentUser } = require("@/lib/auth")
  const user = getCurrentUser()
  
  if (!user || !allowedRoles.includes(user.role)) {
    return fallback ? <>{fallback}</> : null
  }

  return <>{children}</>
}



































