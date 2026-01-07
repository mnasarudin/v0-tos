"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// Removed isAuthenticated import - will check auth client-side via localStorage
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, CheckCircle, MapPin, Camera, Calendar, User, Shield, BarChart3, FileText, ArrowRight, Anchor, Facebook, Instagram, Youtube, Globe } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { markLegitimateNavigation } from "@/lib/navigation-guard"

export default function HomePage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set client immediately
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only redirect if authenticated - separate effect to avoid blocking render
    if (!isClient) return
    
    // Check if this is a logout redirect - if so, don't redirect to dashboard
    const urlParams = new URLSearchParams(window.location.search)
    const isLogout = urlParams.get('logout') === 'true'
    
    if (isLogout) {
      // Clean up the URL parameter
      window.history.replaceState({}, '', '/')
      return
    }
    
    // Don't auto-redirect authenticated users - let them access the homepage
    // They can manually navigate to dashboard if needed
    // Removed automatic redirect to allow homepage access even when logged in
  }, [isClient, router])

  const features = [
    {
      icon: Clock,
      title: "Clock In/Out",
      description: "Record attendance with photo verification and geolocation tracking. Easy one-click check-in system."
    },
    {
      icon: CheckCircle,
      title: "Attendance Tracking",
      description: "Monitor your attendance status including on-time and late arrivals with detailed history."
    },
    {
      icon: MapPin,
      title: "Location Verification",
      description: "Ensure attendance is recorded from authorized locations only with GPS tracking."
    },
    {
      icon: Camera,
      title: "Photo Capture",
      description: "Take photos for verification during clock in and clock out for security."
    },
    {
      icon: Calendar,
      title: "Leave Management",
      description: "Apply for leave and track application status with supervisor approval workflow."
    },
    {
      icon: User,
      title: "Profile Management",
      description: "Update your profile information and emergency contacts easily."
    },
    {
      icon: FileText,
      title: "Volume Logs",
      description: "Maintain detailed logs of your daily work activities and accomplishments."
    },
    {
      icon: BarChart3,
      title: "Reports & Analytics",
      description: "View comprehensive reports and analytics of your attendance and performance."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with encrypted data storage and secure authentication."
    }
  ]

  // Show loading only briefly, then show content
  // This prevents infinite loading states
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blue-100 border-b border-blue-200">
        <div className="w-full px-2 sm:px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between max-w-7xl mx-auto">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <Image 
                  src="/langkawi-port-logo.png" 
                  alt="Langkawi Port Sdn Bhd Logo" 
                  width={48} 
                  height={48} 
                  className="object-contain rounded-full"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">Langkawi Port Sdn Bhd</span>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                size="sm"
                className="bg-[#008B8B] text-white hover:bg-[#006666]"
                onClick={() => {
                  markLegitimateNavigation()
                  router.push('/login')
                }}
              >
                  Sign In
                </Button>
              <Button 
                size="sm"
                className="bg-[#008B8B] text-white hover:bg-[#006666]"
                onClick={() => {
                  markLegitimateNavigation()
                  router.push('/signup')
                }}
              >
                  Sign Up
                  <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-blue-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 text-sm text-gray-700 mb-4">
              <Shield className="w-4 h-4" />
              <span>Langkawi Port Sdn Bhd - Intern Portal</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Intern Attendance<br/>Management System
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Track your attendance, manage leave applications, and maintain daily work logs all in one place. 
              Streamline your internship experience at Langkawi Port with our comprehensive management platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto h-14 px-10 text-lg bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50"
                onClick={() => {
                  markLegitimateNavigation()
                  router.push('/signup')
                }}
              >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto h-14 px-10 text-lg bg-white border-2 border-gray-300 text-gray-900 hover:bg-gray-50"
                onClick={() => {
                  markLegitimateNavigation()
                  router.push('/login')
                }}
              >
                  Sign In
                </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 bg-blue-50">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base sm:text-lg">
            Our comprehensive intern management system provides all the tools you need to track and manage your internship at Langkawi Port effectively.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-[#008B8B]/30 hover:-translate-y-1 bg-white">
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="h-7 w-7 text-[#008B8B]" />
                </div>
                <CardTitle className="text-xl mb-2 text-gray-900">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed text-gray-700">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/90 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-base">Quick Links</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <a 
                    href="https://langkawiport.com.my/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-gray-700 hover:text-[#008B8B] font-medium transition-colors hover:underline"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Langkawi Port Website
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.facebook.com/share/17wTjBW6Et/?mibextid=wwXIfr" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-gray-700 hover:text-[#008B8B] font-medium transition-colors hover:underline"
                  >
                    <Facebook className="mr-2 h-4 w-4" />
                    Facebook
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.tiktok.com/@langkawi_port" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-gray-700 hover:text-[#008B8B] font-medium transition-colors hover:underline"
                  >
                    <span className="mr-2 h-4 w-4 flex items-center justify-center text-base">T</span>
                    TikTok
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.instagram.com/langkawi_port" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-gray-700 hover:text-[#008B8B] font-medium transition-colors hover:underline"
                  >
                    <Instagram className="mr-2 h-4 w-4" />
                    Instagram
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.youtube.com/@langkawi_port" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-gray-700 hover:text-[#008B8B] font-medium transition-colors hover:underline"
                  >
                    <Youtube className="mr-2 h-4 w-4" />
                    YouTube
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-base">Address</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="font-medium text-gray-900">Langkawi Port Sdn Bhd</li>
                <li>Kompleks Dermaga Tanjung Lembung</li>
                <li>Mukim Ulu Melaka</li>
                <li>07000 Langkawi</li>
                <li>Kedah</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-base">Contact</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>E: <a href="mailto:enquiry@langkawiport.com.my" className="text-[#008B8B] hover:underline">enquiry@langkawiport.com.my</a></li>
                <li>T: <a href="tel:+6049665905" className="text-[#008B8B] hover:underline">+604-9665905</a> / <a href="tel:+6049665915" className="text-[#008B8B] hover:underline">+604-9665915</a></li>
                <li>F: +604-9665925</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
            <p>&copy; 2024 Langkawi Port Sdn Bhd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
