import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VendorList } from "@/components/vendor-list"

export default function VendorListPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <VendorList />
      </DashboardLayout>
    </AuthGuard>
  )
}








