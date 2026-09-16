# Dựng và vận hành máy chủ

Viết cho máy Contabo Cloud VPS 4 tại Singapore (4 nhân, 8 GB, 100 GB), nhưng
chạy được trên bất kỳ máy ảo Debian hay Ubuntu nào.

## Trước khi gõ lệnh đầu tiên: máy này chạy bản THỬ

Cơ sở dữ liệu của Ô Ly chứa tên gọi của trẻ, khối lớp, **tháng năm sinh**, lịch
sử làm bài và số điện thoại đã băm của người đại diện. Ba lớp bảo vệ ở
`src/lib/privacy/` chỉ áp cho phần gửi ra bên xử lý ảnh — chúng **không** áp cho
chính cơ sở dữ liệu.

Nghị định 53/2022 buộc lưu trữ dữ liệu người dùng Việt Nam **tại Việt Nam**.
Singapore không phải Việt Nam.

Vì vậy:

| Máy | Dùng làm gì | Được phép có gì |
|---|---|---|
| **Contabo Singapore** | bản thử, bản trình diễn | chỉ dữ liệu giả và hộ mẫu |
| Máy đặt trong nước | bản phục vụ phụ huynh thật | dữ liệu thật |

Ranh giới nằm ở chỗ **có trẻ thật dùng hay chưa**, không nằm ở chỗ phần mềm
chạy thế nào. Nơi đặt bản thật là câu hỏi cho luật sư; Viettel IDC, VNPT Cloud,
FPT Cloud, CMC Cloud và AWS Local Zone Hà Nội đều là chỗ chạy được.

Và nhắc lại nguyên tắc ở `docs/moi-truong.md`: **dữ liệu không bao giờ chảy
ngược từ bản thật sang bản thử.** Đừng chép cơ sở dữ liệu thật sang máy
Singapore này để dò lỗi. Cần dữ liệu thì sinh ra.

## Máy này thừa so với nhu cầu, và đó là một điều tốt

Số đo thật (xem `docs/dua-len-mang.md`):

| Lúc nào | Bộ nhớ |
|---|---|
| Chạy, 30 phiên cùng lúc | **133 MB** |
| **Dựng bản phát hành** | **1.490 MB** |

8 GB nghĩa là dựng ảnh Docker **ngay trên máy** được, không phải dựng ở GitHub
Actions rồi tải về. Đơn giản hơn một bậc. Đổi lại, khi nào lên bản thật thì nên
quay về cách dựng một lần ở CI rồi đưa **cùng một ảnh** qua cả hai môi trường —
dựng lại cho bản thật là dựng một thứ khác với thứ vừa thử xong.

## Ba bước

### 1. Đưa khóa SSH lên máy, trước tất cả

Contabo giao máy với `root` kèm mật khẩu. Từ **máy của anh**:

```bash
ssh-keygen -t ed25519 -C "oly"        # nếu chưa có khóa
ssh-copy-id root@109.123.233.46
ssh root@109.123.233.46               # phải vào được mà KHÔNG hỏi mật khẩu
```

Bước này phải xong trước bước 2. Kịch bản dựng máy sẽ tắt đăng nhập bằng mật
khẩu, và nếu lúc đó chưa có khóa thì nó **bỏ qua** và kêu lên — nó cố tình
không khóa cửa khi anh chưa cầm chìa. Nhưng đừng để nó phải bỏ qua.

### 2. Dựng phần nền

```bash
ssh root@109.123.233.46
curl -fsSLO https://raw.githubusercontent.com/<kho>/<nhánh>/trien-khai/dung-may-chu.sh
bash dung-may-chu.sh oly
```

Nó làm: người dùng `oly` có sudo, tắt đăng nhập root và mật khẩu, tường lửa chỉ
mở 22/80/443, fail2ban, tự cài bản vá bảo mật, múi giờ Việt Nam, Docker, và
trần nhật ký cho thùng chứa. Chạy lại lần nữa không hỏng gì.

### 3. Triển khai Ô Ly

```bash
ssh oly@109.123.233.46
git clone <kho-mã> o-ly && cd o-ly
bash trien-khai/trien-khai.sh
```

Lần đầu nó sinh `.env` với mã trực ngẫu nhiên 32 ký tự và PIN hộ mẫu 6 chữ số,
rồi **in ra một lần duy nhất**. Chép ngay vào chỗ giữ mật khẩu.

Sau đó nó dựng ảnh, khởi động, **đợi trạng thái khỏe** (không phải trạng thái
"đang chạy" — một tiến trình vừa ném lỗi và đang chết vẫn đang chạy), rồi gõ
vào chính máy chủ vừa dựng để xem `/` trả 200 và `/gan-nhan` trả 404.

