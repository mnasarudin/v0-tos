import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RoleTest } from "@/components/role-test"

export default function RoleTestPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <RoleTest />
      </DashboardLayout>
    </AuthGuard>
  )
}



































