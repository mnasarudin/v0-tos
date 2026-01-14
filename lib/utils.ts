import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Department code mapping for request numbers
const DEPARTMENT_CODES: Record<string, string> = {
  "Administration": "ADM",
  "Finance": "FIN",
  "Operation": "OPS",
  "Operations": "OPS",
  "Safety": "SAF",
  "Technical": "TEC",
  "IT": "IT-",
  "GM Office": "GMO",
  "Head Office": "HDO",
  "Assistant Head Office": "AHO",
  "Procurement": "PRO",
  "HR": "HR-"
}

/**
 * Generates a unique request number based on department
 * Format: PR-{DEPARTMENT_CODE}-{YEAR}-{SEQUENCE}
 * Example: PR-ADM-2024-001, PR-FIN-2024-001
 */
export function generateRequestNumber(department: string): string {
  // Get department code, default to first 3 uppercase letters if not found
  const deptCode = DEPARTMENT_CODES[department] || 
    department.substring(0, 3).toUpperCase().padEnd(3, 'X')
  
  const year = new Date().getFullYear()
  
  // Get existing PRs from localStorage to determine sequence
  if (typeof window !== "undefined") {
    try {
      const existingPRs = JSON.parse(localStorage.getItem("app.prs") || "[]")
      
      // Filter PRs for the same department and year
      const deptPRs = existingPRs.filter((pr: any) => {
        const prDept = pr.department || ""
        const prCode = DEPARTMENT_CODES[prDept] || prDept.substring(0, 3).toUpperCase().padEnd(3, 'X')
        return prCode === deptCode
      })
      
      // Extract sequence numbers from existing PRs
      const sequenceNumbers = deptPRs
        .map((pr: any) => {
          const requestNo = pr.requestNo || ""
          // Match pattern: PR-{CODE}-{YEAR}-{NUMBER}
          const match = requestNo.match(new RegExp(`PR-${deptCode}-${year}-(\\d+)`))
          return match ? parseInt(match[1], 10) : 0
        })
        .filter((num: number) => num > 0)
      
      // Get next sequence number
      const nextSequence = sequenceNumbers.length > 0 
        ? Math.max(...sequenceNumbers) + 1 
        : 1
      
      return `PR-${deptCode}-${year}-${String(nextSequence).padStart(3, '0')}`
    } catch (error) {
      // Fallback if localStorage access fails
      const random = Math.floor(1000 + Math.random() * 9000)
      return `PR-${deptCode}-${year}-${String(random).substring(0, 3)}`
    }
  }
  
  // Fallback for server-side rendering
  const random = Math.floor(1000 + Math.random() * 9000)
  return `PR-${deptCode}-${year}-${String(random).substring(0, 3)}`
}