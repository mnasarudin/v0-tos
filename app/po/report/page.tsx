import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { POReport } from "@/components/po-report"

export default function POReportPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <POReport />
      </DashboardLayout>
    </AuthGuard>
  )
}




