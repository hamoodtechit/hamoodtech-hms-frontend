"use client"

import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { UserNav } from "@/components/layout/user-nav"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { ModeToggle } from "@/components/ui/theme-toggle"
import { useActiveSession } from "@/hooks/pharmacy-queries"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { Bell, PlayCircle, Search } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)
  const { activeStoreId } = useStoreContext()
  const { data: sessionResponse } = useActiveSession(activeStoreId || "")
  const activeSession = sessionResponse?.data

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8 gap-2 md:gap-4">
        <MobileSidebar />
        {/* StoreSwitcher moved to Settings page */}
        
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground mr-4 overflow-hidden">
             <Breadcrumb>
                <BreadcrumbList className="flex-nowrap">
                    <BreadcrumbItem className="hidden sm:block">
                        <BreadcrumbLink asChild>
                            <Link href="/dashboard">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {paths.filter(p => p !== "dashboard").map((path, index, arr) => {
                        const href = `/${arr.slice(0, index + 1).join('/')}`;
                        const isLast = index === arr.length - 1;
                        const isSecondToLast = index === arr.length - 2;
                        
                        return (
                            <div key={path} className="flex items-center">
                                <BreadcrumbSeparator className={cn(
                                    index === 0 && "hidden sm:block",
                                    !isLast && !isSecondToLast && "hidden lg:block"
                                )} />
                                <BreadcrumbItem className={cn(
                                    isLast ? "block" : "hidden lg:block",
                                    isSecondToLast && "hidden sm:block"
                                )}>
                                    {isLast ? (
                                        <BreadcrumbPage className="capitalize font-semibold text-primary max-w-[120px] truncate sm:max-w-none">{path}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={href} className="capitalize">{path}</Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </div>
                        );
                    })}
                </BreadcrumbList>
            </Breadcrumb>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
            {/* Session Indicator & Quick POS */}
            {activeSession && activeSession.status === 'open' && (
                <Link href="/pharmacy/pos">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="hidden sm:flex items-center gap-2 border-emerald-500/50 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 transition-all animate-in fade-in slide-in-from-right-4 duration-500"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 pulse-fast"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="font-semibold tracking-wide">POS ACTIVE</span>
                        <PlayCircle className="h-4 w-4 ml-1" />
                    </Button>
                </Link>
            )}

            {/* Global Search */}
            <div className="relative w-32 sm:w-48 lg:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-9 h-9 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </Button>

            <div className="h-6 w-px bg-border mx-1" />

            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <ModeToggle />
                <UserNav />
            </div>
        </div>
      </div>
    </header>
  )
}
