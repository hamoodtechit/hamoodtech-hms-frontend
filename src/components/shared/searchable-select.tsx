"use client"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown, Loader2, Plus } from "lucide-react"
import { useState } from "react"

interface SearchableSelectProps {
    value?: string
    onChange: (value: string) => void
    options: { id: string; name: string }[]
    placeholder?: string
    searchPlaceholder?: string
    emptyMessage?: string
    loading?: boolean
    onSearchChange?: (search: string) => void
    onAddClick?: () => void
    addLabel?: string
    className?: string
    allLabel?: string
    showAll?: boolean
    disabled?: boolean
}

export function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = "Select option...",
    searchPlaceholder = "Search...",
    emptyMessage = "No option found.",
    loading = false,
    onSearchChange,
    onAddClick,
    addLabel = "Add New",
    className,
    allLabel = "All",
    showAll = true,
    disabled = false
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false)
    const [selectedLabel, setSelectedLabel] = useState("")

    const selectedOption = options.find((opt) => opt.id === value)
    const displayLabel = selectedOption?.name || selectedLabel || (showAll && !value ? allLabel : placeholder)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between font-normal h-9 text-xs", className)}
                >
                    <span className="truncate">{displayLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0" align="start">
                <Command shouldFilter={!onSearchChange}>
                    <CommandInput 
                        placeholder={searchPlaceholder} 
                        onValueChange={onSearchChange}
                    />
                    {onAddClick && (
                        <div className="border-b p-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-xs text-primary h-8"
                                onClick={() => {
                                    setOpen(false)
                                    onAddClick()
                                }}
                            >
                                <Plus className="h-3 w-3 mr-2" />
                                {addLabel}
                            </Button>
                        </div>
                    )}
                    <CommandList>
                        {loading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Searching...
                            </div>
                        ) : (
                            <>
                                <CommandEmpty>{emptyMessage}</CommandEmpty>
                                <CommandGroup>
                                    {showAll && (
                                        <CommandItem
                                            onSelect={() => {
                                                onChange("")
                                                setSelectedLabel("")
                                                setOpen(false)
                                            }}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", !value ? "opacity-100" : "opacity-0")} />
                                            {allLabel}
                                        </CommandItem>
                                    )}
                                    {options.map((opt) => (
                                        <CommandItem
                                            key={opt.id}
                                            onSelect={() => {
                                                onChange(opt.id)
                                                setSelectedLabel(opt.name)
                                                setOpen(false)
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    value === opt.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {opt.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
