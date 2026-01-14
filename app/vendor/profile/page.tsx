import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VendorProfile } from "@/components/vendor-profile"

export default function VendorProfilePage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <VendorProfile />
      </DashboardLayout>
    </AuthGuard>
  )
}




















