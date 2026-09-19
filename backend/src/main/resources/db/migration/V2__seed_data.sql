-- =====================================================================
-- CâyGiaPhảSố - V2: Rich Seed Data
-- =====================================================================
-- 3 families, 5 users, ~45 members, ~20 recipes (with genealogy),
-- stories, time capsules, events, photos, chats, achievements, heritages
-- =====================================================================

SET search_path = caygiaphaso, public;

-- ---------------------------------------------------------------------
-- 1. USERS (5)
-- Password hash = bcrypt('Password123!') for every user (dev only)
-- ---------------------------------------------------------------------

INSERT INTO users (id, email, password_hash, full_name, avatar_url, phone, bio, is_active, email_verified) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@nguyen-family.vn',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Nguyễn Văn An',  'https://i.pravatar.cc/300?u=an',
   '0901234567', 'Trưởng họ Nguyễn, đời thứ 5. Yêu thích nấu ăn truyền thống và lịch sử dòng tộc.',
   TRUE, TRUE),

  ('22222222-2222-2222-2222-222222222222', 'lan@nguyen-family.vn',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Nguyễn Thị Lan', 'https://i.pravatar.cc/300?u=lan',
   '0912345678', 'Chuyên gia ẩm thực miền Bắc. Cháu nội cụ tổ Nguyễn Văn Hùng.',
   TRUE, TRUE),

  ('33333333-3333-3333-3333-333333333333', 'minh@nguyen-family.vn',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Nguyễn Minh',    'https://i.pravatar.cc/300?u=minh',
   '0923456789', 'Kỹ sư phần mềm tại Hà Nội, thích tìm hiểu về nguồn gốc các món ăn gia đình.',
   TRUE, TRUE),

  ('44444444-4444-4444-4444-444444444444', 'hoa@tran-family.vn',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Trần Thị Hoa',   'https://i.pravatar.cc/300?u=hoa',
   '0934567890', 'Giáo viên về hưu, người kể chuyện chính của gia tộc họ Trần.',
   TRUE, TRUE),

  ('55555555-5555-5555-5555-555555555555', 'tuan@le-family.vn',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
   'Lê Văn Tuấn',    'https://i.pravatar.cc/300?u=tuan',
   '0945678901', 'Bác sĩ nội khoa, con trai trưởng gia đình họ Lê.',
   TRUE, TRUE);

-- ---------------------------------------------------------------------
-- 2. FAMILIES (3)
-- ---------------------------------------------------------------------

INSERT INTO families (id, name, description, founded_year, motto, origin_location, created_by, member_count) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001',
   'Gia tộc họ Nguyễn', 'Dòng họ Nguyễn có truyền thống hơn 200 năm tại làng Đông Ngạc, Hà Nội. Gia tộc nổi tiếng với nghề làm bánh chưng truyền thống và lòng yêu nước.',
   1820, 'Hiếu đễ trước, nghĩa khí sau', 'Làng Đông Ngạc, Từ Liêm, Hà Nội',
   '11111111-1111-1111-1111-111111111111', 0),

  ('bbbbbbbb-0000-0000-0000-000000000002',
   'Gia tộc họ Trần', 'Gia tộc họ Trần ở Huế với bề dày lịch sử gắn liền với kinh thành xưa. Nổi tiếng với các món cung đình Huế và nghề thêu ren.',
   1855, 'Trung hiếu vẹn toàn', 'Phường Phú Hậu, thành phố Huế',
   '44444444-4444-4444-4444-444444444444', 0),

  ('cccccccc-0000-0000-0000-000000000003',
   'Gia tộc họ Lê', 'Gia đình họ Lê ở Sài Gòn, ba thế hệ theo nghề y và nấu ăn Nam Bộ. Gìn giữ hương vị miền Tây giữa lòng thành phố.',
   1965, 'Thuận vợ thuận chồng, tát biển Đông cũng cạn', 'Quận Bình Thạnh, TP. Hồ Chí Minh',
   '55555555-5555-5555-5555-555555555555', 0);

-- ---------------------------------------------------------------------
-- 3. GENERATIONS
-- ---------------------------------------------------------------------

-- Họ Nguyễn - 5 generations
INSERT INTO generations (id, family_id, generation_number, name, start_year, end_year, description) VALUES
  ('aaaa1111-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001', 1, 'Đời 1 - Cụ tổ',         1820, 1885, 'Cụ tổ khai sáng dòng họ, từ Thanh Hóa lên Hà Nội lập nghiệp.'),
  ('aaaa1111-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001', 2, 'Đời 2 - Cụ nội',        1850, 1920, 'Các cụ đời thứ hai phát triển nghề nông và mở tiệm bánh.'),
  ('aaaa1111-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001', 3, 'Đời 3 - Ông bà nội',    1885, 1975, 'Trải qua hai cuộc kháng chiến, giữ vững truyền thống dân tộc.'),
  ('aaaa1111-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000001', 4, 'Đời 4 - Bố mẹ',        1955, 2025, 'Thời kỳ đổi mới, con cháu đi học và định cư khắp nơi.'),
  ('aaaa1111-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000001', 5, 'Đời 5 - Con cháu',     1985, NULL, 'Thế hệ công nghệ, giữ gìn di sản số và kết nối gia tộc.');

-- Họ Trần - 4 generations
INSERT INTO generations (id, family_id, generation_number, name, start_year, end_year, description) VALUES
  ('bbbb1111-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002', 1, 'Đời 1 - Cụ tổ',       1855, 1920, 'Cụ tổ làm quan dưới triều Nguyễn, có công với đất nước.'),
  ('bbbb1111-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002', 2, 'Đời 2 - Ông bà',      1885, 1970, 'Thời kỳ Pháp thuộc, gia tộc tham gia phong trào yêu nước.'),
  ('bbbb1111-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002', 3, 'Đời 3 - Bố mẹ',      1945, 2020, 'Xây dựng đất nước sau hòa bình, giữ nghề truyền thống.'),
  ('bbbb1111-0000-0000-0000-000000000004','bbbbbbbb-0000-0000-0000-000000000002', 4, 'Đời 4 - Con cháu',   1975, NULL, 'Thế hệ hội nhập quốc tế, đưa ẩm thực Huế ra thế giới.');

-- Họ Lê - 3 generations
INSERT INTO generations (id, family_id, generation_number, name, start_year, end_year, description) VALUES
  ('cccc1111-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003', 1, 'Đời 1 - Ông bà',      1965, 2020, 'Từ miền Tây lên Sài Gòn lập nghiệp, mở phòng khám và quán ăn.'),
  ('cccc1111-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003', 2, 'Đời 2 - Bố mẹ',      1990, NULL, 'Thế hệ kết hợp y học hiện đại với ẩm thực truyền thống.'),
  ('cccc1111-0000-0000-0000-000000000003','cccccccc-0000-0000-0000-000000000003', 3, 'Đời 3 - Con cháu',   2015, NULL, 'Các cháu nhỏ, tương lai của dòng họ.');

-- ---------------------------------------------------------------------
-- 4. FAMILY MEMBERS - Họ Nguyễn (20 members)
-- ---------------------------------------------------------------------

INSERT INTO family_members (id, family_id, user_id, full_name, nickname, gender, birth_date, death_date, birth_place, current_location, occupation, generation_id, biography) VALUES
  -- Đời 1 (Cụ tổ)
  ('a0000001-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Hùng', 'Cụ Hùng', 'MALE', '1820-03-15', '1885-08-20',
   'Thanh Hóa', 'Hà Nội', 'Nông dân - Thợ mộc',
   'aaaa1111-0000-0000-0000-000000000001',
   'Cụ tổ khai sáng dòng họ. Rời Thanh Hóa lên Hà Nội lập nghiệp năm 22 tuổi. Nổi tiếng khéo tay, dạy nghề mộc cho cả làng.'),

  -- Đời 2
  ('a0000002-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Đức', 'Cụ Đức', 'MALE', '1850-06-10', '1920-12-15',
   'Hà Nội', 'Hà Nội', 'Thợ mộc - Làm bánh',
   'aaaa1111-0000-0000-0000-000000000002',
   'Con trai cả cụ Hùng. Kế thừa nghề mộc, sáng tạo công thức bánh chưng làng Đông Ngạc.'),
  ('a0000003-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Thị Mai', 'Cụ Mai', 'FEMALE', '1855-09-12', '1935-04-05',
   'Hà Nội', 'Hà Nội', 'Nội trợ',
   'aaaa1111-0000-0000-0000-000000000002',
   'Vợ cụ Đức, nổi tiếng khéo léo với các món chay và bánh truyền thống.'),
  ('a0000004-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Tài', 'Cụ Tài', 'MALE', '1858-02-20', '1930-11-08',
   'Hà Nội', 'Hà Nội', 'Nông dân',
   'aaaa1111-0000-0000-0000-000000000002',
   'Con trai thứ hai cụ Hùng, theo nghề nông trên quê hương.'),

  -- Đời 3
  ('a0000005-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Cương', 'Ông Cương', 'MALE', '1885-05-15', '1975-03-20',
   'Hà Nội', 'Hà Nội', 'Giáo viên - Nghệ nhân bánh',
   'aaaa1111-0000-0000-0000-000000000003',
   'Con trai cụ Đức. Tham gia kháng chiến chống Pháp. Giữ nghề làm bánh truyền thống.'),
  ('a0000006-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Thị Hạnh', 'Bà Hạnh', 'FEMALE', '1890-08-22', '1970-01-10',
   'Hà Nội', 'Hà Nội', 'Nội trợ',
   'aaaa1111-0000-0000-0000-000000000003',
   'Vợ ông Cương. Nổi tiếng với món giò lụa và chả lá lốt.'),
  ('a0000007-0000-0000-0000-000000000007','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Bình', 'Ông Bình', 'MALE', '1888-04-10', '1965-09-12',
   'Hà Nội', 'Hà Nội', 'Quan chức',
   'aaaa1111-0000-0000-0000-000000000003',
   'Con trai cụ Đức, làm quan dưới chính quyền cũ.'),
  ('a0000008-0000-0000-0000-000000000008','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Thắng', 'Ông Thắng', 'MALE', '1892-07-08', '1972-12-01',
   'Hà Nội', 'Hà Nội', 'Nông dân',
   'aaaa1111-0000-0000-0000-000000000003',
   'Con trai cụ Tài, tiếp quản ruộng đất gia đình.'),

  -- Đời 4
  ('a0000009-0000-0000-0000-000000000009','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn An', 'Bác An', 'MALE', '1955-09-05', NULL,
   'Hà Nội', 'Hà Nội', 'Kỹ sư xây dựng',
   'aaaa1111-0000-0000-0000-000000000004',
   'Con trai ông Cương. Tốt nghiệp Đại học Bách khoa. Hiện là trưởng họ.'),
  ('a0000010-0000-0000-0000-000000000010','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Thị Lan', 'Cô Lan', 'FEMALE', '1960-11-12', NULL,
   'Hà Nội', 'Hà Nội', 'Nội trợ - Đầu bếp gia đình',
   'aaaa1111-0000-0000-0000-000000000004',
   'Vợ bác An. Là người giữ lửa bếp gia đình, nổi tiếng với các món cổ truyền.'),
  ('a0000011-0000-0000-0000-000000000011','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Hùng (con)', 'Chú Hùng', 'MALE', '1958-04-20', NULL,
   'Hà Nội', 'TP. Hồ Chí Minh', 'Doanh nhân',
   'aaaa1111-0000-0000-0000-000000000004',
   'Em bác An, làm ăn tại Sài Gòn.'),
  ('a0000012-0000-0000-0000-000000000012','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Thị Hương', 'Cô Hương', 'FEMALE', '1963-08-18', NULL,
   'Hà Nội', 'Hà Nội', 'Bác sĩ',
   'aaaa1111-0000-0000-0000-000000000004',
   'Con gái ông Bình, làm bác sĩ tại bệnh viện Bạch Mai.'),

  -- Đời 5
  ('a0000013-0000-0000-0000-000000000013','aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'Nguyễn Thị Lan (con)', 'Lan', 'FEMALE', '1985-02-14', NULL,
   'Hà Nội', 'Hà Nội', 'Chuyên gia ẩm thực - Food blogger',
   'aaaa1111-0000-0000-0000-000000000005',
   'Con gái bác An và cô Lan. Tốt nghiệp Học viện Âm nhạc, sau chuyển hướng sang ẩm thực. Lập kênh chia sẻ công thức nấu ăn truyền thống.'),
  ('a0000014-0000-0000-0000-000000000014','aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'Nguyễn Minh', 'Minh', 'MALE', '1988-07-25', NULL,
   'Hà Nội', 'Hà Nội', 'Kỹ sư phần mềm',
   'aaaa1111-0000-0000-0000-000000000005',
   'Con trai bác An và cô Lan. Đam mê công nghệ, xây dựng nền tảng CâyGiaPhảSố.'),
  ('a0000015-0000-0000-0000-000000000015','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Khoa', 'Khoa', 'MALE', '1990-12-05', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Kiến trúc sư',
   'aaaa1111-0000-0000-0000-000000000005',
   'Con trai chú Hùng.'),
  ('a0000016-0000-0000-0000-000000000016','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Thị Mai (cháu)', 'Mai', 'FEMALE', '2015-06-20', NULL,
   'Hà Nội', 'Hà Nội', 'Học sinh',
   'aaaa1111-0000-0000-0000-000000000005',
   'Con gái Lan, đang học tiểu học.'),
  ('a0000017-0000-0000-0000-000000000017','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Minh Anh', 'Minh Anh', 'FEMALE', '2018-09-10', NULL,
   'Hà Nội', 'Hà Nội', 'Học sinh mầm non',
   'aaaa1111-0000-0000-0000-000000000005',
   'Con gái Minh, đang học mẫu giáo.'),
  ('a0000018-0000-0000-0000-000000000018','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Thị Yến', 'Dì Yến', 'FEMALE', '1968-03-22', NULL,
   'Hà Nội', 'Hà Nội', 'Giáo viên',
   'aaaa1111-0000-0000-0000-000000000004',
   'Em gái bác An, dạy cấp 3.'),
  ('a0000019-0000-0000-0000-000000000019','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Văn Nam', 'Nam', 'MALE', '1992-10-15', NULL,
   'Hà Nội', 'Úc', 'Du học sinh',
   'aaaa1111-0000-0000-0000-000000000005',
   'Con trai cô Hương, hiện du học tại Melbourne.'),
  ('a0000020-0000-0000-0000-000000000020','aaaaaaaa-0000-0000-0000-000000000001', NULL,
   'Nguyễn Thị Thu', 'Thu', 'FEMALE', '1995-05-30', NULL,
   'Hà Nội', 'Hà Nội', 'Kế toán',
   'aaaa1111-0000-0000-0000-000000000005',
   'Con gái dì Yến.');

