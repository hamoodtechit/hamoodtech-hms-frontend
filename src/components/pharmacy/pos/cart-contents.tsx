"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { useCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"
import { usePosStore } from "@/store/use-pos-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { CreditCard, Minus, Plus, ShoppingCart, Tag, Trash2 } from "lucide-react"
import { PatientSearch } from "./patient-search"

interface CartContentsProps {
    onCheckout: () => void
    customerDialogOpen: boolean
    setCustomerDialogOpen: (open: boolean) => void
    selectedCustomer: Patient | null
    setSelectedCustomer: (customer: Patient | null) => void
    discount: number
    setDiscount: (discount: number) => void
    discountFixedAmount: number
    setDiscountFixedAmount: (amount: number) => void
    paymentMethod: PaymentMethod
    setPaymentMethod: (method: PaymentMethod) => void
    paidAmount: number
    setPaidAmount: (amount: number) => void
}

export function CartContents({
    onCheckout,
    customerDialogOpen,
    setCustomerDialogOpen,
    selectedCustomer,
    setSelectedCustomer,
    discount,
    setDiscount,
    discountFixedAmount,
    setDiscountFixedAmount,
    paymentMethod,
    setPaymentMethod,
    paidAmount,
    setPaidAmount
}: CartContentsProps) {
    
    const { cart, updateQuantity, removeFromCart } = usePosStore()
    const { pharmacy, finance } = useSettingsStore()
    const { formatCurrency } = useCurrency()
    const vatPercentage = pharmacy?.vatPercentage || 0

    // Calculations: Discount Applied FIRST, then Tax on the discounted amount
    const subtotal = cart.reduce((sum, item) => {
        const itemSubtotal = item.price * item.quantity
        const itemDiscountAmount = item.discountAmount || 
            (item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0)
        return sum + (itemSubtotal - itemDiscountAmount)
    }, 0)
    
    const discountAmount = discountFixedAmount || (subtotal * discount) / 100
    const discountedSubtotal = Math.max(0, subtotal - discountAmount)
    const tax = discountedSubtotal * (vatPercentage / 100)
    const total = discountedSubtotal + tax

    const paymentMethods: PaymentMethod[] = ['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer']

    return (
        <div className="flex flex-col h-full bg-card overflow-hidden">
            {/* Header - Compact */}
            <div className="p-3 border-b bg-secondary/10 flex justify-between items-center shrink-0">
                <h2 className="font-semibold flex items-center gap-2 text-base">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    Cart Items
                </h2>
                <Badge variant="secondary" className="px-2 py-0.5 text-xs">{cart.length} items</Badge>
            </div>
            
            {/* Scrollable Items List - maximize height */}
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-0">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
                        <div className="p-3 bg-secondary rounded-full">
                            <ShoppingCart className="h-6 w-6" />
                        </div>
                        <p className="text-sm">No items added yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {cart.map((item) => {
                            const itemSubtotal = item.price * item.quantity
                            const itemDiscountAmount = item.discountAmount || 
                                (item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0)
                            const itemTotal = itemSubtotal - itemDiscountAmount
                            
                            return (
                            <div key={`${item.id}-${item.batchNumber}`} className="bg-card border rounded-md shadow-sm hover:border-primary/20 transition-colors">
                                <div className="flex gap-2 p-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-xs text-muted-foreground">{formatCurrency(item.price)}</p>
                                            {(item.discountPercentage || item.discountAmount) && (
                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 text-emerald-600 border-emerald-200">
                                                    -{item.discountPercentage ? `${item.discountPercentage}%` : formatCurrency(item.discountAmount || 0)}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-right leading-tight">
                                            {itemDiscountAmount > 0 && (
                                                <span className="text-[10px] text-muted-foreground line-through block">{formatCurrency(itemSubtotal)}</span>
                                            )}
                                            <span className="font-bold text-sm">{formatCurrency(itemTotal)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5 rounded-sm hover:bg-background"
                                                onClick={() => updateQuantity(item.id, -1, item.batchNumber)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-xs w-5 text-center font-medium">{item.quantity}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5 rounded-sm hover:bg-background"
                                                onClick={() => updateQuantity(item.id, 1, item.batchNumber)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-5 w-5 rounded-sm hover:bg-background text-destructive hover:text-destructive"
                                                onClick={() => removeFromCart(item.id, item.batchNumber)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Item Discount Input (Compact) */}
                                <div className="px-2 pb-2 pt-0">
                                    <details className="group">
                                        <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-primary flex items-center gap-1 w-fit">
                                            <Tag className="h-3 w-3" />
                                            <span>Discount</span>
                                        </summary>
                                        <div className="mt-1 flex gap-2">
                                            <SmartNumberInput 
                                                placeholder="%"
                                                className="h-6 text-xs w-16"
                                                min={0}
                                                max={100}
                                                value={item.discountPercentage}
                                                onChange={(val: number | undefined) => {
                                                    const updatedCart = cart.map(c => 
                                                        c.id === item.id && c.batchNumber === item.batchNumber
                                                            ? { ...c, discountPercentage: val, discountAmount: undefined }
                                                            : c
                                                    )
                                                    usePosStore.setState({ cart: updatedCart })
                                                }}
                                            />
                                            <SmartNumberInput 
                                                placeholder="Amt"
                                                className="h-6 text-xs w-20"
                                                min={0}
                                                value={item.discountAmount}
                                                onChange={(val: number | undefined) => {
                                                    const updatedCart = cart.map(c => 
                                                        c.id === item.id && c.batchNumber === item.batchNumber
                                                            ? { ...c, discountAmount: val, discountPercentage: undefined }
                                                            : c
                                                    )
                                                    usePosStore.setState({ cart: updatedCart })
                                                }}
                                            />
                                        </div>
                                    </details>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>

            {/* Footer Section - Optimized for various screen sizes */}
            <div className="p-3 bg-secondary/5 border-t shrink-0 flex flex-col max-h-[70%]">
                <ScrollArea className="flex-1 min-h-0 pr-3">
                    <div className="space-y-3 pb-2">
                        {/* Customer Selection */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between font-bold text-[10px] text-muted-foreground uppercase tracking-widest">
                                <span>Customer</span>
                            </div>
                            <PatientSearch 
                                selectedPatient={selectedCustomer} 
                                onSelect={setSelectedCustomer} 
                            />
                            {selectedCustomer?.bloodGroup && (
                                <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-secondary/20 p-1 rounded px-2">
                                    <span className="font-semibold">Blood Group:</span> {selectedCustomer.bloodGroup}
                                </div>
                            )}
                        </div>

                        {/* Inline Payment & Amount */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Method</span>
                                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue placeholder="Method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map(method => (
                                            <SelectItem key={method} value={method}>
                                                <span className="capitalize">{method}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount Paid</span>
                                <SmartNumberInput 
                                    value={paidAmount}
                                    onFocus={(e: any) => e.target.select()} 
                                    onChange={(val: number | undefined) => setPaidAmount(val || 0)}
                                    className="h-9 text-sm font-bold"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Account</span>
                                <div className="text-xs px-3 py-2 bg-muted rounded border font-medium truncate">
                                    {finance?.paymentMethodAccounts?.[paymentMethod]?.name || (
                                        <span className="text-destructive text-[10px]">No account mapped</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sale Discount */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                Discount
                            </span>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <SmartNumberInput 
                                        placeholder="%" 
                                        className="h-8 text-xs pr-6" 
                                        min={0}
                                        max={100}
                                        value={discount === 0 ? undefined : discount}
                                        onChange={(val: number | undefined) => {
                                            setDiscount(val || 0)
                                            setDiscountFixedAmount(0)
                                        }}
                                    />
                                    <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">%</span>
                                </div>
                                <div className="relative flex-1">
                                    <SmartNumberInput 
                                        placeholder="Amount" 
                                        className="h-8 text-xs pr-8" 
                                        min={0}
                                        value={discountFixedAmount === 0 ? undefined : discountFixedAmount}
                                        onChange={(val: number | undefined) => {
                                            setDiscountFixedAmount(val || 0)
                                            setDiscount(0)
                                        }}
                                    />
                                    <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">Tk</span>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-1" />

                        {/* Totals */}
                        <div className="space-y-1 text-sm bg-background/50 p-2 rounded-md border border-primary/5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Tax ({vatPercentage}%)</span>
                                <span className="font-medium">{formatCurrency(tax)}</span>
                            </div>
                            {(discount > 0 || discountFixedAmount > 0) && (
                                <div className="flex justify-between text-xs text-emerald-600 font-medium">
                                    <span>Discount</span>
                                    <span>-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-1 border-t mt-1">
                                <span>Total to Pay</span>
                                <span className="text-primary">{formatCurrency(total)}</span>
                            </div>
                            
                            {paidAmount > 0 && (
                                <div className="flex justify-between items-center pt-1 border-t border-dashed mt-1">
                                    <span className={cn(
                                        "text-xs font-bold uppercase tracking-wider",
                                        paidAmount >= (total - 0.01) ? "text-emerald-600" : "text-destructive"
                                    )}>
                                        {paidAmount >= (total - 0.01) ? "Return Change" : "Balance Due"}
                                    </span>
                                    <span className={cn(
                                        "font-bold",
                                        paidAmount >= (total - 0.01) ? "text-emerald-600" : "text-destructive font-black text-lg underline underline-offset-4 decoration-2"
                                    )}>
                                        {formatCurrency(Math.abs(paidAmount - total))}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
                
                <div className="pt-3 mt-auto shrink-0 border-t border-primary/10">
                    <Button 
                        className={cn(
                            "w-full h-12 text-lg font-bold shadow-xl transition-all active:scale-[0.98]",
                            paidAmount < (total - 0.01) && total > 0 ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                        )}
                        disabled={cart.length === 0}
                        onClick={onCheckout}
                    >
                        <CreditCard className="mr-3 h-5 w-5" />
                        Complete Payment
                    </Button>
                </div>
            </div>
        </div>
    )
}
