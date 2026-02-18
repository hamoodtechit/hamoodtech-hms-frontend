import { pharmacyService } from '@/services/pharmacy-service'
import { useAuthStore } from '@/store/use-auth-store'
import { Branch } from '@/types/pharmacy'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface StoreContextState {
    activeStoreId: string | null
    stores: Branch[]
    loading: boolean
    setActiveStore: (id: string) => void
    fetchStores: () => Promise<void>
}

export const useStoreContext = create<StoreContextState>()(
    persist(
        (set, get) => ({
            activeStoreId: null,
            stores: [],
            loading: false,
            setActiveStore: (id) => set({ activeStoreId: id }),
            fetchStores: async () => {
                const user = useAuthStore.getState().user
                const hasBranchAccess = user?.role?.name === 'Super Admin' || 
                                      user?.role?.name === 'Admin' || 
                                      user?.role?.name === 'PRO ADMIN' ||
                                      user?.role?.permissions?.some(p => p.key === 'branch:read') ||
                                      user?.permissions?.includes('*');

                if (!hasBranchAccess) {
                    set({ loading: false })
                    return
                }

                try {
                    set({ loading: true })
                    const response = await pharmacyService.getBranches({ limit: 100 })
                    const branches = response.data.branches
                    set({ 
                        stores: branches,
                        // If no active store is selected, or current active store doesn't exist anymore, set the first one
                        activeStoreId: (get().activeStoreId && branches.some(b => b.id === get().activeStoreId)) 
                            ? get().activeStoreId 
                            : (branches.length > 0 ? branches[0].id : null)
                    })
                } catch (error) {
                    console.error("Failed to fetch stores:", error)
                } finally {
                    set({ loading: false })
                }
            }
        }),
        {
            name: 'store-context',
            storage: createJSONStorage(() => localStorage),
        }
    )
)
