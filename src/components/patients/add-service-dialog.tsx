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
import { Loader2, Plus, Search, FileText, Activity, Trash2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AddAdmissionServiceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    admission: Admission | null
    onSuccess?: () => void
}

interface CartItem {
    id: string
    name: string
    price: number
    quantity: number
    serviceId?: string
    isDiagnosticTest?: boolean
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

    // Cart State
    const [cart, setCart] = useState<CartItem[]>([])

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

    const handleAddToCart = () => {
        if (activeTab === "catalog") {
            const service = services.find(s => s.id === selectedServiceId)
            if (!service) {
                toast.error("Please select a service from the list")
                return
            }
            const item: CartItem = {
                id: Math.random().toString(36).substring(7),
                name: service.name,
                price: Number(service.price),
                quantity: quantity,
                serviceId: service.id,
                isDiagnosticTest: service.isDiagnosticTest
            }
            setCart(prev => [...prev, item])
            setSelectedServiceId("")
            setQuantity(1)
            setPrice(0)
        } else {
            if (!manualItemName || manualItemPrice <= 0) {
                toast.error("Please provide valid item name and price")
                return
            }
            const item: CartItem = {
                id: Math.random().toString(36).substring(7),
                name: manualItemName,
                price: manualItemPrice,
                quantity: quantity
            }
            setCart(prev => [...prev, item])
            setManualItemName("")
            setManualItemPrice(0)
            setQuantity(1)
        }
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(c => c.id !== id))
    }

    const totalBill = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)

    const handleFinalizeBill = async () => {
        if (!admission || cart.length === 0) return

        const payload: SalePayload = {
            branchId: activeStoreId || "",
            patientId: admission.patientId,
            patientAdmissionId: admission.id,
            type: "hospital",
            status: "pending",
            paymentMethod: "cash",
            paidAmount: 0,
            dueAmount: Number(totalBill),
            discountPercentage: 0,
            discountAmount: 0,
            taxPercentage: 0,
            taxAmount: 0,
            isIndoorSale: true,
            saleItems: cart.map(item => ({
                itemName: item.name,
                unit: "service",
                price: Number(item.price),
                mrp: Number(item.price),
                quantity: Number(item.quantity),
                totalPrice: Number(item.price) * Number(item.quantity),
                serviceId: item.serviceId,
                isDiagnosticTest: item.isDiagnosticTest
            }))
        }

        try {
            await createSale(payload)
            toast.success("Services added to hospital bill successfully")
            resetForm()
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to submit bill")
        }
    }

    const resetForm = () => {
        setCart([])
        setSelectedServiceId("")
        setQuantity(1)
        setPrice(0)
        setManualItemName("")
        setManualItemPrice(0)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) resetForm()
            onOpenChange(val)
        }}>
            <DialogContent className="sm:max-w-[550px] border-none shadow-2xl rounded-3xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 bg-primary/5 border-b border-primary/10">
                    <DialogTitle className="text-xl font-black tracking-tight text-primary flex items-center gap-3">
                        <Plus className="h-6 w-6" />
                        Add Admission Services
                    </DialogTitle>
                    <DialogDescription className="text-xs font-medium opacity-70">
                        Queue multiple services or charges for {admission?.patient?.name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Add Item Section */}
                    <div className="bg-muted/10 border border-muted-foreground/10 rounded-2xl p-4 space-y-4">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 p-1 bg-muted/40 rounded-xl h-10">
                                <TabsTrigger value="catalog" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                    <Search className="h-3.5 w-3.5" /> Catalog
                                </TabsTrigger>
                                <TabsTrigger value="manual" className="rounded-lg text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:text-primary gap-2">
                                    <FileText className="h-3.5 w-3.5" /> Manual
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="catalog" className="space-y-4 pt-3 mt-0 border-none outline-none">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Service</Label>
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
                                        placeholder="Search catalog..."
                                        loading={isLoadingServices}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qty</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subtotal</Label>
                                        <div className="flex gap-2">
                                            <div className="h-10 flex-1 flex items-center px-3 rounded-xl bg-background border border-muted text-sm font-black tabular-nums">
                                                {formatCurrency(price * quantity)}
                                            </div>
                                            <Button 
                                                onClick={handleAddToCart}
                                                disabled={!selectedServiceId}
                                                className="h-10 px-4 rounded-xl font-black uppercase text-[10px] gap-2 tracking-widest shrink-0"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="manual" className="space-y-4 pt-3 mt-0 border-none outline-none">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Custom Service Name</Label>
                                    <Input
                                        placeholder="e.g. Special Nursing"
                                        value={manualItemName}
                                        onChange={(e) => setManualItemName(e.target.value)}
                                        className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qty</Label>
                                        <Input
                                            type="number"
                                            min={1}
                                            value={quantity}
                                            onChange={(e) => setQuantity(Number(e.target.value))}
                                            className="h-10 rounded-xl bg-background border-muted font-bold text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5 col-span-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unit Price</Label>
                                        <div className="flex gap-2">
                                            <SmartNumberInput
                                                placeholder="0.00"
                                                value={manualItemPrice}
                                                onChange={(val) => setManualItemPrice(val || 0)}
                                                className="h-10 rounded-xl bg-background border-muted font-bold text-xs flex-1"
                                            />
                                            <Button 
                                                onClick={handleAddToCart}
                                                disabled={!manualItemName || manualItemPrice <= 0}
                                                className="h-10 px-4 rounded-xl font-black uppercase text-[10px] gap-2 tracking-widest shrink-0"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Cart View Section */}
                    {cart.length > 0 && (
                        <div className="space-y-3 animate-in fade-in zoom-in-95">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Queued Services</Label>
                            <div className="max-h-[140px] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                                {cart.map(item => (
                                    <div key={item.id} className="p-3 bg-muted/10 rounded-xl border border-muted flex items-center justify-between group">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase">{item.name}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-black text-primary tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500 opacity-50 hover:opacity-100 hover:bg-rose-50 rounded-lg" onClick={() => removeFromCart(item.id)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex justify-between items-center group">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60">Estimated Bill Total</span>
                            <span className="text-2xl font-black text-primary tabular-nums group-hover:scale-105 transition-transform origin-left">
                                {formatCurrency(totalBill)}
                            </span>
                        </div>
                        <Activity className="h-8 w-8 text-primary opacity-20" />
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-primary/10 bg-muted/20">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving} className="rounded-xl px-6 h-11 font-black uppercase text-xs border-muted-foreground/20">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleFinalizeBill}
                        disabled={isSaving || cart.length === 0}
                        className="rounded-xl px-8 h-11 font-black uppercase text-xs gap-2 shadow-lg shadow-primary/20"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        Submit Bill Invoice
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
