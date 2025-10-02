import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddPOForm } from "@/components/add-po-form"

export default function AddPOPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <AddPOForm />
      </DashboardLayout>
    </AuthGuard>
  )
}




