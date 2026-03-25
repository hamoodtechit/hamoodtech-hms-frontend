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
import { useFloors, useDeleteFloor, useBuildings } from "@/hooks/facility-queries";
import { FloorDialog } from "./floor-dialog";
import { Floor } from "@/types/facility";
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

import { usePermissions } from "@/hooks/use-permissions";

export function FloorList() {
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>("all");
    
    const { data: response, isLoading } = useFloors({ 
        page, 
        search, 
        limit: 10, 
        buildingId: selectedBuildingId === "all" ? undefined : selectedBuildingId 
    });
    const { data: buildingsResponse } = useBuildings({ limit: 100 });
    const { mutate: deleteFloor } = useDeleteFloor();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const floors = Array.isArray(response?.data) ? response.data : [];
    const meta = response?.meta;
    const buildings = Array.isArray(buildingsResponse?.data) ? buildingsResponse.data : [];

    const handleEdit = (floor: Floor) => {
        setSelectedFloor(floor);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedFloor(null);
        setDialogOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteFloor(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search floors..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Buildings" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Buildings</SelectItem>
                            {buildings.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {hasPermission("facility:create") && (
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Floor
                    </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Floor Name</TableHead>
                            <TableHead>Name (Bangla)</TableHead>
                            <TableHead>Building</TableHead>
                            <TableHead>Floor #</TableHead>
                            {(hasPermission("facility:update") || hasPermission("facility:delete")) && (
                                <TableHead className="text-right">Actions</TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">Loading...</TableCell>
                            </TableRow>
                        ) : floors.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">No floors found</TableCell>
                            </TableRow>
                        ) : floors.map((floor) => (
                            <TableRow key={floor.id}>
                                <TableCell className="font-medium">{floor.name}</TableCell>
                                <TableCell>{floor.nameBangla || "-"}</TableCell>
                                <TableCell>{floor.building?.name || "Building ID: " + floor.buildingId.substring(0, 8)}</TableCell>
                                <TableCell>{floor.floorNumber}</TableCell>
                                {(hasPermission("facility:update") || hasPermission("facility:delete")) && (
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {hasPermission("facility:update") && (
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(floor)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission("facility:delete") && (
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(floor.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                )}
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

            <FloorDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                floor={selectedFloor}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the floor and all its sections.
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
