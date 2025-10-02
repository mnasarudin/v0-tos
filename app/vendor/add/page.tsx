import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VendorForm } from "@/components/vendor-form"

export default function VendorAddPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <VendorForm />
      </DashboardLayout>
    </AuthGuard>
  )
}








