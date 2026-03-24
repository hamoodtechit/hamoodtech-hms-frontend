"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bed, BedPayload, BedStatus } from "@/types/facility";
import { useEffect, useState } from "react";
import { useCreateBed, useUpdateBed, useBedTypes, useSections, useFloors, useBuildings } from "@/hooks/facility-queries";
import { Loader2 } from "lucide-react";

interface BedDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bed?: Bed | null;
}

export function BedDialog({ open, onOpenChange, bed }: BedDialogProps) {
    const isEditing = !!bed;
    const { mutate: createBed, isPending: isCreating } = useCreateBed();
    const { mutate: updateBed, isPending: isUpdating } = useUpdateBed();

    const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
    const [selectedFloorId, setSelectedFloorId] = useState<string>("");

    const { data: buildingsResponse } = useBuildings({ limit: 100 });
    const { data: floorsResponse } = useFloors({ buildingId: selectedBuildingId, limit: 100 });
    const { data: sectionsResponse } = useSections({ floorId: selectedFloorId, limit: 100 });
    const { data: bedTypesResponse } = useBedTypes({ limit: 100 });

    const buildings = buildingsResponse?.data || [];
    const floors = floorsResponse?.data || [];
    const sections = sectionsResponse?.data || [];
    const bedTypes = bedTypesResponse?.data || [];

    const [formData, setFormData] = useState<BedPayload>({
        bedTypeId: "",
        sectionId: "",
        bedNumber: "",
        status: "available",
    });

    useEffect(() => {
        if (bed) {
            setFormData({
                bedTypeId: bed.bedTypeId,
                sectionId: bed.sectionId,
                bedNumber: bed.bedNumber,
                status: bed.status,
            });
            if (bed.section?.floor?.buildingId) {
                setSelectedBuildingId(bed.section.floor.buildingId);
                setSelectedFloorId(bed.section.floorId);
            }
        } else {
            setFormData({
                bedTypeId: "",
                sectionId: "",
                bedNumber: "",
                status: "available",
            });
        }
    }, [bed, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && bed) {
            updateBed({ id: bed.id, data: formData }, {
                onSuccess: () => onOpenChange(false)
            });
        } else {
            createBed(formData, {
                onSuccess: () => onOpenChange(false)
            });
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Bed" : "Add Bed"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="building">Building</Label>
                            <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                                <SelectTrigger id="building">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {buildings.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="floor">Floor</Label>
                            <Select value={selectedFloorId} onValueChange={setSelectedFloorId} disabled={!selectedBuildingId}>
                                <SelectTrigger id="floor">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    {floors.map((f) => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <Select
                            value={formData.sectionId}
                            onValueChange={(v) => setFormData({ ...formData, sectionId: v })}
                            disabled={!selectedFloorId}
                            required
                        >
                            <SelectTrigger id="section">
                                <SelectValue placeholder="Select Section" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bedType">Bed Type</Label>
                        <Select
                            value={formData.bedTypeId}
                            onValueChange={(v) => setFormData({ ...formData, bedTypeId: v })}
                            required
                        >
                            <SelectTrigger id="bedType">
                                <SelectValue placeholder="Select Bed Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {bedTypes.map((bt) => (
                                    <SelectItem key={bt.id} value={bt.id}>{bt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bedNumber">Bed Number</Label>
                        <Input
                            id="bedNumber"
                            placeholder="e.g. B-101"
                            value={formData.bedNumber}
                            onChange={(e) => setFormData({ ...formData, bedNumber: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(v) => setFormData({ ...formData, status: v as BedStatus })}
                            required
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="occupied">Occupied</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !formData.sectionId || !formData.bedTypeId}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
