"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { getCurrentUser } from "@/lib/auth"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { Edit2, Save, X, Eye, EyeOff } from "lucide-react"

export function ProfileEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState<any>({})
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          // Fetch full user data from API
          const response = await fetch(`/api/users/${currentUser.id}`)
          const data = await response.json()
          
          if (data.success && data.user) {
            setUser(data.user)
            setFormData({
              fullName: data.user.fullName || '',
              email: data.user.email || '',
              username: data.user.username || '',
              phoneNumber: data.user.phoneNumber || '',
              address: data.user.address || '',
              emergencyContactName: data.user.emergencyContactName || '',
              emergencyContactPhone: data.user.emergencyContactPhone || '',
              institution: data.user.institution || '',
              lecturerContactName: data.user.lecturerContactName || '',
              lecturerContactPhone: data.user.lecturerContactPhone || '',
              department: data.user.department || ''
            })
          } else {
            // Fallback to currentUser from localStorage
            setUser(currentUser)
            setFormData({
              fullName: currentUser.fullName || '',
              email: currentUser.email || '',
              username: currentUser.username || '',
              phoneNumber: currentUser.phoneNumber || '',
              address: currentUser.address || '',
              emergencyContactName: currentUser.emergencyContactName || '',
              emergencyContactPhone: currentUser.emergencyContactPhone || '',
              institution: currentUser.institution || '',
              lecturerContactName: currentUser.lecturerContactName || '',
              lecturerContactPhone: currentUser.lecturerContactPhone || '',
              department: currentUser.department || ''
            })
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()
      if (data.success) {
        toast.success('Profile updated successfully')
        setIsEditing(false)
        // Update user state
        if (data.user) {
          setUser(data.user)
          // Update localStorage
          try {
            localStorage.setItem('currentUser', JSON.stringify(data.user))
            if (typeof sessionStorage !== 'undefined') {
              sessionStorage.setItem('currentUser', JSON.stringify(data.user))
            }
          } catch (e) {}
        }
      } else {
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Error updating profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to original user data
    setFormData({
      fullName: user?.fullName || '',
      email: user?.email || '',
      username: user?.username || '',
      phoneNumber: user?.phoneNumber || '',
      address: user?.address || '',
      emergencyContactName: user?.emergencyContactName || '',
      emergencyContactPhone: user?.emergencyContactPhone || '',
      institution: user?.institution || '',
      lecturerContactName: user?.lecturerContactName || '',
      lecturerContactPhone: user?.lecturerContactPhone || '',
      department: user?.department || ''
    })
    setIsEditing(false)
    setShowPasswordSection(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
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
      
      // Update password using the API
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
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  if (!user) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="text-center py-8">
            <p className="text-gray-600">User not found</p>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">My Profile</h1>
              <p className="text-muted-foreground">Update your profile information</p>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" className="gap-2">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.fullName || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.email || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                      Address
                    </Label>
                    {isEditing ? (
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.address || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName" className="text-sm font-medium text-gray-700">
                      Emergency Contact Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.emergencyContactName || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="institution" className="text-sm font-medium text-gray-700">
                      University/Institution
                    </Label>
                    {isEditing ? (
                      <Input
                        id="institution"
                        value={formData.institution}
                        onChange={(e) => handleChange('institution', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.institution || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lecturerContactPhone" className="text-sm font-medium text-gray-700">
                      Lecturer Phone
                    </Label>
                    {isEditing ? (
                      <Input
                        id="lecturerContactPhone"
                        value={formData.lecturerContactPhone}
                        onChange={(e) => handleChange('lecturerContactPhone', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.lecturerContactPhone || '-'}</p>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    {isEditing ? (
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleChange('username', e.target.value)}
                        disabled={true}
                        className="bg-gray-50"
                      />
                    ) : (
                      <p className="text-gray-900">{user.username || '-'}</p>
                    )}
                    {isEditing && (
                      <p className="text-xs text-muted-foreground">Username cannot be changed</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                      Phone Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.phoneNumber || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone" className="text-sm font-medium text-gray-700">
                      Emergency Contact Phone
                    </Label>
                    {isEditing ? (
                      <Input
                        id="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.emergencyContactPhone || '-'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lecturerContactName" className="text-sm font-medium text-gray-700">
                      Lecturer Name
                    </Label>
                    {isEditing ? (
                      <Input
                        id="lecturerContactName"
                        value={formData.lecturerContactName}
                        onChange={(e) => handleChange('lecturerContactName', e.target.value)}
                        className={isEditing ? '' : 'bg-gray-50'}
                      />
                    ) : (
                      <p className="text-gray-900">{user.lecturerContactName || '-'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Change Section - Only shown when editing */}
              {isEditing && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Change Password</h3>
                      <p className="text-sm text-muted-foreground">Enter your current password and create a new one</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowPasswordSection(!showPasswordSection)
                        if (showPasswordSection) {
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          })
                        }
                      }}
                    >
                      {showPasswordSection ? 'Cancel' : 'Change Password'}
                    </Button>
                  </div>

                  {showPasswordSection && (
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPasswords.current ? 'text' : 'password'}
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                            placeholder="Enter your current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          >
                            {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showPasswords.new ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                            placeholder="Enter new password (min 8 chars, letters & numbers)"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          >
                            {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Password must be at least 8 characters and contain both letters and numbers
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                            placeholder="Confirm your new password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          >
                            {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={handleChangePassword}
                        disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="w-full"
                      >
                        {changingPassword ? 'Changing Password...' : 'Update Password'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
