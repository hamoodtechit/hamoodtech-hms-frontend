"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { usePrescriptionStore } from "@/store/use-prescription-store"
import { FileUp, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

// Mock customers list - in real app would come from customer store
const MOCK_CUSTOMERS = [
    { id: 'c-1', name: 'John Doe' },
    { id: 'c-2', name: 'Jane Smith' },
    { id: 'c-3', name: 'Bob Johnson' },
]

export function PrescriptionUploadDialog() {
  const { addPrescription } = usePrescriptionStore()
  const [open, setOpen] = useState(false)
  
  const [patientId, setPatientId] = useState("")
  const [doctorName, setDoctorName] = useState("")
  const [medications, setMedications] = useState("")
  const [notes, setNotes] = useState("")
  const [refillDate, setRefillDate] = useState("")

  const handleUpload = () => {
    if (!patientId || !doctorName) {
        toast.error("Please fill in required fields")
        return
    }

    const patient = MOCK_CUSTOMERS.find(c => c.id === patientId)

    addPrescription({
        id: `rx-${Date.now()}`,
        patientId,
        patientName: patient?.name || 'Unknown',
        doctorName,
        date: new Date().toISOString().split('T')[0],
        status: 'Pending',
        medications: medications.split(',').map(s => s.trim()).filter(Boolean),
        notes,
        refillDate: refillDate || undefined
    })

    toast.success("Prescription uploaded successfully")
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
      setPatientId("")
      setDoctorName("")
      setMedications("")
      setNotes("")
      setRefillDate("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20">
            <FileUp className="mr-2 h-4 w-4" /> Upload Prescription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Details Entry</DialogTitle>
          <DialogDescription>
            Enter prescription details manually or upload an image.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            
          {/* Mock Image Upload Area */}
          <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 hover:bg-muted/80 cursor-pointer transition-colors">
              <Upload className="h-8 w-8 mb-2" />
              <p className="text-xs">Drag & drop or click to upload image</p>
          </div>

          <div className="grid gap-2">
            <Label>Patient</Label>
            <Select onValueChange={setPatientId} value={patientId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select patient..." />
                </SelectTrigger>
                <SelectContent>
                    {MOCK_CUSTOMERS.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Doctor Name</Label>
            <Input value={doctorName} onChange={e => setDoctorName(e.target.value)} placeholder="Dr. Name" />
          </div>
          <div className="grid gap-2">
            <Label>Medications (comma separated)</Label>
            <Textarea 
                value={medications} 
                onChange={e => setMedications(e.target.value)} 
                placeholder="e.g. Paracetamol, Amoxicillin" 
                className="resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label>Notes</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
             </div>
             <div className="grid gap-2">
                <Label>Refill Date</Label>
                <Input type="date" value={refillDate} onChange={e => setRefillDate(e.target.value)} />
             </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload}>Save Prescription</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
