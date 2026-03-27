import type { User, UserWarehouseAssignment } from '@/types/auth.types';
import { api } from './axios.instance';

export const normalizeWarehouseAssignments = (userProfile: any): UserWarehouseAssignment[] => {
    const assignmentsSource = userProfile?.warehouseAssignments || userProfile?.WarehouseAssignments;

    if (!Array.isArray(assignmentsSource)) {
        return [];
    }

    return [...assignmentsSource]
        .filter((assignment: any) => !!(assignment?.warehouseId || assignment?.WarehouseId))
        .sort((a: any, b: any) =>
            new Date((b.assignedAt || b.AssignedAt || 0)).getTime() - new Date((a.assignedAt || a.AssignedAt || 0)).getTime()
        )
        .map((assignment: any) => ({
            warehouseId: assignment.warehouseId || assignment.WarehouseId,
            assignedAt: assignment.assignedAt || assignment.AssignedAt,
            warehouse: assignment.warehouse || assignment.Warehouse
                ? {
                    id: assignment.warehouse?.id || assignment.Warehouse?.id || assignment.Warehouse?.Id,
                    name: assignment.warehouse?.name || assignment.Warehouse?.name || assignment.Warehouse?.Name,
                }
                : undefined,
        }));
};

export const mergeUserProfileIntoUser = (currentUser: User, userProfile: any): User => {
    const normalizedAssignments = normalizeWarehouseAssignments(userProfile);
    const latestAssignment = normalizedAssignments[0];
    const directWarehouseId = userProfile.warehouseId || userProfile.WarehouseId;
    const directWarehouseName = userProfile.warehouseName || userProfile.WarehouseName;
    const resolvedWarehouseId = latestAssignment?.warehouseId || directWarehouseId || currentUser.warehouseId;
    const resolvedWarehouseName = latestAssignment?.warehouse?.name || directWarehouseName || currentUser.warehouseName;

    const resolvedAssignments = normalizedAssignments.length > 0
        ? normalizedAssignments
        : resolvedWarehouseId
            ? [{
                warehouseId: resolvedWarehouseId,
                warehouse: { id: resolvedWarehouseId, name: resolvedWarehouseName },
            }]
            : currentUser.warehouseAssignments;

    return {
        ...currentUser,
        fullName: userProfile.fullName ?? userProfile.FullName ?? currentUser.fullName,
        phone: userProfile.phone ?? userProfile.Phone ?? currentUser.phone,
        warehouseId: resolvedWarehouseId,
        warehouseName: resolvedWarehouseName,
        warehouseAssignments: resolvedAssignments,
        roleName: userProfile.role?.name ?? userProfile.Role?.name ?? userProfile.Role?.Name ?? currentUser.roleName,
        status: userProfile.status ?? userProfile.Status ?? currentUser.status,
        avatar: userProfile.avatar ?? userProfile.Avatar ?? currentUser.avatar,
        createdAt: userProfile.createdAt ?? userProfile.CreatedAt ?? currentUser.createdAt,
        updatedAt: userProfile.updatedAt ?? userProfile.UpdatedAt ?? currentUser.updatedAt,
    };
};

export const getUserProfile = async (userId: number): Promise<User> => {
    const res = await api.get(`/api/Users/get-user-profile/${userId}`);
    return res.data;
};

export const getUserById = async (userId: number): Promise<User> => {
    const res = await api.get(`/api/Users/${userId}`);
    return res.data;
};

export const getUsersByWarehouse = async (warehouseId: number): Promise<User[]> => {
    const res = await api.get(`/api/Users/get-users-by-warehouse/${warehouseId}`);
    return res.data;
};

export const updateProfile = async (userId: number, formData: FormData): Promise<User> => {
    const res = await api.put(`/api/Users/update-profile/${userId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return res.data;
};
