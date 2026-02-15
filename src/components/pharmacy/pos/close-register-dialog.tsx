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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { pharmacyService } from "@/services/pharmacy-service"
import { usePosStore } from "@/store/use-pos-store"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
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
  onSuccess: () => void
}

export function CloseRegisterDialog({
  open,
  onOpenChange,
  registerId,
  onSuccess
}: CloseRegisterDialogProps) {
  const [loading, setLoading] = useState(false)
  const { activeRegister, setActiveRegister } = usePosStore()

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
      setLoading(true)
      const response = await pharmacyService.closeCashRegister(registerId, {
        actualBalance: data.actualBalance,
        closingNote: data.closingNote,
      })
      
      if (response.success) {
        toast.success("Cash register closed successfully")
        setActiveRegister(null)
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(response.message || "Failed to close register")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to close cash register")
    } finally {
      setLoading(false)
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
                <span className="font-medium">${Number(activeRegister?.openingBalance || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Sales ({activeRegister?.salesCount || 0}):</span>
                <span className="font-medium text-emerald-600">+${Number(activeRegister?.salesAmount || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">Expenses ({activeRegister?.expensesCount || 0}):</span>
                <span className="font-medium text-destructive">-${Number(activeRegister?.expensesAmount || 0).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Expected Balance:</span>
                <span className="text-primary">
                    ${(Number(activeRegister?.openingBalance || 0) + 
                       Number(activeRegister?.salesAmount || 0) - 
                       Number(activeRegister?.expensesAmount || 0)).toFixed(2)}
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
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Close Register
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
