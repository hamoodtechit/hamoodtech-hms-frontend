"use client"

import { PatientSearch } from "@/components/pharmacy/pos/patient-search"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCreateRequisition, useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { cn } from "@/lib/utils"
import { useStoreContext } from "@/store/use-store-context"
import { DiagnosticTest } from "@/types/diagnostic"
import { Patient } from "@/types/pharmacy"
import { Check, ChevronsUpDown, Loader2, Microscope, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface RequisitionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function RequisitionDialog({ open, onOpenChange, onSuccess }: RequisitionDialogProps) {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null)
    const [testSearchOpen, setTestSearchOpen] = useState(false)
    const [testQuery, setTestQuery] = useState("")

    const { activeStoreId } = useStoreContext()
    const { data: testsRes, isLoading: loadingTests } = useDiagnosticTests({
        search: testQuery,
        branchId: activeStoreId,
        limit: 50
    })

    const tests = testsRes?.data || []
    const createRequisition = useCreateRequisition()

    const handleCreate = async () => {
        if (!selectedPatient) return toast.error("Please select a patient")
        if (!selectedTest) return toast.error("Please select a diagnostic test")

        try {
            const payload = {
                patientId: selectedPatient.id,
                branchId: activeStoreId || "",
                diagnosticTestId: selectedTest.id
            }
            console.log("CREATING_REQUISITION_PAYLOAD:", payload)
            
            const res = await createRequisition.mutateAsync(payload)
            console.log("REQUISITION_CREATED_RESPONSE:", res)
            
            toast.success("Test requisition created successfully")
            setSelectedPatient(null)
            setSelectedTest(null)
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            toast.error("Failed to create requisition")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
                        <Microscope className="w-6 h-6 text-primary" />
                        Test Requisition
                    </DialogTitle>
                    <DialogDescription>
                        Search for a patient and prescribe clinical tests.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Patient Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <User className="w-3 h-3" /> Select Patient
                        </label>
                        <PatientSearch 
                            selectedPatient={selectedPatient}
                            onSelect={setSelectedPatient}
                        />
                        {selectedPatient && (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 transition-all">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner">
                                    {selectedPatient.name.charAt(0)}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-sm truncate">{selectedPatient.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                                        <Badge variant="outline" className="h-4 px-1 text-[8px] uppercase font-black">{selectedPatient.uhid}</Badge>
                                        {selectedPatient.phone}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Test Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Microscope className="w-3 h-3" /> Select Clinical Test
                        </label>
                        <Popover open={testSearchOpen} onOpenChange={setTestSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={testSearchOpen}
                                    className="w-full justify-between h-12 px-4 rounded-xl bg-muted/30 border-none hover:bg-muted/50 transition-all font-medium"
                                >
                                    {selectedTest ? (
                                        <span className="truncate">{selectedTest.name}</span>
                                    ) : (
                                        <span className="text-muted-foreground">Search test by name or code...</span>
                                    )}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[450px] p-0 rounded-xl overflow-hidden shadow-2xl border-primary/10" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput 
                                        placeholder="Type test name..." 
                                        value={testQuery}
                                        onValueChange={setTestQuery}
                                        className="h-12 border-none focus:ring-0"
                                    />
                                    <CommandList className="max-h-[300px]">
                                        {loadingTests && (
                                            <div className="p-4 flex items-center justify-center">
                                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                            </div>
                                        )}
                                        <CommandEmpty>No tests found.</CommandEmpty>
                                        <CommandGroup>
                                            {tests.map((test) => (
                                                <CommandItem
                                                    key={test.id}
                                                    value={test.id}
                                                    onSelect={() => {
                                                        setSelectedTest(test)
                                                        setTestSearchOpen(false)
                                                    }}
                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-primary/5 rounded-lg m-1 transition-colors"
                                                >
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-sm tracking-tight">{test.name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="h-4 px-1 text-[8px] font-black uppercase tracking-tighter">
                                                                {test.department?.name || 'General'}
                                                            </Badge>
                                                            <span className="text-[10px] text-primary font-black">Tk {test.price}</span>
                                                        </div>
                                                    </div>
                                                    <Check
                                                        className={cn(
                                                            "ml-auto h-4 w-4 text-primary",
                                                            selectedTest?.id === test.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/20 border-t">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)}
                        className="rounded-xl font-bold"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleCreate}
                        disabled={!selectedPatient || !selectedTest || createRequisition.isPending}
                        className="rounded-xl px-8 font-black shadow-lg shadow-primary/20"
                    >
                        {createRequisition.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm Requisition
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
