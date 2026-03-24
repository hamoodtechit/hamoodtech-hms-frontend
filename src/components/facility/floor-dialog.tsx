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
import { Floor, FloorPayload } from "@/types/facility";
import { useEffect, useState } from "react";
import { useCreateFloor, useUpdateFloor, useBuildings } from "@/hooks/facility-queries";
import { Loader2 } from "lucide-react";

interface FloorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    floor?: Floor | null;
}

export function FloorDialog({ open, onOpenChange, floor }: FloorDialogProps) {
    const isEditing = !!floor;
    const { mutate: createFloor, isPending: isCreating } = useCreateFloor();
    const { mutate: updateFloor, isPending: isUpdating } = useUpdateFloor();
    const { data: buildingsResponse } = useBuildings({ limit: 100 });
    const buildings = buildingsResponse?.data || [];

    const [formData, setFormData] = useState<FloorPayload>({
        name: "",
        nameBangla: "",
        floorNumber: 0,
        buildingId: "",
    });

    useEffect(() => {
        if (floor) {
            setFormData({
                name: floor.name,
                nameBangla: floor.nameBangla || "",
                floorNumber: floor.floorNumber,
                buildingId: floor.buildingId,
            });
        } else {
            setFormData({
                name: "",
                nameBangla: "",
                floorNumber: 0,
                buildingId: "",
            });
        }
    }, [floor, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && floor) {
            updateFloor({ id: floor.id, data: formData }, {
                onSuccess: () => onOpenChange(false)
            });
        } else {
            createFloor(formData, {
                onSuccess: () => onOpenChange(false)
            });
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Floor" : "Add Floor"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="building">Building</Label>
                        <Select
                            value={formData.buildingId}
                            onValueChange={(value) => setFormData({ ...formData, buildingId: value })}
                            required
                        >
                            <SelectTrigger id="building">
                                <SelectValue placeholder="Select Building" />
                            </SelectTrigger>
                            <SelectContent>
                                {buildings.map((b) => (
                                    <SelectItem key={b.id} value={b.id}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Floor Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Ground Floor"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nameBangla">Name (Bangla) - Optional</Label>
                        <Input
                            id="nameBangla"
                            placeholder="নিচ তলা"
                            value={formData.nameBangla}
                            onChange={(e) => setFormData({ ...formData, nameBangla: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="floorNumber">Floor Number</Label>
                        <Input
                            id="floorNumber"
                            type="number"
                            value={formData.floorNumber}
                            onChange={(e) => setFormData({ ...formData, floorNumber: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !formData.buildingId}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
