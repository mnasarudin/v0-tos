import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OrderDocumentWorkflow } from "@/components/order-document-workflow"

export default function OrderDocumentWorkflowPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <OrderDocumentWorkflow />
      </DashboardLayout>
    </AuthGuard>
  )
}

