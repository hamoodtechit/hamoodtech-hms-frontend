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
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { patientService } from "@/services/patient-service"
import { Patient } from "@/types/pharmacy"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

const patientSchema = z.object({
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

type PatientFormValues = z.infer<typeof patientSchema>

interface PatientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (patient: Patient) => void
  patient?: Patient | null
}

export function PatientDialog({
  open,
  onOpenChange,
  onSuccess,
  patient
}: PatientDialogProps) {
  const [saving, setSaving] = useState(false)
  const isEditing = !!patient

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      name: "",
      age: 0,
      gender: "male",
      phone: "",
      address: "",
      nameBangla: "",
      bloodGroup: undefined,
      visitType: "opd"
    },
  })

  useEffect(() => {
    if (patient) {
      form.reset({
        name: patient.name,
        nameBangla: patient.nameBangla || "",
        age: Number(patient.age),
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        bloodGroup: patient.bloodGroup,
        visitType: patient.visitType || "opd"
      })
    } else {
      form.reset({
        name: "",
        age: 0,
        gender: "male",
        phone: "",
        address: "",
        nameBangla: "",
        bloodGroup: undefined,
        visitType: "opd"
      })
    }
  }, [patient, form])

  const onSubmit = async (data: PatientFormValues) => {
    try {
      setSaving(true)
      let response;
      if (isEditing && patient) {
        response = await patientService.updatePatient(patient.id, data as any)
        toast.success("Patient updated successfully")
      } else {
        response = await patientService.createPatient(data as any)
        toast.success("Patient created successfully")
      }
      onSuccess(response.data)
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      console.error("Patient save error:", error)
      toast.error(error.response?.data?.message || "Failed to save patient")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Update Patient Details' : 'Register New Patient'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify patient information below.' : 'Enter patient details to create a new record.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                name="nameBangla"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Name (Bangla)</FormLabel>
                    <FormControl>
                        <Input placeholder="নাম (বাংলা)" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Age *</FormLabel>
                    <FormControl>
                        <SmartNumberInput placeholder="30" {...field} onChange={(val: number | undefined) => field.onChange(val)} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
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
                name="bloodGroup"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                             {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                                 <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                             ))}
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

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Patient' : 'Create Patient'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
