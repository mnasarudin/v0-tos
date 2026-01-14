import { SupplierRegistrationForm } from "@/components/supplier-registration-form"
import { CorporateHeader } from "@/components/corporate-header"

export default function SupplierRegisterPage() {
  return (
    <div className="min-h-screen bg-background">
      <CorporateHeader />
      <main>
        <SupplierRegistrationForm />
      </main>
    </div>
  )
}





















