"use client"

import { ReferralPersonDialog } from "@/components/hr/referral-person-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { usePermissions } from "@/hooks/use-permissions"
import { useDeleteReferral, useReferrals } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { ReferralPerson } from "@/types/hr"
import { Edit, Eye, Loader2, Plus, Search, Trash2, Wallet, User, Building2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Link } from "@/i18n/navigation"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function ReferralsPage() {
    const { hasPermission } = usePermissions()
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedReferral, setSelectedReferral] = useState<ReferralPerson | null>(null)
    const { activeStoreId } = useStoreContext()

    const { data: referralsRes, isLoading, refetch } = useReferrals({ 
        page, 
        limit: 10, 
        search, 
        branchId: activeStoreId || undefined
    })
    
    const deleteMutation = useDeleteReferral()

    const referralsData = referralsRes?.data || []
    const referrals: ReferralPerson[] = Array.isArray(referralsData) ? referralsData : (referralsData as any)?.data || (referralsData as any)?.referrals || []
    const meta = referralsRes?.meta || (referralsData as any)?.meta

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this referral person?")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Referral person deleted successfully")
            } catch (error) {
                toast.error("Failed to delete referral person")
            }
        }
    }

    return (
        <PermissionGuard permission="user:read">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Referral Persons</h1>
                        <p className="text-muted-foreground">Manage external agents and internal employee referrals.</p>
                    </div>
                    {(hasPermission('referral:create') || hasPermission('agent:create')) && (
                        <Button onClick={() => {
                            setSelectedReferral(null)
                            setDialogOpen(true)
                        }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Referral
                        </Button>
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-3 border-b">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                               <h3 className="font-semibold text-lg">Referral Directory</h3>
                               <p className="text-sm text-muted-foreground">Detailed list of all registered referral sources.</p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or phone..."
                                        className="pl-8 h-9"
                                        value={search}
                                        onChange={(e) => {
                                            setSearch(e.target.value)
                                            setPage(1)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/50 hover:bg-muted/50">
                                    <TableHead className="w-[300px]">Referral Source</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Commissions</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary/50" />
                                        </TableCell>
                                    </TableRow>
                                ) : referrals.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            No referral sources found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    referrals.map((referral) => (
                                        <TableRow key={referral.id} className="hover:bg-muted/20 transition-colors">
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {referral.name.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold">{referral.name}</span>
                                                        <span className="text-[10px] text-muted-foreground italic">{referral.nameBangla}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-xs">
                                                    <span className="font-medium text-foreground">{referral.phone}</span>
                                                    <span className="text-muted-foreground">{referral.email || 'No Email'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {referral.employeeId ? (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 py-0.5">
                                                        <User className="w-3 h-3" /> Internal
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 gap-1 py-0.5">
                                                        <Building2 className="w-3 h-3" /> External
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-emerald-600">৳{referral.monthlyCommission || 0}</span>
                                                    {Array.isArray(referral.commissionStructure) && referral.commissionStructure.length > 0 ? (
                                                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                            <Wallet className="w-3 h-3" />
                                                            {referral.commissionStructure.length} Services
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground italic">Generic Rate</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {referral.branch?.name || referral.branchId}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    {(hasPermission('referral:read') || hasPermission('user:read')) && (
                                                        <Link href={`/hr/referrals/${referral.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {(hasPermission('referral:update') || hasPermission('agent:update')) && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                            onClick={() => {
                                                                setSelectedReferral(referral)
                                                                setDialogOpen(true)
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {(hasPermission('referral:delete') || hasPermission('agent:delete')) && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => handleDelete(referral.id)}
                                                            disabled={deleteMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {meta && meta.totalPages > 1 && (
                            <div className="flex items-center justify-end space-x-2 p-4 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    disabled={!meta.hasPreviousPage}
                                >
                                    Previous
                                </Button>
                                <div className="text-xs font-medium">
                                    Page {meta.page} of {meta.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(prev => prev + 1)}
                                    disabled={!meta.hasNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <ReferralPersonDialog 
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    referral={selectedReferral}
                    onSuccess={() => refetch()}
                />
            </div>
        </PermissionGuard>
    )
}
