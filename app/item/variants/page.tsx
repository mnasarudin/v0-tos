import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ItemVariants } from "@/components/item-variants"

export default function ItemVariantsPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ItemVariants />
      </DashboardLayout>
    </AuthGuard>
  )
}
