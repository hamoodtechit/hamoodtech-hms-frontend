"use client"

import { DiagnosticTestDialog } from "@/components/diagnostic/diagnostic-test-dialog"
import { TestGroupManagerDialog } from "@/components/diagnostic/test-group-manager-dialog"
import { ServiceDetailSheet } from "@/components/diagnostic/service-detail-sheet"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDeleteDiagnosticTest, useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { DiagnosticTest } from "@/types/diagnostic"
import { Edit, Layers, Loader2, Microscope, Plus, Search, Trash2, AlertCircle, FileText, Columns, Eye } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { useState } from "react"
import { toast } from "sonner"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { cn } from "@/lib/utils"

export default function DiagnosticTestsPage() {
    const { hasPermission } = usePermissions()
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [testDialogOpen, setTestDialogOpen] = useState(false)
    const [groupManagerOpen, setGroupManagerOpen] = useState(false)
    const [detailSheetOpen, setDetailSheetOpen] = useState(false)
    const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null)
    
    // Delete Confirmation State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [testToDelete, setTestToDelete] = useState<DiagnosticTest | null>(null)

    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()

    const { data, isLoading, refetch } = useDiagnosticTests({
        page,
        limit: 10,
        search,
        branchId: activeStoreId || undefined
    })

    const deleteMutation = useDeleteDiagnosticTest()

    const handleDelete = async () => {
        if (!testToDelete) return
        
        try {
            await deleteMutation.mutateAsync(testToDelete.id)
            toast.success("Service deleted successfully")
            setDeleteConfirmOpen(false)
            setTestToDelete(null)
        } catch (error) {
            toast.error("Failed to delete service. It may be linked to existing sales.")
        }
    }

    const tests = data?.data || []

    return (
        <PermissionGuard permission="diagnostic-test:create">
            <div className="flex flex-col gap-6 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-primary">Hospital Services</h1>
                        <p className="text-muted-foreground text-sm font-medium">Manage clinical services, pricing, and availability.</p>
                    </div>
                    {hasPermission('diagnostic-test:create') && (
                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline"
                                onClick={() => setGroupManagerOpen(true)}
                                className="rounded-xl shadow-sm gap-2 border-primary/20 hover:bg-primary/5"
                            >
                                <Layers className="h-4 w-4" /> Manage Groups
                            </Button>
                            <Button 
                                onClick={() => {
                                    setSelectedTest(null)
                                    setTestDialogOpen(true)
                                }}
                                className="rounded-xl shadow-lg shadow-primary/20 gap-2 h-11 px-6 font-black"
                            >
                                <Plus className="h-4 w-4" /> Add New Service
                            </Button>
                        </div>
                    )}
                </div>

                <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden rounded-3xl">
                    <CardHeader className="p-4 border-b bg-card/80">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or code..."
                                    className="pl-10 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-primary/20"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/50 text-[11px] uppercase tracking-wider font-extrabold text-muted-foreground">
                                <TableRow>
                                    <TableHead className="pl-8">Service Information</TableHead>
                                    <TableHead>Clinical Department</TableHead>
                                    <TableHead>Pricing</TableHead>
                                    <TableHead>Reporting</TableHead>
                                    <TableHead className="text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                                                <span className="text-sm font-medium text-muted-foreground">Loading tests...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : tests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-64 text-center">
                                            <div className="flex flex-col items-center gap-2 opacity-40">
                                                <Microscope className="h-10 w-10 text-muted-foreground" />
                                                <span className="text-sm font-bold text-muted-foreground">No services found.</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tests.map((test) => (
                                        <TableRow key={test.id} className="group hover:bg-primary/5 transition-all">
                                            <TableCell className="pl-8 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                                                        <Microscope className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="font-extrabold text-sm text-foreground truncate">{test.name}</div>
                                                        <div className="flex items-center gap-2">
                                                            {test.nameBangla && (
                                                                <span className="text-[10px] text-muted-foreground font-medium truncate">
                                                                    {test.nameBangla}
                                                                </span>
                                                            )}
                                                            {test.isDiagnosticTest && (
                                                                <Badge variant="secondary" className="text-[8px] h-3.5 px-1 bg-blue-500/10 text-blue-600 border-blue-500/10 font-bold uppercase">Lab Mode</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                                                        {test.department?.name || "General"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-primary tracking-tight text-sm">
                                                        {formatCurrency(test.price)}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground font-bold">Standard Rate</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        {test.templateType === 'narrative' ? <FileText className="w-3 h-3 text-indigo-500" /> : <Columns className="w-3 h-3 text-blue-500" />}
                                                        <span className="text-xs font-bold text-foreground">
                                                            {test.templateType === 'narrative' ? 'Descriptive' : 'Structured'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground font-medium">Delivery: {test.reportDays || 0} Days</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-none"
                                                        onClick={() => {
                                                            setSelectedTest(test)
                                                            setDetailSheetOpen(true)
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {hasPermission('diagnostic-test:update') && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-none"
                                                            onClick={() => {
                                                                setSelectedTest(test)
                                                                setTestDialogOpen(true)
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {hasPermission('diagnostic-test:delete') && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="h-9 w-9 rounded-xl text-destructive hover:bg-red-600 hover:text-white transition-all shadow-none"
                                                            onClick={() => {
                                                                setTestToDelete(test)
                                                                setDeleteConfirmOpen(true)
                                                            }}
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
                    </CardContent>
                    {data?.meta && data.meta.totalPages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                            <p className="text-xs text-muted-foreground font-medium">
                                Showing {(data.meta.page - 1) * data.meta.pageSize + 1} to {Math.min(data.meta.page * data.meta.pageSize, data.meta.totalItems)} of {data.meta.totalItems} tests
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-bold"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!data.meta.hasPreviousPage}
                                >
                                    Previous
                                </Button>
                                <div className="text-xs font-bold px-4 h-8 flex items-center bg-card rounded-lg border">
                                    Page {data.meta.page} of {data.meta.totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-bold"
                                    onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
                                    disabled={!data.meta.hasNextPage}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <ServiceDetailSheet 
                    open={detailSheetOpen}
                    onOpenChange={setDetailSheetOpen}
                    service={selectedTest}
                />

                <DiagnosticTestDialog 
                    open={testDialogOpen}
                    onOpenChange={setTestDialogOpen}
                    test={selectedTest}
                    onSuccess={refetch}
                />

                <TestGroupManagerDialog 
                    open={groupManagerOpen}
                    onOpenChange={setGroupManagerOpen}
                />

                {/* PREMIUM DELETE CONFIRMATION */}
                <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                    <AlertDialogContent className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                        <div className="p-8 pb-4 flex flex-col items-center text-center gap-4 bg-white">
                            <div className="h-16 w-16 rounded-3xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <div className="space-y-1">
                                <AlertDialogTitle className="text-xl font-black tracking-tight text-red-700">Delete Clinical Service?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm font-medium text-slate-500">
                                    Are you sure you want to delete <strong className="text-slate-900">{testToDelete?.name}</strong>? 
                                    This action cannot be undone and may affect active reports.
                                </AlertDialogDescription>
                            </div>
                        </div>
                        <AlertDialogFooter className="p-8 pt-4 flex gap-3 sm:justify-center bg-muted/20 border-t">
                            <AlertDialogCancel className="h-12 px-8 rounded-2xl border-none bg-muted/50 font-bold hover:bg-muted transition-all flex-1 sm:flex-none">
                                Keep Service
                            </AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDelete}
                                className="h-12 px-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black shadow-lg shadow-red-500/20 transition-all flex-1 sm:flex-none"
                            >
                                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </PermissionGuard>
    )
}
