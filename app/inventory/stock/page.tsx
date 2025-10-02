import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StockMovement } from "@/components/inventory/stock-movement"

export default function StockMovementPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <StockMovement />
      </DashboardLayout>
    </AuthGuard>
  )
}
