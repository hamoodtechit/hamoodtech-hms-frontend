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
import { Textarea } from "@/components/ui/textarea";
import { Building, BuildingPayload } from "@/types/facility";
import { useEffect, useState } from "react";
import { useCreateBuilding, useUpdateBuilding } from "@/hooks/facility-queries";
import { Loader2 } from "lucide-react";

interface BuildingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    building?: Building | null;
}

export function BuildingDialog({ open, onOpenChange, building }: BuildingDialogProps) {
    const isEditing = !!building;
    const { mutate: createBuilding, isPending: isCreating } = useCreateBuilding();
    const { mutate: updateBuilding, isPending: isUpdating } = useUpdateBuilding();

    const [formData, setFormData] = useState<BuildingPayload>({
        name: "",
        nameBangla: "",
        description: "",
        branchId: "default-branch", // This should probably be dynamic based on current branch
    });

    useEffect(() => {
        if (building) {
            setFormData({
                name: building.name,
                nameBangla: building.nameBangla || "",
                description: building.description || "",
                branchId: building.branchId,
            });
        } else {
            setFormData({
                name: "",
                nameBangla: "",
                description: "",
                branchId: "default-branch",
            });
        }
    }, [building, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && building) {
            updateBuilding({ id: building.id, data: formData }, {
                onSuccess: () => onOpenChange(false)
            });
        } else {
            createBuilding(formData, {
                onSuccess: () => onOpenChange(false)
            });
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Building" : "Add Building"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Building Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. Main Building"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="level">Name (Bangla) - Optional</Label>
                        <Input
                            id="nameBangla"
                            placeholder="প্রধান ভবন"
                            value={formData.nameBangla}
                            onChange={(e) => setFormData({ ...formData, nameBangla: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Brief description..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
