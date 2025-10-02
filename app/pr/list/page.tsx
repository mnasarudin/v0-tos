import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PRList } from "@/components/pr-list"

export default function PRListPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <PRList />
      </DashboardLayout>
    </AuthGuard>
  )
}


