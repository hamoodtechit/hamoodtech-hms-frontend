"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { User } from "@/types/user"
import { Calendar, Mail, Phone, Shield, User as UserIcon } from "lucide-react"

interface UserDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
}

export function UserDetailsDialog({ open, onOpenChange, user }: UserDetailsDialogProps) {
    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription>
                        Detailed information about {user.fullName}.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <UserIcon className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-medium text-lg">{user.fullName}</h3>
                            {user.fullNameBangla && <p className="text-sm text-muted-foreground">{user.fullNameBangla}</p>}
                            <div className="flex items-center gap-2">
                                <Badge variant={user.isActive ? "default" : "destructive"}>
                                    {user.isActive ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant="outline" className="flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    {user.role?.name || "No Role"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid gap-4">
                        <div className="grid grid-cols-[25px_1fr] items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">Username</p>
                                <p className="text-sm text-muted-foreground">{user.username}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-[25px_1fr] items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">Email</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                         {user.phone && (
                            <div className="grid grid-cols-[25px_1fr] items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium leading-none">Phone</p>
                                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                                </div>
                            </div>
                        )}
                         <div className="grid grid-cols-[25px_1fr] items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium leading-none">Joined Date</p>
                                <p className="text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
