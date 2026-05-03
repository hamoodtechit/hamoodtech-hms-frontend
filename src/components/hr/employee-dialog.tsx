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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { SmartNumberInput } from "@/components/ui/smart-number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateEmployee, useDepartments, useDesignations, useUpdateEmployee } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { Employee } from "@/types/hr"
import { Loader2, User } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { MediaPicker } from "../media/media-picker"

interface EmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee?: Employee | null
    onSuccess?: () => void
}

export function EmployeeDialog({ open, onOpenChange, employee, onSuccess }: EmployeeDialogProps) {
    const [loading, setLoading] = useState(false)
    const createMutation = useCreateEmployee()
    const updateMutation = useUpdateEmployee()
    const { activeStoreId, stores } = useStoreContext()
    
    const activeBranchName = stores.find(s => s.id === activeStoreId)?.name || "N/A"

    const isEdit = !!employee

    // Form State
    const [formData, setFormData] = useState({
        branchId: "",
        employeeNumber: "",
        employeeType: "",
        name: "",
        nameBangla: "",
        age: 18,
        gender: "male",
        phone: "",
        email: "",
        dob: "",
        bloodGroup: "",
        address: "",
        designationId: "",
        departmentId: "",
        grossSalary: 0,
        joiningDate: new Date().toISOString().split('T')[0],
        leavingDate: "",
        status: "active" as "active" | "inactive" | "on_leave" | "terminated",
        chamberOrRoomNumber: "",
        photoUrl: "",
        visitCharge: 0,
        repeatVisitCharge: 0,
        repeatVisitDayGap: 7,
        reportCharge: 0,
        commissionPercentage: 0,
        dutyStartTime: "",
        dutyEndTime: ""
    })

    const { data: departmentsRes } = useDepartments({ 
        branchId: formData.branchId || activeStoreId || undefined, 
        limit: 100 
    })
    const { data: designationsRes } = useDesignations({ 
        branchId: formData.branchId || activeStoreId || undefined, 
        departmentId: formData.departmentId, 
        limit: 100 
    })

    useEffect(() => {
        if (open) {
            if (employee) {
                setFormData({
                    branchId: employee.branchId,
                    employeeNumber: employee.employeeNumber || "",
                    employeeType: employee.employeeType,
                    name: employee.name,
                    nameBangla: employee.nameBangla || "",
                    age: employee.age,
                    gender: employee.gender,
                    phone: employee.phone,
                    email: employee.email || "",
                    dob: employee.dob || "",
                    bloodGroup: employee.bloodGroup || "",
                    address: employee.address,
                    designationId: employee.designationId || "",
                    departmentId: employee.departmentId || "",
                    grossSalary: Number(employee.grossSalary),
                    joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : "",
                    leavingDate: employee.leavingDate ? employee.leavingDate.split('T')[0] : "",
                    status: employee.status,
                    chamberOrRoomNumber: employee.chamberOrRoomNumber || "",
                    photoUrl: employee.photoUrl || "",
                    visitCharge: Number(employee.visitCharge || 0),
                    repeatVisitCharge: Number(employee.repeatVisitCharge || 0),
                    repeatVisitDayGap: Number(employee.repeatVisitDayGap || 7),
                    reportCharge: Number(employee.reportCharge || 0),
                    commissionPercentage: Number(employee.commissionPercentage || 0),
                    dutyStartTime: employee.dutyStartTime || "",
                    dutyEndTime: employee.dutyEndTime || ""
                })
            } else {
                setFormData({
                    branchId: activeStoreId || "",
                    employeeNumber: "",
                    employeeType: "",
                    name: "",
                    nameBangla: "",
                    age: 18,
                    gender: "male",
                    phone: "",
                    email: "",
                    dob: "",
                    bloodGroup: "",
                    address: "",
                    designationId: "",
                    departmentId: "",
                    grossSalary: 0,
                    joiningDate: new Date().toISOString().split('T')[0],
                    leavingDate: "",
                    status: "active",
                    chamberOrRoomNumber: "",
                    photoUrl: "",
                    visitCharge: 0,
                    repeatVisitCharge: 0,
                    repeatVisitDayGap: 7,
                    reportCharge: 0,
                    commissionPercentage: 0,
                    dutyStartTime: "",
                    dutyEndTime: ""
                })
            }
        }
    }, [open, employee, activeStoreId])

    const handleSave = async () => {
        if (!formData.name || !formData.branchId || !formData.phone || !formData.address || !formData.employeeType) {
            toast.error("Required fields are missing (Name, Branch, Type, Phone, Address)")
            return
        }

        setLoading(true)
        try {
            if (isEdit && employee) {
                await updateMutation.mutateAsync({
                    id: employee.id,
                    data: formData
                })
                toast.success("Employee updated successfully")
            } else {
                await createMutation.mutateAsync(formData)
                toast.success("Employee created successfully")
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            toast.error(isEdit ? "Failed to update employee" : "Failed to create employee")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[1000px] p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{isEdit ? "Edit Employee" : "Add New Employee"}</DialogTitle>
                    <DialogDescription>
                        Fill in the details for the employee record.
                    </DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="max-h-[80vh] px-6">
                    <div className="grid gap-6 py-4">
                        {/* Section: Professional */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2">Professional Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Active Branch</Label>
                                    <Input 
                                        value={activeBranchName} 
                                        disabled 
                                        className="bg-muted"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Branch is driven by global selection.
                                    </p>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Employee ID / Number</Label>
                                    <Input 
                                        value={formData.employeeNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, employeeNumber: e.target.value }))}
                                        placeholder="e.g. EMP001"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Employee Type *</Label>
                                    <Select 
                                        value={formData.employeeType} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, employeeType: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="doctor">Doctor</SelectItem>
                                            <SelectItem value="guest-doctor">Guest Doctor</SelectItem>
                                            <SelectItem value="nurse">Nurse</SelectItem>
                                            <SelectItem value="staff">Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Department</Label>
                                    <Select 
                                        value={formData.departmentId} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, departmentId: val, designationId: "" }))}
                                        disabled={!formData.branchId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departmentsRes?.data?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Designation</Label>
                                    <Select 
                                        value={formData.designationId} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, designationId: val }))}
                                        disabled={!formData.departmentId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Designation" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {designationsRes?.data?.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Joining Date *</Label>
                                    <Input 
                                        type="date" 
                                        value={formData.joiningDate}
                                        onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Status</Label>
                                    <Select 
                                        value={formData.status} 
                                        onValueChange={(val: any) => setFormData(prev => ({ ...prev, status: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="on_leave">On Leave</SelectItem>
                                            <SelectItem value="terminated">Terminated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>{['doctor', 'guest-doctor'].includes(formData.employeeType) ? 'Chamber Number' : 'Room Number'}</Label>
                                    <Input 
                                        value={formData.chamberOrRoomNumber}
                                        onChange={(e) => setFormData(prev => ({ ...prev, chamberOrRoomNumber: e.target.value }))}
                                        placeholder={['doctor', 'guest-doctor'].includes(formData.employeeType) ? "e.g. Room 302" : "e.g. 201"}
                                    />
                                </div>
                                {['doctor', 'guest-doctor'].includes(formData.employeeType) && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label>Duty Start Time</Label>
                                            <Input 
                                                type="time"
                                                value={formData.dutyStartTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dutyStartTime: e.target.value }))}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Duty End Time</Label>
                                            <Input 
                                                type="time"
                                                value={formData.dutyEndTime}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dutyEndTime: e.target.value }))}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Section: Personal */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2">Personal Information</h3>
                            
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="space-y-2">
                                    <Label>Profile Photo</Label>
                                    <MediaPicker 
                                        value={formData.photoUrl}
                                        onChange={(url) => setFormData(prev => ({ ...prev, photoUrl: url }))}
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">
                                        Best if square (e.g. 400x400)
                                    </p>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Full Name (English) *</Label>
                                        <Input 
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Dr. John Doe"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Full Name (Bangla)</Label>
                                        <Input 
                                            value={formData.nameBangla}
                                            onChange={(e) => setFormData(prev => ({ ...prev, nameBangla: e.target.value }))}
                                            placeholder="নাম"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Age *</Label>
                                        <SmartNumberInput 
                                            value={formData.age}
                                            onChange={(val) => setFormData(prev => ({ ...prev, age: val || 18 }))}
                                            min={18}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Gender *</Label>
                                        <Select 
                                            value={formData.gender} 
                                            onValueChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Gender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="male">Male</SelectItem>
                                                <SelectItem value="female">Female</SelectItem>
                                                <SelectItem value="other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Phone *</Label>
                                    <Input 
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="017xxxxxxxx"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Email</Label>
                                    <Input 
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Blood Group</Label>
                                    <Select 
                                        value={formData.bloodGroup} 
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, bloodGroup: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Blood Group" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(bg => (
                                                <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Date of Birth</Label>
                                    <Input 
                                        type="date" 
                                        value={formData.dob}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Address *</Label>
                                <Textarea 
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Permanent/Present Address"
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Section: Finance */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold border-b pb-2">Financial Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Gross Salary *</Label>
                                    <SmartNumberInput 
                                        value={formData.grossSalary}
                                        onChange={(val) => setFormData(prev => ({ ...prev, grossSalary: val || 0 }))}
                                        min={0}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            {['doctor', 'guest-doctor'].includes(formData.employeeType) && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black uppercase text-primary">Visit Charge</Label>
                                        <SmartNumberInput 
                                            value={formData.visitCharge}
                                            onChange={(val) => setFormData(prev => ({ ...prev, visitCharge: val || 0 }))}
                                            min={0}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black uppercase text-primary">Repeat Charge</Label>
                                        <SmartNumberInput 
                                            value={formData.repeatVisitCharge}
                                            onChange={(val) => setFormData(prev => ({ ...prev, repeatVisitCharge: val || 0 }))}
                                            min={0}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black uppercase text-primary">Day Gap</Label>
                                        <SmartNumberInput 
                                            value={formData.repeatVisitDayGap}
                                            onChange={(val) => setFormData(prev => ({ ...prev, repeatVisitDayGap: val || 7 }))}
                                            min={1}
                                            placeholder="7"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black uppercase text-primary">Report Charge</Label>
                                        <SmartNumberInput 
                                            value={formData.reportCharge}
                                            onChange={(val) => setFormData(prev => ({ ...prev, reportCharge: val || 0 }))}
                                            min={0}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label className="text-xs font-black uppercase text-primary">Commission %</Label>
                                        <SmartNumberInput 
                                            value={formData.commissionPercentage}
                                            onChange={(val) => setFormData(prev => ({ ...prev, commissionPercentage: val || 0 }))}
                                            min={0}
                                            max={100}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Update Employee" : "Save Employee"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
