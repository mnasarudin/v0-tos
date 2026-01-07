"use client"

import { useState, useEffect } from 'react'
import { AdminGuard } from '@/components/auth-guard'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit2, Save, X } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'

export default function AdminProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    phoneNumber: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUser()
      if (currentUser) {
        // Fetch full user data from API
        const response = await fetch(`/api/auth/me`)
        const data = await response.json()
        
        if (data.success && data.user) {
          setUser(data.user)
          setFormData({
            fullName: data.user.fullName || '',
            email: data.user.email || '',
            username: data.user.username || '',
            phoneNumber: data.user.phoneNumber || ''
          })
        } else {
          // Fallback to currentUser from localStorage
          setUser(currentUser)
          setFormData({
            fullName: currentUser.fullName || '',
            email: currentUser.email || '',
            username: currentUser.username || '',
            phoneNumber: currentUser.phoneNumber || ''
          })
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      username: user?.username || '',
      phoneNumber: user?.phoneNumber || ''
    })
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!user) return

    // Validate required fields
    if (!formData.fullName.trim()) {
      toast.error('Full name is required')
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email is required')
      return
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Invalid email format')
      return
    }

    if (!formData.username.trim()) {
      toast.error('Username is required')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        // Update user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentUser', JSON.stringify(data.user))
        }
        
        setUser(data.user)
        setIsEditing(false)
        toast.success('Profile updated successfully')
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('An error occurred while updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleChangePassword = async () => {
    // Validate password fields
    if (!passwordData.currentPassword) {
      toast.error('Current password is required')
      return
    }

    if (!passwordData.newPassword) {
      toast.error('New password is required')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    if (!/[a-zA-Z]/.test(passwordData.newPassword) || !/[0-9]/.test(passwordData.newPassword)) {
      toast.error('New password must contain both letters and numbers')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirm password do not match')
      return
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      toast.error('New password must be different from current password')
      return
    }

    try {
      setChangingPassword(true)
      
      // First verify current password by attempting login
      const verifyResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user?.username,
          password: passwordData.currentPassword
        })
      })

      const verifyData = await verifyResponse.json()
      
      if (!verifyData.success) {
        toast.error('Current password is incorrect')
        return
      }

      // Update password
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Password changed successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordSection(false)
      } else {
        toast.error(data.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('An error occurred while changing password')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </AdminLayout>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Profile</h1>
              <p className="text-sm text-gray-600 mt-1">Update your administrator contact details</p>
            </div>
            {!isEditing && (
              <Button onClick={handleEdit} className="bg-[#008B8B] hover:bg-[#006666] text-white">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>

          {/* Profile Form */}
          <Card className="border-[#008B8B]/20">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? '' : 'bg-gray-50'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? '' : 'bg-gray-50'}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? '' : 'bg-gray-50'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange('phoneNumber', e.target.value)}
                      disabled={!isEditing}
                      className={isEditing ? '' : 'bg-gray-50'}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex items-center justify-end gap-2 mt-6 pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-[#008B8B] hover:bg-[#006666] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password Section */}
          <Card className="border-[#008B8B]/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Change Password</CardTitle>
                {!showPasswordSection && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordSection(true)}
                  >
                    Change Password
                  </Button>
                )}
              </div>
            </CardHeader>
            {showPasswordSection && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                    Current Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter your new password"
                  />
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters with both letters and numbers
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordSection(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    disabled={changingPassword}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="bg-[#008B8B] hover:bg-[#006666] text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
