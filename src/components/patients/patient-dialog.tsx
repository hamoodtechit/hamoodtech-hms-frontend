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
import { DobPicker } from "./dob-picker"
import { Patient } from "@/types/pharmacy"
import { ScrollArea } from "@/components/ui/scroll-area"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarIcon, Loader2, User, Phone, MapPin, Activity, FileText } from "lucide-react"
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

  const ageParts = useMemo(() => {
     if (!dobValue) return { y: "", m: "", d: "" };
     const birthDate = new Date(dobValue);
     if (isNaN(birthDate.getTime())) return { y: "", m: "", d: "" };
     const today = new Date();
     let years = today.getFullYear() - birthDate.getFullYear();
     let months = today.getMonth() - birthDate.getMonth();
     let days = today.getDate() - birthDate.getDate();
     if (days < 0) { months--; const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0); days += lastMonth.getDate(); }
     if (months < 0) { years--; months += 12; }
     if (years < 0) return { y: "", m: "", d: "" };
     return { y: years ? years.toString() : "", m: months ? months.toString() : "", d: days ? days.toString() : "" };
  }, [dobValue]);

  const handleAgePartsChange = (y: string, m: string, d: string) => {
      const yy = parseInt(y || "0");
      const mm = parseInt(m || "0");
      const dd = parseInt(d || "0");

      if (yy === 0 && mm === 0 && dd === 0 && !y && !m && !d) {
          form.setValue('dob', undefined, { shouldValidate: true, shouldDirty: true });
          form.setValue('age', 0, { shouldValidate: true, shouldDirty: true });
          return;
      }

      const today = new Date();
      today.setFullYear(today.getFullYear() - yy);
      today.setMonth(today.getMonth() - mm);
      today.setDate(today.getDate() - dd);
      
      const paddedDay = today.getDate().toString().padStart(2, '0');
      const paddedMonth = (today.getMonth() + 1).toString().padStart(2, '0');
      const dateString = `${today.getFullYear()}-${paddedMonth}-${paddedDay}`;
      
      form.setValue('dob', dateString, { shouldValidate: true, shouldDirty: true });
      form.setValue('age', yy, { shouldValidate: true, shouldDirty: true });
  }

  useEffect(() => {
    if (patient) {
      form.reset({
        name: patient.name,
        nameBangla: patient.nameBangla || "",
        age: Number(patient.age),
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        bloodGroup: patient.bloodGroup || undefined,
        visitType: patient.visitType || "opd",
        village: patient.village || "",
        union: patient.union || "",
        postOffice: patient.postOffice || "",
        thana: patient.thana || "",
        district: patient.district || "",
        religion: patient.religion || "",
        occupation: patient.occupation || "",
        maritalStatus: patient.maritalStatus || undefined,
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
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-6 pb-2">
                
                {/* Registration Details section */}
                <div className="bg-secondary/20 p-4 rounded-xl border border-secondary/30 space-y-4">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-2 uppercase tracking-wider">
                        <Activity className="w-4 h-4" /> Registration Type
                    </h3>
                    <FormField
                    control={form.control}
                    name="visitType"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Visit Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                            <SelectTrigger className="bg-background">
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

                {/* Personal Information section */}
                <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-muted-foreground">
                        <User className="w-4 h-4" /> Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} className="bg-background" />
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
                                <Input placeholder="নাম (বাংলা)" {...field} className="bg-background" />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center justify-between">
                              <span>Age (Years, Months, Days) *</span>
                            </FormLabel>
                            <FormControl>
                                <div className="relative flex items-center gap-1">
                                  <div className="flex-1 flex items-center border rounded-md px-2 focus-within:ring-1 focus-within:ring-ring h-9 bg-background">
                                      <input 
                                        type="number" 
                                        placeholder="YY" 
                                        className="w-full bg-transparent outline-none text-center text-sm" 
                                        value={ageParts.y} 
                                        onChange={(e) => handleAgePartsChange(e.target.value, ageParts.m, ageParts.d)} 
                                        min="0" max="120"
                                      />
                                      <span className="text-xs text-muted-foreground select-none">Y</span>
                                  </div>
                                  <div className="flex-1 flex items-center border rounded-md px-2 focus-within:ring-1 focus-within:ring-ring h-9 bg-background">
                                      <input 
                                        type="number" 
                                        placeholder="MM" 
                                        className="w-full bg-transparent outline-none text-center text-sm" 
                                        value={ageParts.m} 
                                        onChange={(e) => handleAgePartsChange(ageParts.y, e.target.value, ageParts.d)} 
                                        min="0" max="11"
                                      />
                                      <span className="text-xs text-muted-foreground select-none">M</span>
                                  </div>
                                  <div className="flex-1 flex items-center border rounded-md px-2 focus-within:ring-1 focus-within:ring-ring h-9 bg-background pr-8">
                                      <input 
                                        type="number" 
                                        placeholder="DD" 
                                        className="w-full bg-transparent outline-none text-center text-sm" 
                                        value={ageParts.d} 
                                        onChange={(e) => handleAgePartsChange(ageParts.y, ageParts.m, e.target.value)} 
                                        min="0" max="31"
                                      />
                                      <span className="text-xs text-muted-foreground select-none">D</span>
                                  </div>
                                  <DobPicker 
                                    value={dobValue}
                                    onChange={(dateString) => {
                                        form.setValue('dob', dateString || undefined, { shouldValidate: true, shouldDirty: true });
                                        if (dateString) {
                                            const birthDate = new Date(dateString);
                                            const today = new Date();
                                            let calcAge = today.getFullYear() - birthDate.getFullYear();
                                            const m = today.getMonth() - birthDate.getMonth();
                                            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                                calcAge--;
                                            }
                                            const newAge = calcAge >= 0 ? calcAge : 0;
                                            setTimeout(() => {
                                                form.setValue('age', newAge, { shouldValidate: true, shouldDirty: true });
                                            }, 0);
                                        }
                                    }}
                                  />
                                </div>
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
                                <SelectTrigger className="bg-background">
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
                </div>

                {/* Contact & Address section */}
                <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-muted-foreground">
                        <MapPin className="w-4 h-4" /> Contact & Location
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="flex items-center gap-2">Phone *</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="017..." {...field} className="pl-9 bg-background" />
                                </div>
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
                                <SelectTrigger className="bg-background">
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
                                <Input placeholder="e.g. Dhaka" {...field} className="bg-background" />
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
                                <Input placeholder="e.g. Uttara" {...field} className="bg-background" />
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
                                <Input placeholder="e.g. Sector 4" {...field} className="bg-background" />
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
                                <Input placeholder="e.g. Ward 1" {...field} className="bg-background" />
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
                                <Input placeholder="e.g. Uttara Sector 4" {...field} className="bg-background" />
                            </FormControl>
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
                            <Textarea placeholder="Street address, house number..." {...field} className="h-16 resize-none bg-background" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Additional Demographics section */}
                <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-2 uppercase tracking-wider text-muted-foreground">
                        <FileText className="w-4 h-4" /> Additional Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                        control={form.control}
                        name="religion"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Religion</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger className="bg-background">
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
                                <Input placeholder="e.g. Service" {...field} className="bg-background" />
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
                                <SelectTrigger className="bg-background">
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
                                <SelectTrigger className="bg-background">
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
              </div>
            </ScrollArea>

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
