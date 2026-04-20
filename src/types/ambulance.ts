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

export interface AmbulancePaginatedResponse {
    success: boolean;
    message: string;
    data: {
        ambulances: Ambulance[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    };
}
