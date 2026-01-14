import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { GeneratePRForm } from "@/components/generate-pr-form"

export default function GeneratePRPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <GeneratePRForm />
      </DashboardLayout>
    </AuthGuard>
  )
}

