import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { VendorForm } from "@/components/vendor-form"

export default function PropenentsRegisterPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Register Your Business</h2>
            <p className="text-muted-foreground">Provide your company details to register as a vendor.</p>
          </div>
          <VendorForm />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

























