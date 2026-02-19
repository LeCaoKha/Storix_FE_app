export type UserRole = 2 | 3 | 4; // 2: Admin, 3: Manager, 4: Staff

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
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
    roleId: number;
    companyId?: number;
}
