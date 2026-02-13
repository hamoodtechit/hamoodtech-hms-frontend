"use client"

import { Check, ChevronsUpDown, Store } from "lucide-react"
import * as React from "react"

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
import { useStoreContext } from "@/store/use-store-context"

export function StoreSwitcher({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)
  const { stores, activeStoreId, setActiveStore } = useStoreContext()
  
  const selectedStore = stores.find((store) => store.id === activeStoreId)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[250px] justify-between", className)}
        >
          <Store className="mr-2 h-4 w-4" />
          {selectedStore ? selectedStore.name : "Select store..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search store..." />
          <CommandList>
            <CommandEmpty>No store found.</CommandEmpty>
            <CommandGroup>
              {stores.map((store) => (
                <CommandItem
                  key={store.id}
                  value={store.name}
                  onSelect={() => {
                    setActiveStore(store.id)
                    setOpen(false)
                    // Simulate reload/context switch
                    console.log(`Switched to ${store.name}`)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      activeStoreId === store.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {store.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
