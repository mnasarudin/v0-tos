"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getCurrentUser } from "@/lib/auth"
import { useEffect, useState } from "react"
import { Notifications } from "@/components/notifications"
import { Menu } from "lucide-react"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    fetchUser()
  }, [])

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
      <div className="flex h-full items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden h-9 w-9 p-0"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-base sm:text-lg font-semibold text-[#008B8B] truncate">
            Intern Attendance System
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Notifications variant={user?.isAdmin ? 'admin' : 'intern'} />

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium truncate max-w-[120px] md:max-w-none">
                {user?.fullName || user?.username || "Admin"}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px] md:max-w-none">
                {user?.username || user?.email || ""}
              </p>
            </div>
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              {user?.profilePhoto && (
                <AvatarImage src={user.profilePhoto} alt={user?.fullName || user?.username} />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                {(user?.fullName || user?.username || "A")?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
