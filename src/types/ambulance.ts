export type AmbulanceType = 'owned' | 'contractual';
export type AmbulanceStatus = 'available' | 'on duty' | 'maintenance';

export interface Ambulance {
    id: string;
    branchId: string;
    vehicleType: AmbulanceType;
    vehicleNumber: string;
    vehicleModel: string;
    driverName: string;
    driverPhone: string;
    driverLicense: string;
    status: AmbulanceStatus | string; // Flexible to handle backend capitalization if needed
    note?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AmbulancePayload {
    branchId: string;
    vehicleType: AmbulanceType;
    vehicleNumber: string;
    vehicleModel: string;
    driverName: string;
    driverPhone: string;
    driverLicense: string;
    status: string;
    note?: string;
}

export interface ApiMeta {
    page: number;
    pageSize: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface AmbulancePaginatedResponse {
    success: boolean;
    message: string;
    data: Ambulance[];
    meta: ApiMeta;
}

export type AmbulanceBookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface AmbulanceBooking {
    id: string;
    branchId: string;
    ambulanceId: string;
    patientId?: string;
    patientName: string;
    patientAddress?: string;
    pickupLocation: string;
    dropoffLocation: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianRelation?: string;
    status: AmbulanceBookingStatus;
    note?: string;
    createdAt: string;
    updatedAt: string;
    ambulance?: Ambulance;
    branch?: {
        id: string;
        name: string;
    };
    patient?: {
        id: string;
        patientNumber: string;
        name: string;
        phone: string;
    };
}

export interface AmbulanceBookingPayload {
    branchId: string;
    ambulanceId: string;
    patientId?: string;
    patientName: string;
    patientAddress?: string;
    pickupLocation: string;
    dropoffLocation: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianRelation?: string;
    status: AmbulanceBookingStatus | string;
    note?: string;
}

export interface AmbulanceBookingPaginatedResponse {
    success: boolean;
    message: string;
    data: AmbulanceBooking[];
    meta: ApiMeta;
}
