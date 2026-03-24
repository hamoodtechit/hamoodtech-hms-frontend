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
import { BedType, BedTypePayload } from "@/types/facility";
import { useEffect, useState } from "react";
import { useCreateBedType, useUpdateBedType } from "@/hooks/facility-queries";
import { Loader2 } from "lucide-react";

interface BedTypeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bedType?: BedType | null;
}

export function BedTypeDialog({ open, onOpenChange, bedType }: BedTypeDialogProps) {
    const isEditing = !!bedType;
    const { mutate: createBedType, isPending: isCreating } = useCreateBedType();
    const { mutate: updateBedType, isPending: isUpdating } = useUpdateBedType();

    const [formData, setFormData] = useState<BedTypePayload>({
        name: "",
        nameBangla: "",
        description: "",
        pricePerDay: 0,
        branchId: "default-branch",
    });

    useEffect(() => {
        if (bedType) {
            setFormData({
                name: bedType.name,
                nameBangla: bedType.nameBangla || "",
                description: bedType.description || "",
                pricePerDay: bedType.pricePerDay,
                branchId: bedType.branchId,
            });
        } else {
            setFormData({
                name: "",
                nameBangla: "",
                description: "",
                pricePerDay: 0,
                branchId: "default-branch",
            });
        }
    }, [bedType, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && bedType) {
            updateBedType({ id: bedType.id, data: formData }, {
                onSuccess: () => onOpenChange(false)
            });
        } else {
            createBedType(formData, {
                onSuccess: () => onOpenChange(false)
            });
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Bed Type" : "Add Bed Type"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Type Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. VIP Cabin"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nameBangla">Name (Bangla) - Optional</Label>
                        <Input
                            id="nameBangla"
                            placeholder="ভিআইপি কেবিন"
                            value={formData.nameBangla}
                            onChange={(e) => setFormData({ ...formData, nameBangla: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pricePerDay">Price Per Day</Label>
                        <Input
                            id="pricePerDay"
                            type="number"
                            value={formData.pricePerDay}
                            onChange={(e) => setFormData({ ...formData, pricePerDay: parseFloat(e.target.value) || 0 })}
                            required
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
