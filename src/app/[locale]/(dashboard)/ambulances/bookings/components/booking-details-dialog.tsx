"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AmbulanceBooking } from "@/types/ambulance"
import { Calendar, User, MapPin, Truck, Banknote, History, CreditCard } from "lucide-react"

interface BookingDetailsDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    booking: AmbulanceBooking | null
}

export function BookingDetailsDialog({ open, onOpenChange, booking }: BookingDetailsDialogProps) {
    if (!booking) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
                <DialogHeader className="p-8 pb-6 bg-zinc-50 dark:bg-zinc-900/50 border-b">
                    <DialogTitle className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
                        <History className="h-6 w-6 text-primary" /> Booking & Financial Details
                    </DialogTitle>
                </DialogHeader>

                <div className="p-8 space-y-8 max-h-[80vh] overflow-y-auto">
                    {/* General Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2">Transport Info</h3>
                            <div className="p-4 rounded-3xl bg-primary/5 border border-primary/10 flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <User className="h-5 w-5 text-primary shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{booking.patientName}</p>
                                        <p className="text-xs text-muted-foreground">{booking.patient?.patientNumber || "Walk-in / Unregistered"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Truck className="h-5 w-5 text-primary shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-foreground">{booking.ambulance?.vehicleNumber || "Unassigned"}</p>
                                        <p className="text-xs text-muted-foreground">{booking.ambulance?.driverName || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 mb-2">Routing</h3>
                            <div className="p-4 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col gap-3">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-emerald-500 shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-black">Pickup</p>
                                        <p className="text-sm font-bold text-foreground">{booking.pickupLocation}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-rose-500 shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-black">Dropoff</p>
                                        <p className="text-sm font-bold text-foreground">{booking.dropoffLocation}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary Grid */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500/80 mb-2">Billing Summary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50">
                                <p className="text-[10px] text-muted-foreground uppercase font-black">Total Fare</p>
                                <p className="text-lg font-bold">৳ {Number(booking.totalFare || 0).toFixed(2)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50">
                                <p className="text-[10px] text-muted-foreground uppercase font-black">Discount</p>
                                <p className="text-lg font-bold text-rose-500">৳ {Number(booking.discountAmount || 0).toFixed(2)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/50">
                                <p className="text-[10px] text-muted-foreground uppercase font-black">Paid Amount</p>
                                <p className="text-lg font-bold text-emerald-600">৳ {Number(booking.paidAmount || 0).toFixed(2)}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-[10px] text-amber-600/80 uppercase font-black">Due Balance</p>
                                <p className="text-lg font-bold text-amber-600">৳ {Number(booking.dueAmount || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-2">Transaction History</h3>
                        {booking.transactions && booking.transactions.length > 0 ? (
                            <div className="rounded-3xl border overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Date</th>
                                            <th className="px-4 py-3 text-left font-black text-[10px] uppercase tracking-widest text-muted-foreground">Account</th>
                                            <th className="px-4 py-3 text-right font-black text-[10px] uppercase tracking-widest text-muted-foreground">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {booking.transactions.map((tx: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-4 py-3 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {new Date(tx.date || tx.createdAt).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-semibold text-foreground">
                                                            {tx.account?.name || tx.receiveAccount || "N/A"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                                    ৳ {Number(tx.amount || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center rounded-3xl border border-dashed text-muted-foreground">
                                <Banknote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="font-medium">No transactions recorded for this booking.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
