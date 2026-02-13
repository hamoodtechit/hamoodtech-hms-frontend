"use client"

import { MobileSidebar } from "@/components/layout/mobile-sidebar"
import { StoreSwitcher } from "@/components/layout/store-switcher"
import { UserNav } from "@/components/layout/user-nav"
import { Badge } from "@/components/ui/badge"
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
import { usePathname } from "@/i18n/navigation"
import { Bell, Search } from "lucide-react"

export function Header() {
  const pathname = usePathname()
  const paths = pathname.split('/').filter(Boolean)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4 md:px-8 gap-2 md:gap-4">
        <MobileSidebar />
        <StoreSwitcher className="hidden md:flex mr-2" />
        
        {/* Breadcrumbs */}
        <div className="hidden lg:flex items-center text-sm text-muted-foreground">
             <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    {paths.filter(p => p !== "dashboard").map((path, index) => (
                        <div key={path} className="flex items-center">
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {index === paths.length - 2 ? (
                                    <BreadcrumbPage className="capitalize font-semibold text-primary">{path}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink href={`/${path}`} className="capitalize">{path}</BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </div>
                    ))}
                </BreadcrumbList>
            </Breadcrumb>
        </div>

        <div className="ml-auto flex items-center gap-2 md:gap-4">
            {/* Global Search */}
            <div className="relative w-32 sm:w-64 lg:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search (Ctrl + K)"
                  className="pl-9 h-9 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
                <div className="absolute right-2 top-2 flex gap-1">
                    <Badge variant="outline" className="h-5 px-1 text-[10px] text-muted-foreground">⌘</Badge>
                    <Badge variant="outline" className="h-5 px-1 text-[10px] text-muted-foreground">K</Badge>
                </div>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </Button>

            <div className="h-6 w-px bg-border mx-2" />

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
