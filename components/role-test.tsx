"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCurrentUser, canAccessResource, hasPermission } from "@/lib/auth"
import { RoleGuard, PermissionGuard } from "@/components/role-guard"
import { Eye, Edit, Trash2, Plus, Download } from "lucide-react"

export function RoleTest() {
  const [user, setUser] = useState(getCurrentUser())

  useEffect(() => {
    const interval = setInterval(() => {
      setUser(getCurrentUser())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (!user) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Role Permission Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Badge className="bg-blue-100 text-blue-800">
              Current Role: {user.role}
            </Badge>
            <Badge variant="outline">
              Department: {user.department}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">PR Permissions</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span>View PR:</span>
                  <Badge variant={canAccessResource("pr", "view") ? "default" : "secondary"}>
                    {canAccessResource("pr", "view") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Create PR:</span>
                  <Badge variant={canAccessResource("pr", "create") ? "default" : "secondary"}>
                    {canAccessResource("pr", "create") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Edit PR:</span>
                  <Badge variant={canAccessResource("pr", "edit") ? "default" : "secondary"}>
                    {canAccessResource("pr", "edit") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Delete PR:</span>
                  <Badge variant={canAccessResource("pr", "delete") ? "default" : "secondary"}>
                    {canAccessResource("pr", "delete") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Approve PR:</span>
                  <Badge variant={canAccessResource("pr", "approve") ? "default" : "secondary"}>
                    {canAccessResource("pr", "approve") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Export PDF:</span>
                  <Badge variant={canAccessResource("pr", "export") ? "default" : "secondary"}>
                    {canAccessResource("pr", "export") ? "✅" : "❌"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Other Resources</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span>View Inventory:</span>
                  <Badge variant={canAccessResource("inventory", "view") ? "default" : "secondary"}>
                    {canAccessResource("inventory", "view") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Edit Inventory:</span>
                  <Badge variant={canAccessResource("inventory", "edit") ? "default" : "secondary"}>
                    {canAccessResource("inventory", "edit") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>View Items:</span>
                  <Badge variant={canAccessResource("items", "view") ? "default" : "secondary"}>
                    {canAccessResource("items", "view") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Edit Items:</span>
                  <Badge variant={canAccessResource("items", "edit") ? "default" : "secondary"}>
                    {canAccessResource("items", "edit") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>View Reports:</span>
                  <Badge variant={canAccessResource("reports", "view") ? "default" : "secondary"}>
                    {canAccessResource("reports", "view") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Export Reports:</span>
                  <Badge variant={canAccessResource("reports", "export") ? "default" : "secondary"}>
                    {canAccessResource("reports", "export") ? "✅" : "❌"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">System Permissions</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span>View All:</span>
                  <Badge variant={hasPermission("canViewAll") ? "default" : "secondary"}>
                    {hasPermission("canViewAll") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Edit All:</span>
                  <Badge variant={hasPermission("canEditAll") ? "default" : "secondary"}>
                    {hasPermission("canEditAll") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Delete All:</span>
                  <Badge variant={hasPermission("canDeleteAll") ? "default" : "secondary"}>
                    {hasPermission("canDeleteAll") ? "✅" : "❌"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span>Manage Users:</span>
                  <Badge variant={hasPermission("canManageUsers") ? "default" : "secondary"}>
                    {hasPermission("canManageUsers") ? "✅" : "❌"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Action Buttons</h4>
              <div className="space-y-2">
                <RoleGuard resource="pr" action="view">
                  <Button size="sm" variant="outline" className="w-full">
                    <Eye className="w-4 h-4 mr-2" />
                    View PR
                  </Button>
                </RoleGuard>
                <RoleGuard resource="pr" action="create">
                  <Button size="sm" variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Create PR
                  </Button>
                </RoleGuard>
                <RoleGuard resource="pr" action="edit">
                  <Button size="sm" variant="outline" className="w-full">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit PR
                  </Button>
                </RoleGuard>
                <RoleGuard resource="pr" action="delete">
                  <Button size="sm" variant="outline" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete PR
                  </Button>
                </RoleGuard>
                <RoleGuard resource="pr" action="export">
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                  </Button>
                </RoleGuard>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Permission Guards</h4>
              <div className="space-y-2">
                <PermissionGuard permission="canViewAll">
                  <Button size="sm" variant="default" className="w-full">
                    View All Data
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="canEditAll">
                  <Button size="sm" variant="default" className="w-full">
                    Edit All Data
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="canApprovePR">
                  <Button size="sm" variant="default" className="w-full">
                    Approve PRs
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="canManageUsers">
                  <Button size="sm" variant="default" className="w-full">
                    Manage Users
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
