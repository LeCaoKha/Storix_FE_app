export type UserRole = 'staff' | 'manager';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    employeeId: string;
    warehouse: string;
    phone: string;
    joinDate: string;
}

export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}
