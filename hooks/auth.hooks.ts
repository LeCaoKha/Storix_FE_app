import { loginRequest, logoutRequest } from '@/services/auth.api';
import { useAuthStore } from '@/stores/auth.store';
import { useMutation } from '@tanstack/react-query';

export const useLogin = () => {
    const login = useAuthStore((state) => state.login);

    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            loginRequest(email, password),
        onSuccess: (data) => {
            login(data.accessToken, {
                id: data.userId,
                roleId: data.roleId,
                companyId: data.companyId,
                email: '', // Email is not returned by Login endpoint directly in the response object apart from claims
            });
        },
    });
};


export const useLogout = () => {
    const logout = useAuthStore((state) => state.logout);

    return useMutation({
        mutationFn: logoutRequest,
        onSuccess: () => {
            logout();
        },
    });
};
