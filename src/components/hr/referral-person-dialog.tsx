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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { useCreateReferral, useUpdateReferral, useEmployees } from "@/hooks/hr-queries"
import { useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useBranches } from "@/hooks/pharmacy-queries"
import { useStoreContext } from "@/store/use-store-context"
import { ReferralPerson, Employee } from "@/types/hr"
import { Loader2, Plus, Trash2, Search, User, Percent } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReferralPersonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    referral?: ReferralPerson | null
    onSuccess?: (referral: ReferralPerson) => void
}

export function ReferralPersonDialog({ open, onOpenChange, referral, onSuccess }: ReferralPersonDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateReferral()
    const updateMutation = useUpdateReferral()
    const { activeStoreId, stores } = useStoreContext()
    
    // External Data
    const { data: employeesRes } = useEmployees({ branchId: activeStoreId || undefined })
    const { data: servicesRes } = useDiagnosticTests({ limit: 100 })
    const { data: branchesRes } = useBranches({ limit: 100 })
    
    const employees = employeesRes?.data || []
    const services = servicesRes?.data || []
    const branches = branchesRes?.data || []

    const isEdit = !!referral

    // Form State
    const [name, setName] = useState("")
    const [nameBangla, setNameBangla] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [address, setAddress] = useState("")
    const [employeeId, setEmployeeId] = useState<string | undefined>(undefined)
    const [commissionStructure, setCommissionStructure] = useState<any[]>([])
    const [branchId, setBranchId] = useState("")

    const displayBranchName = branches.find(s => s.id === branchId)?.name || stores.find(s => s.id === branchId)?.name || "N/A"

    // Local Helper State for Adding Commissions
    const [selectedServiceId, setSelectedServiceId] = useState("")
    const [currentPercentage, setCurrentPercentage] = useState("10")

    useEffect(() => {
        if (open) {
            if (referral) {
                setName(referral.name)
                setNameBangla(referral.nameBangla || "")
                setPhone(referral.phone || "")
                setEmail(referral.email || "")
                setAddress(referral.address || "")
                setEmployeeId(referral.employeeId || undefined)
                setCommissionStructure(Array.isArray(referral.commissionStructure) ? referral.commissionStructure : [])
                setBranchId(referral.branchId)
            } else {
                setName("")
                setNameBangla("")
                setPhone("")
                setEmail("")
                setAddress("")
                setEmployeeId(undefined)
                setCommissionStructure([])
                setBranchId(activeStoreId || "")
            }
        }
    }, [open, referral, activeStoreId])

    const addCommissionRow = () => {
        if (!selectedServiceId) return toast.error("Please select a service")
        
        const service = services.find(s => s.id === selectedServiceId)
        if (!service) return

        // Check for duplicates
        if (commissionStructure.some(c => c.serviceId === selectedServiceId)) {
            return toast.error("This service already has a commission entry")
        }

        const newRow = {
            serviceId: service.id,
            serviceName: service.name,
            commissionPercentage: Number(currentPercentage)
        }

        setCommissionStructure([...commissionStructure, newRow])
        setSelectedServiceId("")
        setCurrentPercentage("10")
    }

    const removeCommissionRow = (serviceId: string) => {
        setCommissionStructure(commissionStructure.filter(c => c.serviceId !== serviceId))
    }

    const handleSave = async () => {
        if (!name || (!phone && !employeeId) || !branchId) {
            toast.error("Name, Phone/Employee and Branch are required")
            return
        }

        setLoading(true)
        try {
            const payload = {
                name,
                nameBangla,
                phone,
                email,
                address,
                commissionStructure,
                employeeId,
                branchId
            }

            if (isEdit && referral) {
                const updated = await updateMutation.mutateAsync({
                    id: referral.id,
                    data: payload
                })
                toast.success("Referral person updated successfully")
                onSuccess?.((updated as any).data || updated)
            } else {
                const created = await createMutation.mutateAsync(payload)
                toast.success("Referral person created successfully")
                onSuccess?.((created as any).data || created)
            }
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update referral" : "Failed to create referral")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[650px] h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl border-none bg-background/95 backdrop-blur-xl">
                <DialogHeader className="px-6 pt-6">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        {isEdit ? "Edit Referral Person" : "Add New Referral Person"}
                    </DialogTitle>
                    <DialogDescription>
                        Configure referral details, internal linkage, and service-specific commission rates.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                    <div className="px-6 py-6 grid gap-8 pb-32">
                        {/* Section 1: Identity */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full w-5 h-5 p-0 flex items-center justify-center">1</Badge>
                                Basic Identity
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="employee">Link Internal Employee (Optional)</Label>
                                    <Select 
                                        value={employeeId || "none"} 
                                        onValueChange={(val) => {
                                            if (val === "none") {
                                                setEmployeeId(undefined)
                                            } else {
                                                setEmployeeId(val)
                                                // Auto-fill from employee data
                                                const emp = employees.find(e => e.id === val)
                                                if (emp) {
                                                    setName(emp.name)
                                                    setNameBangla(emp.nameBangla || "")
                                                    setPhone(emp.phone || "")
                                                    setEmail(emp.email || "")
                                                    setAddress(emp.address || "")
                                                }
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select an employee" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None (External Referral)</SelectItem>
                                            {employees.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.name} ({emp.employeeNumber || 'N/A'})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2 col-span-2 sm:col-span-1">
                                    <Label>Active Branch</Label>
                                    <Input value={displayBranchName} disabled className="bg-muted h-10" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Full Name (English) *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Dr. Rafiq Ahmed"
                                        className="h-10"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="017xxxxxxxx"
                                        className="h-10"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Commission Structure */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full w-5 h-5 p-0 flex items-center justify-center">2</Badge>
                                Commission Structure (JSON)
                            </h3>
                            
                            <div className="bg-muted/30 p-4 rounded-lg border border-dashed border-muted-foreground/30">
                                <div className="grid grid-cols-12 gap-3 items-end mb-4">
                                    <div className="col-span-7 space-y-2">
                                        <Label className="text-xs">Search Service / Test</Label>
                                        <Select 
                                            value={selectedServiceId} 
                                            onValueChange={(val) => {
                                                setSelectedServiceId(val)
                                                // Auto-fill commission rate if available from service
                                                const service = services.find(s => s.id === val)
                                                if (service && service.refCommissionsPercentage) {
                                                    setCurrentPercentage(service.refCommissionsPercentage.toString())
                                                } else {
                                                    setCurrentPercentage("10")
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="h-9 bg-background">
                                                <SelectValue placeholder="Select a service..." />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[200px]">
                                                {services.map((s) => (
                                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-3 space-y-2">
                                        <Label className="text-xs">Rate (%)</Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                value={currentPercentage}
                                                onChange={(e) => setCurrentPercentage(e.target.value)}
                                                className="h-9 bg-background pr-7"
                                            />
                                            <Percent className="absolute right-2 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <Button 
                                            size="sm" 
                                            type="button" 
                                            className="w-full h-9"
                                            onClick={addCommissionRow}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* List of Active Commissions */}
                                <div className="space-y-2">
                                    {commissionStructure.length === 0 ? (
                                        <div className="text-center py-6 text-xs text-muted-foreground italic">
                                            No service-specific commissions defined.
                                        </div>
                                    ) : (
                                        <div className="border rounded-md bg-card overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted border-b">
                                                    <tr>
                                                        <th className="text-left p-2 font-semibold text-muted-foreground uppercase tracking-tight">Service Name</th>
                                                        <th className="text-center p-2 font-semibold w-24 text-muted-foreground uppercase tracking-tight">Rate (%)</th>
                                                        <th className="w-10 p-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {commissionStructure.map((row, idx) => (
                                                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                                            <td className="p-2 font-medium text-foreground">{row.serviceName}</td>
                                                            <td className="p-2 text-center font-bold text-primary">{row.commissionPercentage}%</td>
                                                            <td className="p-2">
                                                                <Button 
                                                                    variant="ghost" 
                                                                    size="icon" 
                                                                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                                    onClick={() => removeCommissionRow(row.serviceId)}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Additional Info */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Badge variant="outline" className="rounded-full w-5 h-5 p-0 flex items-center justify-center">3</Badge>
                                Additional Details
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nameBangla">Name (Bangla)</Label>
                                    <Input
                                        id="nameBangla"
                                        value={nameBangla}
                                        onChange={(e) => setNameBangla(e.target.value)}
                                        placeholder="ডা. রফিক আহমেদ"
                                        className="h-10"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="example@mail.com"
                                        className="h-10"
                                    />
                                </div>
                                <div className="grid gap-2 col-span-2">
                                    <Label htmlFor="address">Full Address</Label>
                                    <Textarea
                                        id="address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="Detailed street address, thana, district..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 bg-muted/20 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading} className="min-w-[120px]">
                        {loading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : isEdit ? (
                            <User className="mr-2 h-4 w-4" />
                        ) : (
                            <Plus className="mr-2 h-4 w-4" />
                        )}
                        {isEdit ? "Update Referral" : "Save Referral"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
