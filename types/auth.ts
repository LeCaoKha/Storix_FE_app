export type UserRole = 4; // 4: Staff

export interface UserWarehouseAssignment {
    warehouseId: number;
    assignedAt?: string;
    warehouse?: {
        id?: number;
        name?: string;
    };
}

export interface User {
    id: number;
    email: string;
    fullName?: string;
    phone?: string;
    roleId: number;
    roleName?: string;
    companyId?: number;
    warehouseId?: number;
    warehouseName?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
    avatar?: string;
    warehouseAssignments?: UserWarehouseAssignment[];
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
    roleId: number;
    companyId?: number;
    warehouseId?: number;
    warehouseName?: string;
}

