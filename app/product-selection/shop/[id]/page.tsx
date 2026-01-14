import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProductDetail } from "@/components/product-detail"

export default function ProductDetailPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ProductDetail />
      </DashboardLayout>
    </AuthGuard>
  )
}