-- ---------------------------------------------------------------------
-- 5. FAMILY MEMBERS - Họ Trần (15 members)
-- ---------------------------------------------------------------------

INSERT INTO family_members (id, family_id, user_id, full_name, nickname, gender, birth_date, death_date, birth_place, current_location, occupation, generation_id, biography) VALUES
  -- Đời 1
  ('b0000001-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Văn Hào', 'Cụ Hào', 'MALE', '1855-04-10', '1920-09-15',
   'Huế', 'Huế', 'Quan triều Nguyễn',
   'bbbb1111-0000-0000-0000-000000000001',
   'Cụ tổ họ Trần. Làm quan dưới triều Tự Đức, có công trấn thủ Bình Phú.'),
  ('b0000002-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Thị Ngọc', 'Cụ Ngọc', 'FEMALE', '1860-07-20', '1930-11-30',
   'Huế', 'Huế', 'Nội trợ',
   'bbbb1111-0000-0000-0000-000000000001',
   'Vợ cụ Hào, người dạy nấu ăn cung đình cho con cháu.'),

  -- Đời 2
  ('b0000003-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Văn Khánh', 'Ông Khánh', 'MALE', '1885-02-05', '1970-06-18',
   'Huế', 'Huế', 'Nghệ nhân thêu',
   'bbbb1111-0000-0000-0000-000000000002',
   'Con trai cụ Hào. Tham gia phong trào Duy Tân. Nổi tiếng với nghề thêu ren.'),
  ('b0000004-0000-0000-0000-000000000004','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Thị Lệ', 'Bà Lệ', 'FEMALE', '1890-09-25', '1975-12-08',
   'Huế', 'Huế', 'Nội trợ',
   'bbbb1111-0000-0000-0000-000000000002',
   'Vợ ông Khánh, người giữ bí quyết các món cung đình.'),
  ('b0000005-0000-0000-0000-000000000005','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Văn Phú', 'Ông Phú', 'MALE', '1888-03-12', '1968-08-25',
   'Huế', 'Huế', 'Giáo sư',
   'bbbb1111-0000-0000-0000-000000000002',
   'Con trai cụ Hào. Giáo sư trường Quốc Học Huế.'),

  -- Đời 3
  ('b0000006-0000-0000-0000-000000000006','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Văn Sơn', 'Ông Sơn', 'MALE', '1945-05-30', NULL,
   'Huế', 'Huế', 'Kỹ sư',
   'bbbb1111-0000-0000-0000-000000000003',
   'Con trai ông Khánh. Tốt nghiệp Đại học Bách khoa Đà Nẵng.'),
  ('b0000007-0000-0000-0000-000000000007','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Thị Hoa', 'Bà Hoa', 'FEMALE', '1948-08-15', NULL,
   'Huế', 'Huế', 'Giáo viên về hưu',
   'bbbb1111-0000-0000-0000-000000000003',
   'Vợ ông Sơn. Giáo viên tiểu học, sau về hưu là người kể chuyện chính của dòng họ.'),
  ('b0000008-0000-0000-0000-000000000008','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Văn Hải', 'Ông Hải', 'MALE', '1950-11-22', NULL,
   'Huế', 'Đà Nẵng', 'Bác sĩ',
   'bbbb1111-0000-0000-0000-000000000003',
   'Con trai ông Khánh. Bác sĩ tại Bệnh viện Đà Nẵng.'),
  ('b0000009-0000-0000-0000-000000000009','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Thị Hồng', 'Cô Hồng', 'FEMALE', '1952-04-18', NULL,
   'Huế', 'Huế', 'Đầu bếp nhà hàng',
   'bbbb1111-0000-0000-0000-000000000003',
   'Con gái ông Phú. Nổi tiếng với món bún bò Huế.'),

  -- Đời 4
  ('b0000010-0000-0000-0000-000000000010','bbbbbbbb-0000-0000-0000-000000000002', '44444444-4444-4444-4444-444444444444',
   'Trần Thị Hoa (con)', 'Hoa', 'FEMALE', '1975-06-08', NULL,
   'Huế', 'Huế', 'Giáo viên về hưu - Quản trị viên',
   'bbbb1111-0000-0000-0000-000000000004',
   'Con gái ông Sơn và bà Hoa. Hiện quản lý trang CâyGiaPhảSố của dòng họ Trần.'),
  ('b0000011-0000-0000-0000-000000000011','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Văn Thành', 'Thành', 'MALE', '1978-09-14', NULL,
   'Huế', 'TP. Hồ Chí Minh', 'Kỹ sư IT',
   'bbbb1111-0000-0000-0000-000000000004',
   'Con trai ông Sơn và bà Hoa. Làm việc tại TP.HCM.'),
  ('b0000012-0000-0000-0000-000000000012','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Thị Thu Hà', 'Hà', 'FEMALE', '1982-12-03', NULL,
   'Đà Nẵng', 'Hà Nội', 'Bác sĩ nội khoa',
   'bbbb1111-0000-0000-0000-000000000004',
   'Con gái ông Hải. Bác sĩ Bệnh viện Bạch Mai.'),
  ('b0000013-0000-0000-0000-000000000013','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Văn Minh', 'Minh', 'MALE', '1985-03-27', NULL,
   'Huế', 'Úc', 'Đầu bếp chuyên nghiệp',
   'bbbb1111-0000-0000-0000-000000000004',
   'Con trai cô Hồng. Hiện mở nhà hàng Việt tại Sydney.'),
  ('b0000014-0000-0000-0000-000000000014','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Thị Linh', 'Linh', 'FEMALE', '2010-08-15', NULL,
   'Huế', 'Huế', 'Học sinh THPT',
   'bbbb1111-0000-0000-0000-000000000004',
   'Con gái Hoa, đang học lớp 10.'),
  ('b0000015-0000-0000-0000-000000000015','bbbbbbbb-0000-0000-0000-000000000002', NULL,
   'Trần Văn Bảo', 'Bảo', 'MALE', '2013-05-22', NULL,
   'Huế', 'Huế', 'Học sinh THCS',
   'bbbb1111-0000-0000-0000-000000000004',
   'Con trai Hoa, đang học lớp 7.');

-- ---------------------------------------------------------------------
-- 6. FAMILY MEMBERS - Họ Lê (10 members)
-- ---------------------------------------------------------------------

