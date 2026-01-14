"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { setCurrentUser, type UserRole } from "@/lib/auth"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<UserRole>("HOD")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (!email || !password) {
        toast({
          title: "Error",
          description: "Please fill in all fields",
          variant: "destructive",
        })
        return
      }

      // Simulate authentication API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Demo validation - accept any email with "password" as password
      if (password !== "password") {
        toast({
          title: "Authentication Failed",
          description: "Invalid credentials. Use 'password' as the password.",
          variant: "destructive",
        })
        return
      }

      // Store auth state with role
      setCurrentUser({
        email,
        name: email.split("@")[0],
        role,
        department: role === "HOD" ? "Head Office" : role === "AHOD" ? "Assistant Head Office" : role === "Staff" ? "Operations" : role === "Approval" ? "Finance" : "Procurement"
      })

      toast({
        title: "Success",
        description: "Successfully signed in! Redirecting to dashboard...",
      })

      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-11 pr-10"
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
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
            <option value="HOD">HOD (Head of Department)</option>
            <option value="AHOD">AHOD (Assistant Head of Department)</option>
            <option value="Staff">Staff</option>
            <option value="Approval">Approval</option>
            <option value="Maker">Maker</option>
          </Select>
        </div>
        <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in to Dashboard"
          )}
        </Button>
      </form>
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Demo: any email / password</p>
        <p className="text-xs text-muted-foreground mt-1">Select a role to test different permission levels</p>
      </div>
    </div>
  )
}
