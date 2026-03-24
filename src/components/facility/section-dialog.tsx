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
import { Textarea } from "@/components/ui/textarea";
import { Section, SectionPayload } from "@/types/facility";
import { useEffect, useState } from "react";
import { useCreateSection, useUpdateSection, useFloors, useBuildings } from "@/hooks/facility-queries";
import { Loader2 } from "lucide-react";

interface SectionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    section?: Section | null;
}

export function SectionDialog({ open, onOpenChange, section }: SectionDialogProps) {
    const isEditing = !!section;
    const { mutate: createSection, isPending: isCreating } = useCreateSection();
    const { mutate: updateSection, isPending: isUpdating } = useUpdateSection();
    
    const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
    
    const { data: buildingsResponse } = useBuildings({ limit: 100 });
    const { data: floorsResponse } = useFloors({ buildingId: selectedBuildingId, limit: 100 });
    
    const buildings = buildingsResponse?.data || [];
    const floors = floorsResponse?.data || [];

    const [formData, setFormData] = useState<SectionPayload>({
        name: "",
        nameBangla: "",
        description: "",
        floorId: "",
    });

    useEffect(() => {
        if (section) {
            setFormData({
                name: section.name,
                nameBangla: section.nameBangla || "",
                description: section.description || "",
                floorId: section.floorId,
            });
            if (section.floor?.buildingId) {
                setSelectedBuildingId(section.floor.buildingId);
            }
        } else {
            setFormData({
                name: "",
                nameBangla: "",
                description: "",
                floorId: "",
            });
        }
    }, [section, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing && section) {
            updateSection({ id: section.id, data: formData }, {
                onSuccess: () => onOpenChange(false)
            });
        } else {
            createSection(formData, {
                onSuccess: () => onOpenChange(false)
            });
        }
    };

    const isLoading = isCreating || isUpdating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Section" : "Add Section"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="building">Building</Label>
                        <Select
                            value={selectedBuildingId}
                            onValueChange={setSelectedBuildingId}
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
                        <Label htmlFor="floor">Floor</Label>
                        <Select
                            value={formData.floorId}
                            onValueChange={(value) => setFormData({ ...formData, floorId: value })}
                            disabled={!selectedBuildingId}
                            required
                        >
                            <SelectTrigger id="floor">
                                <SelectValue placeholder="Select Floor" />
                            </SelectTrigger>
                            <SelectContent>
                                {floors.map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                        {f.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name">Section Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. ICU A"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nameBangla">Name (Bangla) - Optional</Label>
                        <Input
                            id="nameBangla"
                            placeholder="আইসিইউ এ"
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
                        <Button type="submit" disabled={isLoading || !formData.floorId}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Update" : "Create"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