INSERT INTO family_members (id, family_id, user_id, full_name, nickname, gender, birth_date, death_date, birth_place, current_location, occupation, generation_id, biography) VALUES
  -- Đời 1
  ('c0000001-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Văn Hòa', 'Ông Hòa', 'MALE', '1940-05-10', '2020-08-15',
   'Cần Thơ', 'TP. Hồ Chí Minh', 'Bác sĩ',
   'cccc1111-0000-0000-0000-000000000001',
   'Bác sĩ nội khoa. Từ Cần Thơ lên Sài Gòn lập phòng khám năm 1965.'),
  ('c0000002-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Thị Tươi', 'Bà Tươi', 'FEMALE', '1945-09-18', NULL,
   'Cần Thơ', 'TP. Hồ Chí Minh', 'Nội trợ - Đầu bếp',
   'cccc1111-0000-0000-0000-000000000001',
   'Vợ ông Hòa, người giữ bí quyết nấu ăn miền Tây.'),

  -- Đời 2
  ('c0000003-0000-0000-0000-000000000003','cccccccc-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555',
   'Lê Văn Tuấn', 'Tuấn', 'MALE', '1970-04-22', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Bác sĩ nội khoa',
   'cccc1111-0000-0000-0000-000000000002',
   'Con trai trưởng ông Hòa. Kế thừa phòng khám gia đình.'),
  ('c0000004-0000-0000-0000-000000000004','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Thị Hà', 'Hà', 'FEMALE', '1972-11-30', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Dược sĩ',
   'cccc1111-0000-0000-0000-000000000002',
   'Con gái ông Hòa. Dược sĩ tại nhà thuốc gia đình.'),
  ('c0000005-0000-0000-0000-000000000005','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Văn Hùng', 'Hùng', 'MALE', '1975-07-08', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Đầu bếp',
   'cccc1111-0000-0000-0000-000000000002',
   'Con trai thứ hai ông Hòa. Mở nhà hàng "Miền Tây quê hương".'),
  ('c0000006-0000-0000-0000-000000000006','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Thị Ngọc', 'Ngọc', 'FEMALE', '1978-02-14', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Y tá',
   'cccc1111-0000-0000-0000-000000000002',
   'Con gái thứ hai ông Hòa. Y tá trưởng tại bệnh viện Chợ Rẫy.'),

  -- Đời 3
  ('c0000007-0000-0000-0000-000000000007','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Văn Khoa', 'Khoa', 'MALE', '2000-06-12', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Sinh viên Y khoa',
   'cccc1111-0000-0000-0000-000000000003',
   'Con trai Tuấn, đang học năm 4 Đại học Y khoa.'),
  ('c0000008-0000-0000-0000-000000000008','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Thị Thư', 'Thư', 'FEMALE', '2002-09-25', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Sinh viên',
   'cccc1111-0000-0000-0000-000000000003',
   'Con gái Tuấn, đang học Đại học Ngoại thương.'),
  ('c0000009-0000-0000-0000-000000000009','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Văn Bảo', 'Bảo', 'MALE', '2005-12-08', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Học sinh THPT',
   'cccc1111-0000-0000-0000-000000000003',
   'Con trai Hùng.'),
  ('c0000010-0000-0000-0000-000000000010','cccccccc-0000-0000-0000-000000000003', NULL,
   'Lê Thị Vy', 'Vy', 'FEMALE', '2008-03-19', NULL,
   'TP. Hồ Chí Minh', 'TP. Hồ Chí Minh', 'Học sinh THCS',
   'cccc1111-0000-0000-0000-000000000003',
   'Con gái Ngọc.');

-- ---------------------------------------------------------------------
-- Update member_count on families
-- ---------------------------------------------------------------------
UPDATE families SET member_count = 20 WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
UPDATE families SET member_count = 15 WHERE id = 'bbbbbbbb-0000-0000-0000-000000000002';
UPDATE families SET member_count = 10 WHERE id = 'cccccccc-0000-0000-0000-000000000003';

-- ---------------------------------------------------------------------
-- 7. RELATIONSHIPS
-- ---------------------------------------------------------------------

-- Họ Nguyễn: SPOUSE pairs
INSERT INTO relationships (family_id, from_member_id, to_member_id, relationship_type, start_date, notes) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002','a0000003-0000-0000-0000-000000000003','SPOUSE','1875-01-15','Cụ Đức và cụ Mai - đôi vợ chồng mẫu mực'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000003-0000-0000-0000-000000000003','a0000002-0000-0000-0000-000000000002','SPOUSE','1875-01-15',NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005','a0000006-0000-0000-0000-000000000006','SPOUSE','1910-05-20','Ông Cương và bà Hạnh'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000006-0000-0000-0000-000000000006','a0000005-0000-0000-0000-000000000005','SPOUSE','1910-05-20',NULL),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000009-0000-0000-0000-000000000009','a0000010-0000-0000-0000-000000000010','SPOUSE','1982-11-12','Bác An và cô Lan'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000010-0000-0000-0000-000000000010','a0000009-0000-0000-0000-000000000009','SPOUSE','1982-11-12',NULL);

-- Họ Nguyễn: PARENT-CHILD
INSERT INTO relationships (family_id, from_member_id, to_member_id, relationship_type, notes) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002','PARENT','Cụ Hùng là cha cụ Đức'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001','a0000004-0000-0000-0000-000000000004','PARENT','Cụ Hùng là cha cụ Tài'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002','a0000005-0000-0000-0000-000000000005','PARENT','Cụ Đức là cha ông Cương'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002','a0000007-0000-0000-0000-000000000007','PARENT','Cụ Đức là cha ông Bình'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000004-0000-0000-0000-000000000004','a0000008-0000-0000-0000-000000000008','PARENT','Cụ Tài là cha ông Thắng'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005','a0000009-0000-0000-0000-000000000009','PARENT','Ông Cương là cha bác An'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005','a0000011-0000-0000-0000-000000000011','PARENT','Ông Cương là cha chú Hùng'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005','a0000018-0000-0000-0000-000000000018','PARENT','Ông Cương là cha dì Yến'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000007-0000-0000-0000-000000000007','a0000012-0000-0000-0000-000000000012','PARENT','Ông Bình là cha cô Hương'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000009-0000-0000-0000-000000000009','a0000013-0000-0000-0000-000000000013','PARENT','Bác An là cha Lan'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000009-0000-0000-0000-000000000009','a0000014-0000-0000-0000-000000000014','PARENT','Bác An là cha Minh'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000011-0000-0000-0000-000000000011','a0000015-0000-0000-0000-000000000015','PARENT','Chú Hùng là cha Khoa'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000013-0000-0000-0000-000000000013','a0000016-0000-0000-0000-000000000016','PARENT','Lan là mẹ của Mai'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000014-0000-0000-0000-000000000014','a0000017-0000-0000-0000-000000000017','PARENT','Minh là cha của Minh Anh'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000018-0000-0000-0000-000000000018','a0000020-0000-0000-0000-000000000020','PARENT','Dì Yến là mẹ của Thu'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000012-0000-0000-0000-000000000012','a0000019-0000-0000-0000-000000000019','PARENT','Cô Hương là mẹ của Nam');

-- SIBLING links (đơn giản hóa)
INSERT INTO relationships (family_id, from_member_id, to_member_id, relationship_type, notes) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002','a0000004-0000-0000-0000-000000000004','SIBLING','Cụ Đức và cụ Tài là anh em'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005','a0000007-0000-0000-0000-000000000007','SIBLING','Ông Cương và ông Bình là anh em'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000009-0000-0000-0000-000000000009','a0000011-0000-0000-0000-000000000011','SIBLING','Bác An và chú Hùng là anh em'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000009-0000-0000-0000-000000000009','a0000018-0000-0000-0000-000000000018','SIBLING','Bác An và dì Yến là anh em'),
  ('aaaaaaaa-0000-0000-0000-000000000001','a0000013-0000-0000-0000-000000000013','a0000014-0000-0000-0000-000000000014','SIBLING','Lan và Minh là chị em');

-- Họ Trần: SPOUSE
INSERT INTO relationships (family_id, from_member_id, to_member_id, relationship_type, start_date) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000001','b0000002-0000-0000-0000-000000000002','SPOUSE','1880-02-15'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000002-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000001','SPOUSE','1880-02-15'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000003-0000-0000-0000-000000000003','b0000004-0000-0000-0000-000000000004','SPOUSE','1912-09-20'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000004-0000-0000-0000-000000000004','b0000003-0000-0000-0000-000000000003','SPOUSE','1912-09-20'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000006-0000-0000-0000-000000000006','b0000007-0000-0000-0000-000000000007','SPOUSE','1972-12-10'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000007-0000-0000-0000-000000000007','b0000006-0000-0000-0000-000000000006','SPOUSE','1972-12-10');

-- Họ Trần: PARENT-CHILD
INSERT INTO relationships (family_id, from_member_id, to_member_id, relationship_type) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000001','b0000003-0000-0000-0000-000000000003','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000001','b0000005-0000-0000-0000-000000000005','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000003-0000-0000-0000-000000000003','b0000006-0000-0000-0000-000000000006','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000003-0000-0000-0000-000000000003','b0000008-0000-0000-0000-000000000008','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000005-0000-0000-0000-000000000005','b0000009-0000-0000-0000-000000000009','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000006-0000-0000-0000-000000000006','b0000010-0000-0000-0000-000000000010','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000006-0000-0000-0000-000000000006','b0000011-0000-0000-0000-000000000011','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000008-0000-0000-0000-000000000008','b0000012-0000-0000-0000-000000000012','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000009-0000-0000-0000-000000000009','b0000013-0000-0000-0000-000000000013','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000010-0000-0000-0000-000000000010','b0000014-0000-0000-0000-000000000014','PARENT'),
  ('bbbbbbbb-0000-0000-0000-000000000002','b0000010-0000-0000-0000-000000000010','b0000015-0000-0000-0000-000000000015','PARENT');

-- Họ Lê: SPOUSE
INSERT INTO relationships (family_id, from_member_id, to_member_id, relationship_type, start_date) VALUES
  ('cccccccc-0000-0000-0000-000000000003','c0000001-0000-0000-0000-000000000001','c0000002-0000-0000-0000-000000000002','SPOUSE','1968-09-20'),
  ('cccccccc-0000-0000-0000-000000000003','c0000002-0000-0000-0000-000000000002','c0000001-0000-0000-0000-000000000001','SPOUSE','1968-09-20');

-- Họ Lê: PARENT-CHILD
INSERT INTO relationships (family_id, from_member_id, to_member_id, relationship_type) VALUES
  ('cccccccc-0000-0000-0000-000000000003','c0000001-0000-0000-0000-000000000001','c0000003-0000-0000-0000-000000000003','PARENT'),
  ('cccccccc-0000-0000-0000-000000000003','c0000001-0000-0000-0000-000000000001','c0000004-0000-0000-0000-000000000004','PARENT'),
  ('cccccccc-0000-0000-0000-000000000003','c0000001-0000-0000-0000-000000000001','c0000005-0000-0000-0000-000000000005','PARENT'),
  ('cccccccc-0000-0000-0000-000000000003','c0000001-0000-0000-0000-000000000001','c0000006-0000-0000-0000-000000000006','PARENT'),
  ('cccccccc-0000-0000-0000-000000000003','c0000003-0000-0000-0000-000000000003','c0000007-0000-0000-0000-000000000007','PARENT'),
  ('cccccccc-0000-0000-0000-000000000003','c0000003-0000-0000-0000-000000000003','c0000008-0000-0000-0000-000000000008','PARENT'),
  ('cccccccc-0000-0000-0000-000000000003','c0000005-0000-0000-0000-000000000005','c0000009-0000-0000-0000-000000000009','PARENT'),
  ('cccccccc-0000-0000-0000-000000000003','c0000006-0000-0000-0000-000000000006','c0000010-0000-0000-0000-000000000010','PARENT');

-- ---------------------------------------------------------------------
-- 8. RECIPES (5-10 per family, with genealogy)
-- ---------------------------------------------------------------------

