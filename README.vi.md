# NoMoreTabs

**[🇬🇧 English](README.md)**

![srvMVjnP](https://img.bibica.net/srvMVjnP.png)

Tiện ích mở rộng trình duyệt giúp chặn các tab và popup không mong muốn.

## Cách hoạt động
Khi một trang web cố mở tab mới, cửa sổ mới, hoặc điều hướng sang trang khác, một hộp thoại sẽ hiện ra ngay trong tab hiện tại.

### Nút hành động
- **Allow this time** (xanh lá) — Cho phép yêu cầu này một lần. Không lưu quy tắc nào.
- **Block this time** (đỏ) — Chặn yêu cầu này một lần. Không lưu quy tắc nào.

### Checkbox
Checkbox lưu quy tắc vĩnh viễn. Khi chọn checkbox, nút ngược lại sẽ tự động bị tắt:

- **Always allow [nguồn] to open new tabs** — Các lần truy cập từ tên miền này trong tương lai sẽ được tự động cho phép. Tắt nút **Block this time**.
- **Always block [nguồn] from opening new tabs** — Các lần truy cập từ tên miền này trong tương lai sẽ bị chặn mà không cần hỏi. Tắt nút **Allow this time**.
- **Block all network requests to [đích]** — Tất cả request đến tên miền này (script, ảnh, iframe, v.v.) sẽ bị chặn ở tầng mạng. Trang tự động tải lại. Tắt nút **Allow this time**. *(Chỉ hiện khi tên miền đích khác tên miền nguồn.)*

### Popup tiện ích
Nhấn vào biểu tượng tiện ích để quản lý danh sách thủ công:

- **🚫 Block popups from domain** — Tên miền nguồn không được phép mở tab mới.
- **✅ Allow popups from domain** — Tên miền nguồn được phép mở tab mới tự do.
- **🔗 Block navigation to domain** — Tên miền đích bị chặn ở tầng mạng (tất cả loại tài nguyên).

Hỗ trợ wildcard `*.example.com`. Khi thêm tên miền vào một danh sách, nó sẽ tự động bị xóa khỏi hai danh sách còn lại.

### Danh sách cho phép mặc định
`allowlist.json` chứa các tên miền uy tín (Google, Facebook, ngân hàng, v.v.) luôn được phép và không thể thêm vào danh sách chặn qua giao diện.

### Đồng bộ
Mọi thay đổi được đồng bộ ngay lập tức trên tất cả các tab đang mở qua `chrome.storage.sync`.

## Cài đặt
1. Tải và giải nén **[NoMoreTabs.zip](https://github.com/bibicadotnet/NoMoreTabs/releases/latest/download/NoMoreTabs.zip)**.
2. Mở `chrome://extensions/` trong trình duyệt.
3. Bật **Developer mode** (Chế độ nhà phát triển).
4. Nhấn **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục vừa giải nén.
