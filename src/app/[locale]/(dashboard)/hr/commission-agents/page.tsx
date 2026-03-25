"use client"

import { CommissionAgentDialog } from "@/components/hr/commission-agent-dialog"
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
import { useDeleteCommissionAgent, useCommissionAgents } from "@/hooks/hr-queries"
import { useStoreContext } from "@/store/use-store-context"
import { CommissionAgent } from "@/types/hr"
import { Edit, Eye, Loader2, Plus, Search, Trash2, Wallet } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Link } from "@/i18n/navigation"
import { PermissionGuard } from "@/components/shared/permission-guard"

export default function CommissionAgentsPage() {
    const { hasPermission } = usePermissions()
    const [search, setSearch] = useState("")
    const [page, setPage] = useState(1)
    const [agentDialogOpen, setAgentDialogOpen] = useState(false)
    const [selectedAgent, setSelectedAgent] = useState<CommissionAgent | null>(null)
    const { activeStoreId, stores } = useStoreContext()

    const { data: agentsRes, isLoading, refetch } = useCommissionAgents({ 
        page, 
        limit: 10, 
        search, 
        branchId: activeStoreId || undefined
    })
    
    const deleteMutation = useDeleteCommissionAgent()

    const agents = agentsRes?.data || []
    const meta = agentsRes?.meta

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this commission agent?")) {
            try {
                await deleteMutation.mutateAsync(id)
                toast.success("Commission agent deleted successfully")
            } catch (error) {
                toast.error("Failed to delete commission agent")
            }
        }
    }

    return (
        <PermissionGuard permission="user:read">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Commission Agents</h1>
                        <p className="text-muted-foreground">Manage hospital agents and their commission rates.</p>
                    </div>
                    {hasPermission('agent:create') && (
                    <Button onClick={() => {
                        setSelectedAgent(null)
                        setAgentDialogOpen(true)
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Agent
                    </Button>
                    )}
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                               <h3 className="font-semibold text-lg">Agent List</h3>
                               <p className="text-sm text-muted-foreground">Detailed list of all registered commission agents.</p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search agents..."
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
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Commission (%)</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : agents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No agents found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    agents.map((agent) => (
                                        <TableRow key={agent.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{agent.name}</span>
                                                    <span className="text-xs text-muted-foreground">{agent.nameBangla}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{agent.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                                                    <Wallet className="w-3 h-3 mr-1" />
                                                    {agent.commissionPercentage}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {agent.branch?.name || agent.branchId}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {hasPermission('user:read') && (
                                                    <Link href={`/hr/commission-agents/${agent.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    )}
                                                    {hasPermission('agent:update') && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedAgent(agent)
                                                            setAgentDialogOpen(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    )}
                                                    {hasPermission('agent:delete') && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => handleDelete(agent.id)}
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
                            <div className="flex items-center justify-end space-x-2 py-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                                    disabled={!meta.hasPreviousPage}
                                >
                                    Previous
                                </Button>
                                <div className="text-sm font-medium">
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

                <CommissionAgentDialog 
                    open={agentDialogOpen}
                    onOpenChange={setAgentDialogOpen}
                    agent={selectedAgent}
                    onSuccess={() => refetch()}
                />
            </div>
        </PermissionGuard>
    )
}
