import { loginRequest, logoutRequest } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { useMutation } from '@tanstack/react-query';

export const useLogin = () => {
    const login = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            loginRequest(email, password),
        onSuccess: (data) => {
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
        },
    });
};
