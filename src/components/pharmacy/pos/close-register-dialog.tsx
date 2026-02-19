"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCloseCashRegister } from "@/hooks/pharmacy-queries"
import { useCurrency } from "@/hooks/use-currency"
import { usePosStore } from "@/store/use-pos-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

const closeRegisterSchema = z.object({
  actualBalance: z.coerce.number().min(0, 'Actual balance must be at least 0'),
  closingNote: z.string().optional(),
})

type CloseRegisterValues = z.infer<typeof closeRegisterSchema>

interface CloseRegisterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  registerId: string
  onSuccess?: () => void
}

export function CloseRegisterDialog({
  open,
  onOpenChange,
  registerId,
  onSuccess
}: CloseRegisterDialogProps) {
  const { activeRegister, setActiveRegister } = usePosStore()
  const { formatCurrency } = useCurrency()
  const closeRegisterMutation = useCloseCashRegister()

  const form = useForm<CloseRegisterValues>({
    resolver: zodResolver(closeRegisterSchema) as any,
    defaultValues: {
      actualBalance: 0,
      closingNote: "",
    },
  })

  const onSubmit = async (data: CloseRegisterValues) => {
    if (!registerId) {
        toast.error("Register ID is required")
        return
    }

    try {
      const response = await closeRegisterMutation.mutateAsync({
        registerId,
        actualBalance: data.actualBalance,
        closingNote: data.closingNote,
      } as any)
      
      if (response.success) {
        toast.success("Cash register closed successfully")
        setActiveRegister(null)
        onSuccess?.()
        onOpenChange(false)
      } else {
        toast.error(response.message || "Failed to close register")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to close cash register")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Close Cash Register</DialogTitle>
          <DialogDescription>
            Enter the final balance to close this session.
          </DialogDescription>
        </DialogHeader>

        {/* Session Summary */}
        <div className="bg-secondary/20 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Opening Balance:</span>
                <span className="font-medium">{formatCurrency(activeRegister?.openingBalance || 0)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Sales (Net) ({activeRegister?.salesCount || 0}):</span>
                <span className="font-medium text-emerald-600">+{formatCurrency(activeRegister?.salesAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses ({activeRegister?.expensesCount || 0}):</span>
                <span className="font-medium text-destructive">-{formatCurrency(activeRegister?.expensesAmount || 0)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Expected Balance:</span>
                <span className="text-primary">
                    {formatCurrency(Number(activeRegister?.openingBalance || 0) + 
                       Number(activeRegister?.salesAmount || 0) - 
                       Number(activeRegister?.expensesAmount || 0))}
                </span>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="actualBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Cash in Drawer ($)</FormLabel>
                  <FormControl>
                    <SmartNumberInput placeholder="0.00" {...field} onChange={(val: number | undefined) => field.onChange(val)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closingNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Closing Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes for closing this session..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={closeRegisterMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={closeRegisterMutation.isPending}>
                {closeRegisterMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Close Register
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
