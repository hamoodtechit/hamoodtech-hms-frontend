"use client"

import { StoreSwitcher } from "@/components/layout/store-switcher"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import {
    Activity,
    CalendarDays,
    LayoutDashboard,
    Menu,
    Pill,
    Settings,
    Users
} from "lucide-react"
import { useEffect, useState } from "react"

export function MobileSidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 border-r-0 bg-[#111827] text-white w-72">
        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
        <SidebarBase />
      </SheetContent>
    </Sheet>
  )
}

function SidebarBase() {
    // Custom mobile implementation to avoid store conflict and collapse button
  const pathname = usePathname()
  
  const routes = [
    { label: "Dashboard",   icon: LayoutDashboard, href: "/dashboard", color: "text-sky-400" },
    { label: "Patients",    icon: Users,           href: "/patients",  color: "text-violet-400" },
    { label: "Pharmacy",    icon: Pill,            href: "/pharmacy",  color: "text-pink-400" },
    { label: "Appointments",icon: CalendarDays,    href: "/appointments",color: "text-orange-400" },
    { label: "Settings",    icon: Settings,        href: "/settings",  color: "text-emerald-400" },
  ]

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white">
      <div className="flex items-center h-20 px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
             <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 shadow-lg shadow-primary/20">
                <Activity className="w-6 h-6 text-white" />
             </div>
             <h1 className="text-xl font-bold tracking-tight">
                Medi<span className="text-primary">Care</span>
             </h1>
          </div>
      </div>

      <div className="px-6 py-4">
        <StoreSwitcher className="w-full" />
      </div>

      <div className="flex-1 py-6 px-3 space-y-2">
        {routes.map((route) => (
            <Link
            key={route.href}
            href={route.href}
            className={cn(
                "flex items-center p-3 rounded-xl transition-all duration-200 group",
                pathname.startsWith(route.href)
                    ? "bg-white/10 text-white shadow-md backdrop-blur-sm" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
            >
                <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                <span className="font-medium text-sm">{route.label}</span>
            </Link>
        ))}
      </div>
    </div>
  )
}
