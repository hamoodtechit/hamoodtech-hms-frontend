"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDevices, useTriggerDeviceSync } from "@/hooks/hr-queries"
import { PermissionGuard } from "@/components/shared/permission-guard"
import { Device } from "@/types/hr"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
    Activity,
    HardDrive,
    Loader2,
    MoreHorizontal,
    RefreshCw,
    Smartphone
} from "lucide-react"
import { DeviceSyncDialog } from "@/components/hr/device-sync-dialog"

export function DevicesView() {
    const [selectedDeviceSn, setSelectedDeviceSn] = useState<string | null>(null)
    const [syncDialogOpen, setSyncDialogOpen] = useState(false)
    const { data: devicesRes, isLoading } = useDevices()
    const triggerSyncMutation = useTriggerDeviceSync()

    const devices: Device[] = devicesRes?.data || []

    const handleTriggerSync = async (sn: string) => {
        try {
            await triggerSyncMutation.mutateAsync(sn)
            toast.success("Device synchronization triggered successfully")
        } catch {
            toast.error("Failed to trigger device synchronization")
        }
    }

    const handleViewSyncStatus = (sn: string) => {
        setSelectedDeviceSn(sn)
        setSyncDialogOpen(true)
    }

    return (
        <PermissionGuard permission="user:read">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Registered Devices</h2>
                        <p className="text-muted-foreground">Monitor hardware connectivity and manage synchronization.</p>
                    </div>
                    <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh Status
                    </Button>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                               <h3 className="font-semibold text-lg">Hardware Status</h3>
                               <p className="text-sm text-muted-foreground">Live overview of all connected attendance machines.</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Device Info</TableHead>
                                        <TableHead>Serial Number</TableHead>
                                        <TableHead>Area ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : devices.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No devices found in the system.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        devices.map((device) => (
                                            <TableRow key={device.id} className="group hover:bg-muted/30 transition-colors">
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border">
                                                            <HardDrive className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm leading-tight">
                                                                {device.name}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium text-xs">
                                                    {device.serialNumber}
                                                </TableCell>
                                                <TableCell>
                                                    {device.areaId}
                                                </TableCell>
                                                <TableCell>
                                                    {device.isOnline ? (
                                                        <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Online</Badge>
                                                    ) : (
                                                        <Badge variant="destructive">Offline</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        {format(new Date(device.lastActivity), "dd MMM yyyy, hh:mm a")}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleTriggerSync(device.serialNumber)}>
                                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                                Trigger Full Sync
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleViewSyncStatus(device.serialNumber)}>
                                                                <Activity className="mr-2 h-4 w-4" />
                                                                View Sync Status
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {selectedDeviceSn && (
                    <DeviceSyncDialog 
                        open={syncDialogOpen}
                        onOpenChange={setSyncDialogOpen}
                        deviceSn={selectedDeviceSn}
                    />
                )}
            </div>
        </PermissionGuard>
    )
}
