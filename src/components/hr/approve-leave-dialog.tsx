"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useApproveLeave } from "@/hooks/hr-queries"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ApproveLeaveDialogProps {
  id: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentStatus?: string
}

export function ApproveLeaveDialog({ id, open, onOpenChange, currentStatus = 'pending' }: ApproveLeaveDialogProps) {
  const [status, setStatus] = useState<'approved' | 'rejected' | 'pending'>(currentStatus as 'approved' | 'rejected' | 'pending')
  const [note, setNote] = useState("")

  const approveMutation = useApproveLeave()

  const handleAction = async () => {
    if (!id) return

    try {
      await approveMutation.mutateAsync({
        id,
        data: { status, note }
      })
      toast.success(`Leave request has been ${status}.`)
      onOpenChange(false)
      setNote("")
    } catch (error) {
      toast.error("Failed to update leave request status.")
    }
  }

  // Update local state if currentStatus prop changes
  useState(() => {
    setStatus(currentStatus as 'approved' | 'rejected' | 'pending')
  })

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val)
      if (!val) setNote("")
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Leave Status</DialogTitle>
          <DialogDescription>
            Approve or reject this leave request. You can also add an optional note for the employee.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status">Action</Label>
            <Select value={status} onValueChange={(val: any) => setStatus(val)}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="approved">
                  <div className="flex items-center text-emerald-600 font-medium">
                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                  </div>
                </SelectItem>
                <SelectItem value="rejected">
                  <div className="flex items-center text-rose-600 font-medium">
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </div>
                </SelectItem>
                <SelectItem value="pending">
                   <div className="flex items-center text-amber-600 font-medium">
                    Status Pending
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 pb-2">
            <Label htmlFor="note">Manager Note (Optional)</Label>
            <Textarea 
              id="note" 
              placeholder="E.g., Approved, enjoy your time off. OR Rejected due to high team workload." 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={approveMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleAction} 
            disabled={approveMutation.isPending || !id}
            className={status === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : status === 'rejected' ? 'bg-rose-600 hover:bg-rose-700' : ''}
          >
            {approveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
