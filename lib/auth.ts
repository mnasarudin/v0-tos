// Simple authentication utilities for demo purposes
export type UserRole = "HOD" | "AHOD" | "Staff" | "Approval" | "Maker" | "Vendor"

export interface User {
  email: string
  name: string
  role: UserRole
  department?: string
}

export const ROLE_PERMISSIONS = {
  HOD: {
    canViewAll: true,
    canEditAll: true,
    canDeleteAll: true,
    canApprovePR: true,
    canExportPDF: true,
    canManageUsers: true,
    canViewReports: true,
    canCreatePR: true,
    canEditPR: true,
    canDeletePR: true,
  },
  AHOD: {
    canViewAll: false, // 只能查看自己部门的
    canEditAll: false, // 只能编辑自己部门的
    canDeleteAll: false,
    canApprovePR: true, // 可以审批
    canExportPDF: true,
    canManageUsers: false,
    canViewReports: true,
    canCreatePR: true,
    canEditPR: true,
    canDeletePR: false,
  },
  Staff: {
    canViewAll: false,
    canEditAll: false,
    canDeleteAll: false,
    canApprovePR: false,
    canExportPDF: false,
    canManageUsers: false,
    canViewReports: false,
    canCreatePR: true,
    canEditPR: false,
    canDeletePR: false,
  },
  Approval: {
    canViewAll: false, // 只能查看待审批的
    canEditAll: false,
    canDeleteAll: false,
    canApprovePR: true, // 只能审批
    canExportPDF: true,
    canManageUsers: false,
    canViewReports: false, // 审批人员不需要查看报告
    canCreatePR: false,
    canEditPR: false,
    canDeletePR: false,
  },
  Maker: {
    canViewAll: false,
    canEditAll: false,
    canDeleteAll: false,
    canApprovePR: false,
    canExportPDF: false,
    canManageUsers: false,
    canViewReports: false,
    canCreatePR: true,
    canEditPR: true,
    canDeletePR: false,
  },
  Vendor: {
    canViewAll: false,
    canEditAll: false,
    canDeleteAll: false,
    canApprovePR: false,
    canExportPDF: false,
    canManageUsers: false,
    canViewReports: false,
    canCreatePR: false,
    canEditPR: false,
    canDeletePR: false,
  },
} as const

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem("isAuthenticated") === "true"
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null
  const email = localStorage.getItem("userEmail")
  const role = localStorage.getItem("userRole") as UserRole
  const department = localStorage.getItem("userDepartment")
  
  if (!email || !role) return null

  return {
    email,
    name: email.split("@")[0],
    role,
    department: department || undefined,
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return
  localStorage.setItem("isAuthenticated", "true")
  localStorage.setItem("userEmail", user.email)
  localStorage.setItem("userRole", user.role)
  if (user.department) {
    localStorage.setItem("userDepartment", user.department)
  }
  // Dispatch custom event to notify components of auth change
  window.dispatchEvent(new Event("auth-changed"))
}

export function hasPermission(permission: keyof typeof ROLE_PERMISSIONS.admin): boolean {
  const user = getCurrentUser()
  if (!user) return false
  return ROLE_PERMISSIONS[user.role][permission]
}

export function canAccessResource(resource: string, action: string): boolean {
  const user = getCurrentUser()
  if (!user) return false

  // Define resource-specific permissions
  const resourcePermissions = {
    "pr": {
      "view": user.role === "HOD" || user.role === "AHOD" || user.role === "Approval",
      "edit": user.role === "HOD" || user.role === "AHOD" || user.role === "Maker",
      "delete": user.role === "HOD", // 只有HOD可以删除
      "approve": user.role === "HOD" || user.role === "AHOD" || user.role === "Approval",
      "export": user.role === "HOD" || user.role === "AHOD" || user.role === "Approval",
      "create": user.role === "HOD" || user.role === "AHOD" || user.role === "Staff" || user.role === "Maker",
    },
    "inventory": {
      "view": user.role === "HOD" || user.role === "AHOD", // 移除Approval，审批人员不需要查看库存
      "edit": user.role === "HOD" || user.role === "AHOD",
      "delete": user.role === "HOD", // 只有HOD可以删除
    },
    "items": {
      "view": user.role === "HOD" || user.role === "AHOD", // 移除Approval
      "edit": user.role === "HOD" || user.role === "AHOD",
      "delete": user.role === "HOD", // 只有HOD可以删除
    },
    "reports": {
      "view": user.role === "HOD" || user.role === "AHOD", // 移除Approval，审批人员不需要查看报告
      "export": user.role === "HOD" || user.role === "AHOD",
    },
    "vendor": {
      "view": user.role === "HOD" || user.role === "AHOD" || user.role === "Vendor",
      "edit": user.role === "HOD" || user.role === "AHOD",
      "create": user.role === "HOD" || user.role === "AHOD" || user.role === "Vendor",
    },
    "propenents": {
      "view": user.role === "HOD" || user.role === "AHOD" || user.role === "Staff" || user.role === "Approval" || user.role === "Maker" || user.role === "Vendor",
      "create": user.role === "HOD" || user.role === "AHOD" || user.role === "Staff" || user.role === "Approval" || user.role === "Maker" || user.role === "Vendor",
      "edit": user.role === "HOD" || user.role === "AHOD" || user.role === "Staff" || user.role === "Approval" || user.role === "Maker" || user.role === "Vendor",
    }
  }

  return resourcePermissions[resource as keyof typeof resourcePermissions]?.[action as keyof typeof resourcePermissions[keyof typeof resourcePermissions]] || false
}

export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("isAuthenticated")
  localStorage.removeItem("userEmail")
  localStorage.removeItem("userRole")
  localStorage.removeItem("userDepartment")
  // Dispatch custom event to notify components of auth change
  window.dispatchEvent(new Event("auth-changed"))
}
