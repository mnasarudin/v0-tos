import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { OrderDocumentApproval } from "@/components/order-document-approval"

export default function OrderDocumentApprovalPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <OrderDocumentApproval />
      </DashboardLayout>
    </AuthGuard>
  )
}

