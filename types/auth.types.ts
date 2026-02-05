export type UserRole = 2 | 3 | 4; // 2: Admin, 3: Manager, 4: Staff

export interface User {
    id: number;
    roleId: number;
    companyId?: number;
    email: string;
}


export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
    roleId: number;
    companyId?: number;
}
