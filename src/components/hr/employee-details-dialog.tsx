"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useEmployee } from "@/hooks/hr-queries"
import { format } from "date-fns"
import {
    Briefcase,
    Calendar,
    Clock,
    Contact,
    CreditCard,
    Fingerprint,
    HeartPulse,
    Loader2,
    Mail,
    MapPin,
    Phone,
    User as UserIcon,
    UserPlus
} from "lucide-react"
import { useState } from "react"
import { UserDialog } from "../../app/[locale]/(dashboard)/settings/users/components/user-dialog"

interface EmployeeDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeId: string | null
}

export function EmployeeDetailsDialog({ open, onOpenChange, employeeId }: EmployeeDetailsDialogProps) {
    const { data: employeeRes, isLoading } = useEmployee(employeeId || "")
    const employee = employeeRes?.data
    const [userDialogOpen, setUserDialogOpen] = useState(false)

    if (!employeeId) return null

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
            case "inactive":
                return <Badge variant="secondary">Inactive</Badge>
            case "on_leave":
                return <Badge className="bg-orange-500 hover:bg-orange-600 font-medium">On Leave</Badge>
            case "terminated":
                return <Badge variant="destructive">Terminated</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const formatCurrency = (val: string | number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 0
        }).format(Number(val))
    }

    const DetailItem = ({ icon: Icon, label, value, className = "" }: { icon: any, label: string, value: any, className?: string }) => (
        <div className={`flex items-start gap-3 ${className}`}>
            <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary/70" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value || "—"}</p>
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent pointer-events-none" />
                
                <DialogHeader className="p-8 pb-4 relative">
                    {isLoading ? (
                        <div className="flex items-center gap-4">
                            <DialogTitle className="sr-only">Loading Employee Details</DialogTitle>
                            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
                                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner overflow-hidden">
                                    {employee?.photoUrl ? (
                                        <img 
                                            src={employee.photoUrl} 
                                            alt={employee.name} 
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="h-10 w-10 text-primary" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <DialogTitle className="text-2xl font-bold tracking-tight">
                                        {employee?.name}
                                    </DialogTitle>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-widest bg-background/50 backdrop-blur-sm">
                                            {employee?.employeeNumber || "NO ID"}
                                        </Badge>
                                        <span className="text-muted-foreground text-xs font-medium">•</span>
                                        <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                                            {employee?.employeeType}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {employee && getStatusBadge(employee.status)}
                                <Separator orientation="vertical" className="h-8 hidden md:block" />
                            </div>
                        </div>
                    )}
                </DialogHeader>

                <ScrollArea className="max-h-[70vh] p-8 pt-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="grid gap-8">
                            {/* Professional Info */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                    <Briefcase className="h-4 w-4" />
                                    <h3 className="uppercase tracking-widest">Professional Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-5 rounded-xl bg-secondary/20 border border-secondary/50">
                                    <DetailItem 
                                        icon={Briefcase} 
                                        label="Department" 
                                        value={employee?.department?.name} 
                                    />
                                    <DetailItem 
                                        icon={Fingerprint} 
                                        label="Designation" 
                                        value={employee?.designation?.name} 
                                    />
                                    <DetailItem 
                                        icon={Calendar} 
                                        label="Joining Date" 
                                        value={employee?.joiningDate && format(new Date(employee.joiningDate), "PPP")} 
                                    />
                                    {['doctor', 'guest-doctor'].includes(employee?.employeeType || '') && (
                                        <>
                                            <DetailItem 
                                                icon={Clock} 
                                                label="Duty Hours" 
                                                value={employee?.dutyStartTime ? `${employee.dutyStartTime} - ${employee.dutyEndTime || '???'}` : "Not Set"} 
                                            />
                                            <DetailItem 
                                                icon={Briefcase} 
                                                label="Room/Chamber" 
                                                value={employee?.chamberOrRoomNumber} 
                                            />
                                        </>
                                    )}
                                </div>
                            </section>

                            {['doctor', 'guest-doctor'].includes(employee?.employeeType || '') && (
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                        <HeartPulse className="h-4 w-4" />
                                        <h3 className="uppercase tracking-widest">Clinical Charges & Commission</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-5 rounded-xl bg-primary/5 border border-primary/10">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Visit Charge</p>
                                            <p className="text-lg font-bold text-primary">{employee?.visitCharge ? formatCurrency(employee.visitCharge) : "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Commission %</p>
                                            <p className="text-lg font-bold text-primary">{employee?.commissionPercentage || 0}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Report Charge</p>
                                            <p className="text-lg font-bold text-primary">{employee?.reportCharge ? formatCurrency(employee.reportCharge) : "—"}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Repeat Day Gap</p>
                                            <p className="text-lg font-bold text-primary">{employee?.repeatVisitDayGap || 7} Days</p>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Personal Information */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                        <Contact className="h-4 w-4" />
                                        <h3 className="uppercase tracking-widest">Personal Details</h3>
                                    </div>
                                    <div className="grid gap-5 p-5 rounded-xl bg-background border shadow-sm">
                                        <DetailItem icon={Phone} label="Contact Phone" value={employee?.phone} />
                                        <DetailItem icon={Mail} label="Email Address" value={employee?.email} />
                                        <DetailItem icon={MapPin} label="Home Address" value={employee?.address} />
                                        <div className="grid grid-cols-2 gap-4">
                                            <DetailItem icon={Calendar} label="Date of Birth" value={employee?.dob && format(new Date(employee.dob), "PP")} />
                                            <DetailItem icon={HeartPulse} label="Blood Group" value={employee?.bloodGroup} />
                                        </div>
                                    </div>
                                </section>

                                {/* Financial & Additional */}
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                        <CreditCard className="h-4 w-4" />
                                        <h3 className="uppercase tracking-widest">Finance & Status</h3>
                                    </div>
                                    <div className="grid gap-5 p-5 rounded-xl bg-background border shadow-sm">
                                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gross Monthly Salary</p>
                                            <p className="text-2xl font-black text-primary">
                                                {employee?.grossSalary ? formatCurrency(employee.grossSalary) : "—"}
                                            </p>
                                        </div>
                                        <DetailItem 
                                            icon={Calendar} 
                                            label="Age / Gender" 
                                            value={`${employee?.age} years / ${employee?.gender}`} 
                                            className="capitalize"
                                        />
                                        <DetailItem 
                                            icon={Calendar} 
                                            label="Leaving Date" 
                                            value={employee?.leavingDate ? format(new Date(employee.leavingDate), "PPP") : "Still Employed"} 
                                        />
                                    </div>
                                </section>
                            </div>

                            <Separator />
                            
                            <div className="flex justify-end gap-3 pb-4">
                                <Button 
                                    variant="outline" 
                                    className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                                    onClick={() => setUserDialogOpen(true)}
                                >
                                    <UserPlus className="h-4 w-4" />
                                    Create User Account
                                </Button>
                                <Button variant="outline" onClick={() => onOpenChange(false)}>
                                    Close Details
                                </Button>
                            </div>

                            {employee && (
                                <UserDialog 
                                    open={userDialogOpen}
                                    onOpenChange={setUserDialogOpen}
                                    onSuccess={() => {
                                        setUserDialogOpen(false)
                                    }}
                                    userToEdit={null}
                                    defaultValues={{
                                        fullName: employee.name,
                                        fullNameBangla: employee.nameBangla || "",
                                        email: employee.email || "",
                                        phone: employee.phone || "",
                                        branchId: employee.branchId || "",
                                        employeeId: employee.id,
                                        designation: employee.designation?.name || "",
                                        username: employee.email?.split('@')[0] || employee.name.toLowerCase().replace(/\s+/g, '.'),
                                    }}
                                />
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
