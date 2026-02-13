"use client"

import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/use-sidebar-store"

export default function DashboardShell({
  children,
  sidebar,
  header
}: {
  children: React.ReactNode
  sidebar: React.ReactNode
  header: React.ReactNode
}) {
  const { isOpen } = useSidebarStore()

  return (
    <div className="relative h-full">
      {/* Sidebar Wrapper (Fixed) */}
      <div className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 transition-all duration-300",
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
        <div className="p-4 md:p-8 h-full">
            {children}
        </div>
      </main>

      {/* Mobile Layout (simplified, sidebar is handled by header/sheet, main content flows normally) */}
      <div className="md:hidden min-h-screen bg-background">
          {/* Header is likely already rendered above in 'main' for desktop, but for mobile structure we might need adjustments. 
             Wait, the original code had Header inside Main. On mobile, 'hidden md:flex' hides the sidebar wrapper. 
             'md:ml-72' only applies on md. So on mobile, margin is 0. 
             This single 'main' block works for mobile too! 
             I will remove the specific mobile div block as it's redundant if main handles it correctly. 
          */}
      </div>
    </div>
  )
}
