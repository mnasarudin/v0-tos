"use client"

// Client-side attendance utilities
// These functions interact with the API endpoints

export async function getTodayAttendance(userId: string) {
  try {
    const response = await fetch(`/api/attendance/today?userId=${userId}`)
    if (!response.ok) {
      return null
    }
    const data = await response.json()
    return data.attendance || null
  } catch (error) {
    console.error('Error fetching today attendance:', error)
    return null
  }
}

export async function getAttendanceRecords(userId: string, startDate?: string, endDate?: string) {
  try {
    const params = new URLSearchParams({ userId })
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    
    const response = await fetch(`/api/attendance/records?${params.toString()}`)
    if (!response.ok) {
      return []
    }
    const data = await response.json()
    return data.records || []
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    return []
  }
}

export async function clockIn(userId: string, image: string, location: { lat: number; lng: number }) {
  try {
    const response = await fetch('/api/attendance/clock-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, image, location })
    })
    if (!response.ok) {
      throw new Error('Clock in failed')
    }
    return await response.json()
  } catch (error) {
    console.error('Error clocking in:', error)
    throw error
  }
}

export async function clockOut(userId: string, image: string, location: { lat: number; lng: number }) {
  try {
    const response = await fetch('/api/attendance/clock-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, image, location })
    })
    if (!response.ok) {
      throw new Error('Clock out failed')
    }
    return await response.json()
  } catch (error) {
    console.error('Error clocking out:', error)
    throw error
  }
}

// Office location coordinates
const OFFICE_LAT = 6.292335456278995
const OFFICE_LNG = 99.78658827444191
const ALLOWED_RADIUS_METERS = 150 // 150 meters radius

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLng = (lng2 - lng1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in meters
}

// Check if a location is within the allowed radius
export function checkLocationAccess(location: { lat: number; lng: number }): boolean {
  const distance = calculateDistance(
    OFFICE_LAT,
    OFFICE_LNG,
    location.lat,
    location.lng
  )
  return distance <= ALLOWED_RADIUS_METERS
}

// Get current location (for backward compatibility)
export async function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
      },
      () => {
        resolve(null)
      },
      { timeout: 10000, maximumAge: 0 }
    )
  })
}

