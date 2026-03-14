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
import { CommissionAgent } from "@/types/hr"
import { Check, ChevronsUpDown, Plus, UserCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { useDebounce } from "use-debounce"
import { CommissionAgentDialog } from "./commission-agent-dialog"
import { useStoreContext } from "@/store/use-store-context"

interface CommissionAgentSearchProps {
  selectedAgentId: string | null
  onSelect: (agent: CommissionAgent | null) => void
}

export function CommissionAgentSearch({ selectedAgentId, onSelect }: CommissionAgentSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery] = useDebounce(query, 500)
  const [agents, setAgents] = useState<CommissionAgent[]>([])
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { activeStoreId } = useStoreContext()

  const selectedAgent = agents.find(a => a.id === selectedAgentId)

  useEffect(() => {
    if (open) {
        searchAgents(debouncedQuery)
    }
  }, [debouncedQuery, open, activeStoreId])

  const searchAgents = async (query: string) => {
    try {
      setLoading(true)
      const response = await hrService.getCommissionAgents({ 
          search: query, 
          limit: 10,
          branchId: activeStoreId || undefined
      })
      setAgents(response.data || [])
    } catch (error) {
      console.error("Failed to search agents", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgentCreated = (agent: CommissionAgent) => {
      onSelect(agent)
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
          {selectedAgent ? (
              <div className="flex items-center text-left">
                  <UserCircle className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <div className="flex flex-col">
                      <span className="font-medium">{selectedAgent.name}</span>
                      <span className="text-[10px] text-muted-foreground">{selectedAgent.phone}</span>
                  </div>
              </div>
          ) : (
            "Select Commission Agent (Optional)"
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
                <Plus className="mr-2 h-4 w-4" /> Create New Agent
            </Button>
          </div>
          <CommandInput 
            placeholder="Search agent by name or phone..." 
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
                <p className="text-xs text-center text-muted-foreground py-6">No agent found.</p>
              )}
          </CommandEmpty>
          <CommandGroup>
            {(agents || []).map((agent) => (
              <CommandItem
                key={agent.id}
                value={agent.id}
                onSelect={() => {
                  onSelect(agent)
                  setOpen(false)
                }}
                className="text-xs"
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedAgentId === agent.id ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="flex flex-col">
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-[10px] text-muted-foreground">{agent.phone}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>

    <CommissionAgentDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onSuccess={handleAgentCreated} 
    />
    </>
  )
}