INSERT INTO recipes (id, family_id, author_id, title, description, story, cuisine_type, difficulty, prep_time_minutes, cook_time_minutes, servings, instructions, image_url, is_public, view_count) VALUES
  -- Họ Nguyễn
  ('aaaa2222-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Bánh chưng làng Đông Ngạc',
   'Bánh chưng truyền thống của dòng họ Nguyễn với công thức 5 đời',
   'Công thức này được cụ Đức sáng tạo năm 1880, truyền qua 5 đời. Bánh có vị đậm đà, màu xanh tự nhiên từ lá dong.',
   'Miền Bắc', 'HARD', 240, 720, 8,
   'Ngâm gạo nếp qua đêm. Gói bánh bằng lá dong rửa sạch. Luộc liên tục 12 tiếng với lửa nhỏ.',
   'https://example.com/banh-chung.jpg', TRUE, 1520),

  ('aaaa2222-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Giò lụa gia truyền',
   'Giò lụa dai ngon, công thức của bà Hạnh đời thứ 3',
   'Bà Hạnh nổi tiếng cả làng với món giò lụa thơm ngon. Bí quyết là chọn thịt heo tươi và giã bằng cối đá.',
   'Miền Bắc', 'MEDIUM', 60, 90, 10,
   'Chọn thịt nạc mông heo tươi. Giã nhuyễn với gia vị truyền thống. Gói lá chuối và luộc 90 phút.',
   'https://example.com/gio-lua.jpg', TRUE, 890),

  ('aaaa2222-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Chả lá lốt thơm nức',
   'Món chả lá lốt cuốn hè, gắn liền với ký ức tuổi thơ của các thế hệ',
   'Mỗi mùa hè về, bà Hạnh lại cuốn chả lá lốt cho các cháu. Mùi thơm của lá lốt và thịt nướng là ký ức không thể quên.',
   'Miền Bắc', 'EASY', 30, 20, 4,
   'Ướp thịt với hành, tỏi, nước mắm. Cuốn trong lá lốt tươi, nướng trên than hoa.',
   'https://example.com/cha-la-lot.jpg', TRUE, 1245),

  ('aaaa2222-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Canh măng mực ngày Tết',
   'Canh măng mực - món không thể thiếu trong mâm cỗ Tết của họ Nguyễn',
   'Món canh truyền thống mỗi dịp Tết đến. Măng khô ngọt, mực tươi và hương vị của quê hương.',
   'Miền Bắc', 'MEDIUM', 45, 60, 6,
   'Măng khô ngâm nước ấm qua đêm. Mực làm sạch, xào với hành. Ninh măng và mực 1 tiếng.',
   'https://example.com/canh-mang.jpg', FALSE, 450),

  ('aaaa2222-0000-0000-0000-000000000005','aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Xôi gấc đỏ may mắn',
   'Xôi gấc đỏ cho ngày lễ cưới và Tết',
   'Xôi gấc tượng trưng cho may mắn. Màu đỏ của gấc và vị dẻo của nếp là biểu tượng cho sự sung túc.',
   'Miền Bắc', 'EASY', 30, 45, 8,
   'Trộn gạo nếp với thịt gấc. Đồ xôi 45 phút cho đến khi dẻo và có màu đỏ đẹp.',
   'https://example.com/xoi-gac.jpg', TRUE, 678),

  ('aaaa2222-0000-0000-0000-000000000006','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Nem rán ngày Tết',
   'Nem rán vàng giòn, món ăn không thể thiếu mỗi dịp Tết',
   'Nem rán là món ăn gắn liền với tuổi thơ mỗi người con họ Nguyễn.',
   'Miền Bắc', 'MEDIUM', 60, 30, 20,
   'Trộn nhân thịt, mộc nhĩ, miến, trứng. Gói trong bánh đa nem và rán vàng.',
   'https://example.com/nem-ran.jpg', TRUE, 980),

  -- Họ Trần
  ('bbbb2222-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Bún bò Huế cung đình',
   'Bún bò Huế theo công thức cung đình của cụ Ngọc',
   'Cụ Ngọc đã dạy công thức này cho con cháu. Hương vị cung đình Huế xưa với ruốc đặc biệt.',
   'Miền Trung', 'HARD', 120, 240, 8,
   'Ninh xương bò 4 tiếng với ruốc Huế. Nêm nếm với mắm ruốc và sả. Ăn kèm bún, chả cua, thịt bò.',
   'https://example.com/bun-bo-hue.jpg', TRUE, 2340),

  ('bbbb2222-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Cơm hến Huế',
   'Cơm hến - món ăn dân dã mà đậm đà hương vị xứ Huế',
   'Món ăn yêu thích của cả gia đình trong những chuyến về quê.',
   'Miền Trung', 'MEDIUM', 60, 30, 4,
   'Hến luộc, lấy thịt. Xào hến với gia vị. Trộn với cơm nguội, rau sống và nước mắm ớt.',
   'https://example.com/com-hen.jpg', FALSE, 567),

  ('bbbb2222-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Nem lụi Huế',
   'Nem lụi nướng cuốn bánh tráng',
   'Nem lụi là đặc sản Huế với công thức của dì Lệ.',
   'Miền Trung', 'MEDIUM', 45, 20, 6,
   'Giã thịt heo với mắm ruốc và gia vị. Nướng trên than và cuốn bánh tráng với rau sống.',
   'https://example.com/nem-lui.jpg', TRUE, 789),

  ('bbbb2222-0000-0000-0000-000000000004','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Chè bắp nóng',
   'Chè bắp ngọt thanh, món ăn vặt tuổi thơ',
   'Bà Lệ thường nấu chè bắp cho các cháu mỗi chiều.',
   'Miền Trung', 'EASY', 20, 30, 4,
   'Nấu bắp non với nước, đường và một chút muối. Thêm nước cốt dừa khi chín.',
   'https://example.com/che-bap.jpg', FALSE, 234),

  ('bbbb2222-0000-0000-0000-000000000005','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Bánh nậm Huế',
   'Bánh nậm - món ăn thanh tao của xứ Huế',
   'Bánh nậm là món không thể thiếu trong mâm cỗ Huế.',
   'Miền Trung', 'MEDIUM', 60, 45, 8,
   'Làm bột từ bột gạo. Gói nhân tôm thịt trong lá chuối. Hấp 45 phút.',
   'https://example.com/banh-nam.jpg', TRUE, 456),

  -- Họ Lê
  ('cccc2222-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Cá kho tộ miền Tây',
   'Cá kho tộ đậm đà, đặc sản miền Tây của bà Tươi',
   'Bà Tươi từ Cần Thơ mang công thức cá kho tộ gia truyền lên Sài Gòn.',
   'Miền Nam', 'MEDIUM', 30, 90, 4,
   'Cá lóc làm sạch, kho với nước mắm, đường, nước dừa. Kho lửa nhỏ 90 phút cho đến khi sệt.',
   'https://example.com/ca-kho-to.jpg', TRUE, 1456),

  ('cccc2222-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Canh chua cá lóc',
   'Canh chua miền Tây với cá lóc, bạc hà, đọt xanh',
   'Canh chua là món ăn hàng ngày của gia đình họ Lê.',
   'Miền Nam', 'EASY', 20, 30, 4,
   'Nấu nước sôi với me chua. Cho cá lóc, bạc hà, đọt xang vào. Nêm nếm vừa ăn.',
   'https://example.com/canh-chua.jpg', TRUE, 890),

  ('cccc2222-0000-0000-0000-000000000003','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Bánh xèo miền Tây',
   'Bánh xèo giòn rụm với nhân tôm thịt',
   'Bánh xèo cuối tuần là truyền thống của gia đình họ Lê.',
   'Miền Nam', 'MEDIUM', 30, 30, 4,
   'Pha bột bánh xèo với nước cốt dừa. Đổ bánh trên chảo nóng với tôm, thịt, giá đỗ.',
   'https://example.com/banh-xeo.jpg', TRUE, 1123),

  ('cccc2222-0000-0000-0000-000000000004','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Lẩu mắm miền Tây',
   'Lẩu mắm đậm đà hương vị miền Tây',
   'Món lẩu đặc trưng của quê hương bà Tươi.',
   'Miền Nam', 'HARD', 60, 120, 6,
   'Nấu mắm cá linh với nước, cho thêm thịt ba chỉ, tôm, mực. Ăn kèm rau đắng, bông súng.',
   'https://example.com/lau-mam.jpg', FALSE, 567),

  ('cccc2222-0000-0000-0000-000000000005','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Chuối nếp nướng',
   'Chuối nếp nướng - món tráng miệng truyền thống',
   'Chuối nếp nướng là món ăn vặt yêu thích của tuổi thơ.',
   'Miền Nam', 'EASY', 30, 30, 4,
   'Gói chuối trong nếp, gói lá chuối, nướng trên than hoa 30 phút. Dùng với nước cốt dừa.',
   'https://example.com/chuoi-nep.jpg', TRUE, 789);

-- ---------------------------------------------------------------------
-- 9. RECIPE INGREDIENTS (subset - representative)
-- ---------------------------------------------------------------------

INSERT INTO recipe_ingredients (recipe_id, name, quantity, unit, order_index) VALUES
  ('aaaa2222-0000-0000-0000-000000000001','Gạo nếp', 2, 'kg', 1),
  ('aaaa2222-0000-0000-0000-000000000001','Đỗ xanh', 0.5, 'kg', 2),
  ('aaaa2222-0000-0000-0000-000000000001','Thịt heo ba chỉ', 0.7, 'kg', 3),
  ('aaaa2222-0000-0000-0000-000000000001','Lá dong', 30, 'lá', 4),
  ('aaaa2222-0000-0000-0000-000000000001','Muối', 30, 'g', 5),
  ('aaaa2222-0000-0000-0000-000000000002','Thịt heo nạc mông', 1, 'kg', 1),
  ('aaaa2222-0000-0000-0000-000000000002','Nước mắm', 30, 'ml', 2),
  ('aaaa2222-0000-0000-0000-000000000002','Hành tím', 5, 'củ', 3),
  ('aaaa2222-0000-0000-0000-000000000002','Tiêu', 5, 'g', 4),
  ('aaaa2222-0000-0000-0000-000000000003','Thịt heo xay', 500, 'g', 1),
  ('aaaa2222-0000-0000-0000-000000000003','Lá lốt', 30, 'lá', 2),
  ('aaaa2222-0000-0000-0000-000000000003','Hành lá', 50, 'g', 3),
  ('bbbb2222-0000-0000-0000-000000000001','Xương bò', 2, 'kg', 1),
  ('bbbb2222-0000-0000-0000-000000000001','Mắm ruốc Huế', 50, 'g', 2),
  ('bbbb2222-0000-0000-0000-000000000001','Sả', 5, 'cây', 3),
  ('bbbb2222-0000-0000-0000-000000000001','Bún tươi', 1, 'kg', 4),
  ('cccc2222-0000-0000-0000-000000000001','Cá lóc', 1, 'con', 1),
  ('cccc2222-0000-0000-0000-000000000001','Nước mắm', 60, 'ml', 2),
  ('cccc2222-0000-0000-0000-000000000001','Đường', 50, 'g', 3),
  ('cccc2222-0000-0000-0000-000000000001','Nước dừa', 500, 'ml', 4);

-- ---------------------------------------------------------------------
-- 10. RECIPE STEPS
-- ---------------------------------------------------------------------

