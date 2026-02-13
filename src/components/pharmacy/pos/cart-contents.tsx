"use client"

import { CustomerDialog } from "@/components/pharmacy/customer-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { usePosStore } from "@/store/use-pos-store"
import { CreditCard, Minus, Plus, ShoppingCart, Tag, Trash2, User, X } from "lucide-react"

interface CartContentsProps {
    onCheckout: () => void
    customerDialogOpen: boolean
    setCustomerDialogOpen: (open: boolean) => void
    selectedCustomer: any
    setSelectedCustomer: (customer: any) => void
    discount: number
    setDiscount: (discount: number) => void
}

export function CartContents({
    onCheckout,
    customerDialogOpen,
    setCustomerDialogOpen,
    selectedCustomer,
    setSelectedCustomer,
    discount,
    setDiscount
}: CartContentsProps) {
    
    const { cart, updateQuantity, removeFromCart } = usePosStore()

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.1 // 10% tax
    const discountAmount = (subtotal * discount) / 100
    const total = subtotal + tax - discountAmount

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-6 border-b bg-secondary/10 flex justify-between items-center">
                <h2 className="font-semibold flex items-center gap-2 text-lg">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    Current Order
                </h2>
                <Badge variant="secondary" className="px-2 py-1">{cart.length} items</Badge>
            </div>
            
            <ScrollArea className="flex-1 p-4">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4 opacity-50">
                        <div className="p-4 bg-secondary rounded-full">
                            <ShoppingCart className="h-8 w-8" />
                        </div>
                        <p>No items added yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map((item) => (
                            <div key={item.id} className="flex gap-3 bg-card border p-3 rounded-lg shadow-sm hover:border-primary/20 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{item.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">${item.price.toFixed(2)} each</p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                                    <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 rounded-sm hover:bg-background"
                                            onClick={() => updateQuantity(item.id, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <span className="text-xs w-6 text-center font-medium">{item.quantity}</span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 rounded-sm hover:bg-background"
                                            onClick={() => updateQuantity(item.id, 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 rounded-sm hover:bg-background text-destructive hover:text-destructive"
                                            onClick={() => removeFromCart(item.id)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            <div className="p-6 bg-secondary/5 border-t space-y-4">
                
                {/* Customer Selection */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Customer</span>
                        <CustomerDialog 
                            open={customerDialogOpen} 
                            onOpenChange={setCustomerDialogOpen}
                            onCustomerAdded={setSelectedCustomer}
                        />
                    </div>
                    
                    {selectedCustomer ? (
                        <div className="flex items-center justify-between bg-primary/10 p-2 rounded-md border border-primary/20">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                                    <User className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{selectedCustomer.name}</p>
                                    {selectedCustomer.points && (
                                        <p className="text-xs text-muted-foreground">{selectedCustomer.points} Points</p>
                                    )}
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedCustomer(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input placeholder="Search customer (phone/name)..." className="h-9 text-sm" />
                            <Button variant="secondary" size="icon" className="h-9 w-9 shrink-0" onClick={() => setCustomerDialogOpen(true)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    {selectedCustomer?.allergies && (
                        <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
                            <Tag className="h-3 w-3" />
                            <span>Allergy Alert: {selectedCustomer.allergies}</span>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Discount Input */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Tag className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Discount %" 
                            type="number" 
                            className="pl-9 h-9 text-sm" 
                            min="0" 
                            max="100"
                            value={discount === 0 ? "" : discount}
                            onChange={(e) => setDiscount(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (10%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-emerald-600">
                            <span>Discount ({discount}%)</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-xl">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                </div>
                
                <Button 
                    className="w-full h-12 text-lg shadow-primary/20 shadow-lg" 
                    disabled={cart.length === 0}
                    onClick={onCheckout}
                >
                    <CreditCard className="mr-2 h-5 w-5" />
                    Pay ${total.toFixed(2)}
                </Button>
            </div>
        </div>
    )
}
