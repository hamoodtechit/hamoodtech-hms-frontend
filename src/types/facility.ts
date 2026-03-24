export type BedStatus = 'available' | 'occupied' | 'maintenance';

export interface BedType {
    id: string;
    name: string;
    nameBangla?: string;
    description?: string;
    branchId: string;
    pricePerDay: number;
    createdAt: string;
    updatedAt: string;
}

export interface BedTypePayload {
    name: string;
    nameBangla?: string;
    description?: string;
    branchId: string;
    pricePerDay: number;
}

export interface Building {
    id: string;
    name: string;
    nameBangla?: string;
    description?: string;
    branchId: string;
    createdAt: string;
    updatedAt: string;
}

export interface BuildingPayload {
    name: string;
    nameBangla?: string;
    description?: string;
    branchId: string;
}

export interface Floor {
    id: string;
    name: string;
    nameBangla?: string;
    floorNumber: number;
    buildingId: string;
    building?: Building;
    createdAt: string;
    updatedAt: string;
}

export interface FloorPayload {
    name: string;
    nameBangla?: string;
    floorNumber: number;
    buildingId: string;
}

export interface Section {
    id: string;
    name: string;
    nameBangla?: string;
    description?: string;
    floorId: string;
    floor?: Floor;
    createdAt: string;
    updatedAt: string;
}

export interface SectionPayload {
    name: string;
    nameBangla?: string;
    description?: string;
    floorId: string;
}

export interface Bed {
    id: string;
    bedTypeId: string;
    sectionId: string;
    bedNumber: string;
    status: BedStatus;
    bedType?: BedType;
    section?: Section;
    createdAt: string;
    updatedAt: string;
}

export interface BedPayload {
    bedTypeId: string;
    sectionId: string;
    bedNumber: string;
    status: BedStatus;
}

export interface FacilityPaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    meta: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalItems: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
