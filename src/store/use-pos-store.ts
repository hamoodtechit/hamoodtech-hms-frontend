import { Branch, CashRegister, PaymentMethod } from '@/types/pharmacy'
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
                
                if (existing) {
                    return {
                        cart: state.cart.map((item) =>
                            (item.id === product.id && item.batchNumber === product.batchNumber) 
                                ? { ...item, quantity: item.quantity + 1 } 
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
                        const newQuantity = Math.max(1, item.quantity + delta)
                        return { ...item, quantity: newQuantity }
                    }
                    return item
                })
            })),
            setQuantity: (id: string, quantity: number, batchNumber?: string) => set((state) => ({
                cart: state.cart.map((item) => {
                    if (item.id === id && item.batchNumber === batchNumber) {
                        return { ...item, quantity: Math.max(1, quantity) }
                    }
                    return item
                })
            })),
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
