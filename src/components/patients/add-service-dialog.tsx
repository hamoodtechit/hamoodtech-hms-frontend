"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useCreateSale } from "@/hooks/sales-queries"
import { SearchableSelect } from "@/components/shared/searchable-select"
import { Admission } from "@/types/patient"
import { SalePayload } from "@/types/sales"
import { useStoreContext } from "@/store/use-store-context"
import { useCurrency } from "@/hooks/use-currency"
import { toast } from "sonner"
import { Loader2, Plus, Search, FileText, Activity } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddAdmissionServiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission: Admission | null
    onSuccess?: () => void
}

export function AddAdmissionServiceDialog({
    open,
    onOpenChange,
    admission,
    onSuccess
}: AddAdmissionServiceDialogProps) {
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()
    const { mutateAsync: createSale, isPending: isSaving } = useCreateSale()

    // Service Selection State
    const [selectedServiceId, setSelectedServiceId] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [price, setPrice] = useState(0)
    
    // Manual Entry State
    const [manualItemName, setManualItemName] = useState("")
    const [manualItemPrice, setManualItemPrice] = useState(0)

    // Mode
    const [activeTab, setActiveTab] = useState("catalog")

    const { data: servicesRes, isLoading: isLoadingServices } = useDiagnosticTests({
        branchId: activeStoreId || undefined,
        limit: 1000,
    }, { enabled: open && activeTab === "catalog" })

    const services = servicesRes?.data || []

    const handleAddService = async () => {
        if (!admission) return

        let payload: SalePayload

        if (activeTab === "catalog") {
            const service = services.find(s => s.id === selectedServiceId)
            if (!service) {
                toast.error("Please select a service from the list")
                return
            }

            payload = {
                branchId: activeStoreId || "",
                patientId: admission.patientId,
                patientAdmissionId: admission.id,
                type: "hospital",
                status: "pending",
                paymentMethod: "cash",
                paidAmount: 0,
                dueAmount: Number(service.price) * quantity,
                discountPercentage: 0,
                discountAmount: 0,
                taxPercentage: 0,
                taxAmount: 0,
                isIndoorSale: true,
                saleItems: [
                    {
                        itemName: service.name,
                        unit: service.unit || "service",
                        price: service.price,
                        mrp: service.price,
                        quantity: quantity,
                        totalPrice: Number(service.price) * quantity,
                        serviceId: service.id,
                        isDiagnosticTest: service.isDiagnosticTest
                    }
                ]
            }
        } else {
            if (!manualItemName || manualItemPrice <= 0) {
                toast.error("Please provide item name and price")
                return
            }

            payload = {
                branchId: activeStoreId || "",
                patientId: admission.patientId,
                patientAdmissionId: admission.id,
                type: "hospital",
                status: "pending",
                paymentMethod: "cash",
                paidAmount: 0,
                dueAmount: manualItemPrice * quantity,
                discountPercentage: 0,
                discountAmount: 0,
                taxPercentage: 0,
                taxAmount: 0,
                isIndoorSale: true,
                saleItems: [
                    {
                        itemName: manualItemName,
                        unit: "service",
                        price: manualItemPrice,
                        mrp: manualItemPrice,
                        quantity: quantity,
                        totalPrice: manualItemPrice * quantity,
                    }
                ]
            }
        }

        try {
            await createSale(payload)
            toast.success("Service added successfully")
            resetForm()
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to add service")
        }
    }

    const resetForm = () => {
        setSelectedServiceId("")
        setQuantity(1)
        setPrice(0)
        setManualItemName("")
        setManualItemPrice(0)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="p-8 pb-4 bg-primary/5 border-b border-primary/10">
                    <DialogTitle className="text-xl font-black tracking-tight text-primary flex items-center gap-3">
                        <Plus className="h-6 w-6" />
                        Add Admission Service
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium opacity-70">
                        Record clinical services or additional charges for {admission?.patient?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/30 rounded-2xl h-11">
                            <TabsTrigger value="catalog" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                <Search className="h-3.5 w-3.5" /> Catalog
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="rounded-xl text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                <FileText className="h-3.5 w-3.5" /> Manual Entry
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="catalog" className="space-y-6 pt-4 mt-0 border-none outline-none">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Service from Catalog</Label>
                                <SearchableSelect
                                    value={selectedServiceId}
                                    onChange={(val) => {
                                        setSelectedServiceId(val)
                                        const service = services.find(s => s.id === val)
                                        if (service) setPrice(Number(service.price))
                                    }}
                                    options={services.map(s => ({
                                        id: s.id,
                                        name: `${s.name} - ${formatCurrency(Number(s.price))}`
                                    }))}
                                    placeholder="Search service name..."
                                    loading={isLoadingServices}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="h-11 rounded-xl bg-muted/20 border-white/5 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Price</Label>
                                    <div className="h-11 flex items-center px-4 rounded-xl bg-muted/10 border border-white/5 text-sm font-black tabular-nums">
                                        {formatCurrency(price)}
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-6 pt-4 mt-0 border-none outline-none">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Item Name / Service Description</Label>
                                <Input
                                    placeholder="e.g. Special Nursing Charge"
                                    value={manualItemName}
                                    onChange={(e) => setManualItemName(e.target.value)}
                                    className="h-11 rounded-xl bg-muted/20 border-white/5 font-bold"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Quantity</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                        className="h-11 rounded-xl bg-muted/20 border-white/5 font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price per Unit</Label>
                                    <SmartNumberInput
                                        placeholder="0.00"
                                        value={manualItemPrice}
                                        onChange={(val) => setManualItemPrice(val || 0)}
                                        className="h-11 rounded-xl bg-muted/20 border-white/5 font-bold"
                                    />
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-center group">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Estimated Total Charge</span>
                            <span className="text-xl font-black text-primary tabular-nums group-hover:scale-105 transition-transform">
                                {formatCurrency((activeTab === "catalog" ? price : manualItemPrice) * quantity)}
                                <span className="text-xs ml-1 opacity-40 font-bold uppercase tracking-tighter">to bill</span>
                            </span>
                        </div>
                        <Activity className="h-6 w-6 text-primary opacity-20" />
                    </div>
                </div>

                <DialogFooter className="p-8 border-t border-primary/10 bg-muted/30">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl px-6 h-11 font-black uppercase text-xs">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddService}
                        disabled={isSaving || (activeTab === "catalog" ? !selectedServiceId : !manualItemName)}
                        className="rounded-xl px-8 h-11 font-black uppercase text-xs gap-2 shadow-lg shadow-primary/20"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Add to Bill
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
