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
import { patientService } from "@/services/patient-service"
import { Patient } from "@/types/pharmacy"
import { Check, ChevronsUpDown, Loader2, Plus, User } from "lucide-react"
import { useEffect, useState } from "react"
import { useDebounce } from "use-debounce"
import { CreatePatientDialog } from "./create-patient-dialog"

interface PatientSearchProps {
  selectedPatient: Patient | null
  onSelect: (patient: Patient | null) => void
}

export function PatientSearch({ selectedPatient, onSelect }: PatientSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [debouncedQuery] = useDebounce(query, 500)
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  useEffect(() => {
    if (open) {
        searchPatients(debouncedQuery)
    }
  }, [debouncedQuery, open])

  const searchPatients = async (query: string) => {
    try {
      setLoading(true)
      // Check if query is a number (phone) or text (name)
      const isPhone = /^\d+$/.test(query)
      const params = isPhone ? { phone: query } : { name: query }
      
      const response = await patientService.getPatients({ ...params, limit: 10 })
      setPatients(response.data || [])
    } catch (error) {
      console.error("Failed to search patients", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePatientCreated = (patient: Patient) => {
      onSelect(patient)
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
          className="w-full justify-between"
        >
          {selectedPatient ? (
              <div className="flex items-center text-left">
                  <User className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <div className="flex flex-col">
                      <span className="font-medium">{selectedPatient.name}</span>
                      <span className="text-xs text-muted-foreground">{selectedPatient.phone}</span>
                  </div>
              </div>
          ) : (
            "Select customer / patient..."
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search patient by name or phone..." 
            value={query}
            onValueChange={setQuery}
          />
          <CommandEmpty>
              {loading ? (
                  <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Searching...
                  </div>
              ) : (
                <div className="p-2">
                    <p className="text-sm text-center text-muted-foreground py-2">No patient found.</p>
                    <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => {
                            setOpen(false)
                            setCreateDialogOpen(true)
                        }}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create New Patient
                    </Button>
                </div>
              )}
          </CommandEmpty>
          <CommandGroup>
            {(patients || []).map((patient) => (
              <CommandItem
                key={patient.id}
                value={patient.id}
                onSelect={() => {
                  onSelect(patient)
                  setOpen(false)
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${
                    selectedPatient?.id === patient.id ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div className="flex flex-col">
                    <span>{patient.name}</span>
                    <span className="text-xs text-muted-foreground">{patient.phone}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>

    <CreatePatientDialog 
        open={createDialogOpen} 
        onOpenChange={setCreateDialogOpen} 
        onSuccess={handlePatientCreated} 
    />
    </>
  )
}
