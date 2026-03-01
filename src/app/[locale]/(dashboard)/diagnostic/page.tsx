"use client"

import { DiagnosticTestDialog } from "@/components/diagnostic/diagnostic-test-dialog"
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
import { useDeleteDiagnosticTest, useDiagnosticTests } from "@/hooks/diagnostic-queries"
import { useCurrency } from "@/hooks/use-currency"
import { useStoreContext } from "@/store/use-store-context"
import { DiagnosticTest } from "@/types/diagnostic"
import { Edit, Loader2, Microscope, Plus, Search, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export default function DiagnosticTestsPage() {
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [testDialogOpen, setTestDialogOpen] = useState(false)
    const [selectedTest, setSelectedTest] = useState<DiagnosticTest | null>(null)
    
    const { activeStoreId } = useStoreContext()
    const { formatCurrency } = useCurrency()

    const { data, isLoading, refetch } = useDiagnosticTests({
        page,
        limit: 10,
        search,
        branchId: activeStoreId
    })

    const deleteMutation = useDeleteDiagnosticTest()

    const handleDelete = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this test?")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Test deleted successfully")
            } catch (error) {
                toast.error("Failed to delete test")
            }
        }
    }

    const tests = data?.data || []

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-primary">Diagnostic Tests</h1>
                    <p className="text-muted-foreground text-sm font-medium">Manage clinical tests, pricing, and availability.</p>
                </div>
                <Button 
                    onClick={() => {
                        setSelectedTest(null)
                        setTestDialogOpen(true)
                    }}
                    className="rounded-xl shadow-lg shadow-primary/20 gap-2"
                >
                    <Plus className="h-4 w-4" /> Add New Test
                </Button>
            </div>

            <Card className="border-none shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm overflow-hidden">
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
                        <TableHeader className="bg-muted/50 text-[11px] uppercase tracking-wider font-bold">
                            <TableRow>
                                <TableHead className="pl-6">Test Info</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                                            <span className="text-sm font-medium text-muted-foreground">Loading tests...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : tests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center text-muted-foreground">
                                        No diagnostic tests found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                tests.map((test) => (
                                    <TableRow key={test.id} className="group hover:bg-muted/30 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-4 text-xs">
                                                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                                                    <Microscope className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="font-bold text-foreground truncate">{test.name}</div>
                                                    {test.nameBangla && (
                                                        <div className="text-[10px] text-muted-foreground truncate">
                                                            {test.nameBangla}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="rounded-md font-bold uppercase tracking-tighter bg-secondary/10 border-secondary/30 text-[10px]">
                                                {test.department?.name || "General"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-black text-primary tracking-tight text-sm">
                                                {formatCurrency(test.price)}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={() => {
                                                        setSelectedTest(test)
                                                        setTestDialogOpen(true)
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                                                    onClick={() => handleDelete(test.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DiagnosticTestDialog 
                open={testDialogOpen}
                onOpenChange={setTestDialogOpen}
                test={selectedTest}
                onSuccess={refetch}
            />
        </div>
    )
}
