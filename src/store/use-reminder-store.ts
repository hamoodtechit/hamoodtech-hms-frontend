import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface DosageReminder {
    id: string
    patientName: string
    medication: string
    dosage: string // e.g., "1 tablet"
    frequency: string // e.g., "Daily", "Twice Daily"
    time: string[] // e.g., ["08:00", "20:00"]
    startDate: string
    active: boolean
    method: 'SMS' | 'Email'
    contact: string
}

interface ReminderState {
    reminders: DosageReminder[]
    addReminder: (reminder: DosageReminder) => void
    toggleReminder: (id: string) => void
    deleteReminder: (id: string) => void
}

export const useReminderStore = create<ReminderState>()(
    persist(
        (set) => ({
            reminders: [
                {
                    id: 'rem-1',
                    patientName: 'John Doe',
                    medication: 'Lisinopril',
                    dosage: '10mg',
                    frequency: 'Daily',
                    time: ['09:00'],
                    startDate: '2024-02-01',
                    active: true,
                    method: 'SMS',
                    contact: '+1234567890'
                }
            ],
            addReminder: (reminder) => set((state) => ({ 
                reminders: [reminder, ...state.reminders] 
            })),
            toggleReminder: (id) => set((state) => ({
                reminders: state.reminders.map(r => 
                    r.id === id ? { ...r, active: !r.active } : r
                )
            })),
            deleteReminder: (id) => set((state) => ({
                reminders: state.reminders.filter(r => r.id !== id)
            }))
        }),
        {
            name: 'reminder-storage',
            storage: createJSONStorage(() => localStorage),
            skipHydration: true,
        }
    )
)
