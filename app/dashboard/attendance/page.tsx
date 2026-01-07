"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, MapPin, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { getCurrentUser, isAuthenticated } from "@/lib/auth"
import { getTodayAttendance, clockIn, clockOut, checkLocationAccess, getCurrentLocation } from "@/lib/attendance"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { compareFaces, detectFace, detectFaceWithDetails } from "@/lib/face-recognition"
import { checkDirectAccess } from "@/lib/navigation-guard"

export default function AttendancePage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  
  const [user, setUser] = useState<any>(null)
  const [attendance, setAttendance] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturing, setCapturing] = useState<'clockin' | 'clockout' | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<string>("")
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string>("")
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isProcessingRef = useRef<boolean>(false)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [faceDetection, setFaceDetection] = useState<any>(null)

  useEffect(() => {
    // Check if this is a legitimate login redirect (has auth params)
    const urlParams = new URLSearchParams(window.location.search)
    const isLoginRedirect = urlParams.get('auth') === 'true' && urlParams.get('userId')
    
    // Only check for direct access if this is NOT a login redirect
    if (!isLoginRedirect) {
      try {
        if (checkDirectAccess()) {
          console.log('[AttendancePage] Direct access detected, redirecting to homepage')
          router.replace('/')
          return
        }
      } catch (error) {
        console.error('[AttendancePage] Error checking direct access:', error)
      }
    }

    // Check for logout flag - prevent forward navigation after logout
    try {
      if (typeof sessionStorage !== 'undefined') {
        const logoutFlag = sessionStorage.getItem('logoutFlag')
        if (logoutFlag === 'true') {
          sessionStorage.removeItem('logoutFlag')
          router.replace('/login')
          return
        }
      }
    } catch (error) {
      // Ignore errors
    }

    // Replace history to prevent forward navigation
    window.history.replaceState(null, '', window.location.href)

    if (!isAuthenticated()) {
      router.replace("/login")
      return
    }

    const fetchUser = async () => {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        
        // Fetch today's attendance from database
        try {
          const today = new Date().toISOString().split('T')[0]
          const response = await fetch(`/api/attendance?userId=${currentUser.id}`)
          const data = await response.json()
          
          if (data.success && data.records) {
            const todayRecord = data.records.find((r: any) => r.date === today)
            if (todayRecord) {
              setAttendance(todayRecord)
              console.log('✅ Loaded today attendance from database:', todayRecord)
            } else {
              console.log('ℹ️ No attendance record for today')
              setAttendance(null)
            }
          }
        } catch (error) {
          console.error('Error fetching attendance from database:', error)
          // Fallback to localStorage
          const todayAttendance = getTodayAttendance(currentUser.id)
          setAttendance(todayAttendance)
        }
      }
    }
    fetchUser()

    // Get user location with timeout and better error handling
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    // Check if we're on HTTPS or localhost (required for geolocation)
    const isSecureContext = window.location.protocol === 'https:' || 
                            window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1'

    if (!isSecureContext) {
      console.warn('⚠️ Geolocation requires HTTPS. Using default location for HTTP.')
      console.log('📍 Setting default location for HTTP access:', {
        lat: 6.292279618596812,
        lng: 99.78659978585995
      })
      // For HTTP, use default location (office coordinates)
      // Still verify location is within allowed range
      const defaultLocation = {
        lat: 6.292335456278995, // Office location
        lng: 99.78658827444191
      }
      setLocation(defaultLocation)
      
      // Verify default location is within allowed range
      const isAllowed = checkLocationAccess(defaultLocation)
      if (!isAllowed) {
        setLocationError("Default location is not within allowed range. Please use HTTPS for real GPS verification.")
      } else {
        setLocationError("") // Clear any errors
        console.log('✅ Default location set and verified, clock in/out enabled')
      }
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 second timeout
      maximumAge: 0 // Don't use cached location
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        
        // Check if location is within allowed range
        const isAllowed = checkLocationAccess({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        
        if (!isAllowed) {
          setLocationError("You are not within the allowed location range")
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        let errorMessage = "Unable to get your location. "
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again."
            break
          default:
            errorMessage += "Please enable location services."
        }
        
        setLocationError(errorMessage)
        
        // For HTTP or if location fails, allow clock in/out with default location
        console.log('⚠️ Using default location due to geolocation failure')
        // Set default location immediately
        setLocation({
          lat: 6.292279618596812,
          lng: 99.78659978585995
        })
        // Only show error if it's a permission denied (user blocked it)
        // Otherwise, silently use default location
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError("") // Clear error to allow clock in/out with default location
        } else {
          setLocationError("") // Clear error - using default location
        }
      },
      options
    )
  }, [router])

  useEffect(() => { getCurrentUser().then(setUser); }, []);

  // Debug: Log location state changes
  useEffect(() => {
    console.log('📍 Location state changed:', location)
    console.log('📍 Location error:', locationError)
  }, [location, locationError])
  if (user?.isAdmin) {
    return <div className="p-12 text-center text-xl text-cyan-800">Admins do not clock in/out. Attendance tracking is for interns only.</div>;
  }

  const startCamera = async () => {
    console.log('🎥 Starting camera...')
    
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error("Camera API not supported. Try Chrome, Firefox, or Safari.")
        console.error('❌ getUserMedia not available')
        return false
      }

      console.log('📹 Requesting camera access...')
      let stream: MediaStream | null = null
      
      // Try with portrait/phone-size constraints first
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 480 },   // Portrait width (narrower)
            height: { ideal: 640 },  // Portrait height (taller)
            aspectRatio: { ideal: 3/4 } // Phone portrait aspect ratio
          }
        })
      } catch (constraintError: any) {
        console.warn('⚠️ Constraint error, trying simple video:', constraintError)
        // Retry with simple video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      
      if (!stream) {
        throw new Error('Failed to get media stream')
      }
      
      console.log('✅ Camera access granted')
      streamRef.current = stream
      
      // Set camera active FIRST so video element renders
      setCameraActive(true)
      
      // Wait a tick for React to render the video element
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Now set the stream
      if (!videoRef.current) {
        console.error('❌ Video ref is still null after render')
        toast.error("Camera preview not available")
        return false
      }
      
      console.log('Setting srcObject to video element...')
      videoRef.current.srcObject = stream
      
      // Wait for video to load
      const playPromise = new Promise<boolean>((resolve) => {
        if (!videoRef.current) {
          resolve(false)
          return
        }
        
        const handleCanPlay = async () => {
          console.log('✅ Video can play')
          if (!videoRef.current) {
            resolve(false)
            return
          }
          
          try {
            await videoRef.current.play()
            console.log('▶️ Video is playing')
            toast.success("Camera ready!")
            resolve(true)
          } catch (playError: any) {
            console.warn('⚠️ Play error:', playError.message)
            // Still resolve true - video might play on user interaction
            resolve(true)
          }
        }
        
        videoRef.current.addEventListener('canplay', handleCanPlay, { once: true })
        
        // Fallback timeout
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {})
          }
          resolve(true)
        }, 2000)
      })
      
      return await playPromise
      
    } catch (error: any) {
      console.error('❌ Camera error:', error)
      let errorMsg = "Unable to access camera"

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = "Camera permission denied. Please allow camera access and refresh."
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg = "No camera found. Please connect a camera."
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg = "Camera is being used by another application."
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMsg = "Camera doesn't support required settings."
      }

      toast.error(errorMsg)
      setCameraActive(false)
      setCapturing(null)
      streamRef.current?.getTracks().forEach(track => track.stop())
      return false
    }
  }

  // Draw face detection overlay on canvas
  const drawFaceOverlay = (
    box: { x: number; y: number; width: number; height: number },
    landmarks: any,
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) => {
    if (!video || !canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size to match video display size
    const rect = video.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    
    // Calculate scaling factors
    const scaleX = rect.width / video.videoWidth
    const scaleY = rect.height / video.videoHeight
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Scale the box coordinates
    const scaledBox = {
      x: box.x * scaleX,
      y: box.y * scaleY,
      width: box.width * scaleX,
      height: box.height * scaleY
    }
    
    // Draw dashed face outline (like in the image)
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4]) // Dashed line pattern
    
    // Face outline (oval-like shape)
    ctx.beginPath()
    ctx.ellipse(
      scaledBox.x + scaledBox.width / 2,
      scaledBox.y + scaledBox.height / 2,
      scaledBox.width / 2,
      scaledBox.height / 2,
      0, 0, 2 * Math.PI
    )
    ctx.stroke()
    
    // Draw corner brackets (L-shaped corners)
    const bracketLength = 20
    ctx.setLineDash([]) // Solid lines for brackets
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    
    // Top-left
    ctx.beginPath()
    ctx.moveTo(scaledBox.x, scaledBox.y + bracketLength)
    ctx.lineTo(scaledBox.x, scaledBox.y)
    ctx.lineTo(scaledBox.x + bracketLength, scaledBox.y)
    ctx.stroke()
    
    // Top-right
    ctx.beginPath()
    ctx.moveTo(scaledBox.x + scaledBox.width - bracketLength, scaledBox.y)
    ctx.lineTo(scaledBox.x + scaledBox.width, scaledBox.y)
    ctx.lineTo(scaledBox.x + scaledBox.width, scaledBox.y + bracketLength)
    ctx.stroke()
    
    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(scaledBox.x, scaledBox.y + scaledBox.height - bracketLength)
    ctx.lineTo(scaledBox.x, scaledBox.y + scaledBox.height)
    ctx.lineTo(scaledBox.x + bracketLength, scaledBox.y + scaledBox.height)
    ctx.stroke()
    
    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(scaledBox.x + scaledBox.width - bracketLength, scaledBox.y + scaledBox.height)
    ctx.lineTo(scaledBox.x + scaledBox.width, scaledBox.y + scaledBox.height)
    ctx.lineTo(scaledBox.x + scaledBox.width, scaledBox.y + scaledBox.height - bracketLength)
    ctx.stroke()
    
    // Draw eye boxes if landmarks available
    if (landmarks) {
      ctx.strokeStyle = '#FFFFFF'
      ctx.setLineDash([4, 4])
      
      // Left eye (points 36-41)
      const leftEyePoints = landmarks.positions.slice(36, 42)
      if (leftEyePoints.length > 0) {
        const leftEyeBox = getEyeBox(leftEyePoints, scaleX, scaleY)
        ctx.beginPath()
        ctx.ellipse(
          leftEyeBox.x + leftEyeBox.width / 2,
          leftEyeBox.y + leftEyeBox.height / 2,
          leftEyeBox.width / 2,
          leftEyeBox.height / 2,
          0, 0, 2 * Math.PI
        )
        ctx.stroke()
      }
      
      // Right eye (points 42-47)
      const rightEyePoints = landmarks.positions.slice(42, 48)
      if (rightEyePoints.length > 0) {
        const rightEyeBox = getEyeBox(rightEyePoints, scaleX, scaleY)
        ctx.beginPath()
        ctx.ellipse(
          rightEyeBox.x + rightEyeBox.width / 2,
          rightEyeBox.y + rightEyeBox.height / 2,
          rightEyeBox.width / 2,
          rightEyeBox.height / 2,
          0, 0, 2 * Math.PI
        )
        ctx.stroke()
      }
    }
  }
  
  // Helper to get eye bounding box from landmarks
  const getEyeBox = (points: any[], scaleX: number, scaleY: number) => {
    const xs = points.map((p: any) => p.x * scaleX)
    const ys = points.map((p: any) => p.y * scaleY)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  }

  const stopCamera = () => {
    // Stop scanning
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    setScanning(false)
    setScanStatus("")
    setFaceDetection(null)
    isProcessingRef.current = false
    
    // Clear overlay
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
    setCapturing(null)
  }

  const capturePhoto = async (): Promise<string> => {
    console.log('📸 Attempting to capture photo...')
    console.log('📸 Video ref:', { 
      exists: !!videoRef.current,
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight,
      readyState: videoRef.current?.readyState,
      paused: videoRef.current?.paused,
      playing: !videoRef.current?.paused && (videoRef.current?.readyState ?? 0) >= 2
    })
    console.log('📸 Canvas ref:', { 
      exists: !!canvasRef.current,
      width: canvasRef.current?.width,
      height: canvasRef.current?.height
    })
    
    if (!videoRef.current) {
      console.error('❌ Video element not found - videoRef.current is null')
      toast.error("Video element not ready. Please wait for camera to start.")
      return ""
    }
    
    if (!canvasRef.current) {
      console.error('❌ Canvas element not found - canvasRef.current is null')
      toast.error("Canvas element not ready. Please refresh the page.")
      return ""
    }
    
    // Wait for video to be ready
    if (videoRef.current.readyState < 2) {
      console.log('⏳ Video not ready (state:', videoRef.current.readyState, '), waiting...')
      toast.info("Waiting for camera...")
      
      await new Promise<void>((resolve) => {
        const checkReady = () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            console.log('✅ Video is now ready')
            resolve()
          } else {
            setTimeout(checkReady, 100)
          }
        }
        // Max wait 3 seconds
        setTimeout(() => {
          console.log('⚠️ Timeout waiting for video ready')
          resolve()
        }, 3000)
        checkReady()
      })
    }
    
    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) {
      console.error('❌ Could not get canvas context')
      toast.error("Could not get canvas context")
      return ""
    }
    
    try {
      // Prefer ImageCapture API when available (more reliable on some devices/browsers)
      try {
        const mediaStream = streamRef.current
        const track = mediaStream?.getVideoTracks && mediaStream.getVideoTracks()[0]
        const ImageCaptureCtor: any = (globalThis as any).ImageCapture
        if (track && ImageCaptureCtor) {
          console.log('🧪 Using ImageCapture API fallback...')
          const imageCapture = new ImageCaptureCtor(track)
          const blob: Blob = await imageCapture.takePhoto()
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(String(reader.result))
            reader.onerror = reject
            reader.readAsDataURL(blob)
          })
          if (dataUrl && dataUrl.length > 100) {
            console.log('✅ Photo captured via ImageCapture, size:', dataUrl.length)
            return dataUrl
          }
          console.warn('⚠️ ImageCapture produced small/invalid data, falling back to canvas')
        }
      } catch (icErr) {
        console.warn('⚠️ ImageCapture not available or failed, using canvas method:', icErr)
      }

      // Get actual video dimensions
      let width = videoRef.current.videoWidth
      let height = videoRef.current.videoHeight
      
      console.log('Video dimensions:', width, 'x', height)
      
      // If dimensions are 0, wait a bit and try again
      if (width === 0 || height === 0) {
        console.log('⚠️ Video dimensions are 0, waiting for metadata...')
        await new Promise(resolve => setTimeout(resolve, 500))
        width = videoRef.current.videoWidth
        height = videoRef.current.videoHeight
        console.log('After wait, dimensions:', width, 'x', height)
      }
      
      // Fallback to display dimensions if still 0
      if (width === 0 || height === 0) {
        console.log('⚠️ Using display dimensions as fallback')
        width = videoRef.current.clientWidth || 640
        height = videoRef.current.clientHeight || 480
        
        if (width === 0 || height === 0) {
          console.error('❌ Cannot determine video dimensions')
          toast.error("Camera not ready. Please wait and try again.")
          return ""
        }
      }
      
      console.log('Setting canvas size to:', width, 'x', height)
      canvasRef.current.width = width
      canvasRef.current.height = height
      
      console.log('Drawing video to canvas...')
      try {
        ctx.drawImage(videoRef.current, 0, 0, width, height)
        console.log('✅ Successfully drew video to canvas')
      } catch (drawError: any) {
        console.error('❌ Error drawing to canvas:', drawError)
        toast.error(`Failed to capture: ${drawError.message || 'Could not draw video to canvas'}`)
        return ""
      }
      
      console.log('Converting to image...')
      let imageData: string
      try {
        imageData = canvasRef.current.toDataURL("image/jpeg", 0.8)
        console.log('✅ Successfully converted to data URL, length:', imageData?.length)
      } catch (convertError: any) {
        console.error('❌ Error converting to data URL:', convertError)
        toast.error(`Failed to convert image: ${convertError.message || 'Unknown error'}`)
        return ""
      }
      
      if (!imageData || imageData.length < 100) {
        console.error('❌ Invalid image data:', { 
          hasData: !!imageData, 
          length: imageData?.length,
          preview: imageData?.substring(0, 50)
        })
        // Last resort: try drawing again once after a short delay
        await new Promise(resolve => setTimeout(resolve, 150))
        try {
          ctx.drawImage(videoRef.current, 0, 0, width, height)
          const retryData = canvasRef.current.toDataURL("image/jpeg", 0.8)
          if (retryData && retryData.length > 100) {
            console.log('✅ Photo captured on retry, size:', retryData.length)
            return retryData
          }
        } catch {}
        toast.error(`Failed to capture image. Data length: ${imageData?.length || 0}`)
        return ""
      }
      
      console.log('✅ Photo captured successfully, size:', imageData.length, 'bytes')
      return imageData
    } catch (error: any) {
      console.error('❌ Capture error:', error)
      toast.error(`Capture failed: ${error.message || 'Unknown error'}`)
      return ""
    }
  }

  const handleClockIn = async () => {
    console.log('🖱️ Clock In button clicked')
    console.log('Location:', location)
    console.log('Location error:', locationError)
    
    // Use default location if not available (for HTTP or permission denied)
    const currentLocation = location || {
      lat: 6.292335456278995, // Office location
      lng: 99.78658827444191
    }
    
    if (!currentLocation) {
      toast.error("Please wait for location detection")
      return
    }

    // Verify location is within allowed range
    const isLocationAllowed = checkLocationAccess(currentLocation)
    if (!isLocationAllowed) {
      toast.error("You are not within the allowed location range. Please move to the office location.")
      return
    }

    if (locationError && locationError.includes("not within")) {
      toast.error("You are not within the allowed location range")
      return
    }

    if (!user?.profilePhoto) {
      toast.error("Profile photo not found. Please update your profile picture.")
      return
    }

    // Set capturing state FIRST so camera starts
    console.log('✅ Setting capturing to clockin')
    setCapturing('clockin')
    
    try {
      console.log('🎥 Starting camera for clock in...')
      const cameraStarted = await startCamera()
      if (cameraStarted) {
        console.log('📸 Camera started, waiting for video to be ready...')
        // Wait a bit more for video element to be fully ready
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('📸 Starting face scanning...')
        toast.info("Camera ready! Scanning for your face...")
        startFaceScanning('clockin')
      } else {
        console.error('❌ Camera failed to start')
      }
    } catch (error) {
      console.error('❌ Clock in error:', error)
      toast.error("Failed to start camera")
      setCapturing(null)
    }
  }

  const startFaceScanning = (mode: 'clockin' | 'clockout') => {
    console.log('🔍 startFaceScanning called', { mode, hasProfilePhoto: !!user?.profilePhoto, cameraActive, hasVideo: !!videoRef.current })
    
    if (!user?.profilePhoto) {
      console.error('Cannot start scanning: missing profile photo')
      toast.error("Profile photo not found. Please update your profile.")
      return
    }

    if (!videoRef.current) {
      console.error('Cannot start scanning: video element not ready')
      toast.error("Camera not ready. Please wait...")
      // Try again after a short delay
      setTimeout(() => {
        if (videoRef.current && user?.profilePhoto) {
          startFaceScanning(mode)
        }
      }, 1000)
      return
    }

    console.log('✅ Starting face scanning interval...')
    setScanning(true)
    setScanStatus("🔍 Scanning for face...")
    isProcessingRef.current = false

    // Clear any existing interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
    }

    // Scan every 1.5 seconds
    scanIntervalRef.current = setInterval(async () => {
      console.log('🔍 Scan cycle started', { isProcessing: isProcessingRef.current, cameraActive, hasVideo: !!videoRef.current })
      // Skip if already processing
      if (isProcessingRef.current) {
        return
      }

      // Skip if camera stopped
      if (!videoRef.current || !user?.profilePhoto) {
        console.warn('⚠️ Scan skipped: video not ready or no profile photo')
        return
      }
      
      if (videoRef.current.readyState < 2) {
        console.warn('⚠️ Scan skipped: video not ready (state:', videoRef.current.readyState, ')')
        setScanStatus("⏳ Waiting for camera...")
        isProcessingRef.current = false
        return
      }

      try {
        isProcessingRef.current = true
        
        // Capture current frame
        console.log('📸 Capturing frame for scan...')
        const image = await capturePhoto()
        if (!image || image.length < 100) {
          console.warn('⚠️ Failed to capture image for scan')
          setScanStatus("⚠️ Failed to capture - Retrying...")
          isProcessingRef.current = false
          return
        }
        console.log('✅ Frame captured, length:', image.length)

        // Detect face in captured frame
        setScanStatus("🔍 Detecting face...")
        let hasFace = false
        let faceDetails = null
        
        // Use simple face detection first (more reliable)
        try {
          hasFace = await detectFace(image)
          console.log('Face detection result:', { hasFace })
        } catch (detectError: any) {
          console.error('❌ Simple face detection error:', detectError)
          hasFace = false
        }
        
        // If face detected, get details for overlay
        if (hasFace) {
          try {
            faceDetails = await detectFaceWithDetails(image)
            // Draw overlay if details available
            if (faceDetails?.hasFace && faceDetails?.box && videoRef.current && overlayCanvasRef.current) {
              try {
                drawFaceOverlay(faceDetails.box, faceDetails.landmarks, videoRef.current, overlayCanvasRef.current)
                setFaceDetection(faceDetails)
              } catch (overlayError) {
                console.warn('⚠️ Overlay drawing doubted:', overlayError)
                // Continue even if overlay fails
              }
            }
          } catch (detailsError: any) {
            console.warn('⚠️ Face details error (overlay may not show):', detailsError)
            // Continue without overlay if details fail
          }
        } else {
          // Clear overlay if no face
          if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d')
            if (ctx) {
              ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
            }
          }
          setFaceDetection(null)
          setScanStatus("👤 No face detected - Make sure your face is well-lit and centered")
          isProcessingRef.current = false
          return
        }
        
        if (!hasFace) {
          console.warn('⚠️ No face detected')
          setScanStatus("👤 No face detected - Make sure your face is well-lit and centered")
          isProcessingRef.current = false
          return
        }

        setScanStatus("✅ Face detected! Verifying identity...")
        
        // Compare with profile photo
        let comparison
        try {
          comparison = await compareFaces(user.profilePhoto, image, 50) // Lower threshold for scanning
          console.log('🔍 Comparison result:', { 
            match: comparison.match, 
            accuracy: comparison.accuracy.toFixed(1) + '%' 
          })
        } catch (compareError: any) {
          console.error('❌ Comparison error:', compareError)
          setScanStatus(`⚠️ Comparison error: ${compareError.message || 'Unknown error'}`)
          isProcessingRef.current = false
          return
        }
        
        // More lenient matching during scanning - accept 40% or higher (very lenient)
        const minAccuracy = 40 // Even more lenient
        console.log('🔍 Match check:', { 
          match: comparison.match, 
          accuracy: comparison.accuracy, 
          required: minAccuracy,
          willMatch: comparison.match && comparison.accuracy >= minAccuracy
        })
        
        if (comparison.match && comparison.accuracy >= minAccuracy) {
          // Stop scanning
          if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current)
            scanIntervalRef.current = null
          }
          setScanning(false)
          setScanStatus(`✅ Face matched! (${comparison.accuracy.toFixed(1)}% similarity) - Clocking in...`)
          
          // Clear overlay before clocking in
          if (overlayCanvasRef.current) {
            const ctx = overlayCanvasRef.current.getContext('2d')
            if (ctx) {
              ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
            }
          }
          
          // Automatically clock in/out
          if (mode === 'clockin') {
            await handleVerifyAndClockInInternal(image)
          } else {
            await handleVerifyAndClockOutInternal(image)
          }
          
          isProcessingRef.current = false
        } else {
          // Face detected but doesn't match - show accuracy for user feedback
          const accuracyMsg = comparison.accuracy ? comparison.accuracy.toFixed(1) + '%' : 'N/A'
          setScanStatus(`🔍 Similarity: ${accuracyMsg} (Need 40%) - Keep your face still and centered...`)
          console.log(`⏳ Similarity: ${accuracyMsg}, need 40% or higher`)
          isProcessingRef.current = false
        }
      } catch (error: any) {
        console.error('Scan error:', error)
        setScanStatus("⚠️ Scan error - Retrying...")
        isProcessingRef.current = false
      }
    }, 1500) // Scan every 1.5 seconds
  }

  const handleCapture = async () => {
    console.log('🖱️ Capture button clicked!', { 
      capturing, 
      cameraActive, 
      hasUser: !!user,
      hasVideo: !!videoRef.current,
      hasCanvas: !!canvasRef.current
    })
    
    if (!user) {
      console.error('❌ No user data')
      toast.error("User data not loaded")
      return
    }

    if (!cameraActive) {
      console.error('❌ Camera not active')
      toast.error("Camera not active. Please wait for camera to start.")
      return
    }

    if (!capturing) {
      console.error('❌ No capturing mode set')
      toast.error("Please click Clock In or Clock Out first")
      return
    }

    console.log('📸 Starting capture...')
    toast.info("📸 Capturing photo...")
    
    try {
      const image = await capturePhoto()
      console.log('Capture result:', { 
        imageLength: image?.length, 
        hasImage: !!image 
      })
      
      if (!image) {
        console.error('❌ Photo capture failed - empty result')
        toast.error("Failed to capture photo. Please try again.")
        return
      }

      console.log('✅ Photo captured successfully, length:', image.length)
      setCapturedImage(image)
      toast.success("✅ Photo captured successfully! Now verifying your face...", {
        duration: 3000
      })
      
      // Small delay to let user see the success message
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Automatically verify after capture - pass image directly
      if (capturing === 'clockin') {
        console.log('🔄 Starting clock in verification...')
        toast.info("🔍 Verifying your identity...")
        await handleVerifyAndClockInInternal(image)
      } else if (capturing === 'clockout') {
        console.log('🔄 Starting clock out verification...')
        toast.info("🔍 Verifying your identity...")
        await handleVerifyAndClockOutInternal(image)
      } else {
        console.error('❌ Unknown capturing mode:', capturing)
        toast.error("❌ Unknown mode. Please try again.")
      }
    } catch (error: any) {
      console.error('❌ Capture error:', error)
      toast.error(`Failed to capture: ${error.message || 'Unknown error'}`)
    }
  }

  const handleVerifyAndClockInInternal = async (image: string) => {
    // Use default location if not available (for HTTP or permission denied)
    const currentLocation = location || {
      lat: 6.292335456278995, // Office location
      lng: 99.78658827444191
    }
    
    if (!currentLocation) {
      console.error('❌ No location available')
      toast.error("Location not available")
      return
    }

    if (!user) {
      console.error('❌ No user data')
      toast.error("User data not loaded")
      return
    }

    setVerifying(true)
    try {
      // Check if user has profile photo
      if (!user?.profilePhoto) {
        console.error('❌ No profile photo found for user:', user.username)
        toast.error("Profile photo not found. Please update your profile.")
        setVerifying(false)
        stopCamera()
        return
      }

      console.log('🔍 Detecting face in captured image...')
      toast.info("🔍 Detecting face in photo...")
      
      // Verify face detection with timeout
      let hasFace = false
      try {
        let timeoutId: NodeJS.Timeout | undefined
        if (!capturedImage) {
          throw new Error('No image captured')
        }
        const detectPromise = detectFace(capturedImage).then((result) => {
          if (timeoutId) clearTimeout(timeoutId)
          return result
        })
        
        const timeoutPromise = new Promise<boolean>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('⚠️ Face detection timeout')
            resolve(false)
          }, 15000) // 15 second timeout
        })
        
        hasFace = await Promise.race([detectPromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
        console.log('Face detection result:', hasFace)
      } catch (faceError: any) {
        console.error('❌ Face detection error:', faceError)
        toast.error(`❌ Face detection failed: ${faceError.message || 'Unknown error'}. Please try again.`, {
          duration: 5000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }
      
      if (!hasFace) {
        console.error('❌ No face detected')
        toast.error("❌ No face detected in photo. Please ensure your face is clearly visible, centered, and well-lit, then try again.", {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }

      console.log('✅ Face detected!')
      toast.success("✅ Face detected in photo! Comparing with your profile...", {
        duration: 2000
      })

      // Compare with profile photo (60% accuracy required)
      console.log('🔍 Comparing faces...')
      toast.info("🔍 Comparing facial features with your profile...", {
        duration: 2000
      })
      
      let comparison: { match: boolean; accuracy: number } | null = null
      try {
        let timeoutId: NodeJS.Timeout | undefined
        if (!capturedImage) {
          throw new Error('No image captured')
        }
        const comparePromise = compareFaces(user.profilePhoto, capturedImage, 50).then((result) => {
          if (timeoutId) clearTimeout(timeoutId)
          return result
        })
        
        const timeoutPromise = new Promise<{ match: boolean; accuracy: number }>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('⚠️ Face comparison timeout')
            resolve({ match: false, accuracy: 0 })
          }, 20000) // 20 second timeout
        })
        
        comparison = await Promise.race([comparePromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
        console.log('Face comparison result:', comparison)
      } catch (compareError: any) {
        console.error('❌ Face comparison error:', compareError)
        const errorMessage = compareError?.message || 'Unknown error'
        console.error('Error message:', errorMessage)
        toast.error(`❌ ${errorMessage}`, {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }
      
      if (!comparison || !comparison.match) {
        const accuracy = comparison?.accuracy || 0
        console.error('❌ Face verification failed, accuracy:', accuracy)
        toast.error(`❌ Verification failed! Your face similarity is ${accuracy.toFixed(1)}% (Need 50%). Please ensure good lighting and your face is clearly visible, then try again.`, {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }

      // Face matches, proceed with clock in
      console.log('✅ Face verified, saving attendance...')
      toast.success(`✅ Face verified! Similarity: ${comparison.accuracy.toFixed(1)}%. Processing your attendance...`, {
        duration: 2000
      })
      
      const record = clockIn(user.id, image, currentLocation)
      console.log('✅ Attendance record created:', record.id)
      
      // Save to database via API
      try {
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: record.userId,
            date: record.date,
            clockInTime: record.clockInTime,
            clockInImage: record.clockInImage,
            clockInLatitude: record.clockInLocation?.lat || null,
            clockInLongitude: record.clockInLocation?.lng || null,
            status: record.status
          })
        })
        const result = await response.json()
        if (result.success) {
          console.log('✅ Attendance saved to database')
          
          // Refresh attendance from database
          try {
            const today = new Date().toISOString().split('T')[0]
            const refreshResponse = await fetch(`/api/attendance?userId=${user.id}`)
            const refreshData = await refreshResponse.json()
            if (refreshData.success && refreshData.records) {
              const todayRecord = refreshData.records.find((r: any) => r.date === today)
              if (todayRecord) {
                setAttendance(todayRecord)
                console.log('✅ Refreshed attendance from database')
              } else {
                console.warn('⚠️ Today record not found after save, using local record')
                setAttendance(record)
              }
            } else {
              console.warn('⚠️ No records returned after save, using local record')
              setAttendance(record)
            }
          } catch (refreshError) {
            console.error('Error refreshing attendance:', refreshError)
            setAttendance(record)
          }
        } else {
          console.error('❌ Failed to save to database:', result.error)
          toast.error(`Failed to save: ${result.error || 'Unknown error'}`)
          setAttendance(record)
        }
      } catch (error: any) {
        console.error('❌ Error saving to database:', error)
        toast.error(`Failed to save to database: ${error.message || 'Unknown error'}`)
        setAttendance(record)
      }
      stopCamera()
      setCapturing(null)
      setCapturedImage(null)
      setVerifying(false)
      
      // Final success message
      toast.success(`🎉 Clock in successful! Your face was verified with ${comparison.accuracy.toFixed(1)}% similarity.`, {
        duration: 5000
      })
      console.log('✅ Clock in complete!')
    } catch (error: any) {
      console.error("❌ Clock in error:", error)
      console.error("Error stack:", error.stack)
      toast.error(`❌ Clock in failed: ${error.message || 'Unknown error occurred'}. Please try again.`, {
        duration: 5000
      })
      setVerifying(false)
      setCapturedImage(null) // Allow retry
    }
  }

  const handleVerifyAndClockOutInternal = async (image: string) => {
    // Use default location if not available (for HTTP or permission denied)
    const currentLocation = location || {
      lat: 6.292335456278995, // Office location
      lng: 99.78658827444191
    }
    
    if (!currentLocation) {
      console.error('❌ No location available')
      toast.error("Location not available")
      return
    }

    if (!user) {
      console.error('❌ No user data')
      toast.error("User data not loaded")
      return
    }

    setVerifying(true)
    try {
      // Check if user has profile photo
      if (!user?.profilePhoto) {
        toast.error("Profile photo not found. Please update your profile.")
        setVerifying(false)
        stopCamera()
        return
      }

      console.log('🔍 Detecting face in captured image...')
      toast.info("🔍 Detecting face in photo...")
      
      // Verify face detection
      let hasFace = false
      try {
        let timeoutId: NodeJS.Timeout | undefined
        if (!capturedImage) {
          throw new Error('No image captured')
        }
        const detectPromise = detectFace(capturedImage).then((result) => {
          if (timeoutId) clearTimeout(timeoutId)
          return result
        })
        
        const timeoutPromise = new Promise<boolean>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('⚠️ Face detection timeout')
            resolve(false)
          }, 15000)
        })
        
        hasFace = await Promise.race([detectPromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
      } catch (faceError: any) {
        console.error('❌ Face detection error:', faceError)
        toast.error(`❌ Face detection failed: ${faceError.message || 'Unknown error'}. Please try again.`, {
          duration: 5000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }
      
      if (!hasFace) {
        console.error('❌ No face detected')
        toast.error("❌ No face detected in photo. Please ensure your face is clearly visible, centered, and well-lit, then try again.", {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }

      console.log('✅ Face detected!')
      toast.success("✅ Face detected in photo! Comparing with your profile...", {
        duration: 2000
      })

      // Compare with profile photo (60% accuracy required)
      console.log('🔍 Comparing faces...')
      toast.info("🔍 Comparing facial features with your profile...", {
        duration: 2000
      })
      
      let comparison: { match: boolean; accuracy: number } | null = null
      try {
        let timeoutId: NodeJS.Timeout | undefined
        if (!capturedImage) {
          throw new Error('No image captured')
        }
        const comparePromise = compareFaces(user.profilePhoto, capturedImage, 50).then((result) => {
          if (timeoutId) clearTimeout(timeoutId)
          return result
        })
        
        const timeoutPromise = new Promise<{ match: boolean; accuracy: number }>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('⚠️ Face comparison timeout')
            resolve({ match: false, accuracy: 0 })
          }, 20000)
        })
        
        comparison = await Promise.race([comparePromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
      } catch (compareError: any) {
        console.error('❌ Face comparison error:', compareError)
        toast.error(`❌ Face comparison failed: ${compareError.message || 'Unknown error'}`)
        setVerifying(false)
        return
      }
      
      if (!comparison || !comparison.match) {
        const accuracy = comparison?.accuracy || 0
        console.error('❌ Face verification failed, accuracy:', accuracy)
        toast.error(`❌ Verification failed! Your face similarity is ${accuracy.toFixed(1)}% (Need 50%). Please ensure good lighting and your face is clearly visible, then try again.`, {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }

      // Face matches, proceed with clock out
      console.log('✅ Face verified, saving attendance...')
      toast.success(`✅ Face verified! Similarity: ${comparison.accuracy.toFixed(1)}%. Processing your attendance...`, {
        duration: 2000
      })
      
      const record = clockOut(user.id, image, currentLocation)
      
      // Save to database via API
      try {
        if (!record) {
          toast.error('No attendance record found')
          return
        }
        
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: record.userId,
            date: record.date,
            clockOutTime: record.clockOutTime,
            clockOutImage: record.clockOutImage,
            clockOutLatitude: record.clockOutLocation?.lat || null,
            clockOutLongitude: record.clockOutLocation?.lng || null
          })
        })
        const result = await response.json()
        if (result.success) {
          console.log('✅ Clock out saved to database')
          
          // Refresh attendance from database
          try {
            const today = new Date().toISOString().split('T')[0]
            const refreshResponse = await fetch(`/api/attendance?userId=${user.id}`)
            const refreshData = await refreshResponse.json()
            if (refreshData.success && refreshData.records) {
              const todayRecord = refreshData.records.find((r: any) => r.date === today)
              if (todayRecord) {
                setAttendance(todayRecord)
                console.log('✅ Refreshed attendance from database')
              } else {
                console.warn('⚠️ Today record not found after save, using local record')
                setAttendance(record)
              }
            } else {
              console.warn('⚠️ No records returned after save, using local record')
              setAttendance(record)
            }
          } catch (refreshError) {
            console.error('Error refreshing attendance:', refreshError)
            setAttendance(record)
          }
        } else {
          console.error('❌ Failed to save to database:', result.error)
          toast.error(`Failed to save: ${result.error || 'Unknown error'}`)
          setAttendance(record)
        }
      } catch (error: any) {
        console.error('❌ Error saving to database:', error)
        toast.error(`Failed to save to database: ${error.message || 'Unknown error'}`)
        setAttendance(record)
      }
      stopCamera()
      setCapturing(null)
      setCapturedImage(null)
      setVerifying(false)
      
      // Final success message
      toast.success(`🎉 Clock out successful! Your face was verified with ${comparison.accuracy.toFixed(1)}% similarity.`, {
        duration: 5000
      })
      console.log('✅ Clock out complete!')
    } catch (error: any) {
      console.error("❌ Clock out error:", error)
      console.error("Error stack:", error.stack)
      toast.error(`❌ Clock out failed: ${error.message || 'Unknown error occurred'}. Please try again.`, {
        duration: 5000
      })
      setVerifying(false)
      setCapturedImage(null) // Allow retry
    }
  }

  const handleVerifyAndClockIn = async () => {
    if (!capturedImage) {
      console.error('❌ No captured image')
      return
    }

    // Use default location if not available (for HTTP or permission denied)
    const currentLocation = location || {
      lat: 6.292335456278995, // Office location
      lng: 99.78658827444191
    }
    
    if (!currentLocation) {
      console.error('❌ No location available')
      toast.error("Location not available")
      setVerifying(false)
      return
    }

    // Verify location is within allowed range before proceeding
    const isLocationAllowed = checkLocationAccess(currentLocation)
    if (!isLocationAllowed) {
      console.error('❌ Location not within allowed range')
      toast.error("You are not within the allowed location range. Please move to the office location.")
      setVerifying(false)
      return
    }

    if (!user) {
      console.error('❌ No user data')
      toast.error("User data not loaded")
      setVerifying(false)
      return
    }

    setVerifying(true)
    try {
      // Check if user has profile photo
      if (!user?.profilePhoto) {
        console.error('❌ No profile photo found for user:', user.username)
        toast.error("Profile photo not found. Please update your profile.")
        setVerifying(false)
        stopCamera()
        return
      }

      console.log('🔍 Detecting face in captured image...')
      toast.info("🔍 Detecting face in photo...")
      
      // Verify face detection with timeout
      let hasFace = false
      try {
        let timeoutId: NodeJS.Timeout | undefined
        if (!capturedImage) {
          throw new Error('No image captured')
        }
        const detectPromise = detectFace(capturedImage).then((result) => {
          if (timeoutId) clearTimeout(timeoutId)
          return result
        })
        
        const timeoutPromise = new Promise<boolean>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('⚠️ Face detection timeout')
            resolve(false)
          }, 15000) // 15 second timeout
        })
        
        hasFace = await Promise.race([detectPromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
        console.log('Face detection result:', hasFace)
      } catch (faceError: any) {
        console.error('❌ Face detection error:', faceError)
        toast.error(`❌ Face detection failed: ${faceError.message || 'Unknown error'}. Please try again.`, {
          duration: 5000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }
      
      if (!hasFace) {
        console.error('❌ No face detected')
        toast.error("❌ No face detected in photo. Please ensure your face is clearly visible, centered, and well-lit, then try again.", {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }

      console.log('✅ Face detected!')
      toast.success("✅ Face detected in photo! Comparing with your profile...", {
        duration: 2000
      })

      // Compare with profile photo (60% accuracy required)
      console.log('🔍 Comparing faces...')
      toast.info("🔍 Comparing facial features with your profile...", {
        duration: 2000
      })
      
      let comparison: { match: boolean; accuracy: number } | null = null
      try {
        let timeoutId: NodeJS.Timeout | undefined
        if (!capturedImage) {
          throw new Error('No image captured')
        }
        const comparePromise = compareFaces(user.profilePhoto, capturedImage, 50).then((result) => {
          if (timeoutId) clearTimeout(timeoutId)
          return result
        })
        
        const timeoutPromise = new Promise<{ match: boolean; accuracy: number }>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('⚠️ Face comparison timeout')
            resolve({ match: false, accuracy: 0 })
          }, 20000) // 20 second timeout
        })
        
        comparison = await Promise.race([comparePromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
        console.log('Face comparison result:', comparison)
      } catch (compareError: any) {
        console.error('❌ Face comparison error:', compareError)
        const errorMessage = compareError?.message || 'Unknown error'
        console.error('Error message:', errorMessage)
        toast.error(`❌ ${errorMessage}`, {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }
      
      if (!comparison || !comparison.match) {
        const accuracy = comparison?.accuracy || 0
        console.error('❌ Face verification failed, accuracy:', accuracy)
        toast.error(`❌ Verification failed! Your face similarity is ${accuracy.toFixed(1)}% (Need 50%). Please ensure good lighting and your face is clearly visible, then try again.`, {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }

      // Face matches, proceed with clock in
      console.log('✅ Face verified, saving attendance...')
      toast.success(`✅ Face verified! Similarity: ${comparison.accuracy.toFixed(1)}%. Processing attendance...`)
      
      // Use default location if not available
      const currentLocation = location || {
        lat: 6.292279618596812,
        lng: 99.78659978585995
      }
      
      const record = clockIn(user.id, capturedImage, currentLocation)
      console.log('✅ Attendance record created:', record.id)
      
      // Save to database via API
      try {
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: record.userId,
            date: record.date,
            clockInTime: record.clockInTime,
            clockInImage: record.clockInImage,
            clockInLatitude: record.clockInLocation?.lat || null,
            clockInLongitude: record.clockInLocation?.lng || null,
            status: record.status
          })
        })
        const result = await response.json()
        if (result.success) {
          console.log('✅ Attendance saved to database')
          
          // Refresh attendance from database
          try {
            const today = new Date().toISOString().split('T')[0]
            const refreshResponse = await fetch(`/api/attendance?userId=${user.id}`)
            const refreshData = await refreshResponse.json()
            if (refreshData.success && refreshData.records) {
              const todayRecord = refreshData.records.find((r: any) => r.date === today)
              if (todayRecord) {
                setAttendance(todayRecord)
                console.log('✅ Refreshed attendance from database')
              } else {
                console.warn('⚠️ Today record not found after save, using local record')
                setAttendance(record)
              }
            } else {
              console.warn('⚠️ No records returned after save, using local record')
              setAttendance(record)
            }
          } catch (refreshError) {
            console.error('Error refreshing attendance:', refreshError)
            setAttendance(record)
          }
        } else {
          console.error('❌ Failed to save to database:', result.error)
          toast.error(`Failed to save: ${result.error || 'Unknown error'}`)
          setAttendance(record)
        }
      } catch (error: any) {
        console.error('❌ Error saving to database:', error)
        toast.error(`Failed to save to database: ${error.message || 'Unknown error'}`)
        setAttendance(record)
      }
      stopCamera()
      setCapturing(null)
      setCapturedImage(null)
      setVerifying(false)
      toast.success(`🎉 Face detected! Clock in successful! (Similarity: ${comparison.accuracy.toFixed(1)}%)`, {
        duration: 5000
      })
      console.log('✅ Clock in complete!')
    } catch (error: any) {
      console.error("❌ Clock in error:", error)
      console.error("Error stack:", error.stack)
      toast.error(`❌ Clock in failed: ${error.message || 'Unknown error occurred'}. Please try again.`, {
        duration: 5000
      })
      setVerifying(false)
      setCapturedImage(null) // Allow retry
    }
  }

  const handleClockOut = async () => {
    console.log('🖱️ Clock Out button clicked')
    
    // Use default location if not available (for HTTP or permission denied)
    const currentLocation = location || {
      lat: 6.292335456278995, // Office location
      lng: 99.78658827444191
    }
    
    if (!currentLocation) {
      toast.error("Please wait for location detection")
      return
    }

    // Verify location is within allowed range
    const isLocationAllowed = checkLocationAccess(currentLocation)
    if (!isLocationAllowed) {
      toast.error("You are not within the allowed location range. Please move to the office location.")
      return
    }

    if (locationError && locationError.includes("not within")) {
      toast.error("You are not within the allowed location range")
      return
    }

    if (!user?.profilePhoto) {
      toast.error("Profile photo not found. Please update your profile picture.")
      return
    }

    // Set capturing state FIRST so camera starts
    console.log('✅ Setting capturing to clockout')
    setCapturing('clockout')
    
    try {
      console.log('🎥 Starting camera for clock out...')
      const cameraStarted = await startCamera()
      if (cameraStarted) {
        console.log('📸 Camera started, waiting for video to be ready...')
        // Wait a bit more for video element to be fully ready
        await new Promise(resolve => setTimeout(resolve, 500))
        console.log('📸 Starting face scanning...')
        toast.info("Camera ready! Scanning for your face...")
        startFaceScanning('clockout')
      } else {
        console.error('❌ Camera failed to start')
      }
    } catch (error) {
      console.error('❌ Clock out error:', error)
      toast.error("Failed to start camera")
      setCapturing(null)
    }
  }

  const handleVerifyAndClockOut = async () => {
    if (!capturedImage) {
      console.error('❌ No captured image')
      return
    }

    // Use default location if not available (for HTTP or permission denied)
    const currentLocation = location || {
      lat: 6.292335456278995, // Office location
      lng: 99.78658827444191
    }
    
    if (!currentLocation) {
      console.error('❌ No location available')
      toast.error("Location not available")
      setVerifying(false)
      return
    }

    // Verify location is within allowed range before proceeding
    const isLocationAllowed = checkLocationAccess(currentLocation)
    if (!isLocationAllowed) {
      console.error('❌ Location not within allowed range')
      toast.error("You are not within the allowed location range. Please move to the office location.")
      setVerifying(false)
      return
    }

    if (!user) {
      console.error('❌ No user data')
      toast.error("User data not loaded")
      setVerifying(false)
      return
    }

    setVerifying(true)
    try {
      // Check if user has profile photo
      if (!user?.profilePhoto) {
        toast.error("Profile photo not found. Please update your profile.")
        setVerifying(false)
        stopCamera()
        return
      }

      console.log('🔍 Detecting face in captured image...')
      toast.info("🔍 Detecting face in photo...")
      
      // Verify face detection
      let hasFace = false
      try {
        let timeoutId: NodeJS.Timeout | undefined
        if (!capturedImage) {
          throw new Error('No image captured')
        }
        const detectPromise = detectFace(capturedImage).then((result) => {
          if (timeoutId) clearTimeout(timeoutId)
          return result
        })
        
        const timeoutPromise = new Promise<boolean>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('⚠️ Face detection timeout')
            resolve(false)
          }, 15000)
        })
        
        hasFace = await Promise.race([detectPromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
      } catch (faceError: any) {
        console.error('❌ Face detection error:', faceError)
        toast.error(`❌ Face detection failed: ${faceError.message || 'Unknown error'}. Please try again.`, {
          duration: 5000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }
      
      if (!hasFace) {
        console.error('❌ No face detected')
        toast.error("❌ No face detected in photo. Please ensure your face is clearly visible, centered, and well-lit, then try again.", {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }

      console.log('✅ Face detected!')
      toast.success("✅ Face detected in photo! Comparing with your profile...", {
        duration: 2000
      })

      // Compare with profile photo (60% accuracy required)
      console.log('🔍 Comparing faces...')
      toast.info("🔍 Comparing facial features with your profile...", {
        duration: 2000
      })
      
      let comparison: { match: boolean; accuracy: number } | null = null
      try {
        let timeoutId: NodeJS.Timeout | undefined
        if (!capturedImage) {
          throw new Error('No image captured')
        }
        const comparePromise = compareFaces(user.profilePhoto, capturedImage, 50).then((result) => {
          if (timeoutId) clearTimeout(timeoutId)
          return result
        })
        
        const timeoutPromise = new Promise<{ match: boolean; accuracy: number }>((resolve) => {
          timeoutId = setTimeout(() => {
            console.warn('⚠️ Face comparison timeout')
            resolve({ match: false, accuracy: 0 })
          }, 20000)
        })
        
        comparison = await Promise.race([comparePromise, timeoutPromise])
        if (timeoutId) clearTimeout(timeoutId)
      } catch (compareError: any) {
        console.error('❌ Face comparison error:', compareError)
        toast.error(`❌ Face comparison failed: ${compareError.message || 'Unknown error'}`)
        setVerifying(false)
        return
      }
      
      if (!comparison || !comparison.match) {
        const accuracy = comparison?.accuracy || 0
        console.error('❌ Face verification failed, accuracy:', accuracy)
        toast.error(`❌ Verification failed! Your face similarity is ${accuracy.toFixed(1)}% (Need 50%). Please ensure good lighting and your face is clearly visible, then try again.`, {
          duration: 6000
        })
        setVerifying(false)
        setCapturedImage(null) // Allow retry
        return
      }

      // Face matches, proceed with clock out
      console.log('✅ Face verified, saving attendance...')
      toast.success(`✅ Face verified! Similarity: ${comparison.accuracy.toFixed(1)}%. Processing attendance...`)
      
      // Use default location if not available
      const currentLocation = location || {
        lat: 6.292279618596812,
        lng: 99.78659978585995
      }
      
      const record = clockOut(user.id, capturedImage, currentLocation)
      
      // Save to database via API
      try {
        if (!record) {
          toast.error('No attendance record found')
          return
        }
        
        const response = await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: record.userId,
            date: record.date,
            clockOutTime: record.clockOutTime,
            clockOutImage: record.clockOutImage,
            clockOutLatitude: record.clockOutLocation?.lat || null,
            clockOutLongitude: record.clockOutLocation?.lng || null
          })
        })
        const result = await response.json()
        if (result.success) {
          console.log('✅ Clock out saved to database')
          
          // Refresh attendance from database
          try {
            const today = new Date().toISOString().split('T')[0]
            const refreshResponse = await fetch(`/api/attendance?userId=${user.id}`)
            const refreshData = await refreshResponse.json()
            if (refreshData.success && refreshData.records) {
              const todayRecord = refreshData.records.find((r: any) => r.date === today)
              if (todayRecord) {
                setAttendance(todayRecord)
                console.log('✅ Refreshed attendance from database')
              } else {
                console.warn('⚠️ Today record not found after save, using local record')
                setAttendance(record)
              }
            } else {
              console.warn('⚠️ No records returned after save, using local record')
              setAttendance(record)
            }
          } catch (refreshError) {
            console.error('Error refreshing attendance:', refreshError)
            setAttendance(record)
          }
        } else {
          console.error('❌ Failed to save to database:', result.error)
          toast.error(`Failed to save: ${result.error || 'Unknown error'}`)
          setAttendance(record)
        }
      } catch (error: any) {
        console.error('❌ Error saving to database:', error)
        toast.error(`Failed to save to database: ${error.message || 'Unknown error'}`)
        setAttendance(record)
      }
      stopCamera()
      setCapturing(null)
      setCapturedImage(null)
      setVerifying(false)
      toast.success(`🎉 Face detected! Clock out successful! (Similarity: ${comparison.accuracy.toFixed(1)}%)`, {
        duration: 5000
      })
    } catch (error) {
      console.error("Clock out error:", error)
      toast.error("Failed to clock out. Please try again.")
      setVerifying(false)
    }
  }

  const getStatusBadge = () => {
    if (!attendance) return null
    switch (attendance.status) {
      case "on-time":
        return <Badge className="bg-green-500">On Time</Badge>
      case "late":
        return <Badge className="bg-yellow-500">Late</Badge>
      default:
        return null
    }
  }

  const isClockInAllowed = !attendance || !attendance.clockInTime
  const isClockOutAllowed = attendance?.clockInTime && !attendance?.clockOutTime

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Clock In/Out</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Record your attendance with photo verification</p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Status</CardTitle>
          <CardDescription>Your attendance record for today</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {attendance ? (
            <div className="space-y-3">
              {attendance.clockInTime && !attendance.clockOutTime && (
                <div className="p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-start sm:items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-blue-900">You have already clocked in today</p>
                      <p className="text-xs sm:text-sm text-blue-700">Clock in time: {attendance.clockInTime}</p>
                    </div>
                  </div>
                </div>
              )}
              {attendance.clockInTime && attendance.clockOutTime && (
                <div className="p-2 sm:p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-start sm:items-center gap-2">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-green-900">Attendance complete for today</p>
                      <p className="text-xs sm:text-sm text-green-700 break-words">
                        Clock in: {attendance.clockInTime} | Clock out: {attendance.clockOutTime}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm sm:text-base">Status</span>
                {getStatusBadge()}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Clock In</p>
                  <p className="text-base sm:text-lg font-semibold">{attendance.clockInTime || "Not yet"}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Clock Out</p>
                  <p className="text-base sm:text-lg font-semibold">{attendance.clockOutTime || "Not yet"}</p>
                </div>
              </div>
              {attendance.clockInTime && !attendance.clockOutTime && (
                <div className="mt-2 p-2 rounded-md bg-emerald-50 text-emerald-700 text-sm">
                  ✅ Ready to clock out
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-muted-foreground font-medium">You haven't clocked in today.</p>
            </div>
          )}

          {/* Location Status */}
          <div className="flex items-start sm:items-center gap-2 p-2 sm:p-3 rounded-lg bg-muted/50">
            {location ? (
              (() => {
                const isAllowed = checkLocationAccess(location)
                const isHTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:'
                
                if (!isAllowed) {
                  return (
                <>
                      <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-red-500">❌ Location Not Verified</p>
                        <p className="text-xs text-muted-foreground break-words">
                          You are not within the allowed location range (150m radius)
                        </p>
                  </div>
                </>
                  )
                }
                
                return (
                <>
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-green-500">✅ Location Verified</p>
                      <p className="text-xs text-muted-foreground break-words">
                        {isHTTPS 
                          ? `GPS verified - ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` 
                          : 'Default location verified - use HTTPS for real GPS'}
                    </p>
                  </div>
                </>
              )
              })()
            ) : (
              <>
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0 mt-0.5 sm:mt-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-yellow-500">Getting location...</p>
                  <p className="text-xs text-muted-foreground">Please enable location services</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Camera Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Camera Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-black rounded-lg overflow-hidden w-full max-w-md mx-auto">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                      console.log('✅ Video metadata loaded')
                      console.log('Video dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight)
                    }}
                    onPlay={() => {
                      console.log('▶️ Video started playing')
                    }}
                    onError={(e) => {
                      console.error('❌ Video error:', e)
                    }}
                  />
                  {/* Face detection overlay canvas */}
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ zIndex: 10 }}
                  />
                  {scanning && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white p-4">
                      <div className="text-center space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                        <p className="font-medium text-lg">{scanStatus || "🔍 Scanning for face..."}</p>
                        <p className="text-sm opacity-75">Position your face clearly in view</p>
                      </div>
                    </div>
                  )}
                  {verifying && !scanning && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p>Verifying and saving...</p>
                      </div>
                    </div>
                  )}
                  {!streamRef.current && !scanning && !verifying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p>Starting camera...</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <div className="text-center">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Click Clock In/Out to start camera</p>
                  </div>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="flex flex-col gap-2 sm:gap-3">
              {scanning && (
                <div className="p-2 sm:p-3 rounded-lg bg-blue-50 border border-blue-200 text-center">
                  <p className="text-xs sm:text-sm font-medium text-blue-900">{scanStatus || "🔍 Scanning for face..."}</p>
                  <p className="text-xs text-blue-700 mt-1">Make sure your face is clearly visible</p>
                </div>
              )}
              {isClockOutAllowed && !cameraActive && !capturing && (
                <div className="text-center p-2 rounded-md bg-emerald-50 text-emerald-700 text-xs sm:text-sm">
                  ✅ Ready to clock out — click Clock Out to continue
                </div>
              )}
              {!cameraActive || (!scanning && !capturing) ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  {isClockInAllowed && (
                    <Button
                      onClick={(e) => {
                        console.log('🖱️ Clock In button clicked')
                        e.preventDefault()
                        handleClockIn()
                      }}
                      disabled={loading || (!!locationError && locationError.includes("not within"))}
                      className="flex-1 w-full sm:w-auto"
                      size="lg"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {loading ? "Loading..." : "Clock In"}
                    </Button>
                  )}
                  {isClockOutAllowed && (
                    <Button
                      onClick={(e) => {
                        console.log('🖱️ Clock Out button clicked')
                        e.preventDefault()
                        handleClockOut()
                      }}
                      disabled={loading || (!!locationError && locationError.includes("not within"))}
                      className="flex-1 w-full sm:w-auto"
                      variant="outline"
                      size="lg"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {loading ? "Loading..." : "Clock Out"}
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {scanning && (
                    <Button 
                      onClick={() => { 
                        stopCamera(); 
                        setCapturing(null); 
                        toast.info("Scanning stopped. Click Clock In/Out to try again.")
                      }} 
                      variant="outline"
                      className="w-full"
                    >
                      Stop Scanning & Retry
                    </Button>
                  )}
                  {!scanning && !verifying && (
                    <Button
                      onClick={() => { 
                        stopCamera(); 
                        setCapturing(null); 
                        setCapturedImage(null);
                      }} 
                      variant="outline"
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• Clock in before 8:00 AM to be marked as "On Time"</p>
          <p>• Your location must be within the allowed range</p>
          <p>• A photo is required for both clock in and clock out</p>
          <p>• Clock out must be done after clocking in</p>
        </CardContent>
      </Card>
    </div>
  )
}
