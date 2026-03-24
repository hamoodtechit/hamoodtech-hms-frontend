"use client";

import { useState } from "react";
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBeds, useDeleteBed, useBedTypes, useSections, useFloors, useBuildings } from "@/hooks/facility-queries";
import { BedDialog } from "./bed-dialog";
import { Bed } from "@/types/facility";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";

export function BedList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    
    // Filters
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>("all");
    const [selectedFloorId, setSelectedFloorId] = useState<string>("all");
    const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
    const [selectedBedTypeId, setSelectedBedTypeId] = useState<string>("all");
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    
    const { data: response, isLoading } = useBeds({ 
        page, 
        search, 
        limit: 10, 
        sectionId: selectedSectionId === "all" ? undefined : selectedSectionId,
        bedTypeId: selectedBedTypeId === "all" ? undefined : selectedBedTypeId,
        status: selectedStatus === "all" ? undefined : selectedStatus
    });
    const beds = Array.isArray(response?.data) ? response.data : [];
    const meta = response?.meta;
    
    const { data: buildingsResponse } = useBuildings({ limit: 100 });
    const { data: floorsResponse } = useFloors({ 
        buildingId: selectedBuildingId === "all" ? undefined : selectedBuildingId, 
        limit: 100 
    });
    const { data: sectionsResponse } = useSections({ 
        floorId: selectedFloorId === "all" ? undefined : selectedFloorId, 
        limit: 100 
    });
    const { data: bedTypesResponse } = useBedTypes({ limit: 100 });
    
    const { mutate: deleteBed } = useDeleteBed();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const buildings = Array.isArray(buildingsResponse?.data) ? buildingsResponse.data : [];
    const floors = Array.isArray(floorsResponse?.data) ? floorsResponse.data : [];
    const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];
    const bedTypes = Array.isArray(bedTypesResponse?.data) ? bedTypesResponse.data : [];

    const handleEdit = (bed: Bed) => {
        setSelectedBed(bed);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedBed(null);
        setDialogOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteBed(deleteId);
            setDeleteId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
            case 'occupied': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Occupied</Badge>;
            case 'maintenance': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Maintenance</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search beds..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {/* Filters */}
                    <Select value={selectedBuildingId} onValueChange={(val) => {
                        setSelectedBuildingId(val);
                        setSelectedFloorId("all");
                        setSelectedSectionId("all");
                    }}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Building" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Buildings</SelectItem>
                            {buildings.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedFloorId} onValueChange={(val) => {
                        setSelectedFloorId(val);
                        setSelectedSectionId("all");
                    }} disabled={selectedBuildingId === "all"}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Floor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Floors</SelectItem>
                            {floors.map((f) => (
                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedSectionId} onValueChange={setSelectedSectionId} disabled={selectedFloorId === "all"}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Section" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            {sections.map((s) => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedBedTypeId} onValueChange={setSelectedBedTypeId}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Bed Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {bedTypes.map((t) => (
                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="occupied">Occupied</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Bed
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bed Number</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Price/Day</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">Loading...</TableCell>
                            </TableRow>
                        ) : beds.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-10">No beds found</TableCell>
                            </TableRow>
                        ) : beds.map((bed) => (
                            <TableRow key={bed.id}>
                                <TableCell className="font-medium">{bed.bedNumber}</TableCell>
                                <TableCell>{bed.bedType?.name}</TableCell>
                                <TableCell className="text-xs">
                                    {[
                                        bed.section?.name || (bed.sectionId ? `Section: ${bed.sectionId.substring(0, 5)}` : ""),
                                        bed.section?.floor?.name || (bed.section?.floorId ? `Floor: ${bed.section.floorId.substring(0, 5)}` : ""),
                                        bed.section?.floor?.building?.name || (bed.section?.floor?.buildingId ? `Bldg: ${bed.section.floor.buildingId.substring(0, 5)}` : "")
                                    ].filter(Boolean).join(", ") || "-"}
                                </TableCell>
                                <TableCell>{formatCurrency(bed.bedType?.pricePerDay || 0)}</TableCell>
                                <TableCell>
                                    <Badge variant={
                                        bed.status === 'available' ? 'success' : 
                                        bed.status === 'occupied' ? 'destructive' : 'secondary'
                                    }>
                                        {bed.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(bed)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(bed.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <div className="text-sm font-medium">Page {page} of {meta.totalPages}</div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                        disabled={page === meta.totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}

            <BedDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                bed={selectedBed}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the bed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
