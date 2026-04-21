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
import { AmbulanceBooking } from "@/types/ambulance"
import { Edit, MoreHorizontal, Phone, Trash2, MapPin, Calendar, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface BookingTableProps {
    bookings: AmbulanceBooking[]
    loading: boolean
    onEdit: (booking: AmbulanceBooking) => void
    onDelete: (booking: AmbulanceBooking) => void
}

export function BookingTable({ bookings, loading, onEdit, onDelete }: BookingTableProps) {
    const { hasPermission } = usePermissions()

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase()
        switch (s) {
            case 'pending':
                return <Badge className="bg-amber-500 hover:bg-amber-600">Pending</Badge>
            case 'confirmed':
                return <Badge className="bg-blue-500 hover:bg-blue-600">Confirmed</Badge>
            case 'cancelled':
                return <Badge variant="destructive">Cancelled</Badge>
            case 'completed':
                return <Badge className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>
            default:
                return <Badge variant="secondary" className="capitalize">{status}</Badge>
        }
    }

    if (loading) {
        return (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Patient & Contacts</TableHead>
                        <TableHead>Route (Pickup → Dropoff)</TableHead>
                        <TableHead>Ambulance</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead>Booking Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-12 w-[200px]" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-[250px]" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-[120px]" /></TableCell>
                            <TableCell><div className="flex justify-center"><Skeleton className="h-5 w-[80px]" /></div></TableCell>
                            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        )
    }

    if (bookings.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/50">
                <Calendar className="h-12 w-12 mb-3 opacity-10" />
                <p className="font-medium">No ambulance bookings found.</p>
                <p className="text-sm opacity-60">Try adjusting your filters or record a new transport request.</p>
            </div>
        )
    }

    return (
        <Table>
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead>Patient & Contacts</TableHead>
                    <TableHead>Route (Pickup → Dropoff)</TableHead>
                    <TableHead>Ambulance</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {bookings.map((booking) => (
                    <TableRow key={booking.id} className="group transition-colors">
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                                    booking.status === 'completed' ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary"
                                )}>
                                    <User className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-foreground truncate">{booking.patientName}</span>
                                        {booking.patient?.patientNumber && (
                                            <span className="text-[10px] font-black tracking-tight text-white bg-primary px-1.5 py-0.5 rounded-md shrink-0">
                                                {booking.patient.patientNumber}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <span className="truncate">{booking.guardianPhone || "No phone"}</span>
                                        {booking.guardianName && (
                                            <>
                                                <span className="h-1 w-1 rounded-full bg-border" />
                                                <span className="truncate">{booking.guardianName}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1 max-w-[300px]">
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                                    <span className="text-xs font-semibold text-foreground leading-tight truncate">{booking.pickupLocation}</span>
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                    <span className="text-xs font-bold text-muted-foreground leading-tight truncate">{booking.dropoffLocation}</span>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>
                            {booking.ambulance ? (
                                <div className="flex flex-col">
                                    <span className="text-sm font-black tracking-tight">{booking.ambulance.vehicleNumber}</span>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{booking.ambulance.driverName}</span>
                                </div>
                            ) : (
                                <span className="text-xs italic text-muted-foreground">Unassigned</span>
                            )}
                        </TableCell>
                        <TableCell className="text-center">
                            {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{new Date(booking.createdAt).toLocaleDateString()}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Open menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[180px] rounded-xl shadow-xl border-border/50">
                                    <DropdownMenuLabel className="text-[10px] uppercase font-black text-muted-foreground tracking-widest px-3 py-2">Booking Management</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {hasPermission("ambulance-booking:update") && (
                                        <DropdownMenuItem onClick={() => onEdit(booking)} className="cursor-pointer">
                                            <Edit className="mr-2 h-4 w-4" /> Manage Status
                                        </DropdownMenuItem>
                                    )}
                                    {hasPermission("ambulance-booking:delete") && (
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive cursor-pointer"
                                            onClick={() => onDelete(booking)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" /> Cancel/Remove
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
