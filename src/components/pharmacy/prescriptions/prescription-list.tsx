"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useRouter } from "@/i18n/navigation"
import { usePrescriptionStore } from "@/store/use-prescription-store"
import { Eye, Search, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function PrescriptionList() {
    const { prescriptions, updatePrescriptionStatus } = usePrescriptionStore()
    const [search, setSearch] = useState("")
    const router = useRouter()

    const filtered = prescriptions.filter(p => 
        p.patientName.toLowerCase().includes(search.toLowerCase()) || 
        p.id.toLowerCase().includes(search.toLowerCase())
    )

    const handleFill = (id: string) => {
        // In a real app, this would pre-fill the POS cart
        toast.success(`Loaded prescription ${id} into POS`)
        router.push('/pharmacy/pos')
    }

    return (
        <div className="space-y-4">
             <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by Patient or ID..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rx ID</TableHead>
                            <TableHead>Patient</TableHead>
                            <TableHead>Doctor</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Medications</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((p) => (
                            <TableRow key={p.id}>
                                <TableCell className="font-mono text-xs">{p.id}</TableCell>
                                <TableCell className="font-medium">{p.patientName}</TableCell>
                                <TableCell>{p.doctorName}</TableCell>
                                <TableCell>{p.date}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {p.medications.map((m, i) => (
                                            <Badge key={i} variant="outline" className="text-xs font-normal">
                                                {m}
                                            </Badge>
                                        ))}
                                    </div>
                                </TableCell>
                                <TableCell>
                                     <Badge variant={
                                        p.status === 'Filled' ? 'default' : 
                                        p.status === 'Pending' ? 'secondary' : 'destructive'
                                    }>
                                        {p.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" title="View Image">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {p.status === 'Pending' && (
                                            <Button size="sm" onClick={() => handleFill(p.id)} className="h-8">
                                                <ShoppingCart className="mr-2 h-3.5 w-3.5" />
                                                Fill
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
