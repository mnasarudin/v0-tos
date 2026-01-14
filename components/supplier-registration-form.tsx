"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { registerSupplier, type SupplierAccount } from "@/lib/supplier-auth"

export interface SupplierRegistration {
  id: string
  companyName: string
  ssmNumber?: string
  category: string
  contactName: string
  email: string
  password: string
  phone: string
  address: string
  city: string
  country: string
  website?: string
  businessDescription?: string
}

export function SupplierRegistrationForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [form, setForm] = useState<SupplierRegistration>({
    id: crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    companyName: "",
    category: "General",
    ssmNumber: "",
    contactName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    website: "",
    businessDescription: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")

  function handleChange<T extends keyof SupplierRegistration>(field: T, value: SupplierRegistration[T]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Basic validation
    if (!form.companyName || !form.contactName || !form.email || !form.password || !form.phone || !form.address) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Password validation
    if (form.password.length < 6) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      })
      return
    }

    if (form.password !== confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "destructive",
      })
      return
    }

    try {
      // Register supplier account
      const account: SupplierAccount = {
        ...form,
      }
      registerSupplier(account)

      toast({
        title: "Registration Successful!",
        description: "Your account has been created. Redirecting to your profile...",
      })

      // Redirect to supplier profile
      setTimeout(() => {
        router.push("/supplier/profile")
      }, 1000)
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "This email is already registered.",
        variant: "destructive",
      })
    }
  }


  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Register as Supplier</h1>
        <p className="text-muted-foreground">
          Fill out the form below to create your supplier account. You'll be able to manage your profile and add items after registration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="companyName">
                  Company Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={e => handleChange("companyName", e.target.value)}
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="ssmNumber">SSM Number</Label>
                <Input
                  id="ssmNumber"
                  value={form.ssmNumber || ""}
                  onChange={e => handleChange("ssmNumber", e.target.value)}
                  placeholder="e.g. 202401234567"
                />
              </div>

              <div>
                <Label htmlFor="category">
                  Business Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  id="category"
                  value={form.category}
                  onChange={e => handleChange("category", e.target.value)}
                  required
                >
                  <option value="General">General</option>
                  <option value="Office">Office Supplies</option>
                  <option value="Industrial">Industrial Equipment</option>
                  <option value="IT">IT & Technology</option>
                  <option value="Logistics">Logistics & Transportation</option>
                  <option value="Services">Professional Services</option>
                  <option value="Construction">Construction Materials</option>
                  <option value="Food">Food & Beverages</option>
                </Select>
              </div>

              <div>
                <Label htmlFor="contactName">
                  Contact Person Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactName"
                  value={form.contactName}
                  onChange={e => handleChange("contactName", e.target.value)}
                  placeholder="Enter contact person name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={e => handleChange("email", e.target.value)}
                  placeholder="company@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={e => handleChange("password", e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirmPassword">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={e => handleChange("phone", e.target.value)}
                  placeholder="+60 12-345 6789"
                  required
                />
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={form.website || ""}
                  onChange={e => handleChange("website", e.target.value)}
                  placeholder="https://www.example.com"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">
                  Business Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={e => handleChange("address", e.target.value)}
                  placeholder="Street address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city">
                  City <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={e => handleChange("city", e.target.value)}
                  placeholder="Enter city"
                  required
                />
              </div>

              <div>
                <Label htmlFor="country">
                  Country <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="country"
                  value={form.country}
                  onChange={e => handleChange("country", e.target.value)}
                  placeholder="Enter country"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="businessDescription">Business Description</Label>
                <textarea
                  id="businessDescription"
                  value={form.businessDescription || ""}
                  onChange={e => handleChange("businessDescription", e.target.value)}
                  placeholder="Brief description of your business and services..."
                  className="w-full min-h-[100px] px-3 py-2 text-sm border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.push("/")}>
                Cancel
              </Button>
              <Button type="submit">Submit Registration</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

