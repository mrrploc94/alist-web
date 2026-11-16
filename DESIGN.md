# ATP AList — phương án B

## Brief và quyết định

Thiết kế lại giao diện fork AList, phục vụ quản lý file, nhiều driver lưu trữ và mọi nhóm quản trị gốc. Backuply là tiện ích bổ sung. Người dùng chọn B: tách File và Quản trị. Giữ logo ATP lấy từ cài đặt, driver, quyền, dữ liệu, API và Share sidecar hiện có.

Bộ mặt Clean, sắc Neutral. Token ở src/app/workspace.css: nền #f7f8fa, surface #fff, chữ #24282e, chữ phụ #616873, nhấn #0966be, selected #e7f2ff. Dùng font hệ thống, Hope UI và SolidJS hiện có; không thêm framework. Có dark mode theo thiết lập hiện tại.

## Hợp đồng component

- Navigation: File / Quản trị; sidebar nhóm chức năng gốc, Backuply ở nhóm riêng. Mobile dùng drawer; tab cài đặt tự xuống hàng.
- Form: label phía trên, input outline, trường liên quan xếp cùng nhóm. Giữ trường, điều kiện driver và handler upstream. Mật khẩu/token có ô che và nút hiện lại. Giữ các cách xác thực upstream.
- Table: table/thead/tbody/th thật và scope=col. Bảng lớn cuộn trong vùng nội dung; bảng monitoring có nhãn từng dòng trên điện thoại.
- Actions: nút chính xanh, nút phụ nền surface; modal/menu Hope UI. Giữ focus nhìn thấy khi dùng bàn phím.
- Nhịp 4/8px, viền nhẹ, không bóng trên khối nội dung. Sidebar cuộn riêng để tới được mọi nhóm.
- Thêm locale vi; giữ ngôn ngữ đã lưu. Các nhãn vận hành chính Việt hóa; tên driver và một số nội dung chuyên biệt giữ upstream.

## Luồng

Đăng nhập → File → chọn ổ/thư mục → tìm, đổi kiểu xem, tạo thư mục, upload, preview, chia sẻ.
File → Quản trị → ổ lưu trữ / user / vai trò / metadata / tác vụ / phiên / chỉ mục / trình xem / nhãn / cài đặt / sao lưu cấu hình / Messenger.
Quản trị → tiện ích Backuply → dung lượng / user / lịch và lịch sử.

Share tùy biến và Share gốc giữ /s/: sidecar xử lý ID của nó; ID khác chuyển nội bộ vào AList. Header X-Forwarded-Proto truyền HTTPS để preview/download gốc không bị mixed content. Tạo/sửa/xóa vẫn dùng API gốc hoặc sidecar hiện có.

## Màn đã dựng

File explorer/mobile tree, khung quản trị/dashboard, toàn bộ settings, driver storage, user/profile, role/scopes, metadata, sessions, tasks, shares native/custom, indexes, preview manager, labels, backup/restore configuration, Messenger, đăng nhập và share gốc. Màn chuyên biệt dùng component upstream trong style chung để giữ hành vi.

Monitoring có backend đọc dữ liệu thật, phân quyền admin, cache 5 phút. Lịch backup vẫn quản lý bằng Backuply; màn này chỉ xem.

## Sai khác có chủ ý so với bản mẫu

Dữ liệu giả và nhãn bản mẫu được thay bằng API thật. Không suy quota từ tên gói 5 TB. Trường thiếu dữ liệu hiện Chưa xác định. Không bịa ngày tạo lịch khi Backuply không lưu. Sidebar tăng chữ lên 12px; giữ focus keyboard dù probe phong cách gợi ý bỏ. Desktop giới hạn nội dung 1440px để form dễ đọc ở màn rộng. File list ngắn theo dữ liệu thật, không thêm file giả.

## Kiểm tra thị giác

Card cùng loại có chiều cao tối thiểu nhất quán; thao tác có nền/viền rõ; mỗi khối một viền ngoài. Ở 1920px khoảng rộng giới hạn phục vụ khả năng đọc, sidebar vẫn truy cập được. Hành động chính là upload hoặc mở phần quản trị tương ứng. 375px không tràn ngang trong sweep 25 route. So bản mẫu và live: docs/qa/so-sanh.html.