INSERT INTO recipe_steps (recipe_id, step_number, instruction, duration_minutes) VALUES
  ('aaaa2222-0000-0000-0000-000000000001', 1, 'Ngâm gạo nếp với nước lã qua đêm, sau đó xả sạch và để ráo.', 480),
  ('aaaa2222-0000-0000-0000-000000000001', 2, 'Đỗ xanh ngâm 4 tiếng, hấp chín và nghiền nhuyễn.', 240),
  ('aaaa2222-0000-0000-0000-000000000001', 3, 'Thịt heo thái miếng, ướp tiêu, muối, hành tím trong 30 phút.', 30),
  ('aaaa2222-0000-0000-0000-000000000001', 4, 'Gói bánh: lót lá dong, cho 1 lớp nếp, lớp đỗ, miếng thịt, lớp đỗ, nếp. Gói vuông 4 cạnh.', 60),
  ('aaaa2222-0000-0000-0000-000000000001', 5, 'Luộc bánh trong nồi lớn 12 tiếng với lửa nhỏ đều. Khi chín, ép ráo nước.', 720),
  ('bbbb2222-0000-0000-0000-000000000001', 1, 'Rửa xương bò, chần qua nước sôi để loại bỏ tạp chất.', 15),
  ('bbbb2222-0000-0000-0000-000000000001', 2, 'Ninh xương bò với nước lạnh trong 4 tiếng với sả đập dập.', 240),
  ('bbbb2222-0000-0000-0000-000000000001', 3, 'Pha mắm ruốc với nước ấm, lọc bỏ cặn. Cho vào nồi nước dùng.', 10),
  ('bbbb2222-0000-0000-0000-000000000001', 4, 'Nêm nếm với đường, muối, nước mắm cho vừa ăn.', 5),
  ('cccc2222-0000-0000-0000-000000000001', 1, 'Cá lóc làm sạch, cắt khúc, để ráo.', 10),
  ('cccc2222-0000-0000-0000-000000000001', 2, 'Ướp cá với nước mắm, đường, tiêu trong 30 phút.', 30),
  ('cccc2222-0000-0000-0000-000000000001', 3, 'Xếp cá vào tộ, cho nước dừa và nước mắm.', 5),
  ('cccc2222-0000-0000-0000-000000000001', 4, 'Kho lửa nhỏ 90 phút cho đến khi nước sệt, thịt cá mềm.', 90);

-- ---------------------------------------------------------------------
-- 11. RECIPE ORIGINS (genealogy of recipes)
-- ---------------------------------------------------------------------

INSERT INTO recipe_origins (recipe_id, from_member_id, to_member_id, year_transmitted, generation_gap, story) VALUES
  -- Bánh chưng: Cụ Đức → Ông Cương → Cô Lan → Lan (cháu)
  ('aaaa2222-0000-0000-0000-000000000001','a0000002-0000-0000-0000-000000000002','a0000005-0000-0000-0000-000000000005', 1910, 1,
   'Cụ Đức truyền nghề bánh chưng cho ông Cương trước khi mất. Công thức được viết vào sổ gia đình.'),
  ('aaaa2222-0000-0000-0000-000000000001','a0000005-0000-0000-0000-000000000005','a0000010-0000-0000-0000-000000000010', 1985, 1,
   'Ông Cương truyền cho con dâu Lan. Cô Lan đã gìn giữ và hoàn thiện công thức thêm.'),
  ('aaaa2222-0000-0000-0000-000000000001','a0000010-0000-0000-0000-000000000010','a0000013-0000-0000-0000-000000000013', 2015, 1,
   'Cô Lan truyền cho cháu dâu (Lan cháu) - con gái bác An. Bây giờ Lan cháu là người giữ công thức.'),

  -- Giò lụa: Bà Hạnh → Cô Lan → Lan
  ('aaaa2222-0000-0000-0000-000000000002','a0000006-0000-0000-0000-000000000006','a0000010-0000-0000-0000-000000000010', 1985, 1,
   'Bà Hạnh dạy con dâu Lan cách giã giò thủ công bằng cối đá.'),
  ('aaaa2222-0000-0000-0000-000000000002','a0000010-0000-0000-0000-000000000010','a0000013-0000-0000-0000-000000000013', 2018, 1,
   'Cô Lan dạy Lan cháu khi cháu 18 tuổi, mở đầu hành trình ẩm thực cho cháu.'),

  -- Chả lá lốt: Bà Hạnh → Cô Lan → Lan
  ('aaaa2222-0000-0000-0000-000000000003','a0000006-0000-0000-0000-000000000006','a0000010-0000-0000-0000-000000000010', 1986, 1,
   'Bà Hạnh truyền công thức chả lá lốt cho con dâu vào mùa hè năm 1986.'),

  -- Bún bò Huế: Cụ Ngọc → Bà Lệ → Cô Hồng → Trần Văn Minh
  ('bbbb2222-0000-0000-0000-000000000001','b0000002-0000-0000-0000-000000000002','b0000004-0000-0000-0000-000000000004', 1915, 1,
   'Cụ Ngọc dạy con dâu Lệ cách pha mắm ruốc và nêm nếm để có vị cung đình.'),
  ('bbbb2222-0000-0000-0000-000000000001','b0000004-0000-0000-0000-000000000004','b0000009-0000-0000-0000-000000000009', 1975, 1,
   'Bà Lệ truyền cho con gái Hồng trước khi về già.'),
  ('bbbb2222-0000-0000-0000-000000000001','b0000009-0000-0000-0000-000000000009','b0000013-0000-0000-0000-000000000013', 2010, 1,
   'Cô Hồng dạy con trai Minh mở nhà hàng tại Sydney, giữ hương vị Huế.'),

  -- Cá kho tộ: Bà Tươi → Tuấn → Hùng
  ('cccc2222-0000-0000-0000-000000000001','c0000002-0000-0000-0000-000000000002','c0000003-0000-0000-0000-000000000003', 1995, 1,
   'Bà Tươi dạy con trai Tuấn cách kho cá với nước dừa và lửa nhỏ.'),
  ('cccc2222-0000-0000-0000-000000000001','c0000002-0000-0000-0000-000000000002','c0000005-0000-0000-0000-000000000005', 2000, 1,
   'Bà Tươi truyền cho Hùng trước khi mở nhà hàng. Hùng trở thành đầu bếp chuyên nghiệp.');

-- ---------------------------------------------------------------------
-- 12. RECIPE REACTIONS & COMMENTS
-- ---------------------------------------------------------------------

INSERT INTO recipe_reactions (recipe_id, user_id, reaction_type) VALUES
  ('aaaa2222-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','LOVE'),
  ('aaaa2222-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','YUM'),
  ('aaaa2222-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555','LIKE'),
  ('bbbb2222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','LOVE'),
  ('bbbb2222-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','YUM'),
  ('cccc2222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','LOVE'),
  ('cccc2222-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','WANT_TO_TRY');

INSERT INTO recipe_comments (recipe_id, user_id, content) VALUES
  ('aaaa2222-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Bánh chưng năm nay mình làm theo công thức này, ngon tuyệt vời! Cảm ơn bác An đã chia sẻ.'),
  ('bbbb2222-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Bún bò Huế của bác Hoa nấu rất đúng vị Huế. Mình đã thử và thành công.'),
  ('cccc2222-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',
   'Cá kho tộ ngon quá! Mình sẽ thử cuối tuần này.'),
  ('aaaa2222-0000-0000-0000-000000000002','33333333-3333-3333-3333-333333333333',
   'Giò lụa dai ngon, mình ăn thử rồi. Công thức chuẩn!');

-- Reply example
INSERT INTO recipe_comments (recipe_id, user_id, content, parent_comment_id)
SELECT 'aaaa2222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
       'Cảm ơn cháu Lan! Bác cũng tự hào về công thức này.',
       id FROM recipe_comments WHERE recipe_id = 'aaaa2222-0000-0000-0000-000000000001' LIMIT 1;

-- ---------------------------------------------------------------------
-- 13. STORIES
-- ---------------------------------------------------------------------

INSERT INTO stories (id, family_id, author_id, title, content, story_date, story_location, related_member_ids, related_generation_id, is_featured, view_count) VALUES
  ('aaaa3333-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Hồi tưởng về cụ tổ Nguyễn Văn Hùng',
   'Ngày ấy, cụ tổ Hùng từ Thanh Hóa lên Hà Nội lập nghiệp, mang theo một gói gạo nếp và bộ đồ nghề mộc. Cụ đã dựng nên cả một làng nghề...',
   '1870-05-10', 'Làng Đông Ngạc, Từ Liêm',
   ARRAY['a0000001-0000-0000-0000-000000000001'::uuid, 'a0000002-0000-0000-0000-000000000002'::uuid],
   'aaaa1111-0000-0000-0000-000000000001', TRUE, 1245),

  ('aaaa3333-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Bí quyết bánh chưng 5 đời',
   'Bánh chưng làng Đông Ngạc nổi tiếng khắp vùng, nhưng ít ai biết rằng đó là sự kết tinh từ công thức của cụ Đức...',
   '1880-12-30', 'Hà Nội',
   ARRAY['a0000002-0000-0000-0000-000000000002'::uuid, 'a0000005-0000-0000-0000-000000000005'::uuid, 'a0000010-0000-0000-0000-000000000010'::uuid],
   'aaaa1111-0000-0000-0000-000000000002', TRUE, 2890),

  ('aaaa3333-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Mùa hè của bà Hạnh',
   'Mỗi mùa hè về, bà Hạnh lại gọi các cháu về và cuốn chả lá lốt cho cả nhà. Mùi thơm ấy đã trở thành ký ức không thể quên...',
   '1960-07-15', 'Hà Nội',
   ARRAY['a0000006-0000-0000-0000-000000000006'::uuid, 'a0000010-0000-0000-0000-000000000010'::uuid],
   'aaaa1111-0000-0000-0000-000000000003', FALSE, 678),

  ('aaaa3333-0000-0000-0000-000000000004','aaaaaaaa-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',
   'Xây dựng CâyGiaPhảSố - hành trình của thế hệ 5',
   'Là thế hệ công nghệ, chúng tôi muốn xây dựng một nền tảng để giữ gìn di sản dòng họ. Từ ý tưởng đến hiện thực...',
   '2024-03-20', 'Hà Nội',
   ARRAY['a0000013-0000-0000-0000-000000000013'::uuid, 'a0000014-0000-0000-0000-000000000014'::uuid],
   'aaaa1111-0000-0000-0000-000000000005', FALSE, 345),

  -- Họ Trần
  ('bbbb3333-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Ông nội và phong trào Duy Tân',
   'Ông nội tôi - Trần Văn Khánh - tham gia phong trào Duy Tân đầu thế kỷ 20. Ông là người yêu nước, thương dân...',
   '1906-04-10', 'Huế',
   ARRAY['b0000003-0000-0000-0000-000000000003'::uuid],
   'bbbb1111-0000-0000-0000-000000000002', TRUE, 1567),

  ('bbbb3333-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Mâm cỗ Tết của bà Lệ',
   'Mỗi dịp Tết, bà Lệ lại chuẩn bị mâm cỗ với hàng chục món. Bà dạy các cháu nấu ăn từ năm 8 tuổi...',
   '1970-01-25', 'Huế',
   ARRAY['b0000004-0000-0000-0000-000000000004'::uuid, 'b0000009-0000-0000-0000-000000000009'::uuid],
   'bbbb1111-0000-0000-0000-000000000003', FALSE, 890),

  ('bbbb3333-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Minh mở nhà hàng tại Sydney',
   'Hành trình từ một cậu bé Huế đến chủ nhà hàng tại Úc. Câu chuyện về hương vị quê hương nơi xa xứ...',
   '2018-05-20', 'Sydney, Úc',
   ARRAY['b0000013-0000-0000-0000-000000000013'::uuid],
   'bbbb1111-0000-0000-0000-000000000004', FALSE, 456),

  -- Họ Lê
  ('cccc3333-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Ông Hòa - người thầy thuốc của làng',
   'Ông nội tôi là bác sĩ nội khoa đầu tiên của vùng. Ông khám bệnh miễn phí cho người nghèo...',
   '1975-08-15', 'TP. Hồ Chí Minh',
   ARRAY['c0000001-0000-0000-0000-000000000001'::uuid, 'c0000002-0000-0000-0000-000000000002'::uuid],
   'cccc1111-0000-0000-0000-000000000001', TRUE, 789),

  ('cccc3333-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Bà Tươi và gánh bánh xèo',
   'Bà Tươi mở gánh bánh xèo đầu ngõ từ năm 1985. Bà truyền nghề cho các con...',
   '1985-06-10', 'Quận Bình Thạnh',
   ARRAY['c0000002-0000-0000-0000-000000000002'::uuid, 'c0000005-0000-0000-0000-000000000005'::uuid],
   'cccc1111-0000-0000-0000-000000000002', FALSE, 345);

