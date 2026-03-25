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
import { useSections, useDeleteSection, useFloors, useBuildings } from "@/hooks/facility-queries";
import { SectionDialog } from "./section-dialog";
import { Section } from "@/types/facility";
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

export function SectionList() {
    const { hasPermission } = usePermissions();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>("all");
    const [selectedFloorId, setSelectedFloorId] = useState<string>("all");
    
    const { data: response, isLoading } = useSections({ 
        page, 
        search, 
        limit: 10, 
        floorId: selectedFloorId === "all" ? undefined : selectedFloorId 
    });
    const sections = Array.isArray(response?.data) ? response.data : [];
    const meta = response?.meta;
    
    const { data: buildingsResponse } = useBuildings({ limit: 100 });
    const { data: floorsResponse } = useFloors({ 
        buildingId: selectedBuildingId === "all" ? undefined : selectedBuildingId, 
        limit: 100 
    });
    const { mutate: deleteSection } = useDeleteSection();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const buildings = Array.isArray(buildingsResponse?.data) ? buildingsResponse.data : [];
    const floors = Array.isArray(floorsResponse?.data) ? floorsResponse.data : [];

    const handleEdit = (section: Section) => {
        setSelectedSection(section);
        setDialogOpen(true);
    };

    const handleAdd = () => {
        setSelectedSection(null);
        setDialogOpen(true);
    };

    const handleDelete = () => {
        if (deleteId) {
            deleteSection(deleteId);
            setDeleteId(null);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search sections..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Select value={selectedBuildingId} onValueChange={(val) => {
                        setSelectedBuildingId(val);
                        setSelectedFloorId("all");
                    }}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Building" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Buildings</SelectItem>
                            {buildings.map((b) => (
                                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={selectedBuildingId === "all"}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Floor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Floors</SelectItem>
                            {floors.map((f) => (
                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {hasPermission("facility:create") && (
                    <Button onClick={handleAdd}>
                        <Plus className="mr-2 h-4 w-4" /> Add Section
                    </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Section Name</TableHead>
                            <TableHead>Name (Bangla)</TableHead>
                            <TableHead>Floor</TableHead>
                            <TableHead>Building</TableHead>
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
                        ) : sections.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10">No sections found</TableCell>
                            </TableRow>
                        ) : sections.map((section) => (
                            <TableRow key={section.id}>
                                <TableCell className="font-medium">{section.name}</TableCell>
                                <TableCell>{section.nameBangla || "-"}</TableCell>
                                <TableCell>{section.floor?.name || (section.floorId ? `Floor: ${section.floorId.substring(0, 8)}` : "-")}</TableCell>
                                <TableCell>{section.floor?.building?.name || "-"}</TableCell>
                                {(hasPermission("facility:update") || hasPermission("facility:delete")) && (
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {hasPermission("facility:update") && (
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(section)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            {hasPermission("facility:delete") && (
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(section.id)}>
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

            <SectionDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                section={selectedSection}
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the section and all its beds.
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
