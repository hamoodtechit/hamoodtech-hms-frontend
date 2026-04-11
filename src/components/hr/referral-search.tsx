"use client"

import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { hrService } from "@/services/hr-service"
import { ReferralPerson } from "@/types/hr"
import { Check, ChevronsUpDown, Plus, UserCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useDebounce } from "use-debounce"
import { ReferralPersonDialog } from "./referral-person-dialog"
import { useStoreContext } from "@/store/use-store-context"

interface ReferralSearchProps {
  selectedReferralId: string | null
  onSelect: (referral: ReferralPerson | null) => void
}

export function ReferralSearch({ selectedReferralId, onSelect }: ReferralSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery] = useDebounce(query, 500)
  const [referrals, setReferrals] = useState<ReferralPerson[]>([])
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { activeStoreId } = useStoreContext()

  const selectedReferral = referrals.find(r => r.id === selectedReferralId)

  const searchReferrals = async (query: string) => {
    try {
      setLoading(true)
      const response = await hrService.getReferrals({ 
          search: query, 
          limit: 10,
          branchId: activeStoreId || undefined
      })
      setReferrals(response.data || [])
    } catch (error) {
      console.error("Failed to search referrals", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    searchReferrals(debouncedQuery)
  }, [debouncedQuery, activeStoreId])

  const handleReferralCreated = (referral: ReferralPerson) => {
      onSelect(referral)
      setCreateDialogOpen(false)
  }

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 text-xs font-medium"
        >
          {selectedReferral ? (
              <div className="flex items-center text-left">
                  <UserCircle className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <div className="flex flex-col">
                      <span className="font-medium">{selectedReferral.name}</span>
                      <span className="text-[10px] text-muted-foreground">{selectedReferral.phone}</span>
                  </div>
              </div>
          ) : (
            "Select Referral Person (Optional)"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="p-2 border-b">
            <Button 
                variant="outline" 
                className="w-full justify-start font-normal text-primary hover:text-primary hover:bg-primary/5 border-dashed text-xs" 
                size="sm"
                onClick={() => {
                    setOpen(false)
                    setCreateDialogOpen(true)
                }}
            >
                <Plus className="mr-2 h-4 w-4" /> Create New Referral
            </Button>
          </div>
          <CommandInput 
            placeholder="Search referral by name or phone..." 
            value={query}
            onValueChange={setQuery}
            className="text-xs"
          />
          <CommandEmpty>
              {loading ? (
                  <div className="p-2 space-y-2">
                      <div className="flex items-center gap-2 px-2 py-1.5">
                          <Skeleton className="h-4 w-4 rounded-sm" />
                          <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                          </div>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5">
                          <Skeleton className="h-4 w-4 rounded-sm" />
                          <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                          </div>
                      </div>
                  </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-6">No referral found.</p>
              )}
          </CommandEmpty>
          <CommandGroup>
            {(referrals || []).map((referral) => (
              <CommandItem
                key={referral.id}
                value={referral.id}
                onSelect={() => {
                  onSelect(referral)
                  setOpen(false)
                }}
                className="text-xs"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedReferralId === referral.id ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="flex flex-col">
                    <span className="font-medium">{referral.name}</span>
                    <span className="text-[10px] text-muted-foreground">{referral.phone}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>

    <ReferralPersonDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onSuccess={handleReferralCreated} 
    />
    </>
  )
}
