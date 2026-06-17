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
import { calculateExactAge } from "@/lib/age-calculator"
import { Patient } from "@/types/pharmacy"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useEffect, useState, useMemo } from "react"
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
    address: z.string().optional(),
    visitType: z.enum(['ipd', 'opd', 'emergency']).optional(),
    // New Fields
    village: z.string().optional(),
    union: z.string().optional(),
    postOffice: z.string().optional(),
    thana: z.string().optional(),
    district: z.string().optional(),
    religion: z.string().optional(),
    occupation: z.string().optional(),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
    nationality: z.string().optional(),
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
      visitType: "opd",
      village: "",
      union: "",
      postOffice: "",
      thana: "",
      district: "",
      religion: "",
      occupation: "",
      maritalStatus: undefined,
      nationality: "Bangladeshi",
      dob: undefined
    },
  })

  const dobValue = form.watch("dob");

  const exactAgeText = useMemo(() => calculateExactAge(dobValue), [dobValue]);

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
        visitType: patient.visitType || "opd",
        village: patient.village || "",
        union: patient.union || "",
        postOffice: patient.postOffice || "",
        thana: patient.thana || "",
        district: patient.district || "",
        religion: patient.religion || "",
        occupation: patient.occupation || "",
        maritalStatus: patient.maritalStatus,
        nationality: patient.nationality || "Bangladeshi",
        dob: patient.dob || undefined
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
        visitType: "opd",
        village: "",
        union: "",
        postOffice: "",
        thana: "",
        district: "",
        religion: "",
        occupation: "",
        maritalStatus: undefined,
        nationality: "Bangladeshi",
        dob: undefined
      })
    }
  }, [patient, form])

  const onSubmit = async (data: PatientFormValues) => {
    try {
      setSaving(true)
      // Filter out null values before sending to API
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== null)
      );

      let response;
      if (isEditing && patient) {
        response = await patientService.updatePatient(patient.id, cleanedData as any)
        toast.success("Patient updated successfully")
      } else {
        response = await patientService.createPatient(cleanedData as any)
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Update Patient Details' : 'Register New Patient'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modify patient information below.' : 'Enter patient details to create a new record.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info & Address</TabsTrigger>
                <TabsTrigger value="details">Other Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4 pt-4">
                <ScrollArea className="h-[450px] pr-4">
                  <div className="space-y-4 pb-4">
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

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField
                        control={form.control}
                        name="dob"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    if (e.target.value) {
                                      const birthDate = new Date(e.target.value);
                                      const today = new Date();
                                      let calcAge = today.getFullYear() - birthDate.getFullYear();
                                      const m = today.getMonth() - birthDate.getMonth();
                                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                          calcAge--;
                                      }
                                      const newAge = calcAge >= 0 ? calcAge : 0;
                                      // Force React Hook Form to trigger re-evaluation of value for SmartNumberInput
                                      setTimeout(() => {
                                        form.setValue('age', newAge, { shouldValidate: true, shouldDirty: true });
                                      }, 0);
                                    }
                                  }}
                                />
                            </FormControl>
                            {exactAgeText && <p className="text-[10px] text-muted-foreground font-bold mt-1 tracking-tight text-primary">Exact Age: {exactAgeText}</p>}
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

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="district"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>District</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Dhaka" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="thana"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Thana / Upazila</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Uttara" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="postOffice"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Post Office</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Sector 4" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="union"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Union / Ward</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Ward 1" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="village"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Village / Area</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Uttara Sector 4" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="visitType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Visit Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select visit type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="opd">OPD (Out-Patient)</SelectItem>
                                    <SelectItem value="ipd">IPD (In-Patient)</SelectItem>
                                    <SelectItem value="emergency">Emergency</SelectItem>
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
                          <FormLabel>Full Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Street address, house number..." {...field} className="h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 pt-4">
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Islam">Islam</SelectItem>
                                    <SelectItem value="Hinduism">Hinduism</SelectItem>
                                    <SelectItem value="Christianity">Christianity</SelectItem>
                                    <SelectItem value="Buddhism">Buddhism</SelectItem>
                                    <SelectItem value="Sikhism">Sikhism</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="occupation"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Service" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="maritalStatus"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Marital Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="married">Married</SelectItem>
                                    <SelectItem value="divorced">Divorced</SelectItem>
                                    <SelectItem value="widowed">Widowed</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="nationality"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nationality</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Bangladeshi">Bangladeshi</SelectItem>
                                    <SelectItem value="Indian">Indian</SelectItem>
                                    <SelectItem value="Pakistani">Pakistani</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

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
