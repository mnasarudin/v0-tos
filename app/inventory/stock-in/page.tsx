import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StockInForm } from "@/components/inventory/stock-in-form"

export default function StockInPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <StockInForm />
      </DashboardLayout>
    </AuthGuard>
  )
}








