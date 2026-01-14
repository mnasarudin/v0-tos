import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProductSelection } from "@/components/product-selection"

export default function ProductSelectionPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ProductSelection />
      </DashboardLayout>
    </AuthGuard>
  )
}

