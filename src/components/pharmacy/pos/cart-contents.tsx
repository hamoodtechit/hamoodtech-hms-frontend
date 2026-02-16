"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useCurrency } from "@/hooks/use-currency"
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
    const { pharmacy } = useSettingsStore()
    const { formatCurrency } = useCurrency()
    const vatPercentage = pharmacy?.vatPercentage || 0

    // Calculations
    const subtotal = cart.reduce((sum, item) => {
        const itemSubtotal = item.price * item.quantity
        const itemDiscountAmount = item.discountAmount || 
            (item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0)
        return sum + (itemSubtotal - itemDiscountAmount)
    }, 0)
    const tax = subtotal * (vatPercentage / 100)
    const discountAmount = discountFixedAmount || (subtotal * discount) / 100
    const total = subtotal + tax - discountAmount

    const paymentMethods: PaymentMethod[] = ['cash', 'card', 'online', 'cheque', 'bKash', 'Nagad', 'Rocket', 'Bank Transfer']

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-6 border-b bg-secondary/10 flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2 text-lg">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Current Order
                </h2>
                <Badge variant="secondary" className="px-2 py-1">{cart.length} items</Badge>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
                        <div className="p-4 bg-secondary rounded-full">
                            <ShoppingCart className="h-8 w-8" />
                        </div>
                        <p>No items added yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map((item) => {
                            const itemSubtotal = item.price * item.quantity
                            const itemDiscountAmount = item.discountAmount || 
                                (item.discountPercentage ? (itemSubtotal * item.discountPercentage) / 100 : 0)
                            const itemTotal = itemSubtotal - itemDiscountAmount
                            
                            return (
                            <div key={`${item.id}-${item.batchNumber}`} className="bg-card border rounded-lg shadow-sm hover:border-primary/20 transition-colors">
                                <div className="flex gap-3 p-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{item.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{formatCurrency(item.price)} each</p>
                                        {(item.discountPercentage || item.discountAmount) && (
                                            <p className="text-xs text-emerald-600 mt-1">
                                                Discount: {item.discountPercentage ? `${item.discountPercentage}%` : formatCurrency(item.discountAmount || 0)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-right">
                                            {itemDiscountAmount > 0 && (
                                                <span className="text-xs text-muted-foreground line-through block">{formatCurrency(itemSubtotal)}</span>
                                            )}
                                            <span className="font-bold text-sm">{formatCurrency(itemTotal)}</span>
                                        </div>
                                        <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 rounded-sm hover:bg-background"
                                                onClick={() => updateQuantity(item.id, -1, item.batchNumber)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="text-xs w-6 text-center font-medium">{item.quantity}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 rounded-sm hover:bg-background"
                                                onClick={() => updateQuantity(item.id, 1, item.batchNumber)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-6 w-6 rounded-sm hover:bg-background text-destructive hover:text-destructive"
                                                onClick={() => removeFromCart(item.id, item.batchNumber)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Item Discount Input */}
                                <div className="px-3 pb-3 pt-0">
                                    <details className="group">
                                        <summary className="text-xs text-muted-foreground cursor-pointer hover:text-primary flex items-center gap-1">
                                            <Tag className="h-3 w-3" />
                                            <span>Item discount</span>
                                        </summary>
                                        <div className="mt-2 flex gap-2">
                                            <Input 
                                                type="number"
                                                placeholder="% off"
                                                className="h-8 text-xs"
                                                min="0"
                                                max="100"
                                                value={item.discountPercentage || ""}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value)
                                                    const updatedCart = cart.map(c => 
                                                        c.id === item.id && c.batchNumber === item.batchNumber
                                                            ? { ...c, discountPercentage: val || undefined, discountAmount: undefined }
                                                            : c
                                                    )
                                                    usePosStore.setState({ cart: updatedCart })
                                                }}
                                            />
                                            <span className="text-xs self-center text-muted-foreground">or</span>
                                            <Input 
                                                type="number"
                                                placeholder="Fixed amount"
                                                className="h-8 text-xs"
                                                min="0"
                                                value={item.discountAmount || ""}
                                                onChange={(e) => {
                                                    const val = Number(e.target.value)
                                                    const updatedCart = cart.map(c => 
                                                        c.id === item.id && c.batchNumber === item.batchNumber
                                                            ? { ...c, discountAmount: val || undefined, discountPercentage: undefined }
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

            <div className="p-6 bg-secondary/5 border-t space-y-4">
                
                {/* Customer Selection */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Customer / Patient</span>
                    </div>
                    
                    <PatientSearch 
                        selectedPatient={selectedCustomer} 
                        onSelect={setSelectedCustomer} 
                    />

                    {selectedCustomer?.bloodGroup && (
                         <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/20 p-2 rounded">
                            <span className="font-semibold">Blood Group:</span> {selectedCustomer.bloodGroup}
                        </div>
                    )}
                </div>

                <Separator />

                {/* Payment Method Selector */}
                 <div className="space-y-2">
                    <span className="text-sm font-medium">Payment Method</span>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
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

                <Separator />

                {/* Sale Discount Input */}
                <div className="space-y-2">
                    <span className="text-sm font-medium flex items-center gap-1">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Sale Discount
                    </span>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="% off" 
                            type="number" 
                            className="h-9 text-sm" 
                            min="0" 
                            max="100"
                            value={discount === 0 ? "" : discount}
                            onChange={(e) => {
                                setDiscount(Number(e.target.value) || 0)
                                setDiscountFixedAmount(0)
                            }}
                        />
                        <span className="text-xs self-center text-muted-foreground">or</span>
                        <Input 
                            placeholder="Fixed amount" 
                            type="number" 
                            className="h-9 text-sm" 
                            min="0"
                            value={discountFixedAmount === 0 ? "" : discountFixedAmount}
                            onChange={(e) => {
                                setDiscountFixedAmount(Number(e.target.value) || 0)
                                setDiscount(0)
                            }}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <span className="text-sm font-medium">Amount Paid</span>
                    <Input 
                        type="number" 
                        value={paidAmount} 
                        onChange={(e) => setPaidAmount(Number(e.target.value))}
                        className="h-10 text-lg font-bold"
                    />
                </div>

                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax ({vatPercentage}%)</span>
                        <span>{formatCurrency(tax)}</span>
                    </div>
                    {(discount > 0 || discountFixedAmount > 0) && (
                        <div className="flex justify-between text-emerald-600">
                            <span>Sale Discount {discount > 0 ? `(${discount}%)` : ''}</span>
                            <span>-{formatCurrency(discountAmount)}</span>
                        </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-xl">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(total)}</span>
                    </div>
                    
                    {paidAmount > 0 && (
                        <>
                            <Separator className="my-2" />
                            <div className="flex justify-between items-center">
                                <span className={paidAmount >= total ? "text-emerald-600 font-medium" : "text-destructive font-medium"}>
                                    {paidAmount >= total ? "Change" : "Due"}
                                </span>
                                <span className={`text-lg font-bold ${paidAmount >= total ? "text-emerald-600" : "text-destructive"}`}>
                                    {formatCurrency(Math.abs(paidAmount - total))}
                                </span>
                            </div>
                        </>
                    )}
                </div>
                
                <Button 
                    className="w-full h-12 text-lg shadow-primary/20 shadow-lg" 
                    disabled={cart.length === 0}
                    onClick={onCheckout}
                >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pay {formatCurrency(total)}
                </Button>
            </div>
        </div>
    )
}
