import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

import type { AuthState, User, UserRole } from '@/types/auth';

interface AuthContextType extends AuthState {
    login: (email: string, password: string, role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@storix_auth_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isLoading: true,
        isAuthenticated: false,
    });

    // Load user from storage on mount
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
            if (userJson) {
                const user = JSON.parse(userJson) as User;
                setState({
                    user,
                    isLoading: false,
                    isAuthenticated: true,
                });
            } else {
                setState({
                    user: null,
                    isLoading: false,
                    isAuthenticated: false,
                });
            }
        } catch (error) {
            console.error('Failed to load user:', error);
            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
            });
        }
    };

    const login = async (email: string, password: string, role: UserRole) => {
        // TODO: Replace with real API call
        // Mock user data based on role
        const mockUser: User = {
            id: role === 'staff' ? 'staff-001' : 'manager-001',
            name: role === 'staff' ? 'Nguyen Van A' : 'Tran Thi B',
            email,
            role,
            employeeId: role === 'staff' ? 'WS-2024-001' : 'WM-2024-001',
            warehouse: 'WH-HCM-01',
            phone: '+84 987 654 321',
            joinDate: '03/15/2024',
        };

        try {
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
            setState({
                user: mockUser,
                isLoading: false,
                isAuthenticated: true,
            });
        } catch (error) {
            console.error('Failed to save user:', error);
            throw new Error('Login failed');
        }
    };

    const logout = async () => {
        try {
            await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
            setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
            });
        } catch (error) {
            console.error('Failed to logout:', error);
        }
    };

    const hasRole = (role: UserRole) => {
        return state.user?.role === role;
    };

    return (
        <AuthContext.Provider
            value={{
                ...state,
                login,
                logout,
                hasRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
