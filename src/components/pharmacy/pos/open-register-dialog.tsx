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

const openRegisterSchema = z.object({
  openingBalance: z.coerce.number().min(0, 'Opening balance must be at least 0'),
  openingNote: z.string().optional(),
})

type OpenRegisterValues = z.infer<typeof openRegisterSchema>

interface OpenRegisterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  branchId: string
  onSuccess: () => void
}

export function OpenRegisterDialog({
  open,
  onOpenChange,
  branchId,
  onSuccess
}: OpenRegisterDialogProps) {
  const [loading, setLoading] = useState(false)
  const { setActiveRegister } = usePosStore()

  const form = useForm<OpenRegisterValues>({
    resolver: zodResolver(openRegisterSchema) as any,
    defaultValues: {
      openingBalance: 0,
      openingNote: "",
    },
  })

  const onSubmit = async (data: OpenRegisterValues) => {
    if (!branchId) {
        toast.error("Branch ID is required")
        return
    }

    try {
      setLoading(true)
      const response = await pharmacyService.openCashRegister({
        branchId,
        openingBalance: data.openingBalance,
        openingNote: data.openingNote,
      })
      
      if (response.success) {
        toast.success("Cash register opened successfully")
        setActiveRegister(response.data)
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(response.message || "Failed to open register")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to open cash register")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
        // Prevent closing manually if possible, but radix doesn't make it easy without 'onPointerDownOutside' etc.
        // For now just standard openChange.
        onOpenChange(val)
    }}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Open Cash Register</DialogTitle>
          <DialogDescription>
            You must open a cash register session before you can process sales.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Balance ($)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openingNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opening Note (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Notes for this session..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Open Register
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
