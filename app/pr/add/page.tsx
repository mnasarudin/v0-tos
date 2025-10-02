import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AddPRForm } from "@/components/add-pr-form"

export default function AddPRPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <AddPRForm />
      </DashboardLayout>
    </AuthGuard>
  )
}