-- ---------------------------------------------------------------------
-- 14. STORY MEDIA
-- ---------------------------------------------------------------------

INSERT INTO story_media (story_id, media_type, media_url, caption, order_index) VALUES
  ('aaaa3333-0000-0000-0000-000000000001','IMAGE','https://example.com/anh-cu-to.jpg','Ảnh chân dung cụ Hùng',1),
  ('aaaa3333-0000-0000-0000-000000000001','DOCUMENT','https://example.com/so-gia-dinh.pdf','Sổ gia đình viết tay',2),
  ('aaaa3333-0000-0000-0000-000000000002','IMAGE','https://example.com/banh-chung.jpg','Bánh chưng ngày Tết',1),
  ('aaaa3333-0000-0000-0000-000000000002','VIDEO','https://example.com/lam-banh-chung.mp4','Video cách làm bánh',2),
  ('aaaa3333-0000-0000-0000-000000000003','IMAGE','https://example.com/ba-hanh.jpg','Bà Hạnh nấu ăn',1),
  ('aaaa3333-0000-0000-0000-000000000004','IMAGE','https://example.com/nhom-dev.jpg','Nhóm phát triển CâyGiaPhảSố',1),
  ('bbbb3333-0000-0000-0000-000000000001','IMAGE','https://example.com/ong-khanh.jpg','Ông Khánh thời trẻ',1),
  ('bbbb3333-0000-0000-0000-000000000001','DOCUMENT','https://example.com/duy-tan.pdf','Tài liệu về phong trào',2),
  ('bbbb3333-0000-0000-0000-000000000002','IMAGE','https://example.com/mam-co-tet.jpg','Mâm cỗ Tết',1),
  ('bbbb3333-0000-0000-0000-000000000003','IMAGE','https://example.com/nha-hang-sydney.jpg','Nhà hàng tại Sydney',1),
  ('cccc3333-0000-0000-0000-000000000001','IMAGE','https://example.com/ong-hoa.jpg','Ông Hòa khám bệnh',1),
  ('cccc3333-0000-0000-0000-000000000002','IMAGE','https://example.com/ganh-banh-xeo.jpg','Gánh bánh xèo',1);

-- ---------------------------------------------------------------------
-- 15. STORY TAGS + MAP
-- ---------------------------------------------------------------------

INSERT INTO story_tags (name) VALUES
  ('truyền thống'), ('gia đình'), ('tết'), ('ẩm thực'),
  ('quê hương'), ('kháng chiến'), ('học tập'), ('du học'),
  ('y khoa'), ('lễ cưới');

INSERT INTO story_tag_map (story_id, tag_id)
SELECT s.id, t.id FROM stories s CROSS JOIN story_tags t
WHERE (s.id = 'aaaa3333-0000-0000-0000-000000000001' AND t.name IN ('truyền thống','gia đình'))
   OR (s.id = 'aaaa3333-0000-0000-0000-000000000002' AND t.name IN ('ẩm thực','truyền thống','tết'))
   OR (s.id = 'bbbb3333-0000-0000-0000-000000000001' AND t.name IN ('kháng chiến','truyền thống'))
   OR (s.id = 'bbbb3333-0000-0000-0000-000000000002' AND t.name IN ('ẩm thực','tết','truyền thống'))
   OR (s.id = 'cccc3333-0000-0000-0000-000000000001' AND t.name IN ('y khoa','truyền thống'));

-- ---------------------------------------------------------------------
-- 16. TIME CAPSULES (some unlocked, some locked)
-- ---------------------------------------------------------------------

INSERT INTO time_capsules (family_id, creator_id, title, content, media_url, recipient_member_id, unlock_date, unlock_condition, is_opened, opened_at, opened_by) VALUES
  -- Họ Nguyễn
  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Lá thư gửi tương lai của bác An',
   'Các cháu yêu quý, khi các cháu đọc được lá thư này thì bác đã 70 tuổi. Bác muốn các cháu nhớ rằng gia đình là gốc rễ...',
   NULL, NULL, '2025-09-19', 'DATE', TRUE, '2025-09-19 10:00:00+07', '33333333-3333-3333-3333-333333333333'),

  ('aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Công thức bí mật cho Mai',
   'Mai ơi, khi con 18 tuổi mẹ sẽ tiết lộ công thức bánh chưng bí mật mà cụ tổ truyền lại...',
   'https://example.com/secret-recipe.pdf', 'a0000016-0000-0000-0000-000000000016', '2033-06-20', 'DATE', FALSE, NULL, NULL),

  ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Kỷ vật cho Minh Anh',
   'Minh Anh yêu quý, ông nội viết thư này cho cháu. Hãy luôn yêu thương gia đình...',
   'https://example.com/letter-minhanh.pdf', 'a0000017-0000-0000-0000-000000000017', '2036-09-10', 'DATE', FALSE, NULL, NULL),

  -- Họ Trần
  ('bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Thư cho Linh và Bảo',
   'Các cháu yêu, đây là những điều bà muốn kể cho các cháu khi các cháu đủ lớn...',
   NULL, 'b0000014-0000-0000-0000-000000000014', '2028-08-15', 'DATE', FALSE, NULL, NULL),

  -- Họ Lê
  ('cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Di sản nghề y cho con cháu',
   'Khoa yêu quý, cha muốn chia sẻ với con những bài học quý giá từ ông nội và cha...',
   NULL, 'c0000007-0000-0000-0000-000000000007', '2026-06-12', 'DATE', FALSE, NULL, NULL);

-- ---------------------------------------------------------------------
-- 17. EVENTS
-- ---------------------------------------------------------------------

INSERT INTO events (id, family_id, creator_id, title, description, event_type, event_date, end_date, location, latitude, longitude) VALUES
  ('aaaa4444-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Đám cưới Lan và Minh','Đám cưới của Lan cháu và Minh','WEDDING','2024-06-15 11:00:00+07','2024-06-15 22:00:00+07',
   'Nhà hàng Hoa Sứ, Hà Nội', 21.028511, 105.804817),

  ('aaaa4444-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Giỗ tổ Nguyễn Văn Hùng','Lễ giỗ cụ tổ hằng năm','FUNERAL','2024-03-15 09:00:00+07',NULL,
   'Đền làng Đông Ngạc, Hà Nội', 21.037778, 105.790556),

  ('aaaa4444-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Họp mặt họ Nguyễn 2024','Buổi họp mặt cuối năm của dòng họ','REUNION','2024-12-31 18:00:00+07','2024-12-31 23:00:00+07',
   'Trung tâm Hội nghị Quốc gia, Hà Nội', 21.003056, 105.788056),

  ('bbbb4444-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Giỗ tổ Trần Văn Hào','Lễ giỗ cụ tổ họ Trần','FUNERAL','2024-04-10 08:00:00+07',NULL,
   'Nhà thờ họ Trần, Huế', 16.463713, 107.590866),

  ('bbbb4444-0000-0000-0000-000000000002','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Sinh nhật ông Sơn 80 tuổi','Mừng thọ ông Sơn','BIRTHDAY','2025-05-30 17:00:00+07','2025-05-30 21:00:00+07',
   'Nhà hàng Hoàng Cung, Huế', 16.469075, 107.578386),

  ('bbbb4444-0000-0000-0000-000000000003','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Lễ tưởng niệm liệt sĩ','Tưởng niệm các anh hùng liệt sĩ họ Trần','RELIGIOUS','2024-07-27 09:00:00+07',NULL,
   'Nghĩa trang TP Huế', 16.480000, 107.600000),

  ('cccc4444-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Khai trương nhà hàng Miền Tây','Khai trương nhà hàng của Hùng','OTHER','2010-05-15 10:00:00+07','2010-05-15 22:00:00+07',
   'Quận Bình Thạnh, TP.HCM', 10.801944, 106.710556),

  ('cccc4444-0000-0000-0000-000000000002','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Họp mặt gia đình cuối năm','Tổ chức họp mặt cuối năm','REUNION','2024-12-30 17:00:00+07','2024-12-30 22:00:00+07',
   'Nhà hàng Miền Tây, TP.HCM', 10.801944, 106.710556);

-- ---------------------------------------------------------------------
-- 18. EVENT ATTENDEES
-- ---------------------------------------------------------------------

