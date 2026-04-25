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
import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { usePermissions } from "@/hooks/use-permissions"
import { Ambulance } from "@/types/ambulance"
import { Edit, MoreHorizontal, Phone, Trash2, Truck } from "lucide-react"

interface AmbulanceTableProps {
    ambulances: Ambulance[]
    loading: boolean
    onEdit: (ambulance: Ambulance) => void
    onDelete: (ambulance: Ambulance) => void
}

export function AmbulanceTable({ ambulances, loading, onEdit, onDelete }: AmbulanceTableProps) {
    const { hasPermission } = usePermissions()

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case 'available':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Available</Badge>
            case 'on duty':
                return <Badge variant="destructive">On Duty</Badge>
            case 'maintenance':
                return <Badge className="bg-amber-500 hover:bg-amber-600">Maintenance</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Ambulance</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Added Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-10 w-[180px]" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-[150px]" /></TableCell>
                            <TableCell><div className="flex justify-center"><Skeleton className="h-5 w-[70px]" /></div></TableCell>
                            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    if (ambulances.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                <Truck className="h-10 w-10 mb-2 opacity-20" />
                <p>No ambulances found in the directory.</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ambulance</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Added Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {Array.isArray(ambulances) && ambulances.map((ambulance) => (
                    <TableRow key={ambulance.id}>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                    <Truck className="h-4 w-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium">{ambulance.vehicleNumber}</span>
                                    <span className="text-xs text-muted-foreground">{ambulance.vehicleModel}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className="capitalize">
                                {ambulance.vehicleType}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{ambulance.driverName}</span>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {ambulance.driverPhone}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            {getStatusBadge(ambulance.status)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                            {new Date(ambulance.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {hasPermission("ambulance:update") && (
                                        <DropdownMenuItem onClick={() => onEdit(ambulance)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                                        </DropdownMenuItem>
                                    )}
                                    {hasPermission("ambulance:delete") && (
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => onDelete(ambulance)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Vehicle
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
