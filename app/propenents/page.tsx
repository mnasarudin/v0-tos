import { AuthGuard } from "@/components/auth-guard"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function PropenentsHomePage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Propenents</h2>
          <p className="text-muted-foreground">Manage your vendor/business registration.</p>
          <Link href="/propenents/register">
            <Button>Register Your Business</Button>
          </Link>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

























