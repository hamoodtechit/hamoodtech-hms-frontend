"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingList } from "@/components/facility/building-list";
import { FloorList } from "@/components/facility/floor-list";
import { SectionList } from "@/components/facility/section-list";
import { BedTypeList } from "@/components/facility/bed-type-list";
import { BedList } from "@/components/facility/bed-list";
import { Building2, Layers, LayoutGrid, BedDouble, Settings2, AlertCircle } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

import { PermissionGuard } from "@/components/shared/permission-guard";

export default function FacilityPage() {
    return (
        <PermissionGuard permission="facility:read">
            <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Facility Management</h2>
                    <p className="text-muted-foreground">
                        Manage hospital infrastructure, beds, and departments.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="buildings" className="space-y-4">
                <TabsList className="bg-muted p-1 rounded-xl h-auto flex flex-wrap gap-1 justify-start">
                    <TabsTrigger value="buildings" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Building2 className="h-4 w-4 mr-2" /> Buildings
                    </TabsTrigger>
                    <TabsTrigger value="floors" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Layers className="h-4 w-4 mr-2" /> Floors
                    </TabsTrigger>
                    <TabsTrigger value="sections" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <LayoutGrid className="h-4 w-4 mr-2" /> Sections
                    </TabsTrigger>
                    <TabsTrigger value="bed-types" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Settings2 className="h-4 w-4 mr-2" /> Bed Types
                    </TabsTrigger>
                    <TabsTrigger value="beds" className="rounded-lg px-4 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <BedDouble className="h-4 w-4 mr-2" /> Beds
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="buildings" className="space-y-4 outline-none">
                    <div className="bg-card rounded-xl border p-6 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold">Buildings</h3>
                            <p className="text-sm text-muted-foreground">Manage and track all buildings in the branch.</p>
                        </div>
                        <BuildingList />
                    </div>
                </TabsContent>
                
                <TabsContent value="floors" className="space-y-4 outline-none">
                    <div className="bg-card rounded-xl border p-6 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold">Floors</h3>
                            <p className="text-sm text-muted-foreground">Manage floors within buildings.</p>
                        </div>
                        <FloorList />
                    </div>
                </TabsContent>
                
                <TabsContent value="sections" className="space-y-4 outline-none">
                    <div className="bg-card rounded-xl border p-6 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold">Sections</h3>
                            <p className="text-sm text-muted-foreground">Define sections and departments within floors.</p>
                        </div>
                        <SectionList />
                    </div>
                </TabsContent>
                
                <TabsContent value="bed-types" className="space-y-4 outline-none">
                    <div className="bg-card rounded-xl border p-6 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold">Bed Types</h3>
                            <p className="text-sm text-muted-foreground">Define bed categories and pricing.</p>
                        </div>
                        <BedTypeList />
                    </div>
                </TabsContent>

                <TabsContent value="beds" className="space-y-4 outline-none">
                    <div className="bg-card rounded-xl border p-6 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold">Beds</h3>
                            <p className="text-sm text-muted-foreground">Manage individual hospital beds and their status.</p>
                        </div>
                        <BedList />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
        </PermissionGuard>
    );
}
