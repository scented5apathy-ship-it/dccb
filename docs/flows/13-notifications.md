# Luồng 13: Thông báo (Notifications)

## Mô tả nghiệp vụ

Luồng quản lý in-app notifications:
- Tạo notification khi user bị tag trong story/recipe/event/time-capsule
- List notifications (filter unread only)
- Mark as read (single + all)
- Real-time notification count (badge trên TopBar)

## Sequence Diagram

### 13.1. Tạo notification (event-driven)

```mermaid
sequenceDiagram
    autonumber
    participant Trigger as Trigger Service<br/>(Story/Event/Recipe)
    participant NotifSvc as NotificationService
    participant NotifRepo as NotificationRepository
    participant DB as PostgreSQL

    Trigger->>NotifSvc: notify(userId, type, title, content, entityType, entityId)
    NotifSvc->>NotifRepo: insert(Notification)
    NotifRepo->>DB: INSERT INTO caygiophaso.notifications<br/>(user_id, notification_type, title, content?, related_entity_type?, related_entity_id?, is_read=FALSE)
    DB-->>NotifRepo: notificationId
    NotifRepo-->>NotifSvc: savedNotification
    NotifSvc-->>Trigger: void
```

### 13.2. List notifications

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend
    participant API as NotificationController
    participant NotifSvc as NotificationService
    participant NotifRepo as NotificationRepository
    participant DB as PostgreSQL

    User->>FE: Vào /notifications
    FE->>API: GET /api/notifications?unreadOnly=true&page=0&size=20
    API->>NotifSvc: list(filters, page, size, currentUser)
    NotifSvc->>NotifRepo: list(userId, unreadOnly, page, size)
    NotifRepo->>DB: SELECT * FROM caygiophaso.notifications<br/>WHERE user_id = ?<br/>AND (? = false OR is_read = false)<br/>ORDER BY created_at DESC<br/>LIMIT ? OFFSET ?
    DB-->>NotifRepo: List<Notification>
    NotifRepo->>DB: SELECT COUNT(*), COUNT(*) FILTER (WHERE is_read = FALSE) ...
    DB-->>NotifRepo: total, unreadCount
    NotifRepo-->>NotifSvc: { notifications, total, unreadCount, page, size }
    NotifSvc-->>API: NotificationListResponse
    API-->>FE: HTTP 200
    FE->>User: Render notifications
```

### 13.3. Mark as read

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend
    participant API as NotificationController
    participant NotifSvc as NotificationService
    participant NotifRepo as NotificationRepository
    participant DB as PostgreSQL

    User->>FE: Click notification
    FE->>API: POST /api/notifications/{id}/read
    API->>NotifSvc: markRead(id, currentUser)
    NotifSvc->>NotifRepo: markRead(id, userId)
    NotifRepo->>DB: UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?
    DB-->>NotifRepo: OK
    NotifSvc-->>API: { notification }
    API-->>FE: HTTP 200
    FE->>FE: Update local state (unread count -1)

    Note over User: Mark all as read
    User->>FE: Click "Đánh dấu tất cả đã đọc"
    FE->>API: POST /api/notifications/read-all
    API->>NotifSvc: markAllRead(currentUser)
    NotifSvc->>NotifRepo: markAllRead(userId)
    NotifRepo->>DB: UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE
    DB-->>NotifRepo: rowCount
    NotifSvc-->>API: { markedCount }
    API-->>FE: HTTP 200
    FE->>User: Toast "Đã đánh dấu X thông báo"
```

## API Endpoints

| Method | Path | Mô tả | Auth |
|--------|------|-------|------|
| `GET` | `/api/notifications` | List | ✅ |
| `POST` | `/api/notifications/{id}/read` | Mark 1 | ✅ |
| `POST` | `/api/notifications/read-all` | Mark all | ✅ |

## Bảng DB

```sql
CREATE TABLE caygiophaso.notifications (
    id UUID PK,
    user_id UUID FK -> users (CASCADE),
    notification_type TEXT,
    title TEXT,
    content TEXT,
    related_entity_type TEXT,
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);
```

## SQL mẫu

```sql
-- 1. Unread count cho user
SELECT COUNT(*) AS unread_count
FROM caygiophaso.notifications
WHERE user_id = '...' AND is_read = FALSE;

-- 2. Notification types breakdown
SELECT notification_type, COUNT(*) AS total,
       COUNT(*) FILTER (WHERE is_read = FALSE) AS unread
FROM caygiophaso.notifications
WHERE user_id = '...'
GROUP BY notification_type
ORDER BY total DESC;

-- 3. Notifications gần đây (7 ngày qua)
SELECT *
FROM caygiophaso.notifications
WHERE user_id = '...' AND created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 4. Top users nhận nhiều notification nhất
SELECT u.email, u.full_name, COUNT(*) AS notif_count
FROM caygiophaso.notifications n
JOIN caygiophaso.users u ON u.id = n.user_id
WHERE n.created_at > NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, u.full_name
ORDER BY notif_count DESC
LIMIT 10;

-- 5. Notification activity heatmap
SELECT
    DATE_TRUNC('hour', created_at) AS hour_bucket,
    COUNT(*) AS notif_count
FROM caygiophaso.notifications
WHERE user_id = '...' AND created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket;

-- 6. Cleanup old read notifications
DELETE FROM caygiophaso.notifications
WHERE is_read = TRUE AND read_at < NOW() - INTERVAL '90 days';
```

## Edge cases

1. **Polymorphic reference**: `related_entity_type` + `related_entity_id` không có FK (by design).
2. **CASCADE delete**: Xoá user → xoá tất cả notifications.
3. **Composite index**: `(user_id, created_at DESC)` cho list nhanh (V4).
4. **Partial index unread**: `(user_id, created_at DESC) WHERE is_read = FALSE`.
5. **Owner check**: Mark read chỉ áp dụng cho notification của chính user đó.

## Bài học SQL

1. **Polymorphic references**: Không FK nhưng có type constraint.
2. **Partial index**: Chỉ index rows thỏa điều kiện (smaller, faster).
3. **Cleanup jobs**: Scheduled job xoá notification cũ (đã đọc > 90 ngày).
4. **DATE_TRUNC**: Bucket time cho phân tích.
5. **CASCADE**: User bị xoá → notifications tự xoá.