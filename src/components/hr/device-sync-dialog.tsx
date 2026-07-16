"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDeviceSyncStatus, useRetryDeviceSync } from "@/hooks/hr-queries"
import { AlertCircle, CheckCircle2, Loader2, RefreshCcw, User, Users } from "lucide-react"
import { toast } from "sonner"

interface DeviceSyncDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deviceSn: string
}

export function DeviceSyncDialog({ open, onOpenChange, deviceSn }: DeviceSyncDialogProps) {
    const { data: statusRes, isLoading } = useDeviceSyncStatus(deviceSn)
    const retryMutation = useRetryDeviceSync()

    const syncStatus = statusRes?.data
    const isSyncing = syncStatus && syncStatus.pendingCount > 0

    const handleRetry = async () => {
        try {
            await retryMutation.mutateAsync(deviceSn)
            toast.success("Retry command sent to device successfully")
        } catch {
            toast.error("Failed to send retry command")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCcw className="h-5 w-5 text-primary" />
                        Device Synchronization
                    </DialogTitle>
                    <DialogDescription>
                        Status for device <span className="font-mono font-semibold text-zinc-900 dark:text-white">{deviceSn}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-6">
                    {/* Status Overview Card */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-zinc-200 dark:border-white/10 flex flex-col items-center justify-center space-y-3">
                        {isLoading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : isSyncing ? (
                            <>
                                <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                    <AlertCircle className="h-6 w-6" />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-semibold text-lg text-zinc-900 dark:text-white">
                                        {syncStatus.pendingCount} Users Pending
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        Synchronization is currently active.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <div className="text-center">
                                    <h4 className="font-semibold text-lg text-zinc-900 dark:text-white">Fully Synchronized</h4>
                                    <p className="text-sm text-muted-foreground">
                                        All users are up to date on this device.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Pending Users List */}
                    {!isLoading && isSyncing && syncStatus.pendingUsers && syncStatus.pendingUsers.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    Pending Uploads
                                </h4>
                                <Badge variant="secondary" className="font-mono text-xs">
                                    {syncStatus.pendingUsers.length} listed
                                </Badge>
                            </div>
                            
                            <ScrollArea className="h-[180px] w-full rounded-md border p-3">
                                <div className="space-y-2">
                                    {syncStatus.pendingUsers.map((user, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{user.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase">UID: {user.uid}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end pt-4 gap-2 border-t">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Close
                        </Button>
                        <Button 
                            onClick={handleRetry} 
                            disabled={!isSyncing || retryMutation.isPending}
                            className="gap-2"
                        >
                            {retryMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCcw className="h-4 w-4" />
                            )}
                            Force Retry Sync
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
