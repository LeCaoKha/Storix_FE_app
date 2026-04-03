import { api } from './axios.instance';

export interface NotificationItem {
  id: number;
  title?: string;
  message?: string;
  createdAt?: string;
  isRead?: boolean;
  type?: string;
  [key: string]: any;
}

export const getUserNotifications = async (userId: number, skip = 0, take = 50) => {
  const res = await api.get(`/api/Notification/get-notifications/${userId}?skip=${skip}&take=${take}`);
  return res.data as NotificationItem[];
};

export const markNotificationAsRead = async (userId: number, userNotificationId: number) => {
  const res = await api.put(`/api/Notification/mark-as-read/${userId}/${userNotificationId}`);
  return res.data;
};