INSERT INTO event_attendees (event_id, member_id, rsvp_status, responded_at) VALUES
  -- Đám cưới Lan
  ('aaaa4444-0000-0000-0000-000000000001','a0000009-0000-0000-0000-000000000009','GOING','2024-05-01 10:00:00+07'),
  ('aaaa4444-0000-0000-0000-000000000001','a0000010-0000-0000-0000-000000000010','GOING','2024-05-01 11:00:00+07'),
  ('aaaa4444-0000-0000-0000-000000000001','a0000013-0000-0000-0000-000000000013','GOING','2024-04-20 09:00:00+07'),
  ('aaaa4444-0000-0000-0000-000000000001','a0000014-0000-0000-0000-000000000014','GOING','2024-04-20 09:00:00+07'),
  ('aaaa4444-0000-0000-0000-000000000001','a0000018-0000-0000-0000-000000000018','GOING','2024-05-10 15:00:00+07'),
  -- Giỗ tổ
  ('aaaa4444-0000-0000-0000-000000000002','a0000009-0000-0000-0000-000000000009','GOING','2024-03-01 08:00:00+07'),
  ('aaaa4444-0000-0000-0000-000000000002','a0000011-0000-0000-0000-000000000011','GOING','2024-03-02 10:00:00+07'),
  ('aaaa4444-0000-0000-0000-000000000002','a0000018-0000-0000-0000-000000000018','GOING','2024-03-05 11:00:00+07'),
  -- Họp mặt
  ('aaaa4444-0000-0000-0000-000000000003','a0000013-0000-0000-0000-000000000013','GOING','2024-12-01 09:00:00+07'),
  ('aaaa4444-0000-0000-0000-000000000003','a0000014-0000-0000-0000-000000000014','GOING','2024-12-01 10:00:00+07'),
  ('aaaa4444-0000-0000-0000-000000000003','a0000015-0000-0000-0000-000000000015','MAYBE','2024-12-10 14:00:00+07'),
  -- Giỗ tổ họ Trần
  ('bbbb4444-0000-0000-0000-000000000001','b0000010-0000-0000-0000-000000000010','GOING','2024-03-15 10:00:00+07'),
  ('bbbb4444-0000-0000-0000-000000000001','b0000011-0000-0000-0000-000000000011','GOING','2024-03-15 10:00:00+07'),
  ('bbbb4444-0000-0000-0000-000000000001','b0000014-0000-0000-0000-000000000014','GOING','2024-03-16 11:00:00+07'),
  -- Sinh nhật ông Sơn
  ('bbbb4444-0000-0000-0000-000000000002','b0000010-0000-0000-0000-000000000010','GOING','2025-04-15 10:00:00+07'),
  ('bbbb4444-0000-0000-0000-000000000002','b0000012-0000-0000-0000-000000000012','MAYBE','2025-04-20 09:00:00+07'),
  -- Khai trương nhà hàng
  ('cccc4444-0000-0000-0000-000000000001','c0000001-0000-0000-0000-000000000001','GOING','2010-05-01 10:00:00+07'),
  ('cccc4444-0000-0000-0000-000000000001','c0000003-0000-0000-0000-000000000003','GOING','2010-05-01 10:00:00+07'),
  ('cccc4444-0000-0000-0000-000000000001','c0000004-0000-0000-0000-000000000004','GOING','2010-05-01 10:00:00+07'),
  -- Họp mặt cuối năm họ Lê
  ('cccc4444-0000-0000-0000-000000000002','c0000003-0000-0000-0000-000000000003','GOING','2024-12-15 10:00:00+07'),
  ('cccc4444-0000-0000-0000-000000000002','c0000005-0000-0000-0000-000000000005','GOING','2024-12-15 11:00:00+07'),
  ('cccc4444-0000-0000-0000-000000000002','c0000006-0000-0000-0000-000000000006','GOING','2024-12-15 11:00:00+07'),
  ('cccc4444-0000-0000-0000-000000000002','c0000007-0000-0000-0000-000000000007','MAYBE','2024-12-20 14:00:00+07');

-- ---------------------------------------------------------------------
-- 19. EVENT PHOTOS
-- ---------------------------------------------------------------------

INSERT INTO event_photos (event_id, photo_url, caption, uploaded_by) VALUES
  ('aaaa4444-0000-0000-0000-000000000001','https://example.com/wedding-1.jpg','Cô dâu chú rể',  '22222222-2222-2222-2222-222222222222'),
  ('aaaa4444-0000-0000-0000-000000000001','https://example.com/wedding-2.jpg','Cả gia đình',    '11111111-1111-1111-1111-111111111111'),
  ('aaaa4444-0000-0000-0000-000000000001','https://example.com/wedding-3.jpg','Tiệc cưới',      '33333333-3333-3333-3333-333333333333'),
  ('aaaa4444-0000-0000-0000-000000000002','https://example.com/gio-to-1.jpg','Lễ giỗ tổ',     '11111111-1111-1111-1111-111111111111'),
  ('aaaa4444-0000-0000-0000-000000000003','https://example.com/reunion-1.jpg','Họp mặt cuối năm','33333333-3333-3333-3333-333333333333'),
  ('bbbb4444-0000-0000-0000-000000000001','https://example.com/gio-to-tran.jpg','Lễ giỗ tổ họ Trần','44444444-4444-4444-4444-444444444444'),
  ('cccc4444-0000-0000-0000-000000000001','https://example.com/khai-truong.jpg','Khai trương nhà hàng','55555555-5555-5555-5555-555555555555');

-- ---------------------------------------------------------------------
-- 20. PHOTO ALBUMS & PHOTOS
-- ---------------------------------------------------------------------

INSERT INTO photo_albums (id, family_id, creator_id, title, description, cover_photo_url) VALUES
  ('aaaa5555-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Tết 2024','Ảnh Tết Nguyên Đán 2024','https://example.com/album-tet-2024.jpg'),
  ('aaaa5555-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Đám cưới Lan & Minh','Album ảnh đám cưới','https://example.com/album-wedding.jpg'),
  ('aaaa5555-0000-0000-0000-000000000003','aaaaaaaa-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Kỷ niệm tuổi thơ','Ảnh hồi bé của các thành viên','https://example.com/album-childhood.jpg'),
  ('bbbb5555-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002','44444444-4444-4444-4444-444444444444',
   'Du lịch Huế 2023','Chuyến đi gia đình về Huế','https://example.com/album-hue.jpg'),
  ('cccc5555-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003','55555555-5555-5555-5555-555555555555',
   'Sinh nhật ông nội','Album sinh nhật ông nội','https://example.com/album-birthday.jpg');

INSERT INTO photos (album_id, uploader_id, photo_url, caption, photo_date, photo_location, member_ids) VALUES
  ('aaaa5555-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'https://example.com/photo-tet-1.jpg','Cả gia đình sum họp','2024-02-10','Hà Nội',
   ARRAY['a0000009-0000-0000-0000-000000000009'::uuid,'a0000010-0000-0000-0000-000000000010'::uuid,'a0000013-0000-0000-0000-000000000013'::uuid]),
  ('aaaa5555-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'https://example.com/photo-tet-2.jpg','Bánh chưng ngày Tết','2024-02-09','Hà Nội',
   ARRAY['a0000010-0000-0000-0000-000000000010'::uuid]),
  ('aaaa5555-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',
   'https://example.com/photo-tet-3.jpg','Mai và Minh Anh','2024-02-10','Hà Nội',
   ARRAY['a0000016-0000-0000-0000-000000000016'::uuid,'a0000017-0000-0000-0000-000000000017'::uuid]),
  ('aaaa5555-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',
   'https://example.com/photo-wedding-1.jpg','Khoảnh khắc hạnh phúc','2024-06-15','Hà Nội',
   ARRAY['a0000013-0000-0000-0000-000000000013'::uuid,'a0000014-0000-0000-0000-000000000014'::uuid]),
  ('aaaa5555-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222',
   'https://example.com/photo-wedding-2.jpg','Bố mẹ chú rể','2024-06-15','Hà Nội',
   ARRAY['a0000009-0000-0000-0000-000000000009'::uuid,'a0000010-0000-0000-0000-000000000010'::uuid]),
  ('aaaa5555-0000-0000-0000-000000000003','22222222-2222-2222-2222-222222222222',
   'https://example.com/photo-childhood-1.jpg','Lan hồi 5 tuổi','1990-08-15','Hà Nội',
   ARRAY['a0000013-0000-0000-0000-000000000013'::uuid]),
  ('bbbb5555-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444',
   'https://example.com/photo-hue-1.jpg','Trước Đại Nội','2023-07-20','Huế',
   ARRAY['b0000010-0000-0000-0000-000000000010'::uuid,'b0000014-0000-0000-0000-000000000014'::uuid,'b0000015-0000-0000-0000-000000000015'::uuid]),
  ('cccc5555-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555',
   'https://example.com/photo-birthday-1.jpg','Ông nội với các cháu','2018-05-15','TP.HCM',
   ARRAY['c0000001-0000-0000-0000-000000000001'::uuid,'c0000003-0000-0000-0000-000000000003'::uuid,'c0000007-0000-0000-0000-000000000007'::uuid]);

INSERT INTO photo_tags (photo_id, tag_type, tagged_member_id) VALUES
  ((SELECT id FROM photos WHERE caption = 'Cả gia đình sum họp'), 'MEMBER', 'a0000009-0000-0000-0000-000000000009'),
  ((SELECT id FROM photos WHERE caption = 'Cả gia đình sum họp'), 'MEMBER', 'a0000010-0000-0000-0000-000000000010');

INSERT INTO photo_tags (photo_id, tag_type, tagged_event_id) VALUES
  ((SELECT id FROM photos WHERE caption = 'Trước Đại Nội'), 'EVENT', 'bbbb4444-0000-0000-0000-000000000001');

-- ---------------------------------------------------------------------
-- 21. CHATS & MESSAGES
-- ---------------------------------------------------------------------

INSERT INTO family_chats (id, family_id, name, description, created_by) VALUES
  ('aaaa6666-0000-0000-0000-000000000001','aaaaaaaa-0000-0000-0000-000000000001',
   'Chat chung họ Nguyễn','Nhóm chat chính của gia đình','11111111-1111-1111-1111-111111111111'),
  ('bbbb6666-0000-0000-0000-000000000001','bbbbbbbb-0000-0000-0000-000000000002',
   'Chat chung họ Trần','Nhóm chat chính của gia đình','44444444-4444-4444-4444-444444444444'),
  ('cccc6666-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000003',
   'Chat chung họ Lê','Nhóm chat chính của gia đình','55555555-5555-5555-5555-555555555555');

-- Chat members
INSERT INTO chat_members (chat_id, user_id, role) VALUES
  ('aaaa6666-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','ADMIN'),
  ('aaaa6666-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','MEMBER'),
  ('aaaa6666-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','MEMBER'),
  ('bbbb6666-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444','ADMIN'),
  ('cccc6666-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555','ADMIN');

