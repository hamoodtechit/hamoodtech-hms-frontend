import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface InventoryItem {
    id: string
    name: string
    category: string
    minStockData: number
    price: number
    supplier: string // Default supplier
}

export interface Batch {
    id: string
    itemId: string
    batchNumber: string
    expiryDate: string
    quantity: number
    costPrice: number
}

export interface PurchaseOrder {
    id: string
    date: string
    supplier: string
    items: { itemId: string, quantity: number }[]
    status: 'Pending' | 'Ordered' | 'Received'
    totalCost: number
}

interface InventoryState {
    items: InventoryItem[]
    batches: Batch[]
    purchaseOrders: PurchaseOrder[]
    
    addItem: (item: InventoryItem) => void
    addBatch: (batch: Batch) => void
    updateBatchQuantity: (batchId: string, delta: number) => void
    createPurchaseOrder: (po: PurchaseOrder) => void
    updatePurchaseOrderStatus: (id: string, status: PurchaseOrder['status']) => void
    
    // Selectors helpers
    getItemStock: (itemId: string) => number
    getLowStockItems: () => InventoryItem[]
    getExpiringBatches: (daysThreshold: number) => Batch[]
}

export const useInventoryStore = create<InventoryState>()(
    persist(
        (set, get) => ({
            items: [
                { id: '1', name: 'Paracetamol 500mg', category: 'Tablets', minStockData: 100, price: 5.00, supplier: 'PharmaDist Inc' },
                { id: '2', name: 'Amoxicillin 250mg', category: 'Antibiotics', minStockData: 50, price: 12.50, supplier: 'MedSupply Co' },
                { id: '3', name: 'Insulin Injection', category: 'Injections', minStockData: 10, price: 45.00, supplier: 'BioCare Ltd' },
            ],
            batches: [
                { id: 'b1', itemId: '1', batchNumber: 'BN-101', expiryDate: '2025-12-31', quantity: 200, costPrice: 3.50 },
                { id: 'b2', itemId: '1', batchNumber: 'BN-102', expiryDate: '2024-06-30', quantity: 50, costPrice: 3.50 }, // Expiring soon
                { id: 'b3', itemId: '2', batchNumber: 'BN-201', expiryDate: '2025-10-15', quantity: 40, costPrice: 8.00 }, // Low stock (Total 40 < 50)
                { id: 'b4', itemId: '3', batchNumber: 'BN-301', expiryDate: '2026-01-20', quantity: 15, costPrice: 35.00 },
            ],
            purchaseOrders: [],

            addItem: (item) => set((state) => ({ items: [...state.items, item] })),
            
            addBatch: (batch) => set((state) => ({ batches: [...state.batches, batch] })),
            
            updateBatchQuantity: (batchId, delta) => set((state) => ({
                batches: state.batches.map(b => 
                    b.id === batchId ? { ...b, quantity: Math.max(0, b.quantity + delta) } : b
                )
            })),

            createPurchaseOrder: (po) => set((state) => ({ purchaseOrders: [...state.purchaseOrders, po] })),
            
            updatePurchaseOrderStatus: (id, status) => set((state) => ({
                purchaseOrders: state.purchaseOrders.map(p => 
                    p.id === id ? { ...p, status } : p
                )
            })),

            getItemStock: (itemId) => {
                return get().batches
                    .filter(b => b.itemId === itemId)
                    .reduce((sum, b) => sum + b.quantity, 0)
            },

            getLowStockItems: () => {
                const state = get()
                return state.items.filter(item => {
                    const totalStock = state.getItemStock(item.id)
                    return totalStock <= item.minStockData
                })
            },

            getExpiringBatches: (daysThreshold = 30) => {
                const now = new Date()
                const thresholdDate = new Date()
                thresholdDate.setDate(now.getDate() + daysThreshold)
                
                return get().batches.filter(b => {
                    const expiry = new Date(b.expiryDate)
                    return expiry <= thresholdDate && expiry >= now && b.quantity > 0
                })
            }
        }),
        {
            name: 'inventory-storage',
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
        }
    )
)
