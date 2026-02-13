"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/store/use-sidebar-store"
import {
    Activity,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
    Pill,
    Settings,
    Shield,
    Users
} from "lucide-react"
import { useTranslations } from "next-intl"

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebarStore()
  const t = useTranslations("Sidebar")

  const routes = [
    {
      label: t("dashboard"),
      icon: LayoutDashboard,
      href: "/dashboard",
      color: "text-sky-400",
    },
    {
      label: t("patients"),
      icon: Users,
      href: "/patients",
      color: "text-violet-400",
    },
    {
      label: "Pharmacy",
      icon: Pill,
      href: "/pharmacy",
      color: "text-pink-400",
    },
    {
      label: t("appointments"),
      icon: CalendarDays,
      href: "/appointments",
      color: "text-orange-400",
    },
    {
      label: "Roles & Permissions",
      icon: Shield,
      href: "/settings/roles",
      color: "text-amber-400",
    },
    {
      label: t("settings"),
      icon: Settings,
      href: "/settings",
      color: "text-emerald-400",
    },
  ]

  return (
    <div className={cn(
        "hidden md:flex relative flex-col h-full bg-[#111827] text-white border-r border-white/10 transition-all duration-300 w-full"
    )}>
      {/* Brand Header */}
      <div className="flex items-center h-20 px-6 border-b border-white/10 bg-[#111827]">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-600 shadow-lg shadow-primary/20">
             <Activity className="w-6 h-6 text-white" />
          </div>
          {isOpen && (
             <div className="flex flex-col animate-in fade-in duration-300">
                <h1 className="text-xl font-bold tracking-tight">
                    Medi<span className="text-primary">Care</span>
                </h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Pro Admin</p>
             </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-6 px-3">
        <div className="space-y-2">
          {routes.map((route) => {
             const isActive = pathname === route.href || pathname.startsWith(`${route.href}/`)
             return (
                <Link
                key={route.href}
                href={route.href}
                className={cn(
                    "relative flex items-center p-3 rounded-xl transition-all duration-200 group overflow-hidden",
                    isActive 
                        ? "bg-white/10 text-white shadow-md backdrop-blur-sm" 
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
                >
                {isActive && (
                    <div className="absolute left-0 w-1 h-8 bg-primary rounded-r-full" />
                )}
                
                <div className={cn("flex items-center flex-1", !isOpen && "justify-center")}>
                    <route.icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", route.color, isOpen && "mr-3")} />
                    {isOpen && <span className="font-medium text-sm">{route.label}</span>}
                </div>
                
                {/* Hover Glow Effect */}
                {!isActive && (
                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gradient-to-r from-white/5 to-transparent transition-opacity pointer-events-none" />
                )}
                </Link>
             )
          })}
        </div>
      </ScrollArea>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-white/10 bg-[#0f1523]">
        <Button 
            variant="ghost" 
            className={cn(
                "w-full text-zinc-400 hover:text-white hover:bg-white/5", 
                !isOpen && "px-2"
            )}
            onClick={toggle}
        >
             {isOpen ? (
                 <div className="flex items-center w-full">
                     <ChevronLeft className="h-5 w-5 mr-2" />
                     <span>Collapse Sidebar</span>
                 </div>
             ) : (
                 <ChevronRight className="h-5 w-5" />
             )}
        </Button>
      </div>
    </div>
  )
}
