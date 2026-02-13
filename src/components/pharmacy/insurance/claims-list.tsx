"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ClaimStatus, useInsuranceStore } from "@/store/use-insurance-store"
import { Check, FileText, MoreHorizontal, Trash, X } from "lucide-react"
import { toast } from "sonner"

export function ClaimsList() {
    const { claims, updateClaimStatus, deleteClaim } = useInsuranceStore()

    const handleStatusUpdate = (id: string, status: ClaimStatus) => {
        updateClaimStatus(id, status)
        toast.success(`Claim marked as ${status}`)
    }

    const handleDelete = (id: string) => {
        deleteClaim(id)
        toast.success("Claim deleted")
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-emerald-500 hover:bg-emerald-600'
            case 'Pending': return 'bg-yellow-500 hover:bg-yellow-600'
            case 'Rejected': return 'bg-red-500 hover:bg-red-600'
            case 'Paid': return 'bg-blue-500 hover:bg-blue-600'
            default: return 'bg-gray-500'
        }
    }

    return (
        <div className="rounded-md border bg-card overflow-x-auto">
            <Table className="min-w-[600px]">
                <TableHeader>
                    <TableRow>
                        <TableHead>Claim ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="hidden md:table-cell">Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {claims.map((claim) => (
                        <TableRow key={claim.id}>
                            <TableCell className="font-mono text-xs">{claim.id}</TableCell>
                            <TableCell className="font-medium">{claim.patientName}</TableCell>
                            <TableCell>{claim.providerName}</TableCell>
                            <TableCell className="hidden md:table-cell">{claim.date}</TableCell>
                            <TableCell>${claim.amount.toFixed(2)}</TableCell>
                            <TableCell>
                                <Badge className={`${getStatusColor(claim.status)} text-white`}>
                                    {claim.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(claim.id, 'Approved')}>
                                            <Check className="mr-2 h-4 w-4 text-emerald-500" /> Use Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleStatusUpdate(claim.id, 'Rejected')}>
                                            <X className="mr-2 h-4 w-4 text-red-500" /> Reject
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => toast.info(`Viewing details for ${claim.id}`)}>
                                             <FileText className="mr-2 h-4 w-4" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(claim.id)} className="text-destructive focus:text-destructive animate-in">
                                            <Trash className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
