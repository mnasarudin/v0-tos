import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VendorShop } from "@/components/vendor-shop"

export default function VendorShopPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <VendorShop />
      </DashboardLayout>
    </AuthGuard>
  )
}

