Bản mới không đứng dậy được thì nó **tự lùi về ảnh cũ** và báo. Đó là lý do có
kịch bản này thay vì một dòng `docker compose up -d`.

## Tên miền

Chưa có tên miền thì Caddy tự ký chứng chỉ, trình duyệt sẽ kêu "kết nối không
riêng tư". Chấp nhận được cho bản thử, **không** chấp nhận được cho bản thật:
đường này chở mã PIN của bố mẹ, mã một lần gửi qua điện thoại và ảnh trang vở.

Có tên miền rồi thì trỏ bản ghi A về `109.123.233.46`, đợi DNS lan, rồi:

```bash
sed -i 's/^OLY_TEN_MIEN=.*/OLY_TEN_MIEN=thu.oly.vn/' .env
bash trien-khai/trien-khai.sh
```

Caddy tự xin chứng chỉ Let's Encrypt và tự gia hạn. Không phải làm gì thêm.

## Sau khi lên

Từ **máy của anh**, không phải từ máy chủ:

```bash
npm run kiem-moi-truong -- --goc https://thu.oly.vn --cho thu
```

Bộ này tự thử PIN `1234` và mã trực `truc2026` vào chính máy chủ đó rồi **đòi bị
từ chối**. Hơn bốn trăm bài kiểm thử trong Node không làm được việc này: chúng
không biết máy ngoài kia được khởi động với biến môi trường nào.

Rồi bật sao lưu:

```bash
bash trien-khai/sao-luu.sh --cai-lich
```

## Vận hành hằng ngày

```bash
cd ~/o-ly
docker compose -f compose.yaml -f compose.thu.yaml -f trien-khai/compose.caddy.yaml logs -f o-ly
bash trien-khai/trien-khai.sh                    # triển khai bản mới
bash trien-khai/sao-luu.sh                       # sao lưu ngay
bash trien-khai/sao-luu.sh --phuc-hoi <tệp.gz>   # ĐÈ dữ liệu đang chạy
```

Sao lưu dùng lệnh của chính SQLite chứ không chép tệp — chép giữa một giao dịch
sẽ ra bản sao đứt đoạn mà **mở lên vẫn thấy có dữ liệu**, nên không ai biết là
hỏng cho tới hôm cần dùng. Mỗi bản sao được **mở thử ngay sau khi tạo** vì cùng
lý do đó.

Bản sao nằm trên chính máy này, nên ổ hỏng là mất cả gốc lẫn sao. Chuyển một bản
ra ngoài mỗi tuần, và **mã hóa trước khi chuyển**: tệp đó có tên, khối lớp và
tháng năm sinh của từng đứa trẻ.

## Hai cái bẫy đã tránh sẵn, đừng gỡ ra

**Docker đi vòng qua ufw.** Docker tự viết luật iptables ở một bảng nằm trước
luật của ufw, nên một dòng `ports: "3000:3000"` mở cổng 3000 ra thẳng Internet
ngay cả khi `ufw status` nói cổng đó bị chặn — tường lửa báo xanh trong khi cửa
vẫn mở. `trien-khai/compose.caddy.yaml` vì thế bỏ hẳn việc công bố cổng của
Ô Ly; chỉ Caddy gọi tới được, qua mạng nội bộ của Docker.

**Vùng đĩa của Caddy giữ chứng chỉ.** Xóa `caddy-du-lieu` là xin chứng chỉ mới,
mà Let's Encrypt có hạn mức mỗi tuần. Xóa vài lần là bị khóa mất mấy ngày, đúng
vào lúc đang cần lên lại.

## Còn thiếu gì trước khi có phụ huynh thật

Những thứ dưới đây **không** phải việc của máy chủ, nhưng chúng chặn ngày mở bán
chứ không phải máy chủ:

- Đặt máy trong nước (Nghị định 53) — xem phần đầu.
- Cổng tin nhắn thật. Hiện đang chạy bản giả lập, nên mức xác minh ghi vào hồ sơ
  là `otp-gia-lap` chứ không phải `otp-dien-thoai`. Đó là ghi đúng sự thật, và
  đừng bao giờ sửa nó thành mức mạnh hơn thứ đã thật sự xảy ra.
- Cổng thanh toán thật.
- Ba cờ thỏa thuận xử lý dữ liệu (`OLY_DPA_*`) trước khi gọi mô hình đọc ảnh
  bằng ảnh thật của trẻ.
- Bảng trực hiện vào bằng một mã chung. Trước khi có người dùng thật, phần này
  phải thành tài khoản nhân sự có phân quyền và có nhật ký đăng nhập.

Đọc `docs/truy-vet-yeu-cau.md` phần điều kiện ra mắt. Phần mềm chạy được không
có nghĩa là đủ điều kiện mở bán.
