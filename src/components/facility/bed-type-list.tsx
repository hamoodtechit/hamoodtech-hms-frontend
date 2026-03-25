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
import { useBedTypes, useDeleteBedType } from "@/hooks/facility-queries";
import { BedTypeDialog } from "./bed-type-dialog";
import { BedType } from "@/types/facility";
import { formatCurrency } from "@/lib/utils";
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

export function BedTypeList() {
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const { data: response, isLoading } = useBedTypes({ page, search, limit: 10 });
    const { mutate: deleteBedType } = useDeleteBedType();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedBedType, setSelectedBedType] = useState<BedType | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const bedTypes = Array.isArray(response?.data) ? response.data : [];
    const meta = response?.meta;

    const handleEdit = (bedType: BedType) => {
        setSelectedBedType(bedType);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedBedType(null);
        setDialogOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteBedType(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search bed types..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {hasPermission("facility:create") && (
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Bed Type
                    </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type Name</TableHead>
                            <TableHead>Name (Bangla)</TableHead>
                            <TableHead>Price / Day</TableHead>
                            <TableHead>Description</TableHead>
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
                        ) : bedTypes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">No bed types found</TableCell>
                            </TableRow>
                        ) : bedTypes.map((bedType) => (
                            <TableRow key={bedType.id}>
                                <TableCell className="font-medium">{bedType.name}</TableCell>
                                <TableCell>{bedType.nameBangla || "-"}</TableCell>
                                <TableCell>{formatCurrency(bedType.pricePerDay)}</TableCell>
                                <TableCell className="max-w-xs truncate">{bedType.description || "-"}</TableCell>
                                {(hasPermission("facility:update") || hasPermission("facility:delete")) && (
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {hasPermission("facility:update") && (
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(bedType)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission("facility:delete") && (
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(bedType.id)}>
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

            <BedTypeDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                bedType={selectedBedType}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the bed type.
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
