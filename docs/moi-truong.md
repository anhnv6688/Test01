# Môi trường thử và môi trường thật

Ba nơi, và ranh giới quan trọng nhất giữa chúng **không phải là mã nguồn** —
mã nguồn giống hệt nhau. Ranh giới là **dữ liệu**.

| | Máy người viết mã | Bản thử | Bản thật |
|---|---|---|---|
| `OLY_MOI_TRUONG` | (để trống) | `thu` | `that` |
| `NODE_ENV` | `development` | `production` | `production` |
| Dữ liệu | hộ mẫu tự dựng | **dữ liệu giả** | dữ liệu thật của các hộ |
| Mã PIN hộ mẫu | `1234` | đặt tùy ý | không có hộ mẫu |
| Bảng trực | mã mặc định | mã riêng | **mã riêng, bắt buộc** |
| Đọc ảnh | bản giả lập | thật, **khóa API riêng** | thật |
| Tin nhắn | bản giả lập | bản giả lập | thật |
| Máy tìm kiếm | — | **chặn hết** | chỉ mở trang giới thiệu |

## Bốn nguyên tắc

### 1. Dữ liệu không bao giờ chảy ngược

Cách làm quen thuộc ở nhiều nơi là chép cơ sở dữ liệu thật sang bản thử để dò
lỗi cho giống thật. **Ở đây thì không.** Cơ sở dữ liệu của Ô Ly chứa tên gọi,
khối lớp, tháng năm sinh và lịch sử làm bài của trẻ em. Chép nó sang một máy có
mã yếu hơn, ít người canh hơn, nhiều người có quyền vào hơn — đó không phải là
tiện lợi, đó là một sự cố lộ dữ liệu tự gây ra.

Cần dữ liệu để thử thì **sinh ra**, đừng chép. Bản thử bật `OLY_DU_LIEU_MAU` là
có hộ mẫu; cần nhiều hơn thì viết thêm phần sinh dữ liệu giả, đừng lấy của thật.

Nếu có lỗi chỉ tái hiện được trên dữ liệu thật: lấy **hình dạng** của dữ liệu đó
(mã khuôn dạng, hạt giống, mã lỗi) rồi dựng lại một ca giả có cùng hình dạng.
Gần như lúc nào cũng làm được, và nó còn để lại một bài kiểm thử.

### 2. Một ảnh Docker đi qua cả hai

Dựng đúng **một lần** ở phần chạy tự động, gắn nhãn bằng mã băm của lần gửi mã,
rồi đưa **cùng ảnh đó** sang bản thử, và khi đạt thì sang bản thật.

Đừng dựng lại cho bản thật. Dựng lại là một lần biên dịch khác, một cây phụ
thuộc có thể khác — nghĩa là thứ đưa lên bản thật không phải thứ vừa thử xong,
và toàn bộ việc thử mất ý nghĩa.

Vì vậy `robots.txt` được **sinh lúc chạy** chứ không phải tệp tĩnh: cùng một ảnh
phải trả lời khác nhau ở hai môi trường.

### 3. Khác nhau chỉ ở biến môi trường

Mọi khác biệt giữa thử và thật đều nằm ở biến môi trường, và chốt nằm gọn trong
`src/lib/server/moi-truong.ts`. Không có `if (laBanThu())` rải rác trong mã
nghiệp vụ — rải ra thì sớm muộn hai môi trường chạy hai đường mã khác nhau, và
bản thử thôi không còn thử được bản thật nữa.

Bản phát hành mà **quên** khai `OLY_MOI_TRUONG` thì được coi là **thật**. Đoán
nhầm theo hướng đó thì hậu quả là chặt hơn cần thiết; đoán nhầm theo hướng kia
thì những nới lỏng của bản thử áp lên dữ liệu của trẻ thật.

### 4. Khóa API của bản thử phải khác bản thật

Bản thử gọi mô hình đọc ảnh thật — nếu không thì nó không thử được đúng cái đắt
nhất và dễ hỏng nhất. Nhưng dùng **khóa riêng**, để hóa đơn tách bạch và để rút
khóa của bản thử không đụng tới người dùng thật.

Và bản thử chỉ được gửi **ảnh giả hoặc ảnh đo đã che**, không bao giờ gửi ảnh
trang vở của trẻ thật. Ba cờ `OLY_DPA_*` vẫn phải bật đúng như bản thật.

## Thứ tự đưa lên

```bash
# 1. Phần chạy tự động dựng ảnh, gắn nhãn bằng mã băm lần gửi mã
docker build -t o-ly:$(git rev-parse --short HEAD) .

# 2. Đưa lên bản thử
docker compose -f compose.yaml -f compose.thu.yaml up -d

# 3. Soi bản thử bằng trình duyệt thật
npm run kiem-giao-dien -- --goc https://thu.oly.vn
npm run kiem-moi-truong -- --goc https://thu.oly.vn --cho thu

# 4. Đạt thì đưa ĐÚNG ảnh đó sang bản thật
docker compose -f compose.yaml -f compose.that.yaml up -d

# 5. Soi lại bản thật
npm run kiem-moi-truong -- --goc https://oly.vn --cho that
```

## Vì sao có `kiem-moi-truong` dù đã có `cau-hinh-phat-hanh.test.ts`

Bài kiểm thử kia chứng minh **hàm** trả về đúng, nhưng nó chạy trong Node trên
máy người viết mã. Nó không biết máy chủ ngoài kia được khởi động với biến môi
trường nào. Một bản triển khai quên đặt `OLY_MA_TRUC`, hoặc lỡ bật
`OLY_DU_LIEU_MAU` với PIN `1234` trên bản thật, sẽ **qua sạch mọi bài kiểm thử**
rồi mở toang cửa trên mạng.

Nên `kiem-moi-truong` làm một việc khác hẳn: nó **tự tấn công máy chủ của chính
mình** bằng đúng những mã mặc định mà kho mã từng dùng — PIN `1234` và mã trực
`truc2026` — rồi đòi bị từ chối.

Nói "chúng tôi đã tắt PIN 1234" thì nhẹ hơn hẳn so với "chúng tôi đã thử đăng
nhập bằng 1234 vào chính máy thật và bị từ chối".

Nó cũng kiểm HTTPS, chuyển hướng từ HTTP, `robots.txt` theo môi trường, và các
tiêu đề khoe phần mềm máy chủ.

## Sao lưu: hai môi trường, hai chính sách

Bản thật: sao lưu đều, mã hóa nơi lưu, hạn chế người truy cập. Xem phần sao lưu
ở `docs/dua-len-mang.md`.

Bản thử: **không cần sao lưu**. Dữ liệu ở đó là dữ liệu giả, mất thì sinh lại.
Nếu có lúc nào thấy tiếc dữ liệu trên bản thử, đó là dấu hiệu nguyên tắc số 1 đã
bị vi phạm từ lúc nào rồi.
