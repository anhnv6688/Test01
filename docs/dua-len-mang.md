# Đưa Ô Ly lên mạng

Bản dựng này chạy được bằng một lệnh. Nhưng trước khi gõ lệnh đó, có ba điều
phải biết — và điều thứ ba mới là điều quan trọng nhất.

## 1. Ô Ly cần một ổ đĩa giữ lâu dài, không chạy được trên nền không máy chủ

Dữ liệu nằm trong một tệp SQLite. Nghĩa là **Vercel, Netlify Functions,
Cloudflare Workers và mọi nền tảng "serverless" đều KHÔNG chạy được** — chúng
cho mỗi lần gọi một hệ tệp tạm, nên mỗi lần khởi động lại là mất sạch tài khoản,
lịch sử học và bằng chứng đồng ý.

Chỗ chạy được là nơi có ổ đĩa gắn kèm: một máy chủ ảo bình thường, Fly.io có
volume, Railway có volume, hoặc bất kỳ máy nào chạy được Docker.

Đây là một đánh đổi có chủ ý chứ không phải thiếu sót. SQLite giữ cho phần kho
dữ liệu đơn giản, chạy được ngoại tuyến khi phát triển, và kiểm thử được mà
không cần dựng máy chủ cơ sở dữ liệu. Khi nào lượng hộ đủ lớn để một máy không
gánh nổi thì đổi sang Postgres, và chỗ phải sửa nằm gọn trong
`src/lib/server/`.

## 2. Ba khai báo bắt buộc, và vì sao chúng không có giá trị mặc định

| Biến | Bắt buộc | Nếu thiếu |
|---|---|---|
| `OLY_MA_TRUC` | **Có** | Bảng trực khóa hẳn. Không ai xử lý được yêu cầu gỡ bỏ hay yêu cầu dữ liệu đúng hạn (CR-06) |
| `OLY_DB` | Nên đặt | Cơ sở dữ liệu rơi vào thư mục làm việc, mất sau mỗi lần khởi động lại |
| `OLY_DU_LIEU_MAU` | Không | Bật thì có hộ mẫu để mở thử. Bản phục vụ người thật **đừng bật** |
| `OLY_PIN_MAU` | Nếu bật hộ mẫu | 4 tới 8 chữ số. Không đặt thì hộ mẫu không được dựng |

Bản dựng phát triển cố tình dễ tính: có sẵn hộ mẫu, PIN `1234`, mã trực đoán
được. Nhờ vậy mở máy ra là chạy ngay. Trên một địa chỉ công khai thì đúng ba thứ
đó là ba lỗ hổng, nên chúng **tự tắt** khi `NODE_ENV=production` và chỉ bật lại
được bằng khai báo có chủ ý. Chốt nằm ở `src/lib/server/moi-truong.ts` và có bài
kiểm thử canh (`tests/cau-hinh-phat-hanh.test.ts`).

Máy chủ in ra danh sách thiếu gì ngay lúc khởi động. Đọc dòng đó trước khi mở
cho ai vào.

## 3. Máy chủ đặt ở đâu là một câu hỏi pháp lý, không phải câu hỏi kỹ thuật

Cơ sở dữ liệu này chứa **dữ liệu cá nhân của trẻ em**: tên gọi, khối lớp, tháng
năm sinh, lịch sử làm bài, và bằng chứng đồng ý. Toàn bộ kiến trúc khử nhận dạng
ở `src/lib/privacy/` chỉ áp cho phần gửi ra bên xử lý ảnh — nó **không** áp cho
chính cơ sở dữ liệu.

Vì vậy chọn nơi đặt máy chủ là chọn nơi lưu trữ dữ liệu trẻ em, và việc đó có
ràng buộc pháp lý ở Việt Nam. Hỏi luật sư trước, đừng chọn theo giá thuê.

Riêng bản **trình diễn** chỉ có hộ mẫu do chính mình dựng thì không có dữ liệu
của ai cả, nên đặt đâu cũng được. Ranh giới nằm ở chỗ có người thật dùng hay
chưa, chứ không ở chỗ phần mềm chạy thế nào.

## Chạy bằng Docker

```bash
cp .env.example .env
# Mở .env, đặt OLY_MA_TRUC thành một chuỗi dài khó đoán.
# Muốn có hộ mẫu để mở thử thì đặt thêm:
#   OLY_DU_LIEU_MAU=true
#   OLY_PIN_MAU=884417

docker compose up -d --build
```

Mở `http://<địa-chỉ-máy>:3000`. Xong.

Đằng sau một bộ định tuyến ngược (nginx, Caddy, Traefik) thì trỏ vào cổng 3000
và bật HTTPS ở lớp đó. **Phải có HTTPS**: mã PIN của bố mẹ, mã một lần gửi qua
điện thoại và ảnh trang vở đều đi qua đường này.

## Chạy không cần Docker

```bash
npm ci
npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/

cd .next/standalone
NODE_ENV=production \
OLY_DB=/du-lieu/oly.sqlite \
OLY_MA_TRUC="chuỗi-dài-khó-đoán" \
PORT=3000 \
node server.js
```

Hai dòng `cp` là bắt buộc: bản phát hành gọn (`output: "standalone"`) không tự
chép tệp tĩnh và thư mục `public` vào, nên thiếu chúng thì trang lên được nhưng
mất sạch định dạng và biểu tượng.

## Sao lưu

Toàn bộ dữ liệu nằm trong đúng một tệp. Sao lưu là chép tệp đó, nhưng **đừng
chép khi máy chủ đang chạy** — chép giữa chừng một giao dịch sẽ ra một bản sao
hỏng. Dùng lệnh sao lưu của chính SQLite:

```bash
docker compose exec o-ly \
  node -e "const D=require('better-sqlite3');new D(process.env.OLY_DB).backup('/du-lieu/ban-sao.sqlite').then(()=>console.log('xong'))"
```

Bản sao này chứa dữ liệu cá nhân của trẻ em. Giữ nó như giữ chính cơ sở dữ liệu:
mã hóa nơi lưu, hạn chế người truy cập, và xóa theo cùng một chính sách.

## Sau khi lên mạng

Ba việc, theo thứ tự:

1. Mở `/truc`, đăng nhập bằng `OLY_MA_TRUC`, xem bảng trực có lên không. Đây là
   chỗ xử lý yêu cầu gỡ bỏ và yêu cầu dữ liệu đúng hạn — có người trực thật thì
   mới đạt điều kiện ra mắt số 5.
2. Chạy `npm run kiem-giao-dien -- --goc https://<địa-chỉ>` để soi bản đang chạy
   bằng trình duyệt thật, không chỉ xem trang có lên 200 hay không.
3. Đọc lại `docs/truy-vet-yeu-cau.md` phần điều kiện ra mắt. Phần mềm chạy được
   không có nghĩa là đủ điều kiện mở bán.
