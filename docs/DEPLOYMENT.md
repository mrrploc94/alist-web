# Triển khai ATP AList Workspace B — 16/11/2026

Live: https://file.atpwebhost.com. S3: https://s3.atpweb.vn.
Core Docker xhofe/alist:v3.66.0 ARM64 giữ nguyên. UI dùng dist_dir chính thức.

## Snapshot và triển khai

Snapshot: /root/atp-alist-ui-backups/20261116T035521Z trên Oracle.
ops/snapshot-ui.py chụp config, online SQLite backup, container, nginx và sidecar trước khi đổi; chạy Python 3.11.

Release đợt triển khai đầu: workspace-b-20261116T041129Z.
Host: /www/wwwroot/file.atpwebhost.com/data/ui-releases/<release>/dist.
Container: /opt/alist/data/ui-releases/<release>/dist.
Giữ chunk cũ cho tab trình duyệt đang mở. deploy-ui.py tự khôi phục config nếu health check thất bại. Không đổi image, port, provider token, S3 vhost hoặc lịch Backuply.

Nginx bổ sung fallback native Share cho ID không thuộc sidecar và X-Forwarded-Proto cho UI. Sidecar live khác repo công khai: chỉ patch dispatch, không chép đè từ repo.

## Monitoring

- iNet: /usr/local/libexec/atp-backuply-export.py; chỉ đọc các trường cho phép từ Backuply và dung lượng DirectAdmin user.
- Oracle: /usr/local/libexec/atp-alist-monitor.py; cache /var/lib/atp-alist-monitor/dashboard.json, root:www 640.
- Cron /etc/cron.d/atp-alist-monitor mỗi 5 phút; không đổi cron Backuply gốc.
- Key chỉ nằm trên Oracle; iNet authorized_keys giới hạn IP, restrict và forced command exporter.
- API /share-app/backup-dashboard.php: xác thực token bằng /api/me, cần role admin, GET-only, no-store.
- Đã xác minh: 7 mounts, 100 hosting users, 2 lịch, 200 task. Hiển thị nguồn/lần cập nhật và UTC+7.

## Validation

Vite production build thành công; có cảnh báo upstream chunk lớn. Typecheck toàn repo vẫn có lỗi nền: TS4.7 với satisfies, router test globals và typing cũ. Compiler mới không báo lỗi ở các component workspace mới; không tuyên bố toàn repo tsc sạch.

Production sweep: 50 route/viewport 1280/375, không lỗi JavaScript hoặc overflow ngang sau sửa preview manager. Bao gồm nhóm quản trị gốc, settings, form thêm mới, File/Yandex, login, Share custom và monitoring.

Auth: khách 401; user thường 403 ở monitor API; admin nhận dữ liệu thật. Đăng nhập user thường bằng password, native admin API từ chối quyền; UI không hiện admin workspace/data monitor. User/role thử đã xóa trong finally.

Browser: tạo thư mục Yandex, upload bằng input thật, tải cloud và so byte; list/grid/image, tìm kiếm, mobile tree. Thư mục/file thử được dọn bằng API gốc.

S3: PUT Content-MD5, HEAD, GET byte-for-byte, Range 206. Không coi đây là bằng chứng đã chạy một job incremental/restore đầy đủ của Backuply.

Share: native /s tới AList; custom giữ password screen, từ chối password sai, download đúng byte với password đúng. Kiểm tra native preview HTTPS sau bổ sung forwarded scheme; fixture được dọn riêng.

Probe đã sweep và so ảnh 375/1440/1920. Không tuyên bố pixel-perfect: còn khác chuỗi/dữ liệu giả, sidebar, focus và giới hạn nội dung nêu trong DESIGN.md.

## Giới hạn dữ liệu

Quota 7 cloud mounts chưa có API dùng chung tin cậy: total/used/free là null. Không tự refresh OAuth có thể xoay token của AList. Dung lượng nguồn user theo DirectAdmin; dung lượng catalog chưa xác định khi DB không ghi. Hai lịch hiện có vẫn compressed. Lỗi MySQL/previous-task-running có sẵn được hiển thị thật, không sửa trong đợt UI này.

## Rollback

Chép ops/rollback-ui.py lên Oracle rồi chạy:

    python3.11 /path/to/rollback-ui.py /root/atp-alist-ui-backups/20261116T035521Z

Chỉ khôi phục config UI và các file routing đã chụp, nginx -t/reload và restart container. Không phục hồi database đang dùng hoặc ghi đè Share/user/ổ lưu trữ mới phát sinh. Giữ UI release và snapshot cũ.

Đối chiếu sau dọn: 47 hàng Share tùy biến gốc và các hàng users/roles/meta/native shares trùng snapshot. Cấu hình ổ lưu trữ cố định trùng snapshot; AList tự cập nhật refresh_token của Yandex/OneDrive và Headers/HeaderTime của Sharelink, đồng thời đánh giá lại status khi khởi động. Không khôi phục token cũ. Source sidecar chỉ thay download.php ở đoạn dispatch đã nêu. Bằng chứng riêng trên Oracle: final-integrity.json trong snapshot.

## File và Share — đợt cập nhật tiếp theo

- Live release: workspace-b-20261116T055440Z.
- Snapshot riêng trước đợt này: /root/atp-alist-ui-backups/20261116T052619Z.
- Bản trước/sau và ảnh sáng/tối: docs/exterior/so-sanh.html.
- Deploy UI qua dist_dir, core Docker v3.66.0 giữ nguyên. Sidecar assets: share-workspace.css/js; canonical CSS nằm tại src/app/share-workspace.css, enhancer tại ops/sidecar/share-workspace.js.
- Apply presentation hooks bằng ops/patch-share-exterior.py trên đúng source live đã snapshot, sau đó ops/fix-share-download-form.py. Không sao chép config.php hay ghi đè từ repo sidecar khác. Khi cập nhật các lần sau chỉ thay assets đã kiểm tra; script patch sẽ dừng nếu hook đã tồn tại.
- Build production qua. Kiểm tra live sáng/tối ở 375/1280/1920: không rail cũ, menu đầy đủ và không tràn ngang; modal và menu đã xem ảnh sau khi animation hoàn tất.
- Qua 9 kiểm tra modal thật: che/hiện password, chọn thời hạn riêng, tạo, URL kết quả, copy, thu hồi đúng link thử, phân trang và lọc. Public view đã thử password sai/đúng, download bằng nút POST và so byte; thử trang hết hạn ở sáng/tối. Native share vẫn render đúng file thử.
- Hope UI dùng active descendant cho menu; đã xác minh mở bằng ArrowDown. Chọn file có đúng một tóm tắt, bỏ chọn hoạt động. Các check desktop/mobile chạy qua domain production sau deploy.
- S3 HEAD/GET/Range đã xác minh lại sau restart UI; không thay lịch backup hoặc gateway.
- Sau dọn fixture: 47 Share cũ, user, role, metadata, native shares và cấu hình cố định của storage đều trùng snapshot. Chỉ hai source sidecar sẵn có thay đổi: download.php (trình bày và CTA) và share-inject.js (nạp enhancer). config.php và ShareDB.php giữ nguyên.
- Rollback riêng đợt này: python3.11 /root/atp-alist-ui-backups/20261116T052619Z/rollback-ui.py /root/atp-alist-ui-backups/20261116T052619Z. Script khôi phục cả injector và PHP view, không phục hồi DB đang dùng.
