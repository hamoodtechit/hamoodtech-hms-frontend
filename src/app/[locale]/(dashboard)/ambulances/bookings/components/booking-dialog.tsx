"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useCreateAmbulanceBooking, useUpdateAmbulanceBooking } from "@/hooks/ambulance-booking-queries"
import { useAmbulances } from "@/hooks/ambulance-queries"
import { usePatients } from "@/hooks/patient-queries"
import { useStoreContext } from "@/store/use-store-context"
import { AmbulanceBooking, AmbulanceBookingPayload } from "@/types/ambulance"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, UserPlus, Banknote, CreditCard, Percent } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { PatientDialog } from "@/components/patients/patient-dialog"

const bookingSchema = z.object({
    branchId: z.string().min(1, "Branch is required"),
    ambulanceId: z.string().min(1, "Ambulance selection is required"),
    patientId: z.string().optional(),
    patientName: z.string().min(1, "Patient name is required"),
    patientAddress: z.string().optional(),
    pickupLocation: z.string().min(1, "Pickup location is required"),
    dropoffLocation: z.string().min(1, "Drop-off location is required"),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    guardianRelation: z.string().optional(),
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]),
    note: z.string().optional(),
    totalFare: z.coerce.number().optional(),
    discountAmount: z.coerce.number().optional(),
    paidAmount: z.coerce.number().optional(),
    paymentAmount: z.coerce.number().optional(),
    accountId: z.string().optional(),
}).superRefine((data, ctx) => {
    if ((data.paidAmount ?? 0) > 0 || (data.paymentAmount ?? 0) > 0) {
        if (!data.accountId) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Account is required when collecting payment",
                path: ["accountId"],
            });
        }
    }
})

interface BookingDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    bookingToEdit?: AmbulanceBooking | null
}

