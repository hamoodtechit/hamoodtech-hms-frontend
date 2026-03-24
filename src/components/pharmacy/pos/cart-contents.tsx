"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { useFinanceAccounts } from "@/hooks/finance-queries"
import { useCurrency } from "@/hooks/use-currency"
import { cn } from "@/lib/utils"
import { usePosStore } from "@/store/use-pos-store"
import { useSettingsStore } from "@/store/use-settings-store"
import { FinanceAccount } from "@/types/finance"
import { Patient, PaymentMethod } from "@/types/pharmacy"
import { CalendarDays, Check, ChevronDown, CreditCard, Minus, Plus, Receipt, ShoppingCart, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PatientSearch } from "./patient-search"

interface CartContentsProps {
    onCheckout: () => void
    onFinalizeCheckout: () => void
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
    selectedAccountId: string
    setSelectedAccountId: (id: string) => void
    paidAmount: number
    setPaidAmount: (amount: number) => void
    isCheckoutOpen: boolean
    setIsCheckoutOpen: (open: boolean) => void
}

export function CartContents({
    onCheckout,
    onFinalizeCheckout,
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
    selectedAccountId,
    setSelectedAccountId,
    paidAmount,
    setPaidAmount,
    isCheckoutOpen,
    setIsCheckoutOpen,
}: CartContentsProps) {
    
    const { cart, updateQuantity, removeFromCart, switchBatch } = usePosStore()
    const { pharmacy, finance } = useSettingsStore()
    const { formatCurrency } = useCurrency()
    const { data: accountsRes } = useFinanceAccounts({ limit: 100, isActive: true })
    const accounts = accountsRes?.data || []

    const paymentMethodToAccountType: Record<string, string> = {
        'cash': 'cash',
        'card': 'bank',
        'online': 'bank',
        'Bank Transfer': 'bank',
        'cheque': 'bank',
        'bKash': 'mfs',
        'Nagad': 'mfs',
        'Rocket': 'mfs'
    }

    // Relaxed filtering to allow switching accounts regardless of payment method
    const availableAccounts = accounts
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
                                <div className="p-1.5 space-y-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm truncate leading-tight">
                                                {item.name}
                                                {item.dosageForm && <span className="text-[11px] font-bold text-primary ml-1 uppercase">({item.dosageForm})</span>}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground font-medium">{formatCurrency(item.price)}</p>
                                            
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <button className="text-[10px] text-muted-foreground flex items-center hover:text-primary transition-colors mt-0.5 group/batch">
                                                        <span className="opacity-70">Batch:</span> 
                                                        <span className="font-bold ml-1 text-foreground/80 group-hover/batch:text-primary">{item.batchNumber || 'N/A'}</span>
                                                        <ChevronDown className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                                                    </button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[180px] p-0" align="start">
                                                    <div className="p-2 border-b bg-muted/20">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Select Batch</p>
                                                    </div>
                                                    <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                                                        {item.stocks?.filter(s => Number(s.quantity) > 0).map((s) => (
                                                            <button
                                                                key={s.batchNumber}
                                                                className={cn(
                                                                    "w-full text-left p-2 text-xs flex flex-col gap-0.5 hover:bg-muted transition-colors border-b last:border-0 relative",
                                                                    s.batchNumber === item.batchNumber && "bg-primary/5 border-l-2 border-l-primary"
                                                                )}
                                                                onClick={() => switchBatch(item.id, item.batchNumber || '', s)}
                                                            >
                                                                <div className="flex justify-between items-center pr-4">
                                                                    <span className="font-bold">{s.batchNumber}</span>
                                                                    {s.batchNumber === item.batchNumber && <Check className="h-3 w-3 text-primary absolute right-2 top-2" />}
                                                                </div>
                                                                <div className="flex justify-between text-[9px] text-muted-foreground">
                                                                    <span className="flex items-center gap-0.5">
                                                                        <CalendarDays className="h-2.5 w-2.5" />
                                                                        {new Date(s.expiryDate).toLocaleDateString()}
                                                                    </span>
                                                                    <span className="font-bold text-foreground/70">{s.quantity} left</span>
                                                                </div>
                                                                <div className="text-[10px] font-black text-primary">
                                                                    {formatCurrency(Number(s.unitPrice))}
                                                                </div>
                                                            </button>
                                                        ))}
                                                        {(!item.stocks || item.stocks.filter(s => Number(s.quantity) > 0).length === 0) && (
                                                            <div className="p-4 text-center text-[10px] text-muted-foreground italic">
                                                                No other batches available
                                                            </div>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {itemDiscountAmount > 0 && (
                                                <span className="text-[10px] text-muted-foreground line-through block leading-none">{formatCurrency(itemSubtotal)}</span>
                                            )}
                                            <span className="font-black text-sm text-primary leading-tight">{formatCurrency(itemTotal)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 border-t pt-1.5 mt-0.5">
                                        <div className="flex items-center gap-1">
                                             <div className="flex items-center gap-1 bg-secondary/30 rounded-md p-0.5 border">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 rounded-sm hover:bg-background"
                                                    onClick={() => updateQuantity(item.id, -1, item.batchNumber)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <SmartNumberInput 
                                                    id={`qty-${item.id}-${item.batchNumber || 'N/A'}`}
                                                    value={item.quantity}
                                                    onFocus={(e: any) => e.target.select()}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
                                                        }
                                                    }}
                                                    onChange={(val: number | undefined) => {
                                                        const q = val || 1
                                                        if (q > (item.stock || 0)) {
                                                            toast.error(`Only ${item.stock} items available in stock`)
                                                        }
                                                        const { setQuantity } = usePosStore.getState()
                                                        setQuantity(item.id, q, item.batchNumber)
                                                    }}
                                                    className="h-6 w-10 text-center text-[11px] p-0 font-black bg-background border-none focus-visible:ring-1 focus-visible:ring-primary"
                                                />
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 rounded-sm hover:bg-background"
                                                    onClick={() => {
                                                        if (item.quantity >= (item.stock || 0)) {
                                                            toast.error(`Only ${item.stock} items available in stock`)
                                                            return
                                                        }
                                                        updateQuantity(item.id, 1, item.batchNumber)
                                                    }}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 rounded-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => removeFromCart(item.id, item.batchNumber)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-1 bg-secondary/20 rounded-md p-0.5 border">
                                            <SmartNumberInput 
                                                placeholder="%"
                                                className="h-6 text-[10px] w-12 bg-background border-none px-1"
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
                                            <Separator orientation="vertical" className="h-4" />
                                            <SmartNumberInput 
                                                placeholder="Amt"
                                                className="h-6 text-[10px] w-16 bg-background border-none px-1"
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
                                    </div>
                                </div>
                            </div>
                        )})}
                    </div>
                )}
            </div>

            {/* Footer Section - Simplified Sticky Footer */}
            <div className="p-3 bg-secondary/5 border-t shrink-0 flex flex-col gap-3">
                {/* 1. Summary Totals */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Subtotal ({cart.length} items)</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {(discount > 0 || discountFixedAmount > 0) && (
                        <div className="flex justify-between text-xs font-medium text-emerald-600">
                            <span>Discount</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                    )}
                    {tax > 0 && (
                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                            <span>Tax (VAT {vatPercentage}%)</span>
                            <span>{formatCurrency(tax)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-baseline pt-1 border-t mt-1">
                        <span className="text-sm font-bold uppercase">Total to Pay</span>
                        <span className="text-2xl font-black text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>

                {/* 2. Main Checkout Trigger (Drawer) */}
                <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                    <SheetTrigger asChild>
                        <Button 
                            className="w-full h-12 text-lg font-bold shadow-lg transition-all active:scale-[0.98] bg-primary hover:bg-primary/90"
                            disabled={cart.length === 0}
                        >
                            <CreditCard className="mr-2 h-5 w-5" />
                            Review & Pay
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
                        <SheetHeader className="p-4 border-b bg-secondary/10">
                            <SheetTitle className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-primary" />
                                Checkout Details
                            </SheetTitle>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Drawer: Customer Selection */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Customer Selection
                                </Label>
                                <PatientSearch 
                                    selectedPatient={selectedCustomer} 
                                    onSelect={setSelectedCustomer} 
                                />
                                {selectedCustomer && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded border border-primary/10">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {selectedCustomer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">{selectedCustomer.name}</p>
                                            <p className="text-[10px]">{selectedCustomer.phone}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Drawer: Sale Discount */}
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Sale Discount
                                </Label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="Percentage (%)" 
                                            className="h-10 text-sm pr-8" 
                                            min={0}
                                            max={100}
                                            value={discount === 0 ? undefined : discount}
                                            onChange={(val: number | undefined) => {
                                                setDiscount(val || 0)
                                                setDiscountFixedAmount(0)
                                            }}
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">%</span>
                                    </div>
                                    <div className="relative">
                                        <SmartNumberInput 
                                            placeholder="Fixed (Tk)" 
                                            className="h-10 text-sm pr-8" 
                                            min={0}
                                            value={discountFixedAmount === 0 ? undefined : discountFixedAmount}
                                            onChange={(val: number | undefined) => {
                                                setDiscountFixedAmount(val || 0)
                                                setDiscount(0)
                                            }}
                                        />
                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">Tk</span>
                                    </div>
                                </div>
                            </div>

                            {/* Drawer: Payment Details */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Payment Method</Label>
                                        <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                                            <SelectTrigger className="h-10 text-sm">
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
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount Paid</Label>
                                        <SmartNumberInput 
                                            value={paidAmount}
                                            onFocus={(e: any) => e.target.select()} 
                                            onChange={(val: number | undefined) => setPaidAmount(val || 0)}
                                            className="h-10 text-base font-bold border-primary/20 text-primary"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Target Account</Label>
                                    <Select 
                                        value={selectedAccountId} 
                                        onValueChange={setSelectedAccountId}
                                    >
                                        <SelectTrigger className="h-10 text-sm">
                                            <SelectValue placeholder="Select Account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableAccounts.map((account: FinanceAccount) => (
                                                <SelectItem key={account.id} value={account.id}>
                                                    {account.name} ({account.type})
                                                </SelectItem>
                                            ))}
                                            {availableAccounts.length === 0 && (
                                                <div className="p-2 text-xs text-muted-foreground text-center italic">
                                                    No {paymentMethodToAccountType[paymentMethod]} accounts found
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer: Totals and Completion */}
                        <div className="p-4 border-t bg-foreground text-background">
                            <div className="space-y-1 mb-4">
                                <div className="flex justify-between text-xs opacity-70">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-xs text-emerald-400">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(discountAmount)}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between text-xs opacity-70">
                                        <span>Tax (VAT {vatPercentage}%)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                                    <span>Total Payable</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={cn(
                                        "text-xs font-black uppercase tracking-widest",
                                        paidAmount >= (total - 0.01) ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {paidAmount >= (total - 0.01) ? "Return Change" : "Balance Due"}
                                    </span>
                                    <span className={cn(
                                        "text-2xl font-black",
                                        paidAmount >= (total - 0.01) ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                        {formatCurrency(Math.abs(paidAmount - total))}
                                    </span>
                                </div>
                            </div>

                            <Button 
                                className={cn(
                                    "w-full h-14 text-xl font-black shadow-xl transition-all active:scale-[0.98]",
                                    paidAmount < (total - 0.01) && total > 0 
                                        ? "bg-rose-500 hover:bg-rose-600 text-white" 
                                        : "bg-emerald-500 hover:bg-emerald-600 text-white"
                                )}
                                onClick={() => {
                                    onFinalizeCheckout()
                                    setIsCheckoutOpen(false)
                                }}
                            >
                                <CreditCard className="mr-3 h-6 w-6" />
                                COMPLETE PAYMENT
                            </Button>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    )
}
