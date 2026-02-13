import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ClaimStatus = 'Pending' | 'Approved' | 'Rejected' | 'Paid'

export interface InsuranceProvider {
    id: string
    name: string
    contact: string
    email: string
}

export interface Claim {
    id: string
    patientName: string
    providerId: string
    providerName: string
    date: string
    amount: number
    status: ClaimStatus
    saleId?: string
    notes?: string
}

interface InsuranceState {
    providers: InsuranceProvider[]
    claims: Claim[]
    
    addProvider: (provider: InsuranceProvider) => void
    addClaim: (claim: Claim) => void
    updateClaimStatus: (id: string, status: ClaimStatus) => void
    deleteClaim: (id: string) => void
}

export const useInsuranceStore = create<InsuranceState>()(
    persist(
        (set, get) => ({
            providers: [
                { id: 'p-1', name: 'Blue Cross', contact: '1-800-555-0101', email: 'claims@bluecross.com' },
                { id: 'p-2', name: 'Aetna', contact: '1-800-555-0102', email: 'support@aetna.com' },
                { id: 'p-3', name: 'UnitedHealth', contact: '1-800-555-0103', email: 'help@uhc.com' },
            ],
            claims: [
                {
                    id: 'CLM-001',
                    patientName: 'John Doe',
                    providerId: 'p-1',
                    providerName: 'Blue Cross',
                    date: '2024-02-10',
                    amount: 125.50,
                    status: 'Pending',
                    notes: 'Prescription refill #RX-992'
                },
                {
                    id: 'CLM-002',
                    patientName: 'Jane Smith',
                    providerId: 'p-2',
                    providerName: 'Aetna',
                    date: '2024-02-08',
                    amount: 450.00,
                    status: 'Approved',
                    notes: 'Insulin detailed coverage'
                }
            ],

            addProvider: (provider) => set((state) => ({ 
                providers: [...state.providers, provider] 
            })),

            addClaim: (claim) => set((state) => ({ 
                claims: [claim, ...state.claims] 
            })),

            updateClaimStatus: (id, status) => set((state) => ({
                claims: state.claims.map(c => 
                    c.id === id ? { ...c, status } : c
                )
            })),

            deleteClaim: (id) => set((state) => ({
                claims: state.claims.filter(c => c.id !== id)
            }))
        }),
        {
            name: 'insurance-storage',
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
        }
    )
)
