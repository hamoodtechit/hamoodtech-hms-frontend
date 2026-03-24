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
import { useBuildings, useDeleteBuilding } from "@/hooks/facility-queries";
import { BuildingDialog } from "./building-dialog";
import { Building } from "@/types/facility";
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

export function BuildingList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data: response, isLoading } = useBuildings({ page, search, limit: 10 });
    const { mutate: deleteBuilding } = useDeleteBuilding();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const buildings = Array.isArray(response?.data) ? response.data : [];
    const meta = response?.meta;

    const handleEdit = (building: Building) => {
        setSelectedBuilding(building);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedBuilding(null);
        setDialogOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteBuilding(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search buildings..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button onClick={handleAdd}>
                    <Plus className="mr-2 h-4 w-4" /> Add Building
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Name (Bangla)</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">Loading...</TableCell>
                            </TableRow>
                        ) : buildings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-10">No buildings found</TableCell>
                            </TableRow>
                        ) : buildings.map((building) => (
                            <TableRow key={building.id}>
                                <TableCell className="font-medium">{building.name}</TableCell>
                                <TableCell>{building.nameBangla || "-"}</TableCell>
                                <TableCell className="max-w-xs truncate">{building.description || "-"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(building)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(building.id)}>
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

            <BuildingDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                building={selectedBuilding}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the building and all its floors and sections.
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
