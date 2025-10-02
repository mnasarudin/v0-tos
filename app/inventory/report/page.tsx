import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { InventoryReport } from "@/components/inventory/inventory-report"

export default function InventoryReportPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <InventoryReport />
      </DashboardLayout>
    </AuthGuard>
  )
}








