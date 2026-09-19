export interface Notification {
  id: string;
  userId?: string;
  notificationType?: string;
  title: string;
  content?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isRead?: boolean;
  readAt?: string;
  createdAt?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  size: number;
}

export interface NotificationMarkReadResponse {
  notification: Notification;
}

export interface NotificationMarkAllReadResponse {
  count: number;
}