"use client"

import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/use-sidebar-store"
import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { NotificationTicker } from "./notification-ticker"
import { NoticeDetailModal } from "../communication/notice-detail-modal"

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
  const pathname = usePathname()

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
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-40 bg-white dark:bg-sidebar border-r border-zinc-200 dark:border-sidebar-border transition-all duration-300",
        isOpen ? "md:w-60" : "md:w-18"
      )}>
        {sidebar}
      </div>

      {/* Main Content Wrapper (Margin Left) */}
      <main className={cn(
        "transition-all duration-300 min-h-screen bg-background flex flex-col",
        isOpen ? "md:ml-60" : "md:ml-18"
      )}>
        {header}
        {pathname.endsWith("/dashboard") && <NotificationTicker />}
        <div className="p-3 sm:p-4 md:p-8 flex-1 overflow-auto">
            {children}
        </div>
      </main>

      <NoticeDetailModal />
    </div>
  )
}
