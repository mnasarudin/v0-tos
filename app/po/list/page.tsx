import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { POList } from "@/components/po-list"

export default function POListPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <POList />
      </DashboardLayout>
    </AuthGuard>
  )
}




