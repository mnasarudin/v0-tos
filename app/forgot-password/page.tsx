"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Mail, ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request')
  const [verificationCode, setVerificationCode] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [devCode, setDevCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      // Check response status first
      if (!response.ok) {
        let errorMessage = 'Failed to send reset code. Please try again.'
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          if (response.status === 404) {
            errorMessage = 'Email address does not match any account. Please check your email and try again.'
          } else if (response.status === 400) {
            errorMessage = 'Invalid email format. Please enter a valid email address.'
          } else {
            errorMessage = `Failed to send reset code (${response.status}). Please try again.`
          }
        }
        
        toast.error(errorMessage)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        setUserEmail(email.trim().toLowerCase())
        if (data.devCode && data.emailNotSent) {
          setDevCode(data.devCode)
        }
        setStep('verify')
        toast.success('Password reset code sent to your email!')
      } else {
        toast.error(data.error || 'Failed to send reset code. Please try again.')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!verificationCode || verificationCode.length !== 4) {
      toast.error('Please enter a 4-digit verification code')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          code: verificationCode.trim(),
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Invalid or expired verification code. Please try again.'
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          if (response.status === 401) {
            errorMessage = 'Invalid or expired verification code. Please try again.'
          } else if (response.status === 404) {
            errorMessage = 'User not found. Please check your email address.'
          }
        }
        
        toast.error(errorMessage)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        setStep('reset')
        toast.success('Code verified! Please set your new password.')
      } else {
        toast.error(data.error || 'Failed to verify code. Please try again.')
      }
    } catch (error) {
      console.error('Verify code error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      toast.error('Please enter both password fields')
      return
    }

    if (newPassword.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(newPassword)) {
      toast.error('Password must be at least 8 characters with both letters and numbers')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match. Please make sure both passwords are the same.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          code: verificationCode.trim(),
          newPassword: newPassword,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to reset password. Please try again.'
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          if (response.status === 401) {
            errorMessage = 'Verification code expired. Please request a new code.'
          } else if (response.status === 400) {
            errorMessage = 'Invalid password. Password must be at least 8 characters with both letters and numbers.'
          }
        }
        
        toast.error(errorMessage)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        toast.success('Password reset successful! Please login with your new password.')
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        toast.error(data.error || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-turquoise-50 to-turquoise-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Mail className="h-6 w-6 text-primary" />
              Verify Code
            </CardTitle>
            <CardDescription>
              {devCode 
                ? `Email could not be sent. Please use the verification code below:`
                : `We've sent a password reset code to ${userEmail}. Please check your email inbox (and spam folder).`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {devCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                <p className="font-semibold text-yellow-800">Email Not Sent</p>
                <p className="text-yellow-700">Reset code: <span className="font-mono font-bold text-lg">{devCode}</span></p>
                <p className="text-yellow-600 text-xs mt-1">Please enter this code to verify</p>
              </div>
            )}
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  maxLength={4}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 4-digit code"
                  disabled={isLoading}
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || verificationCode.length !== 4}
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('request')
                    setVerificationCode('')
                    setDevCode('')
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Back to email entry
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'reset') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-turquoise-50 to-turquoise-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Lock className="h-6 w-6 text-primary" />
              Set New Password
            </CardTitle>
            <CardDescription>
              Please enter your new password below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
                <p className="text-xs text-gray-500">Must be at least 8 characters with both letters and numbers</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                  autoComplete="new-password"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? "Resetting Password..." : "Reset Password"}
              </Button>

              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep('verify')
                    setNewPassword('')
                    setConfirmPassword('')
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Back to code verification
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-turquoise-50 to-turquoise-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Mail className="h-6 w-6 text-primary" />
            Forgot Password
          </CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a code to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={isLoading}
                autoComplete="email"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>

            <div className="text-center text-sm">
              <Link href="/login" className="text-primary hover:underline font-medium flex items-center justify-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

