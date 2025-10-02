import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PRReport } from "@/components/pr-report"

export default function PRReportPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <PRReport />
      </DashboardLayout>
    </AuthGuard>
  )
}


