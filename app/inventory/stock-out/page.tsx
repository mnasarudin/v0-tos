import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StockOutForm } from "@/components/inventory/stock-out-form"

export default function StockOutPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <StockOutForm />
      </DashboardLayout>
    </AuthGuard>
  )
}








