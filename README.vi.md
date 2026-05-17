# NoMoreTabs

**[🇬🇧 English](README.md)**

![srvMVjnP](https://img.bibica.net/srvMVjnP.png)

Tiện ích mở rộng trình duyệt giúp chặn các tab và popup không mong muốn.

## Cách hoạt động
Khi một trang web cố mở tab mới, cửa sổ mới, hoặc điều hướng bạn sang trang khác, một hộp thoại xác nhận sẽ hiện ra ngay trong tab hiện tại.

### Nút hành động
- **Open once** — Cho phép yêu cầu hiện tại một lần duy nhất. Tab hoặc trang sẽ được mở, nhưng không lưu quy tắc nào.
- **Block** — Dừng yêu cầu và đóng hộp thoại. Không có gì được mở.

### Tùy chọn checkbox
Các checkbox xuất hiện bên trong hộp thoại. Mỗi checkbox gắn với một nút cụ thể:

**Khi nhấn Open once:**
- **Always allow [tên miền nguồn] to open new tabs** — Thêm tên miền nguồn vào danh sách cho phép. Tất cả các lần truy cập **từ** tên miền này trong tương lai sẽ được tự động cho phép.

**Khi nhấn Block:**
- **Always block [tên miền nguồn] from opening new tabs** — Thêm tên miền nguồn vào danh sách chặn. Tất cả các lần truy cập **từ** tên miền này trong tương lai sẽ bị chặn mà không cần hỏi.
- **Block all network requests to [tên miền đích]** — *(Chỉ hiện khi tên miền đích khác tên miền nguồn và chưa nằm trong danh sách nào.)* Thêm tên miền đích vào danh sách chặn mạng. Tất cả các request **đến** tên miền này (script, ảnh, iframe, v.v.) sẽ bị chặn ở tầng mạng qua `declarativeNetRequest`.

### Cài đặt qua popup tiện ích
Nhấn vào biểu tượng tiện ích để quản lý danh sách thủ công:

- **🚫 Block popups from domain** — Tên miền nguồn **không được phép** mở tab mới. Hỗ trợ wildcard `*.example.com`.
- **✅ Allow popups from domain** — Tên miền nguồn **được phép** mở tab mới tự do.
- **🔗 Block navigation to domain** — Tên miền đích bị chặn ở **tầng mạng** (tất cả loại tài nguyên).

Khi thêm tên miền vào một danh sách, nó sẽ tự động bị xóa khỏi hai danh sách còn lại.

### Danh sách cho phép mặc định
`allowlist.json` chứa danh sách các tên miền uy tín (Google, Facebook, ngân hàng, v.v.) luôn được phép. Các tên miền này không thể thêm vào danh sách chặn qua giao diện popup.

### Đồng bộ
Mọi thay đổi danh sách được đồng bộ ngay lập tức trên tất cả các tab đang mở qua `chrome.storage.sync`.

## Cài đặt
1. Tải và giải nén **[NoMoreTabs.zip](https://github.com/bibicadotnet/NoMoreTabs/releases/latest/download/NoMoreTabs.zip)**.
2. Mở `chrome://extensions/` trong trình duyệt.
3. Bật **Developer mode** (Chế độ nhà phát triển).
4. Nhấn **Load unpacked** (Tải tiện ích đã giải nén) và chọn thư mục vừa giải nén.
