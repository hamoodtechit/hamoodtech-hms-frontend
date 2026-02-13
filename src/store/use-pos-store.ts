import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface Product {
    id: number
    name: string
    price: number
    quantity: number
}

export interface Transaction {
    id: string
    date: string
    customerName: string
    items: Product[]
    total: number
    subtotal: number
    tax: number
    discount: number
    status: 'Completed' | 'Refunded'
    paymentMethod: 'Cash' | 'Card' | 'Mobile'
}

interface PosState {
    cart: Product[]
    transactions: Transaction[]
    addToCart: (product: any) => void
    removeFromCart: (id: number) => void
    updateQuantity: (id: number, delta: number) => void
    clearCart: () => void
    addTransaction: (transaction: Transaction) => void
    refundTransaction: (id: string) => void
}

export const usePosStore = create<PosState>()(
    persist(
        (set) => ({
            cart: [],
            transactions: [
                 { id: "PH-1004", date: "2024-02-11 12:45", customerName: "John Doe", total: 45.50, status: "Completed", items: [], subtotal: 40, tax: 5.5, discount: 0, paymentMethod: 'Card' },
                 { id: "PH-1003", date: "2024-02-11 11:30", customerName: "Guest", total: 12.00, status: "Completed", items: [], subtotal: 10, tax: 2, discount: 0, paymentMethod: 'Cash' },
            ],
            addToCart: (product) => set((state) => {
                const existing = state.cart.find((item) => item.id === product.id)
                if (existing) {
                    return {
                        cart: state.cart.map((item) =>
                            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                        )
                    }
                }
                return { cart: [...state.cart, { ...product, quantity: 1 }] }
            }),
            removeFromCart: (id) => set((state) => ({
                cart: state.cart.filter((item) => item.id !== id)
            })),
            updateQuantity: (id, delta) => set((state) => ({
                cart: state.cart.map((item) => {
                    if (item.id === id) {
                        const newQuantity = Math.max(1, item.quantity + delta)
                        return { ...item, quantity: newQuantity }
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
            skipHydration: true, // We will handle hydration manually if needed to avoid errors
        }
    )
)
