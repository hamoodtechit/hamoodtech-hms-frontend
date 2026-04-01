import { SearchableSelect } from "@/components/shared/searchable-select"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateDiagnosticTest, useTestGroups, useUpdateDiagnosticTest } from "@/hooks/diagnostic-queries"
import { useDepartments } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { DiagnosticTest, DiagnosticTestPayload } from "@/types/diagnostic"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface DiagnosticTestDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    test?: DiagnosticTest | null
    onSuccess?: () => void
}

export function DiagnosticTestDialog({ open, onOpenChange, test, onSuccess }: DiagnosticTestDialogProps) {
    const [loading, setLoading] = useState(false)
    const { activeStoreId } = useStoreContext()

    const { data: departmentsRes } = useDepartments({ branchId: activeStoreId, limit: 100 })
    const { data: testGroupsRes } = useTestGroups({ limit: 100 })


    const createMutation = useCreateDiagnosticTest()
    const updateMutation = useUpdateDiagnosticTest()

    const isEdit = !!test

    const [formData, setFormData] = useState<DiagnosticTestPayload>({
        branchId: activeStoreId || "",
        name: "",
        nameBangla: "",
        description: "",
        departmentId: "",
        testGroupId: "",
        price: 0,
        reportDays: 0,
    })

    useEffect(() => {
        if (open) {
            if (test) {
                setFormData({
                    branchId: test.branchId || activeStoreId || "",
                    name: test.name,
                    nameBangla: test.nameBangla || "",
                    description: test.description || "",
                    departmentId: test.departmentId,
                    testGroupId: test.testGroupId || "",
                    price: test.price,
                    reportDays: test.reportDays || 0,
                })
            } else {
                setFormData({
                    branchId: activeStoreId || "",
                    name: "",
                    nameBangla: "",
                    description: "",
                    departmentId: "",
                    testGroupId: "",
                    price: 0,
                    reportDays: 0,
                })
            }
        }
    }, [open, test, activeStoreId])

    const handleSave = async () => {
        if (!formData.name || !formData.departmentId || !formData.testGroupId || formData.price === undefined) {
            toast.error("Please fill in required fields (Name, Department, Test Group, Price)")
            return
        }

        setLoading(true)
        try {
            if (isEdit && test) {
                await updateMutation.mutateAsync({
                    id: test.id,
                    data: { ...formData, price: Number(formData.price) }
                })
                toast.success("Diagnostic test updated successfully")
            } else {
                const { branchId, ...createPayload } = formData
                await createMutation.mutateAsync({ ...createPayload, price: Number(formData.price) })
                toast.success("Diagnostic test created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch {
            toast.error(isEdit ? "Failed to update test" : "Failed to create test")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{isEdit ? "Update Diagnostic Test" : "Create New Diagnostic Test"}</DialogTitle>
                    <DialogDescription>
                        Define the details for a diagnostic test or procedure.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[80vh] px-6">
                    <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Test Name *</Label>
                        <Input 
                            id="name" 
                            value={formData.name} 
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g. MRI Scan"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="nameBangla">Name (Bangla)</Label>
                        <Input 
                            id="nameBangla" 
                            value={formData.nameBangla} 
                            onChange={(e) => setFormData(prev => ({ ...prev, nameBangla: e.target.value }))}
                            placeholder="নাম (বাংলা)"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Department *</Label>
                        <SearchableSelect 
                            value={formData.departmentId}
                            onChange={(val) => setFormData(prev => ({ ...prev, departmentId: val }))}
                            options={departmentsRes?.data?.map(d => ({ id: d.id, name: d.name })) || []}
                            placeholder="Select Department"
                            showAll={false}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Test Group *</Label>
                        <SearchableSelect 
                            value={formData.testGroupId || ""}
                            onChange={(val) => setFormData(prev => ({ ...prev, testGroupId: val }))}
                            options={testGroupsRes?.data?.map(g => ({ id: g.id, name: g.name })) || []}
                            placeholder="Select Test Group"
                            showAll={false}
                        />
                    </div>


                    <div className="grid gap-2">
                        <Label htmlFor="price">Standard Price *</Label>
                        <SmartNumberInput 
                            value={Number(formData.price) || undefined} 
                            onChange={(val) => setFormData(prev => ({ ...prev, price: val || 0 }))}
                            min={0}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="reportDays">Report Delivery Days</Label>
                        <SmartNumberInput 
                            value={formData.reportDays} 
                            onChange={(val) => setFormData(prev => ({ ...prev, reportDays: val || 0 }))}
                            min={0}
                            placeholder="e.g. 1"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                            id="description" 
                            value={formData.description} 
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Brief description of the test..."
                            rows={3}
                        />
                    </div>
                </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Test" : "Create Test"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
