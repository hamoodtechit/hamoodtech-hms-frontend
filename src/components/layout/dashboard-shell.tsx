"use client"

import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/use-sidebar-store"
import { useEffect } from "react"

export default function DashboardShell({
  children,
  sidebar,
  header
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  header: React.ReactNode
}) {
  const { isOpen, setOpen } = useSidebarStore()

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setOpen(false)
      } else {
        setOpen(true)
      }
    }

    // Initial check
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [setOpen])

  return (
    <div className="relative h-full">
      {/* Sidebar Wrapper (Fixed) */}
      <div className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40 bg-gray-900 transition-all duration-300",
        isOpen ? "md:w-72" : "md:w-20"
      )}>
        {sidebar}
      </div>

      {/* Main Content Wrapper (Margin Left) */}
      <main className={cn(
        "transition-all duration-300 min-h-screen bg-background",
        isOpen ? "md:ml-72" : "md:ml-20"
      )}>
        {header}
        <div className="p-3 sm:p-4 md:p-8 h-full">
            {children}
        </div>
      </main>

    </div>
  )
}
