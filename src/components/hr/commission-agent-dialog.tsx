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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateCommissionAgent, useUpdateCommissionAgent } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { CommissionAgent } from "@/types/hr"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface CommissionAgentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    agent?: CommissionAgent | null
    onSuccess?: (agent: CommissionAgent) => void
}

export function CommissionAgentDialog({ open, onOpenChange, agent, onSuccess }: CommissionAgentDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateCommissionAgent()
    const updateMutation = useUpdateCommissionAgent()
    const { activeStoreId, stores } = useStoreContext()
    
    const activeBranchName = stores.find(s => s.id === activeStoreId)?.name || "N/A"

    const isEdit = !!agent

    // Form State
    const [name, setName] = useState("")
    const [nameBangla, setNameBangla] = useState("")
    const [phone, setPhone] = useState("")
    const [email, setEmail] = useState("")
    const [address, setAddress] = useState("")
    const [commissionPercentage, setCommissionPercentage] = useState("0")
    const [branchId, setBranchId] = useState("")

    useEffect(() => {
        if (open) {
            if (agent) {
                setName(agent.name)
                setNameBangla(agent.nameBangla || "")
                setPhone(agent.phone || "")
                setEmail(agent.email || "")
                setAddress(agent.address || "")
                setCommissionPercentage(agent.commissionPercentage.toString())
                setBranchId(agent.branchId)
            } else {
                setName("")
                setNameBangla("")
                setPhone("")
                setEmail("")
                setAddress("")
                setCommissionPercentage("0")
                setBranchId(activeStoreId || "")
            }
        }
    }, [open, agent, activeStoreId])

    const handleSave = async () => {
        if (!name || !phone || !branchId) {
            toast.error("Name, Phone and Branch are required")
            return
        }

        setLoading(true)
        try {
            const payload = {
                name,
                nameBangla,
                phone,
                email,
                address,
                commissionPercentage: Number(commissionPercentage),
                branchId
            }

            if (isEdit && agent) {
                const updatedAgent = await updateMutation.mutateAsync({
                    id: agent.id,
                    data: payload
                })
                toast.success("Commission agent updated successfully")
                onSuccess?.((updatedAgent as any).data || updatedAgent)
            } else {
                const newAgent = await createMutation.mutateAsync(payload)
                toast.success("Commission agent created successfully")
                onSuccess?.((newAgent as any).data || newAgent)
            }
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update agent" : "Failed to create agent")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Commission Agent" : "Add New Commission Agent"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Update agent details." : "Create a new commission agent for tracking sales and commissions."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2 col-span-2">
                            <Label>Active Branch</Label>
                            <Input 
                                value={activeBranchName} 
                                disabled 
                                className="bg-muted"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="name">Agent Name (English) *</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Dr. Rafiq Ahmed"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nameBangla">Agent Name (Bangla)</Label>
                            <Input
                                id="nameBangla"
                                value={nameBangla}
                                onChange={(e) => setNameBangla(e.target.value)}
                                placeholder="ডা. রফিক আহমেদ"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="017xxxxxxxx"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@mail.com"
                            />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="commissionPercentage">Commission Percentage (%) *</Label>
                            <Input
                                id="commissionPercentage"
                                type="number"
                                step="0.1"
                                value={commissionPercentage}
                                onChange={(e) => setCommissionPercentage(e.target.value)}
                                placeholder="e.g. 5.5"
                            />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Detailed address..."
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Agent" : "Save Agent"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
