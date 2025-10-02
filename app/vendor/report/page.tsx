import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VendorReport } from "@/components/vendor-report"

export default function VendorReportPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <VendorReport />
      </DashboardLayout>
    </AuthGuard>
  )
}








