import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemReport } from "@/components/item-report"

export default function ItemReportPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ItemReport />
      </DashboardLayout>
    </AuthGuard>
  )
}








