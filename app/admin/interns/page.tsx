"use client"

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminGuard } from '@/components/auth-guard'
import { AdminLayout } from '@/components/admin-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Search, Download, Printer, ArrowUpDown } from 'lucide-react'
import { getCurrentUser, DEPARTMENTS } from '@/lib/auth'
import { toast } from 'sonner'
import { exportTableToPDF, exportTableToCSV } from '@/lib/pdf-export'

export default function AdminInternsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [allInterns, setAllInterns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'all' | 'mine'>('all')
  const [sortColumn, setSortColumn] = useState<'name' | 'department' | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    const view = searchParams.get('view') as 'all' | 'mine' | null
    if (view === 'all' || view === 'mine') {
      setViewMode(view)
    }
    
    getCurrentUser().then(user => {
      setCurrentUser(user)
      fetchInterns(user, view)
    })
  }, [searchParams])

  const fetchInterns = async (user?: any, view?: string | null) => {
    try {
      setLoading(true)
      const res = await fetch('/api/auth/interns')
      const data = await res.json()
      
      if (data.success && data.interns) {
        let interns = data.interns || []
        
        if (view === 'mine' && user?.department) {
          const dept = (user.department || '').trim().toLowerCase()
          interns = interns.filter((intern: any) => 
            (intern.department || '').trim().toLowerCase() === dept
          )
        }
        
        setAllInterns(interns)
      } else {
        setAllInterns([])
      }
    } catch (error) {
      console.error('Error fetching interns:', error)
      toast.error('Failed to load interns')
      setAllInterns([])
    } finally {
      setLoading(false)
    }
  }

  const filteredInterns = useMemo(() => {
    let result = allInterns
    
    if (departmentFilter) {
      result = result.filter(intern => 
        (intern.department || '').trim().toLowerCase() === departmentFilter.trim().toLowerCase()
      )
    }
    
    if (statusFilter) {
      if (statusFilter === 'active') {
        result = result.filter(intern => 
          intern.isActive !== 0 && intern.isActive !== false && intern.isActive !== '0'
        )
      } else if (statusFilter === 'inactive') {
        result = result.filter(intern => 
          intern.isActive === 0 || intern.isActive === false || intern.isActive === '0'
        )
      }
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(intern =>
        (intern.fullName || '').toLowerCase().includes(searchLower) ||
        (intern.email || '').toLowerCase().includes(searchLower) ||
        (intern.phoneNumber || '').toLowerCase().includes(searchLower) ||
        (intern.emergencyContactPhone || '').toLowerCase().includes(searchLower)
      )
    }
    
    // Sort
    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let aVal = ''
        let bVal = ''
        
        if (sortColumn === 'name') {
          aVal = (a.fullName || '').toLowerCase()
          bVal = (b.fullName || '').toLowerCase()
        } else if (sortColumn === 'department') {
          aVal = (a.department || '').toLowerCase()
          bVal = (b.department || '').toLowerCase()
        }
        
        if (sortDirection === 'asc') {
          return aVal.localeCompare(bVal)
        } else {
          return bVal.localeCompare(aVal)
        }
      })
    }
    
    return result
  }, [allInterns, search, departmentFilter, statusFilter, sortColumn, sortDirection])

  const handleSort = (column: 'name' | 'department') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const handleExportPDF = () => {
    exportTableToPDF({
      title: "Interns Management",
      headers: ["Name", "Email", "Department", "Status"],
      data: filteredInterns.map(intern => [
        intern.fullName || '-',
        intern.email || '-',
        intern.department || '-',
        (intern.isActive !== 0 && intern.isActive !== false && intern.isActive !== '0') ? 'Active' : 'Inactive'
      ]),
      filename: "interns_management.pdf"
    })
  }

  const handleExportCSV = () => {
    exportTableToCSV({
      headers: ["Name", "Email", "Department", "Status"],
      data: filteredInterns.map(intern => [
        intern.fullName || '-',
        intern.email || '-',
        intern.department || '-',
        (intern.isActive !== 0 && intern.isActive !== false && intern.isActive !== '0') ? 'Active' : 'Inactive'
      ]),
      filename: "interns_management.csv"
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <AdminGuard>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#008B8B] mx-auto mb-2"></div>
              <p className="text-gray-600">Loading interns...</p>
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
          <div>
            <p className="text-sm text-gray-500 mb-1">Intern Attendance System</p>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Interns Management</h1>
                {currentUser && (
                  <p className="text-sm text-gray-600 mt-1">
                    Viewing as {currentUser.fullName} ({currentUser.department || 'No Department'})
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs and Filters */}
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('all')
                  router.push('/admin/interns?view=all')
                }}
                className={viewMode === 'all' ? 'bg-[#008B8B] text-white hover:bg-[#006666]' : ''}
              >
                All Interns
              </Button>
              {currentUser?.department && (
                <Button
                  variant={viewMode === 'mine' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setViewMode('mine')
                    router.push('/admin/interns?view=mine')
                  }}
                  className={viewMode === 'mine' ? 'bg-[#008B8B] text-white hover:bg-[#006666]' : ''}
                >
                  My Interns
                </Button>
              )}
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[300px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="min-w-[180px]">
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008B8B] focus:border-transparent"
                >
                  <option value="">All Departments</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="min-w-[150px]">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#008B8B] focus:border-transparent"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interns Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Profile</th>
                    <th 
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Email</th>
                    <th 
                      className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('department')}
                    >
                      <div className="flex items-center gap-1">
                        Department
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInterns.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-500 text-sm">
                        {allInterns.length === 0
                          ? 'No interns found'
                          : 'No interns match your search criteria'}
                      </td>
                    </tr>
                  ) : (
                    filteredInterns.map(intern => (
                      <tr 
                        key={intern.id} 
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => router.push(`/admin/interns/${intern.id}`)}
                      >
                        <td className="p-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={intern.profilePhoto} alt={intern.fullName} />
                            <AvatarFallback className="bg-[#008B8B]/10 text-[#008B8B]">
                              {getInitials(intern.fullName || intern.username || '?')}
                            </AvatarFallback>
                          </Avatar>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-gray-900">{intern.fullName || '-'}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-gray-600">{intern.email || '-'}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-gray-600">{intern.department || '-'}</p>
                        </td>
                        <td className="p-4">
                          {(intern.isActive !== 0 && intern.isActive !== false && intern.isActive !== '0') ? (
                            <Badge className="bg-[#008B8B] text-white">Active</Badge>
                          ) : (
                            <Badge className="bg-gray-200 text-gray-700">Inactive</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminGuard>
  )
}
