# Luồng hệ thống CâyGiaPhảSố (AncestryTree)

Tài liệu này mô tả chi tiết từng luồng nghiệp vụ của hệ thống CâyGiaPhảSố — nền tảng Cây Gia Phả Số. Mỗi luồng đi kèm:

- Mô tả nghiệp vụ
- Sequence diagram (Mermaid) chi tiết từng bước
- Bảng API endpoints liên quan
- Bảng câu SQL phức tạp đi kèm (nếu có)
- Edge cases và luật phân quyền
- Test cases để tester thực hành

## Mục lục

| # | Luồng | File | Độ phức tạp |
|---|-------|------|-------------|
| 1 | Xác thực & Phân quyền (Auth) | [01-authentication.md](01-authentication.md) | ⭐⭐ |
| 2 | Quản lý Gia tộc (Family) | [02-family-management.md](02-family-management.md) | ⭐⭐⭐ |
| 3 | Lời mời vào Gia tộc (Invitation) | [03-invitations.md](03-invitations.md) | ⭐⭐ |
| 4 | Thành viên & Quan hệ (Member & Relationship) | [04-members-relationships.md](04-members-relationships.md) | ⭐⭐⭐ |
| 5 | Cây gia phả trực quan (Family Tree) | [05-family-tree.md](05-family-tree.md) | ⭐⭐⭐ |
| 6 | Công thức nấu ăn (Recipe) | [06-recipes.md](06-recipes.md) | ⭐⭐⭐ |
| 7 | Phả hệ Công thức (Recipe Genealogy) | [07-recipe-genealogy.md](07-recipe-genealogy.md) | ⭐⭐⭐⭐⭐ |
| 8 | Câu chuyện gia tộc (Story) | [08-stories.md](08-stories.md) | ⭐⭐ |
| 9 | Sự kiện gia đình (Event) | [09-events.md](09-events.md) | ⭐⭐⭐ |
| 10 | Trò chuyện gia đình (Chat) | [10-chat.md](10-chat.md) | ⭐⭐ |
| 11 | Capsules thời gian (Time Capsules) | [11-time-capsules.md](11-time-capsules.md) | ⭐⭐⭐ |
| 12 | Album ảnh gia đình (Photo Albums) | [12-photo-albums.md](12-photo-albums.md) | ⭐⭐ |
| 13 | Thông báo (Notifications) | [13-notifications.md](13-notifications.md) | ⭐⭐ |
| 14 | Di sản & Truyền thống (Heritage) | [14-heritage.md](14-heritage.md) | ⭐ |
| 15 | Thành tích (Achievements) | [15-achievements.md](15-achievements.md) | ⭐ |

## Stack tổng quan

```
┌─────────────────┐    HTTP/JSON    ┌─────────────────┐   SQL   ┌──────────────────┐
│  Frontend       │ ◄────────────► │   Backend       │ ◄─────► │  PostgreSQL 16   │
│  Next.js 14     │   JWT Bearer    │   Spring Boot   │  Jdbc   │  schema:         │
│  TypeScript     │                 │   Java 17       │         │  caygiaphaso     │
│  TanStack Query │                 │   Flyway        │         │  33 tables       │
└─────────────────┘                 └─────────────────┘         └──────────────────┘
```

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + TanStack Query
- **Backend**: Spring Boot 3.2.5 + Java 17 + JdbcTemplate (raw SQL, no JPA)
- **Database**: PostgreSQL 16 + Flyway migrations (`V1__init_schema.sql`, `V2__seed_data.sql`, `V3__create_views.sql`, `V4__fix_integrity_and_performance.sql`)
- **Auth**: JWT (Access + Refresh tokens, 7-day TTL)

## Cấu trúc URL

| Mục | Giá trị |
|-----|---------|
| Base URL backend | `http://localhost:8080/api` |
| Context path | `/api` |
| Base URL frontend | `http://localhost:3000` |
| Database | `skillseed` (Docker) / schema `caygiaphaso` |
| Flyway baseline | v3 (V1+V2 đã có) |

## Phân quyền

| Role | Quyền |
|------|-------|
| **ADMIN** | Toàn quyền: tạo/sửa/xoá mọi thứ trong gia tộc |
| **EDITOR** | Thêm/sửa thành viên, công thức, sự kiện, story |
| **MEMBER** | Thêm thành viên, xem/sửa thông tin được phép |
| **VIEWER** | Chỉ xem |

## Luật phân quyền đặc biệt

1. **Người tạo gia tộc (creator)**: luôn có role ADMIN, xác định qua `families.created_by`
2. **Người dùng hợp lệ**: phải tồn tại trong `family_members` với `user_id`
3. **Mời vào gia tộc**: chỉ ADMIN mới tạo được lời mời
4. **Mở Time Capsule**: phải thoả điều kiện unlock (DATE/EVENT/MANUAL)
5. **Public recipes**: ai cũng xem được (kể cả không phải thành viên gia tộc)

## Bắt đầu nhanh

1. Đăng ký tài khoản → `/auth/register`
2. Đăng nhập → `/auth/login` (nhận accessToken + refreshToken)
3. Tạo gia tộc → `POST /api/families`
4. Mời thành viên → `POST /api/families/{familyId}/invitations`
5. Người được mời đăng ký/đăng nhập → join bằng `POST /api/families/join`
6. Thêm thành viên cây → `POST /api/families/{familyId}/members`
7. Thêm quan hệ → `POST /api/relationships`

## Quy ước

- Tất cả API response đều JSON
- Lỗi trả về HTTP status + body `{ "error": "...", "message": "..." }`
- Authentication: header `Authorization: Bearer <accessToken>`
- UUID làm primary key cho mọi bảng
- Timestamps luôn là TIMESTAMPTZ (UTC)