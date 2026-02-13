import { useCallback, useState } from 'react'

export interface Interaction {
    severity: 'High' | 'Moderate' | 'Low'
    description: string
    drugs: string[]
}

// Mock database of interactions
const INTERACTION_DB: Record<string, string[]> = {
    'aspirin': ['warfarin', 'heparin', 'ibuprofen'],
    'warfarin': ['aspirin', 'ibuprofen', 'acetaminophen'],
    'amoxicillin': ['methotrexate'],
    'sildenafil': ['nitroglycerin', 'isosorbide'],
}

const INTERACTION_DETAILS: Record<string, { severity: 'High' | 'Moderate' | 'Low', description: string }> = {
    'aspirin+warfarin': { severity: 'High', description: 'Increased risk of bleeding.' },
    'aspirin+ibuprofen': { severity: 'Moderate', description: 'May reduce aspirin heart protection.' },
    'amoxicillin+methotrexate': { severity: 'High', description: 'May increase methotrexate toxicity.' },
    'sildenafil+nitroglycerin': { severity: 'High', description: 'Deadly drop in blood pressure.' },
}

export function useDrugInteraction() {
    const [interactions, setInteractions] = useState<Interaction[]>([])

    const checkInteractions = useCallback((drugNames: string[]) => {
        const foundInteractions: Interaction[] = []
        const lowerDrugs = drugNames.map(d => d.toLowerCase())

        for (let i = 0; i < lowerDrugs.length; i++) {
            for (let j = i + 1; j < lowerDrugs.length; j++) {
                const drugA = lowerDrugs[i]
                const drugB = lowerDrugs[j]

                // Check direct interaction A -> B
                if (INTERACTION_DB[drugA]?.includes(drugB)) {
                    const key = `${drugA}+${drugB}`
                    const revKey = `${drugB}+${drugA}`
                    const details = INTERACTION_DETAILS[key] || INTERACTION_DETAILS[revKey] || { severity: 'Moderate', description: 'Potential interaction detected.' }

                    foundInteractions.push({
                        severity: details.severity,
                        description: details.description,
                        drugs: [drugA, drugB]
                    })
                }
            }
        }

        setInteractions(foundInteractions)
        return foundInteractions
    }, [])

    return { interactions, checkInteractions }
}
