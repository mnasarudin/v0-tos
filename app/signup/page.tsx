"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Mail, Lock, MapPin, Phone, Building2, UserCircle, GraduationCap, AlertCircle, Camera } from "lucide-react"
import { DEPARTMENTS } from "@/lib/auth"
import Link from "next/link"
import { detectFace } from "@/lib/face-recognition"
import { toast } from "sonner"

interface FormErrors {
  fullName?: string
  username?: string
  email?: string
  address?: string
  department?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  institution?: string
  lecturerContactName?: string
  lecturerContactPhone?: string
  phoneNumber?: string
  password?: string
  confirmPassword?: string
  profilePhoto?: string
}

interface TouchedFields {
  fullName?: boolean
  username?: boolean
  email?: boolean
  address?: boolean
  department?: boolean
  emergencyContactName?: boolean
  emergencyContactPhone?: boolean
  institution?: boolean
  lecturerContactName?: boolean
  lecturerContactPhone?: boolean
  phoneNumber?: boolean
  password?: boolean
  confirmPassword?: boolean
  profilePhoto?: boolean
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'verification'>('form')
  const [verificationCode, setVerificationCode] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [devCode, setDevCode] = useState('') // For development mode
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<TouchedFields>({})

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    address: "",
    department: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    institution: "",
    lecturerContactName: "",
    lecturerContactPhone: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    profilePhoto: "",
  })
  
  // Photo capture state
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string>("")
  const [capturing, setCapturing] = useState(false)
  const [faceDetected, setFaceDetected] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const validateField = (name: keyof typeof formData, value: string): string | undefined => {
    switch (name) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        break
      case 'username':
        if (!value.trim()) return 'Username is required'
        if (value.length < 3) return 'Username must be at least 3 characters'
        break
      case 'email':
        if (!value.trim()) return 'Email is required'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address'
        break
      case 'address':
        if (!value.trim()) return 'Address is required'
        break
      case 'department':
        if (!value.trim()) return 'Department is required'
        break
      case 'emergencyContactName':
        if (!value.trim()) return 'Emergency contact name is required'
        break
      case 'emergencyContactPhone':
        if (!value.trim()) return 'Emergency contact phone is required'
        if (!/^[0-9+\-\s()]+$/.test(value)) return 'Please enter a valid phone number'
        break
      case 'institution':
        if (!value.trim()) return 'Institution/University is required'
        break
      case 'lecturerContactName':
        if (!value.trim()) return 'Lecturer contact name is required'
        break
      case 'lecturerContactPhone':
        if (!value.trim()) return 'Lecturer contact phone is required'
        if (!/^[0-9+\-\s()]+$/.test(value)) return 'Please enter a valid phone number'
        break
      case 'phoneNumber':
        if (!value.trim()) return 'Phone number is required'
        if (!/^[0-9+\-\s()]+$/.test(value)) return 'Please enter a valid phone number'
        break
      case 'password':
        if (!value) return 'Password is required'
        if (value.length < 8) return 'Password must be at least 8 characters'
        if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) return 'Password must contain both letters and numbers'
        break
      case 'confirmPassword':
        if (!value) return 'Please confirm your password'
        if (value !== formData.password) return 'Passwords do not match. Please make sure both passwords are the same.'
        break
    }
    return undefined
  }

  const handleBlur = (name: keyof typeof formData) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const error = validateField(name, formData[name])
    setErrors(prev => ({ ...prev, [name]: error }))
  }

  const handleChange = (name: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
    // Validate on change if field has been touched
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors(prev => ({ ...prev, [name]: error }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const allFields: (keyof typeof formData)[] = [
      'fullName', 'username', 'email', 'address', 'department',
      'emergencyContactName', 'emergencyContactPhone', 'institution',
      'lecturerContactName', 'lecturerContactPhone', 'phoneNumber',
      'password', 'confirmPassword'
    ]

    allFields.forEach(field => {
      const error = validateField(field, formData[field])
      if (error) {
        newErrors[field] = error
      }
    })
    
    // Validate profile photo
    if (!formData.profilePhoto) {
      newErrors.profilePhoto = 'Profile photo is required for face recognition'
    }

    setErrors(newErrors)
    setTouched({
      fullName: true,
      username: true,
      email: true,
      address: true,
      department: true,
      emergencyContactName: true,
      emergencyContactPhone: true,
      institution: true,
      lecturerContactName: true,
      lecturerContactPhone: true,
      phoneNumber: true,
      password: true,
      confirmPassword: true,
    })

    return Object.keys(newErrors).length === 0
  }
  
  // Camera functions
  const startCamera = async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Camera is not available in your browser. Please use a modern browser with camera support.')
        return
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      })
      streamRef.current = stream
      setCameraActive(true)
      
      // Wait a bit for the video element to be rendered, then set stream
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(err => {
            console.error('Video play error:', err)
          })
        }
      }, 100)
    } catch (error: any) {
      console.error('Camera error:', error)
      let errorMessage = 'Failed to access camera. '
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage += 'Please allow camera permissions in your browser settings and try again.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage += 'No camera found. Please connect a camera and try again.'
      } else {
        errorMessage += error.message || 'Unknown error occurred.'
      }
      alert(errorMessage)
      setCameraActive(false)
    }
  }
  
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }
  
  const capturePhoto = async (): Promise<string> => {
    if (!videoRef.current || !canvasRef.current) return ""
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return ""
    
    const width = videoRef.current.videoWidth || 640
    const height = videoRef.current.videoHeight || 480
    
    canvasRef.current.width = width
    canvasRef.current.height = height
    ctx.drawImage(videoRef.current, 0, 0, width, height)
    
    return canvasRef.current.toDataURL('image/jpeg', 0.8)
  }
  
  const handleCapturePhoto = async () => {
    setCapturing(true)
    try {
      const photo = await capturePhoto()
      if (!photo) {
        alert('Failed to capture photo. Please try again.')
        setCapturing(false)
        return
      }
      
      // Try to detect face in captured photo (optional - models might not be available)
      let faceDetected = false
      try {
        const img = new Image()
        img.src = photo
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          setTimeout(reject, 5000) // 5 second timeout
        })
        
        const faceDetection = await detectFace(img)
        faceDetected = !!faceDetection
        
        if (!faceDetection) {
          // Ask user if they want to proceed without face detection
          const proceed = confirm('Face detection models are not available or no face was detected. You can still proceed, but face recognition during clock-in/out may not work. Do you want to use this photo anyway?')
          if (!proceed) {
            setCapturing(false)
            return
          }
        }
      } catch (faceError: any) {
        console.warn('Face detection error (continuing anyway):', faceError)
        // Models not available or face detection failed - allow user to proceed
        const proceed = confirm('Face detection is not available. You can still proceed, but face recognition during clock-in/out may not work. Do you want to use this photo anyway?')
        if (!proceed) {
          setCapturing(false)
          return
        }
      }
      
      // Save photo regardless of face detection result
      setCapturedPhoto(photo)
      setFormData(prev => ({ ...prev, profilePhoto: photo }))
      setFaceDetected(faceDetected)
      stopCamera()
    } catch (error: any) {
      console.error('Capture error:', error)
      alert('Failed to capture photo: ' + (error.message || 'Unknown error'))
      setFaceDetected(false)
    } finally {
      setCapturing(false)
    }
  }
  
  // Handle video stream when camera becomes active
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(err => {
        console.error('Video play error:', err)
      })
    }
  }, [cameraActive])
  
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        setUserEmail(formData.email)
        // Only show dev code if email was not sent (credentials not configured or error)
        if (data.devCode && data.emailNotSent) {
          setDevCode(data.devCode)
          console.log('🔑 Verification code (email not sent):', data.devCode)
        }
        setStep('verification')
      } else {
        const errorMessage = data.error || 'An error occurred. Please try again.'
        toast.error(errorMessage)
        setErrors({ email: errorMessage })
      }
    } catch (error) {
      console.error('Signup error:', error)
      const errorMessage = 'An error occurred. Please try again.'
      toast.error(errorMessage)
      setErrors({ email: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          code: verificationCode.trim(),
          userData: {
            fullName: formData.fullName,
            username: formData.username,
            address: formData.address,
            department: formData.department,
            emergencyContactName: formData.emergencyContactName,
            emergencyContactPhone: formData.emergencyContactPhone,
            institution: formData.institution,
            lecturerContactName: formData.lecturerContactName,
            lecturerContactPhone: formData.lecturerContactPhone,
            phoneNumber: formData.phoneNumber,
            password: formData.password,
            profilePhoto: formData.profilePhoto,
          },
        }),
      })

      // Check response status first
      if (!response.ok) {
        let errorMessage = 'Invalid or expired verification code. Please check the code and try again.'
        
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          // If we can't parse the error, use default message based on status
          if (response.status === 401) {
            errorMessage = 'Invalid or expired verification code. Please check the code and try again.'
          } else if (response.status === 400) {
            errorMessage = 'Email and verification code are required.'
          } else if (response.status === 409) {
            errorMessage = 'Email already registered. Please use a different email or login instead.'
          } else {
            errorMessage = `Verification failed (${response.status}). Please try again.`
          }
        }
        
        toast.error(errorMessage)
        setIsLoading(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        toast.success('Account created successfully! Welcome to Intern Attendance System :)')
        setTimeout(() => {
          router.push('/login?signup=success')
        }, 1500)
      } else {
        toast.error(data.error || 'Invalid verification code. Please try again.')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('An error occurred during verification. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (step === 'verification') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-turquoise-50 to-turquoise-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Mail className="h-6 w-6 text-primary" />
              Verify Your Email
            </CardTitle>
            <CardDescription>
              {devCode 
                ? `Email could not be sent. Please use the verification code below:`
                : `We've sent a verification code to ${userEmail}. Please check your email inbox (and spam folder).`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {devCode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
                <p className="font-semibold text-yellow-800">Email Not Sent</p>
                <p className="text-yellow-700">Verification code: <span className="font-mono font-bold text-lg">{devCode}</span></p>
                <p className="text-yellow-600 text-xs mt-1">Please enter this code to verify your email</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                maxLength={4}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 4-digit code"
                className="text-center text-2xl tracking-widest"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={isLoading || verificationCode.length !== 4}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>
            <div className="text-center text-sm text-gray-600">
              <button
                onClick={() => {
                  setStep('form')
                  setVerificationCode('')
                }}
                className="text-primary hover:underline"
              >
                Back to form
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-turquoise-50 to-turquoise-100 p-4 py-8">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <UserCircle className="h-6 w-6 text-primary" />
            Intern Sign Up
          </CardTitle>
          <CardDescription>
            Create your intern account. All fields are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  aria-invalid={touched.fullName && errors.fullName ? 'true' : 'false'}
                />
                {touched.fullName && errors.fullName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">
                  <User className="inline h-4 w-4 mr-1" />
                  Username *
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  onBlur={() => handleBlur('username')}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  autoComplete="username"
                  aria-invalid={touched.username && errors.username ? 'true' : 'false'}
                />
                {touched.username && errors.username && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Address *
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                  placeholder="Enter your address"
                  disabled={isLoading}
                  aria-invalid={touched.address && errors.address ? 'true' : 'false'}
                />
                {touched.address && errors.address && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.address}
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Department *
                </Label>
                <select
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  onBlur={() => handleBlur('department')}
                  disabled={isLoading}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                  aria-invalid={touched.department && errors.department ? 'true' : 'false'}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                {touched.department && errors.department && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.department}
                  </p>
                )}
              </div>

              {/* Emergency Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">
                  <User className="inline h-4 w-4 mr-1" />
                  Emergency Contact Name *
                </Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={(e) => handleChange('emergencyContactName', e.target.value)}
                  onBlur={() => handleBlur('emergencyContactName')}
                  placeholder="Parent/Guardian Name"
                  disabled={isLoading}
                  aria-invalid={touched.emergencyContactName && errors.emergencyContactName ? 'true' : 'false'}
                />
                {touched.emergencyContactName && errors.emergencyContactName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.emergencyContactName}
                  </p>
                )}
              </div>

              {/* Emergency Contact Phone */}
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Emergency Contact Phone *
                </Label>
                <Input
                  id="emergencyContactPhone"
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleChange('emergencyContactPhone', e.target.value)}
                  onBlur={() => handleBlur('emergencyContactPhone')}
                  placeholder="0123456789"
                  disabled={isLoading}
                  aria-invalid={touched.emergencyContactPhone && errors.emergencyContactPhone ? 'true' : 'false'}
                />
                {touched.emergencyContactPhone && errors.emergencyContactPhone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.emergencyContactPhone}
                  </p>
                )}
              </div>

              {/* Institution */}
              <div className="space-y-2">
                <Label htmlFor="institution">
                  <GraduationCap className="inline h-4 w-4 mr-1" />
                  Institution / University *
                </Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => handleChange('institution', e.target.value)}
                  onBlur={() => handleBlur('institution')}
                  placeholder="Universiti Teknologi Malaysia"
                  disabled={isLoading}
                  aria-invalid={touched.institution && errors.institution ? 'true' : 'false'}
                />
                {touched.institution && errors.institution && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.institution}
                  </p>
                )}
              </div>

              {/* Lecturer Contact Name */}
              <div className="space-y-2">
                <Label htmlFor="lecturerContactName">
                  <User className="inline h-4 w-4 mr-1" />
                  Lecturer Contact Name *
                </Label>
                <Input
                  id="lecturerContactName"
                  value={formData.lecturerContactName}
                  onChange={(e) => handleChange('lecturerContactName', e.target.value)}
                  onBlur={() => handleBlur('lecturerContactName')}
                  placeholder="Dr. Ahmad bin Abdullah"
                  disabled={isLoading}
                  aria-invalid={touched.lecturerContactName && errors.lecturerContactName ? 'true' : 'false'}
                />
                {touched.lecturerContactName && errors.lecturerContactName && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lecturerContactName}
                  </p>
                )}
              </div>

              {/* Lecturer Contact Phone */}
              <div className="space-y-2">
                <Label htmlFor="lecturerContactPhone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Lecturer Contact Phone *
                </Label>
                <Input
                  id="lecturerContactPhone"
                  type="tel"
                  value={formData.lecturerContactPhone}
                  onChange={(e) => handleChange('lecturerContactPhone', e.target.value)}
                  onBlur={() => handleBlur('lecturerContactPhone')}
                  placeholder="0123456789"
                  disabled={isLoading}
                  aria-invalid={touched.lecturerContactPhone && errors.lecturerContactPhone ? 'true' : 'false'}
                />
                {touched.lecturerContactPhone && errors.lecturerContactPhone && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.lecturerContactPhone}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number *
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', e.target.value)}
                  onBlur={() => handleBlur('phoneNumber')}
                  placeholder="0123456789"
                  disabled={isLoading}
                  aria-invalid={touched.phoneNumber && errors.phoneNumber ? 'true' : 'false'}
                />
                {touched.phoneNumber && errors.phoneNumber && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Your Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="your@email.com"
                  disabled={isLoading}
                  aria-invalid={touched.email && errors.email ? 'true' : 'false'}
                />
                {touched.email && errors.email && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-invalid={touched.password && errors.password ? 'true' : 'false'}
                />
                {touched.password && errors.password && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters with both letters and numbers
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Confirm Password *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  autoComplete="new-password"
                  aria-invalid={touched.confirmPassword && errors.confirmPassword ? 'true' : 'false'}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Photo Capture */}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  <Camera className="inline h-4 w-4 mr-1" />
                  Profile Photo (Required for Face Recognition) *
                </Label>
                <p className="text-sm text-gray-600">
                  Capture your photo for face recognition during clock-in/out
                </p>
                
                {!capturedPhoto ? (
                  <div className="space-y-3">
                    {!cameraActive ? (
                      <Button
                        type="button"
                        onClick={startCamera}
                        variant="outline"
                        className="w-full"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Start Camera
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                          <canvas ref={canvasRef} className="hidden" />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            onClick={handleCapturePhoto}
                            disabled={capturing}
                            className="flex-1"
                          >
                            {capturing ? 'Capturing...' : 'Capture Photo'}
                          </Button>
                          <Button
                            type="button"
                            onClick={stopCamera}
                            variant="outline"
                            disabled={capturing}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video">
                      <img
                        src={capturedPhoto}
                        alt="Captured profile photo"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={`flex items-center gap-2 text-sm ${faceDetected ? 'text-green-600' : 'text-yellow-600'}`}>
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        {faceDetected 
                          ? 'Photo captured successfully! Face detected.' 
                          : 'Photo captured successfully! (Face detection unavailable - photo will still be saved)'}
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        setCapturedPhoto("")
                        setFormData(prev => ({ ...prev, profilePhoto: "" }))
                        setFaceDetected(false)
                        startCamera()
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Retake Photo
                    </Button>
                  </div>
                )}
                
                {touched.profilePhoto && errors.profilePhoto && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.profilePhoto}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#008B8B] hover:bg-[#008B8B]/90"
              disabled={isLoading || !formData.profilePhoto}
            >
              {isLoading ? 'Processing...' : 'Continue to Verification'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
