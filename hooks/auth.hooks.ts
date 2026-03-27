import { loginRequest, logoutRequest } from '@/services/auth.api';
import { queryClient } from '@/services/queryClient';
import { useAuthStore } from '@/stores/auth.store';
import { useMutation } from '@tanstack/react-query';

export const useLogin = () => {
    const login = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            loginRequest(email, password),
        onSuccess: (data) => {
            // Avoid showing stale data from previous account/company after login.
            queryClient.clear();
            login(data.accessToken, data.refreshToken, {
                id: data.userId,
                roleId: data.roleId,
                companyId: data.companyId,
                email: '',
            });
        },
    });
};


export const useLogout = () => {
    const logout = useAuthStore((state) => state.logout);
    const refreshToken = useAuthStore((state) => state.refreshToken);

    return useMutation({
        mutationFn: () => logoutRequest(refreshToken),
        onSettled: () => {
            // Clear local session regardless of API success
            logout();
            queryClient.clear();
        },
    });
};
