import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface StoreLocation {
    id: string
    name: string
    address: string
    type: 'Main' | 'Branch'
}

interface StoreContextState {
    activeStoreId: string
    stores: StoreLocation[]
    setActiveStore: (id: string) => void
    addStore: (store: StoreLocation) => void
}

export const useStoreContext = create<StoreContextState>()(
    persist(
        (set) => ({
            activeStoreId: 'store-1',
            stores: [
                { id: 'store-1', name: 'Main Branch (Downtown)', address: '123 Main St', type: 'Main' },
                { id: 'store-2', name: 'City Center Hub', address: '456 Center Ave', type: 'Branch' },
                { id: 'store-3', name: 'Westside Clinic', address: '789 West Blvd', type: 'Branch' },
            ],
            setActiveStore: (id) => set({ activeStoreId: id }),
            addStore: (store) => set((state) => ({ stores: [...state.stores, store] }))
        }),
        {
            name: 'store-context',
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
        }
    )
)