-- Chat messages
INSERT INTO chat_messages (chat_id, sender_id, content, message_type) VALUES
  ('aaaa6666-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Cả nhà ơi, ngày mai có ai rảnh không? Mình muốn tổ chức họp mặt cuối tuần.','TEXT'),
  ('aaaa6666-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Em rảnh! Em sẽ mang theo bánh chưng mới làm.','TEXT'),
  ('aaaa6666-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',
   'Minh cũng đi! Sẽ mang theo máy ảnh chụp ảnh gia đình.','TEXT'),
  ('aaaa6666-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   '@bác An ơi, bác xem giúp em công thức canh măng mực ngày Tết nhé?','TEXT'),
  ('bbbb6666-0000-0000-0000-000000000001','44444444-4444-4444-4444-444444444444',
   'Cả nhà ơi, ai có ảnh cũ của ông nội Khánh không ạ?','TEXT'),
  ('cccc6666-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555',
   'Tối nay nhà hàng có món mới, mời cả nhà đến thử nhé!','TEXT');

-- ---------------------------------------------------------------------
-- 22. ACHIEVEMENTS & MEMBER_ACHIEVEMENTS
-- ---------------------------------------------------------------------

INSERT INTO achievements (code, name, description, icon_url, points) VALUES
  ('FIRST_RECIPE',  'Người đầu bếp đầu tiên',  'Đăng công thức đầu tiên của bạn',          'https://example.com/icons/first-recipe.png',   10),
  ('TREE_BUILDER',  'Người xây dựng cây',      'Thêm 10 thành viên vào cây gia đình',    'https://example.com/icons/tree-builder.png',   20),
  ('STORY_TELLER',  'Người kể chuyện',          'Đăng câu chuyện đầu tiên',               'https://example.com/icons/story-teller.png',   15),
  ('LEGACY_KEEPER', 'Người giữ di sản',         'Truyền 3 công thức qua các thế hệ',      'https://example.com/icons/legacy-keeper.png',  50),
  ('FAMILY_GATHER', 'Người kết nối',            'Tham gia 5 sự kiện gia đình',            'https://example.com/icons/gather.png',         30),
  ('PHOTO_HUNTER',  'Thợ săn ảnh',              'Đăng 50 ảnh lên album',                  'https://example.com/icons/photo-hunter.png',   25);

-- Member achievements
INSERT INTO member_achievements (member_id, achievement_id, notes) VALUES
  ('a0000013-0000-0000-0000-000000000013',
   (SELECT id FROM achievements WHERE code = 'FIRST_RECIPE'),
   'Đăng công thức đầu tiên năm 2020'),
  ('a0000013-0000-0000-0000-000000000013',
   (SELECT id FROM achievements WHERE code = 'TREE_BUILDER'),
   'Đã thêm 15 thành viên vào cây gia đình'),
  ('a0000013-0000-0000-0000-000000000013',
   (SELECT id FROM achievements WHERE code = 'STORY_TELLER'),
   'Viết câu chuyện về cô Lan đầu tiên'),
  ('a0000013-0000-0000-0000-000000000013',
   (SELECT id FROM achievements WHERE code = 'LEGACY_KEEPER'),
   'Truyền 3 công thức qua các thế hệ'),
  ('a0000014-0000-0000-0000-000000000014',
   (SELECT id FROM achievements WHERE code = 'TREE_BUILDER'),
   'Minh xây dựng CâyGiaPhảSố'),
  ('a0000014-0000-0000-0000-000000000014',
   (SELECT id FROM achievements WHERE code = 'PHOTO_HUNTER'),
   'Đã đăng hơn 50 ảnh'),
  ('a0000010-0000-0000-0000-000000000010',
   (SELECT id FROM achievements WHERE code = 'LEGACY_KEEPER'),
   'Người giữ công thức gia truyền'),
  ('a0000010-0000-0000-0000-000000000010',
   (SELECT id FROM achievements WHERE code = 'FAMILY_GATHER'),
   'Tham gia tích cực các sự kiện'),
  ('b0000010-0000-0000-0000-000000000010',
   (SELECT id FROM achievements WHERE code = 'STORY_TELLER'),
   'Kể chuyện về gia tộc họ Trần'),
  ('c0000003-0000-0000-0000-000000000003',
   (SELECT id FROM achievements WHERE code = 'TREE_BUILDER'),
   'Xây dựng cây gia đình họ Lê');

-- ---------------------------------------------------------------------
-- 23. FAMILY HERITAGES (motto, traditions, songs)
-- ---------------------------------------------------------------------

INSERT INTO family_heritages (family_id, heritage_type, title, description, year_established, created_by) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'MOTTO', 'Hiếu đễ trước, nghĩa khí sau',
   'Gia huấn của cụ tổ: con cháu phải biết hiếu thảo với cha mẹ, sau đó mới đến nghĩa khí với đời.', 1820,
   '11111111-1111-1111-1111-111111111111'),

  ('aaaaaaaa-0000-0000-0000-000000000001', 'TRADITION', 'Gói bánh chưng ngày Tết',
   'Mỗi gia đình con cháu đều gói bánh chưng ngày Tết theo công thức gia truyền 5 đời.', 1820,
   '11111111-1111-1111-1111-111111111111'),

  ('aaaaaaaa-0000-0000-0000-000000000001', 'TRADITION', 'Giỗ tổ vào ngày 15 tháng 3',
   'Hằng năm cả họ tổ chức giỗ cụ tổ Nguyễn Văn Hùng vào ngày 15 tháng 3 âm lịch.', 1820,
   '11111111-1111-1111-1111-111111111111'),

  ('aaaaaaaa-0000-0000-0000-000000000001', 'SONG', 'Bài ca làng Đông Ngạc',
   'Bài dân ca nổi tiếng về làng Đông Ngạc và dòng họ Nguyễn.', 1880,
   '11111111-1111-1111-1111-111111111111'),

  ('bbbbbbbb-0000-0000-0000-000000000002', 'MOTTO', 'Trung hiếu vẹn toàn',
   'Gia huấn: trung với nước, hiếu với cha mẹ.', 1855,
   '44444444-4444-4444-4444-444444444444'),

  ('bbbbbbbb-0000-0000-0000-000000000002', 'SYMBOL', 'Hoa sen',
   'Hoa sen là biểu tượng của dòng họ, thể hiện sự thanh khiết và bền bỉ.', 1855,
   '44444444-4444-4444-4444-444444444444'),

  ('bbbbbbbb-0000-0000-0000-000000000002', 'RECIPE', 'Bún bò Huế cung đình',
   'Công thức bún bò cung đình truyền 4 đời.', 1855,
   '44444444-4444-4444-4444-444444444444'),

  ('cccccccc-0000-0000-0000-000000000003', 'MOTTO', 'Thuận vợ thuận chồng',
   'Gia huấn: vợ chồng thuận hòa thì việc gì cũng thành công.', 1965,
   '55555555-5555-5555-5555-555555555555'),

  ('cccccccc-0000-0000-0000-000000000003', 'TRADITION', 'Ăn cá kho tộ ngày cuối tuần',
   'Truyền thống gia đình mỗi chủ nhật cùng ăn cơm với cá kho tộ.', 1965,
   '55555555-5555-5555-5555-555555555555'),

  ('cccccccc-0000-0000-0000-000000000003', 'STORY', 'Câu chuyện ông Hòa khám bệnh miễn phí',
   'Truyền thống gia đình làm nghề y và giúp đỡ người nghèo.', 1965,
   '55555555-5555-5555-5555-555555555555');

-- ---------------------------------------------------------------------
-- 24. NOTIFICATIONS
-- ---------------------------------------------------------------------

INSERT INTO notifications (user_id, notification_type, title, content, related_entity_type, related_entity_id, is_read) VALUES
  ('11111111-1111-1111-1111-111111111111','RECIPE','Có người thích công thức của bạn',
   'Lan đã thích công thức Bánh chưng làng Đông Ngạc','RECIPE','aaaa2222-0000-0000-0000-000000000001',TRUE),
  ('11111111-1111-1111-1111-111111111111','COMMENT','Có bình luận mới',
   'Lan đã bình luận về công thức Bánh chưng','COMMENT',(SELECT id FROM recipe_comments WHERE recipe_id = 'aaaa2222-0000-0000-0000-000000000001' LIMIT 1),FALSE),
  ('22222222-2222-2222-2222-222222222222','EVENT','Sự kiện sắp diễn ra',
   'Đám cưới Lan và Minh vào ngày mai','EVENT','aaaa4444-0000-0000-0000-000000000001',FALSE),
  ('22222222-2222-2222-2222-222222222222','ACHIEVEMENT','Bạn nhận được thành tựu mới',
   'Bạn đã đạt được LEGACY_KEEPER','ACHIEVEMENT',
   (SELECT id FROM achievements WHERE code = 'LEGACY_KEEPER'),FALSE),
  ('33333333-3333-3333-3333-333333333333','CHAT','Tin nhắn mới trong nhóm chat',
   'Có 3 tin nhắn mới trong nhóm họ Nguyễn','CHAT','aaaa6666-0000-0000-0000-000000000001',FALSE),
  ('44444444-4444-4444-4444-444444444444','STORY','Câu chuyện mới được đăng',
   'Cô Hoa đã đăng câu chuyện về ông Khánh','STORY','bbbb3333-0000-0000-0000-000000000001',TRUE),
  ('55555555-5555-5555-5555-555555555555','TIME_CAPSULE','Time capsule sắp được mở',
   'Di sản nghề y cho con cháu sẽ mở vào 2026-06-12','TIME_CAPSULE',
   (SELECT id FROM time_capsules WHERE family_id = 'cccccccc-0000-0000-0000-000000000003' LIMIT 1),FALSE);

-- ---------------------------------------------------------------------
-- 25. POLYMORPHIC COMMENTS (for stories/photos/events)
-- ---------------------------------------------------------------------

INSERT INTO comments (entity_type, entity_id, user_id, content) VALUES
  ('STORY','aaaa3333-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222',
   'Câu chuyện cảm động quá! Cảm ơn bác An đã chia sẻ.'),
  ('STORY','aaaa3333-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',
   'Cháu rất tự hào về lịch sử dòng họ.'),
  ('STORY','bbbb3333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Câu chuyện về ông Khánh thật cảm động. Cảm ơn bác Hoa.'),
  ('STORY','cccc3333-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333',
   'Ông Hòa là tấm gương sáng cho con cháu noi theo.'),
  ('PHOTO',(SELECT id FROM photos WHERE caption = 'Cả gia đình sum họp' LIMIT 1),
   '33333333-3333-3333-3333-333333333333',
   'Ảnh đẹp quá!'),
  ('PHOTO',(SELECT id FROM photos WHERE caption = 'Khoảnh khắc hạnh phúc' LIMIT 1),
   '11111111-1111-1111-1111-111111111111',
   'Chúc mừng hạnh phúc các con!'),
  ('EVENT','aaaa4444-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111',
   'Cảm ơn mọi người đã đến dự đám cưới!'),
  ('EVENT','cccc4444-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555',
   'Chúc mừng khai trương! Cảm ơn mọi người đã đến.');

-- ---------------------------------------------------------------------
-- 26. POLYMORPHIC REACTIONS
-- ---------------------------------------------------------------------

INSERT INTO reactions (entity_type, entity_id, user_id, reaction_type) VALUES
  ('STORY','aaaa3333-0000-0000-0000-000000000001','33333333-3333-3333-3333-333333333333','LOVE'),
  ('STORY','aaaa3333-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','LOVE'),
  ('STORY','aaaa3333-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111111','LIKE'),
  ('STORY','bbbb3333-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','LOVE'),
  ('STORY','bbbb3333-0000-0000-0000-000000000002','22222222-2222-2222-2222-222222222222','YUM'),
  ('STORY','cccc3333-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','LOVE'),
  ('PHOTO',(SELECT id FROM photos WHERE caption = 'Cả gia đình sum họp' LIMIT 1),
   '11111111-1111-1111-1111-111111111111','LOVE'),
  ('PHOTO',(SELECT id FROM photos WHERE caption = 'Khoảnh khắc hạnh phúc' LIMIT 1),
   '33333333-3333-3333-3333-333333333333','LOVE'),
  ('EVENT','aaaa4444-0000-0000-0000-000000000001','22222222-2222-2222-2222-222222222222','LOVE'),
  ('EVENT','cccc4444-0000-0000-0000-000000000001','55555555-5555-5555-5555-555555555555','LOVE');

-- ---------------------------------------------------------------------
-- 27. REFRESH TOKENS (sample)
-- ---------------------------------------------------------------------

INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES
  ('11111111-1111-1111-1111-111111111111',
   'sample-refresh-token-admin-an-12345',
   NOW() + INTERVAL '7 days'),
  ('22222222-2222-2222-2222-222222222222',
   'sample-refresh-token-lan-67890',
   NOW() + INTERVAL '7 days'),
  ('33333333-3333-3333-3333-333333333333',
   'sample-refresh-token-minh-11111',
   NOW() + INTERVAL '7 days');

-- =====================================================================
-- End V2
-- =====================================================================
