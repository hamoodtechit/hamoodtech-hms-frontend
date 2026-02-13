import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type PrescriptionStatus = 'Pending' | 'Verified' | 'Filled' | 'Rejected'

export interface Prescription {
    id: string
    patientId: string
    patientName: string
    doctorName: string
    date: string
    notes?: string
    imageUrl?: string // In a real app, this would be a URL
    status: PrescriptionStatus
    medications: string[] // List of medication names or IDs
    refillDate?: string // For auto-reminders
}

interface PrescriptionState {
    prescriptions: Prescription[]
    addPrescription: (prescription: Prescription) => void
    updatePrescriptionStatus: (id: string, status: PrescriptionStatus) => void
    linkToSale: (prescriptionId: string, saleId: string) => void
    getPendingPrescriptions: () => Prescription[]
    getPatientPrescriptions: (patientId: string) => Prescription[]
}

export const usePrescriptionStore = create<PrescriptionState>()(
    persist(
        (set, get) => ({
            prescriptions: [
                {
                    id: 'rx-001',
                    patientId: 'c-1',
                    patientName: 'John Doe',
                    doctorName: 'Dr. Smith',
                    date: '2024-02-10',
                    status: 'Pending',
                    medications: ['Paracetamol', 'Amoxicillin'],
                    notes: 'Take twice daily after food.'
                },
                {
                    id: 'rx-002',
                    patientId: 'c-2',
                    patientName: 'Jane Smith',
                    doctorName: 'Dr. Jones',
                    date: '2024-02-09',
                    status: 'Filled',
                    medications: ['Insulin'],
                    refillDate: '2024-03-09'
                }
            ],

            addPrescription: (prescription) => set((state) => ({ 
                prescriptions: [prescription, ...state.prescriptions] 
            })),

            updatePrescriptionStatus: (id, status) => set((state) => ({
                prescriptions: state.prescriptions.map(p => 
                    p.id === id ? { ...p, status } : p
                )
            })),

            linkToSale: (prescriptionId, saleId) => {
                // In a real app, we'd store the saleId on the prescription or vice versa
                console.log(`Linked prescription ${prescriptionId} to sale ${saleId}`)
                get().updatePrescriptionStatus(prescriptionId, 'Filled')
            },

            getPendingPrescriptions: () => {
                return get().prescriptions.filter(p => p.status === 'Pending')
            },

            getPatientPrescriptions: (patientId) => {
                return get().prescriptions.filter(p => p.patientId === patientId)
            }
        }),
        {
            name: 'prescription-storage',
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
        }
    )
)
