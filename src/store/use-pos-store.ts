import { Branch, CashRegister, PaymentMethod, Stock } from '@/types/pharmacy'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Product {
    id: string
    name: string
    price: number
    quantity: number
    batchNumber?: string
    expiryDate?: string
    stockId?: string
    medicineId?: string
    category?: string
    discountPercentage?: number
    discountAmount?: number
    dosageForm?: string
    strength?: string
    genericName?: string
    stock?: number
    stocks?: Stock[]
}

export interface Transaction {
    id: string
    date: string
    customerName: string
    items: Product[]
    total: number
    subtotal: number
    tax: number
    taxPercentage?: number
    discount: number
    discountAmount?: number
    paidAmount?: number
    dueAmount?: number
    status: 'Completed' | 'Refunded'
    paymentMethod: PaymentMethod
    invoiceNumber?: string
}

interface PosState {
    cart: Product[]
    transactions: Transaction[]
    activeRegister: CashRegister | null
    activeBranch: Branch | null
    setActiveRegister: (register: CashRegister | null) => void
    setActiveBranch: (branch: Branch | null) => void
    addToCart: (product: Product) => void
    removeFromCart: (id: string, batchNumber?: string) => void
    updateQuantity: (id: string, delta: number, batchNumber?: string) => void
    setQuantity: (id: string, quantity: number, batchNumber?: string) => void
    switchBatch: (id: string, oldBatchNumber: string, newBatch: Stock) => void
    clearCart: () => void
    addTransaction: (transaction: Transaction) => void
    refundTransaction: (id: string) => void
}

export const usePosStore = create<PosState>()(
    persist(
        (set) => ({
            cart: [],
            transactions: [
                 { id: "PH-1004", date: "2024-02-11 12:45", customerName: "John Doe", total: 45.50, status: "Completed", items: [], subtotal: 40, tax: 5.5, discount: 0, paymentMethod: 'card' },
                 { id: "PH-1003", date: "2024-02-11 11:30", customerName: "Guest", total: 12.00, status: "Completed", items: [], subtotal: 10, tax: 2, discount: 0, paymentMethod: 'cash' },
            ],
            activeRegister: null,
            activeBranch: null,
            setActiveRegister: (register) => set({ activeRegister: register }),
            setActiveBranch: (branch) => set({ activeBranch: branch }),
            addToCart: (product) => set((state) => {
                // Check if item with same ID AND same batch exists
                const existing = state.cart.find((item) => 
                    item.id === product.id && item.batchNumber === product.batchNumber
                )
                
                // Calculate total stock across all batches to allow overflow
                const totalStock = product.stocks?.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0) || product.stock || 0
                
                if (existing) {
                    // Check total stock limit instead of single batch limit
                    if (existing.quantity >= totalStock) {
                        return { cart: state.cart } // No change, caller should handle toast
                    }
                    return {
                        cart: state.cart.map((item) =>
                            (item.id === product.id && item.batchNumber === product.batchNumber) 
                                ? { ...item, quantity: item.quantity + 1, stocks: product.stocks || item.stocks } 
                                : item
                        )
                    }
                }
                return { cart: [...state.cart, { ...product, quantity: 1 }] }
            }),
            removeFromCart: (id: string, batchNumber?: string) => set((state) => ({
                cart: state.cart.filter((item) => !(item.id === id && item.batchNumber === batchNumber))
            })),
            updateQuantity: (id: string, delta: number, batchNumber?: string) => set((state) => ({
                cart: state.cart.map((item) => {
                    if (item.id === id && item.batchNumber === batchNumber) {
                        const totalStock = item.stocks?.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0) || item.stock || 0
                        const newQuantity = Math.max(1, item.quantity + delta)
                        
                        // Limit to total stock
                        if (delta > 0 && newQuantity > totalStock) {
                            return item
                        }
                        
                        return { ...item, quantity: newQuantity }
                    }
                    return item
                })
            })),
            setQuantity: (id: string, quantity: number, batchNumber?: string) => set((state) => ({
                cart: state.cart.map((item) => {
                    if (item.id === id && item.batchNumber === batchNumber) {
                        const totalStock = item.stocks?.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0) || item.stock || 0
                        const validatedQuantity = Math.min(Math.max(1, quantity), totalStock)
                        return { ...item, quantity: validatedQuantity }
                    }
                    return item
                })
            })),
            switchBatch: (id, oldBatchNumber, newBatch) => set((state) => {
                // Find the item to switch
                const itemToSwitch = state.cart.find(item => item.id === id && item.batchNumber === oldBatchNumber)
                if (!itemToSwitch) return state

                // Check if an item with the NEW batch already exists in cart
                const targetExisting = state.cart.find(item => item.id === id && item.batchNumber === newBatch.batchNumber)

                if (targetExisting) {
                    // Merge quantities if they are the same medicine but different entries
                    // Ensure we don't exceed the new batch's stock
                    const combinedQuantity = Math.min(itemToSwitch.quantity + targetExisting.quantity, (newBatch.quantity as number) || 0)
                    
                    return {
                        cart: state.cart
                            .filter(item => !(item.id === id && item.batchNumber === oldBatchNumber)) // Remove the old entry
                            .map(item => 
                                (item.id === id && item.batchNumber === newBatch.batchNumber)
                                    ? { 
                                        ...item, 
                                        quantity: combinedQuantity,
                                        price: Number(newBatch.unitPrice),
                                        stock: Number(newBatch.quantity),
                                        expiryDate: newBatch.expiryDate
                                      }
                                    : item
                            )
                    }
                }

                // Otherwise just update the specific item
                const totalStock = itemToSwitch.stocks?.reduce((acc: number, s: any) => acc + (Number(s.quantity) || 0), 0) || itemToSwitch.stock || 0
                return {
                    cart: state.cart.map((item) => 
                        (item.id === id && item.batchNumber === oldBatchNumber)
                            ? { 
                                ...item, 
                                batchNumber: newBatch.batchNumber,
                                expiryDate: newBatch.expiryDate,
                                price: Number(newBatch.unitPrice),
                                stock: totalStock, // Preserve total stock
                                quantity: Math.min(item.quantity, totalStock)
                              }
                            : item
                    )
                }
            }),
            clearCart: () => set({ cart: [] }),
            addTransaction: (transaction) => set((state) => ({
                transactions: [transaction, ...state.transactions]
            })),
            refundTransaction: (id) => set((state) => ({
                transactions: state.transactions.map(t => 
                    t.id === id ? { ...t, status: 'Refunded' } : t
                )
            }))
        }),
        {
            name: 'pos-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
