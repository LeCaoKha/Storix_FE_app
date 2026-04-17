import { api } from './axios.instance';

export interface NotificationItem {
  id: number;
  title?: string;
  message?: string;
  createdAt?: string;
  isRead?: boolean;
  type?: string;
  notification?: {
    id?: number;
    title?: string;
    message?: string;
    createdAt?: string;
    isRead?: boolean;
    type?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const getUserNotifications = async (userId: number, skip = 0, take = 50) => {
  const res = await api.get(`/api/Notification/get-notifications/${userId}?skip=${skip}&take=${take}`);

  if (Array.isArray(res.data)) {
    return res.data as NotificationItem[];
  }

  if (Array.isArray(res.data?.items)) {
    return res.data.items as NotificationItem[];
  }

  if (Array.isArray(res.data?.data)) {
    return res.data.data as NotificationItem[];
  }

  return [] as NotificationItem[];
};

export const markNotificationAsRead = async (userId: number, userNotificationId: number) => {
  const res = await api.put(`/api/Notification/mark-as-read/${userId}/${userNotificationId}`);
  return res.data;
};

export const deleteNotification = async (userId: number, userNotificationId: number) => {
  const res = await api.delete(`/api/Notification/delete/${userId}/${userNotificationId}`);
  return res.data;
};