export function BookingDialog({ open, onOpenChange, bookingToEdit }: BookingDialogProps) {
    const { activeStoreId, stores } = useStoreContext()
    const [patientDialogOpen, setPatientDialogOpen] = useState(false)

    const createMutation = useCreateAmbulanceBooking()
    const updateMutation = useUpdateAmbulanceBooking()

    // Fetch ambulances for selection (limit to current branch if possible)
    const { data: ambulanceRes } = useAmbulances({ 
        branchId: activeStoreId || undefined,
        limit: 100 
    })
    const ambulances = Array.isArray(ambulanceRes?.data) 
        ? ambulanceRes.data 
        : ((ambulanceRes?.data as any)?.ambulances || [])

    const { data: patientsRes } = usePatients({ limit: 100 })
    const patients = Array.isArray(patientsRes?.data) ? patientsRes.data : []

    const { data: accountsRes } = useFinanceAccounts({ 
        branchId: activeStoreId || undefined,
        limit: 100 
    })
    const accounts = Array.isArray(accountsRes?.data) ? accountsRes.data : []

    const form = useForm<z.infer<typeof bookingSchema>>({
        resolver: zodResolver(bookingSchema) as any,
        defaultValues: {
            branchId: activeStoreId || "",
            ambulanceId: "",
            patientId: "",
            patientName: "",
            patientAddress: "",
            pickupLocation: "",
            dropoffLocation: "",
            guardianName: "",
            guardianPhone: "",
            guardianRelation: "",
            status: "pending",
            note: "",
            totalFare: 0,
            discountAmount: 0,
            paidAmount: 0,
            paymentAmount: 0,
            accountId: "",
        },
    })

    useEffect(() => {
        if (bookingToEdit && open) {
            form.reset({
                branchId: bookingToEdit.branchId,
                ambulanceId: bookingToEdit.ambulanceId,
                patientId: bookingToEdit.patientId || "",
                patientName: bookingToEdit.patientName,
                patientAddress: bookingToEdit.patientAddress || "",
                pickupLocation: bookingToEdit.pickupLocation,
                dropoffLocation: bookingToEdit.dropoffLocation,
                guardianName: bookingToEdit.guardianName || "",
                guardianPhone: bookingToEdit.guardianPhone || "",
                guardianRelation: bookingToEdit.guardianRelation || "",
                status: bookingToEdit.status,
                note: bookingToEdit.note || "",
                totalFare: bookingToEdit.totalFare || 0,
                discountAmount: bookingToEdit.discountAmount || 0,
                paidAmount: 0, // Reset paid/payment fields since they are used for current transaction
                paymentAmount: 0,
                accountId: "",
            })
        } else if (open) {
            form.reset({
                branchId: activeStoreId || "",
                ambulanceId: "",
                patientId: "",
                patientName: "",
                patientAddress: "",
                pickupLocation: "",
                dropoffLocation: "",
                guardianName: "",
                guardianPhone: "",
                guardianRelation: "",
                status: "pending",
                note: "",
                totalFare: 0,
                discountAmount: 0,
                paidAmount: 0,
                paymentAmount: 0,
                accountId: "",
            })
        }
    }, [bookingToEdit, form, open, activeStoreId])

    const totalFare = form.watch("totalFare") || 0
    const discountAmount = form.watch("discountAmount") || 0
    const paidAmount = form.watch("paidAmount") || 0
    const paymentAmount = form.watch("paymentAmount") || 0

    const netFare = totalFare - discountAmount
    const currentDue = bookingToEdit 
        ? Math.max(0, (bookingToEdit.dueAmount || 0) - paymentAmount)
        : Math.max(0, netFare - paidAmount)

    // Auto-select "Ambulance" account by default for new bookings
    useEffect(() => {
        if (open && !bookingToEdit && accounts.length > 0 && !form.getValues("accountId")) {
            const defaultAcc = accounts.find((a: any) => a.name?.toLowerCase().includes("ambulance")) 
                || accounts.find((a: any) => a.name?.toLowerCase().includes("cash"))
                || accounts[0];
            
            if (defaultAcc) {
                form.setValue("accountId", defaultAcc.id);
            }
        }
    }, [open, bookingToEdit, accounts, form]);

    // Update patient info when a patient is selected from the searchable dropdown
    const handlePatientChange = (patientId: string) => {
        const patient = patients.find(p => p.id === patientId)
        if (patient) {
            form.setValue("patientId", patientId)
            form.setValue("patientName", patient.name)
            form.setValue("patientAddress", patient.address || "")
            form.setValue("guardianPhone", patient.phone || "")
        }
    }

    const onSubmit = async (values: z.infer<typeof bookingSchema>) => {
        if (bookingToEdit) {
            await updateMutation.mutateAsync({ id: bookingToEdit.id, data: values as AmbulanceBookingPayload })
        } else {
            await createMutation.mutateAsync(values as AmbulanceBookingPayload)
        }
        onOpenChange(false)
    }

    const isLoading = createMutation.isPending || updateMutation.isPending

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl flex flex-col max-h-[95vh] w-[95vw]">
                    <DialogHeader className="p-8 pb-4 bg-zinc-50 dark:bg-zinc-900/50 border-b shrink-0">
                        <DialogTitle className="text-2xl font-black tracking-tight uppercase">
                            {bookingToEdit ? "Manage Transport Booking" : "Record New Dispatch Request"}
                        </DialogTitle>
                        <DialogDescription className="font-semibold text-zinc-500">
                            Coordinate emergency transport logistics and patient status.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col overflow-hidden">
                            <div className="p-6 md:p-8 pt-6 space-y-8 overflow-y-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Section 1: Patient Details */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2">Patient Information</h3>
                                    
                                    <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
                                        <FormField
                                            control={form.control}
                                            name="patientId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <FormLabel className="text-xs font-bold text-foreground opacity-70">Link Existing Patient</FormLabel>
                                                        <Button 
                                                            type="button" 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-6 text-[10px] font-black uppercase gap-1 px-1.5 hover:bg-primary/10 hover:text-primary transition-colors"
                                                            onClick={() => setPatientDialogOpen(true)}
                                                        >
                                                            <UserPlus className="h-3 w-3" /> Register New
                                                        </Button>
                                                    </div>
                                                    <SearchableSelect 
                                                        value={field.value || ""}
                                                        onChange={handlePatientChange}
                                                        options={Array.isArray(patients) ? patients.map(p => ({ id: p.id, name: `${p.name} (${p.phone})` })) : []}
                                                        placeholder="Search patients..."
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="patientName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-foreground opacity-70">Patient Name *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Enter full name" className="h-10 rounded-xl bg-background shadow-sm font-medium" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Section 2: Fleet Assignment */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2">Fleet Assignment</h3>
                                    
                                    <div className="space-y-4 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10">
                                        <FormField
                                            control={form.control}
                                            name="ambulanceId"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-blue-700/70">Select Available Ambulance *</FormLabel>
                                                    <SearchableSelect 
                                                        value={field.value || ""}
                                                        onChange={field.onChange}
                                                        options={Array.isArray(ambulances) ? ambulances.map(unit => ({ 
                                                            id: unit.id, 
                                                            name: `${unit.vehicleNumber} (${unit.driverName || 'No Driver'}) • ${unit.status}` 
                                                        })) : []}
                                                        placeholder="Search and choose vehicle..."
                                                    />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="status"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-blue-700/70">Booking Lifecycle Status</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-10 rounded-xl bg-background border-blue-500/20 shadow-sm font-bold">
                                                                <SelectValue placeholder="Status" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="rounded-xl">
                                                            <SelectItem value="pending">Pending Request</SelectItem>
                                                            <SelectItem value="confirmed">Dispatch Confirmed</SelectItem>
                                                            <SelectItem value="completed">Journey Completed</SelectItem>
                                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Section 3: Logistics */}
                                <div className="space-y-4 md:col-span-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2">Logistics & Route</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="pickupLocation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-foreground opacity-70 tracking-tight">Origin / Pickup Point *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Hospital Main Ward" className="h-10 rounded-xl bg-background shadow-sm font-bold border-rose-500/20 focus-visible:ring-rose-500" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="dropoffLocation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-foreground opacity-70 tracking-tight">Destination / Drop-off *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Patient Address or Specialized Lab" className="h-10 rounded-xl bg-background shadow-sm font-bold border-emerald-500/20 focus-visible:ring-emerald-500" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Section 4: Auxiliary Info */}
                                <div className="space-y-4 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="guardianName"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold opacity-70">Attendant Name</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Guardian name" className="h-10 rounded-xl font-medium" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="guardianPhone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold opacity-70">Attendant Contact</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Phone number" className="h-10 rounded-xl font-medium" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="guardianRelation"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold opacity-70">Relation</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Neighbor, spouse, etc." className="h-10 rounded-xl font-medium" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>

                                {/* Section 5: Financial Details */}
                                <div className="space-y-4 md:col-span-2">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2">Financial Setup & Billing</h3>
                                    <div className="bg-amber-500/5 p-5 rounded-3xl border border-amber-500/10 space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <FormField
                                                control={form.control}
                                                name="totalFare"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-amber-900/70 dark:text-amber-500/70">Total Base Fare</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600/50" />
                                                                <Input type="number" className="h-10 pl-9 rounded-xl font-bold bg-background border-amber-500/20" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="discountAmount"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-amber-900/70 dark:text-amber-500/70">Discount Amount</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600/50" />
                                                                <Input type="number" className="h-10 pl-9 rounded-xl font-bold bg-background border-amber-500/20" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between py-3 border-y border-amber-500/10">
                                            <span className="text-sm font-bold text-amber-900/60 dark:text-amber-500/60">Calculated Net Fare:</span>
                                            <span className="text-lg font-black text-amber-600">৳ {netFare.toFixed(2)}</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <FormField
                                                control={form.control}
                                                name={bookingToEdit ? "paymentAmount" : "paidAmount"}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-emerald-700/70">
                                                            {bookingToEdit ? "Collect Due Payment" : "Initial Payment Received"}
                                                        </FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600/50" />
                                                                <Input type="number" className="h-10 pl-9 rounded-xl font-bold bg-background border-emerald-500/20" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="accountId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs font-bold text-emerald-700/70">Deposit Account</FormLabel>
                                                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger className="h-10 rounded-xl bg-background border-emerald-500/20 font-bold">
                                                                    <div className="flex items-center gap-2">
                                                                        <CreditCard className="h-4 w-4 text-emerald-600/50" />
                                                                        <SelectValue placeholder="Select account..." />
                                                                    </div>
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent className="rounded-xl border-emerald-500/20">
                                                                {accounts.map((acc: any) => (
                                                                    <SelectItem key={acc.id} value={acc.id} className="font-medium">
                                                                        {acc.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        {currentDue > 0 && (
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-sm font-bold text-rose-500/80">Remaining Due Balance:</span>
                                                <span className="text-lg font-black text-rose-500">৳ {currentDue.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="note"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs font-bold opacity-70 tracking-widest uppercase">Internal Dispatch Notes</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="Oxygen required, ICU bed coordinated, etc." 
                                                className="resize-none min-h-[80px] rounded-2xl bg-zinc-50 border-zinc-200/50 shadow-inner font-medium" 
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            </div>
                            <DialogFooter className="p-6 border-t gap-3 sm:justify-end bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="h-12 px-6 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-all">
                                    Discard Changes
                                </Button>
                                <Button type="submit" disabled={isLoading} className="h-12 px-10 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-black tracking-widest uppercase transition-all active:scale-95">
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />}
                                    {bookingToEdit ? "Update Dispatch" : "Confirm Booking"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <PatientDialog 
                open={patientDialogOpen}
                onOpenChange={setPatientDialogOpen}
                onSuccess={(newPatient) => {
                    handlePatientChange(newPatient.id)
                    setPatientDialogOpen(false)
                }}
            />
        </>
    )
}
