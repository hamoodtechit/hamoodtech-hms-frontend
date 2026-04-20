"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Filter, X } from "lucide-react"

interface FilterPopoverProps {
    children: React.ReactNode
    activeFilterCount?: number
    onReset: () => void
    title?: string
    className?: string
}

export function FilterPopover({
    children,
    activeFilterCount = 0,
    onReset,
    title = "Advanced Filters",
    className = "w-[80vw] sm:w-[500px] md:w-[700px]"
}: FilterPopoverProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2 h-9">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1 text-[10px] flex items-center justify-center bg-primary text-primary-foreground">
                            {activeFilterCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className={`${className} p-0 shadow-xl`} align="end">
                <div className="flex items-center justify-between border-b p-4 pb-2 mb-0">
                    <h4 className="font-semibold text-sm uppercase tracking-wider">{title}</h4>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onReset} 
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive gap-1"
                    >
                        <X className="h-3 w-3" />
                        Reset All
                    </Button>
                </div>
                <ScrollArea className="max-h-[70vh] p-4 pt-1">
                    {children}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
