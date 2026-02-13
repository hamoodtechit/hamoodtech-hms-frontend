"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Interaction } from "@/hooks/use-drug-interaction"
import { AlertTriangle } from "lucide-react"

interface InteractionAlertProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    interactions: Interaction[]
    onProceed: () => void
}

export function InteractionAlert({ open, onOpenChange, interactions, onProceed }: InteractionAlertProps) {
    if (!interactions.length) return null

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="border-l-4 border-l-destructive">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center text-destructive">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        Drug Interaction Warning
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        The following interactions were detected in the customer's cart:
                    </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="py-4 space-y-3">
                    {interactions.map((interaction, idx) => (
                        <div key={idx} className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-sm capitalize">
                                    {interaction.drugs.join(' + ')}
                                </span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-destructive text-destructive-foreground">
                                    {interaction.severity}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground">{interaction.description}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Pharmacist Action Required:</strong> Please counsel the patient regarding these risks before proceeding.
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel Sale</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={onProceed}>
                        Override & Proceed
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
