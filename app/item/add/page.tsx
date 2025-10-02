import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemForm } from "@/components/item-form"

export default function ItemAddPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ItemForm />
      </DashboardLayout>
    </AuthGuard>
  )
}








