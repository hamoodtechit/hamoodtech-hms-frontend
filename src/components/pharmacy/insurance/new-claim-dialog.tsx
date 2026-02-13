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
import { useInsuranceStore } from "@/store/use-insurance-store"
import { PlusCircle, Upload } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function NewClaimDialog() {
  const { providers, addClaim } = useInsuranceStore()
  const [open, setOpen] = useState(false)
  
  const [patientName, setPatientName] = useState("")
  const [providerId, setProviderId] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    if (!patientName || !providerId || !amount) {
        toast.error("Please fill in required fields")
        return
    }

    const provider = providers.find(p => p.id === providerId)

    addClaim({
        id: `CLM-${Math.floor(Math.random() * 10000)}`,
        patientName,
        providerId,
        providerName: provider?.name || 'Unknown',
        date: new Date().toISOString().split('T')[0],
        amount: parseFloat(amount),
        status: 'Pending',
        notes
    })

    toast.success("Claim submitted successfully")
    setOpen(false)
    resetForm()
  }

  const resetForm = () => {
      setPatientName("")
      setProviderId("")
      setAmount("")
      setNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Insurance Claim</DialogTitle>
          <DialogDescription>
            Create a new claim request for reimbursement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            
          <div className="grid gap-2">
            <Label>Patient Name</Label>
            <Input value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="e.g. John Doe" />
          </div>

          <div className="grid gap-2">
            <Label>Insurance Provider</Label>
            <Select onValueChange={setProviderId} value={providerId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select provider..." />
                </SelectTrigger>
                <SelectContent>
                    {providers.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
             <Label>Claim Amount ($)</Label>
             <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
          </div>

          <div className="grid gap-2">
            <Label>Notes / Diagnosis Code</Label>
            <Textarea 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Additional details..." 
                className="resize-none"
            />
          </div>

           <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 cursor-pointer hover:bg-muted transition-colors">
              <Upload className="h-6 w-6 mb-2" />
              <p className="text-xs">Attach Policy / Receipt</p>
          </div>

        </div>
        <DialogFooter>
          <Button onClick={handleSubmit}>Submit Claim</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
