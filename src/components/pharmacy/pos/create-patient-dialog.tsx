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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { patientService } from "@/services/patient-service"
import { Patient } from "@/types/pharmacy"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

const createPatientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    nameBangla: z.string().optional(),
    age: z.coerce.number().int().min(0, 'Age must be a positive integer'),
    gender: z.enum(['male', 'female', 'other']),
    phone: z.string().min(1, 'Phone number is required'),
    dob: z.string().optional(),
    bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
    address: z.string().min(1, 'Address is required'),
    visitType: z.enum(['ipd', 'opd', 'emergency']).optional(),
});

type PatientFormValues = z.infer<typeof createPatientSchema>

interface CreatePatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (patient: Patient) => void
}

export function CreatePatientDialog({
  open,
  onOpenChange,
  onSuccess
}: CreatePatientDialogProps) {
  const [saving, setSaving] = useState(false)

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(createPatientSchema) as any,
    defaultValues: {
      name: "",
      age: 0,
      gender: "male",
      phone: "",
      address: "",
    },
  })

  const onSubmit = async (data: PatientFormValues) => {
    try {
      setSaving(true)
      const response = await patientService.createPatient(data)
      toast.success("Patient created successfully")
      onSuccess(response.data)
      onOpenChange(false)
      form.reset()
    } catch (error) {
      toast.error("Failed to create patient")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Register New Patient</DialogTitle>
          <DialogDescription>
            Enter patient details to create a new record.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Phone *</FormLabel>
                    <FormControl>
                        <Input placeholder="017..." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Gender *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Patient
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
