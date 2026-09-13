# Ô Ly

Ứng dụng web học Toán cho học sinh tiểu học, dựng theo **Tài liệu yêu cầu nghiệp vụ
Ô Ly phiên bản 1.2**. Đây là bản dựng Giai đoạn 1 — lõi lớp 2 học kỳ 2 — chạy được
thật, gồm cả bề mặt của trẻ, bề mặt của phụ huynh và luồng chụp ảnh nhóm F.

> Đáp án thì ở đâu cũng có. Cái thiếu là biết con sai vì lý do gì.

## Chạy thử

```bash
npm install
npm run dev          # mở http://localhost:3000
```

Lần mở đầu tiên, ứng dụng tự tạo một hộ gia đình mẫu với hai bé (Bống lớp 2,
Cu Tí lớp 1) và dữ liệu nằm trong `.data/oly.sqlite`. **Mã PIN của phần dành cho
bố mẹ là `1234`.**

```bash
npm run kiem-tra     # kiểm kiểu, lint và toàn bộ 115 bài kiểm thử
npm test             # chỉ chạy kiểm thử
npm run build        # dựng bản phát hành
```

## Hai bề mặt, tách bạch

Đây là quyết định kiến trúc quan trọng nhất của sản phẩm, theo NT-10 và BR-03.

| | Bề mặt của trẻ `/be` | Bề mặt của phụ huynh `/phu-huynh` |
|---|---|---|
| Người dùng | Trẻ 6–8 tuổi | Bố mẹ |
| Vào bằng | Chạm vào hình của mình | Mã PIN bốn số |
| Nền | Giấy ô ly, nút to, màu tươi | Trắng ngà, nhiều chữ, màu trầm |
| Có lời giải đầy đủ | **Không bao giờ** | Có |
| Đáp án trong gói dữ liệu tải về | **Không có trường nào** | — |

Việc chấm bài diễn ra ở máy chủ. Máy của trẻ không bao giờ nhận được đáp án, kể
cả khi đã mở hết thang gợi ý, kể cả khi trẻ mở công cụ nhà phát triển. Có bốn bài
kiểm thử canh riêng điều này, xem `tests/khong-lo-dap-an.test.ts`.

## Kho nội dung

Kho chỉ lưu **khuôn dạng bài** — cấu trúc toán học cùng tham số và ràng buộc. Từ
một khuôn dạng sinh ra vô hạn bài cụ thể, nên kho hữu hạn mà trẻ luyện bốn tuần
không gặp lại bài cũ. Hiện có 12 khuôn dạng phủ 8 yêu cầu cần đạt của lớp 2 học
kỳ 2, mỗi khuôn dạng đều có bản ghi người duyệt và hồ sơ nguồn gốc.

Mỗi bài cụ thể tái dựng được từ cặp `(mã khuôn dạng, hạt ngẫu nhiên)`, nên máy
chủ không cần lưu đề đã sinh mà phụ huynh vẫn xem lại được đúng bài con đã làm.

**Ngân hàng bẫy** có 7 bẫy điển hình của trẻ lớp 1–2 — cho xăng-ti-mét nhưng hỏi
mét, năm cái cây chỉ có bốn khoảng, thấy "nhiều hơn" là cộng, quên nhớ khi cộng.
Mỗi khuôn dạng khai sẵn con số mà trẻ sẽ viết ra khi mắc từng bẫy, nên việc nhận
diện là tra bảng chứ không phải máy đoán.

**Thang gợi ý** có bốn bậc: đọc lại đề → nhìn hình → làm mẫu một bài tương tự →
chốt bước đầu tiên. Bậc cuối cùng vẫn không phải đáp án. Bài mẫu ở bậc ba được
chọn tự động sao cho không con số nào trong đó trùng đáp án của bài đang làm.

## Thiết kế ba lớp bảo vệ dữ liệu

Theo BR-32, BR-34, BR-35. Ba lớp phải làm đủ mới có giá trị.

1. **Che ảnh ngay trên thiết bị.** Trình duyệt vẽ ảnh lên canvas, tô đè hẳn dải
   đầu trang chứa họ tên — lớp — trường, rồi mới mã hóa. Pixel gốc của vùng đó
   không bao giờ được đóng gói vào yêu cầu mạng. Bước vẽ lại cũng rũ luôn EXIF.
   → `src/app/phu-huynh/chup/che-anh.ts`
2. **Gói gửi đi không kèm mã truy ngược.** Hàm dựng gói viết theo lối danh sách
   trắng: chỉ năm trường được liệt kê mới đi ra ngoài, thêm một trường mới là
   hành động có chủ ý.
   → `src/lib/privacy/envelope.ts`
3. **Xóa ảnh ngay sau khi trả kết quả.** Ảnh chỉ sống trong bộ nhớ tiến trình
   đúng một lần gọi, bị ghi đè bằng số không rồi xóa trong khối `finally`. Lược
   đồ cơ sở dữ liệu cố ý không có cột nào chứa ảnh.
   → `src/lib/privacy/retention.ts`

## Kinh tế vận hành

Chỉ **một** hành vi duy nhất trong toàn bộ mã nguồn bị đếm lượt: xử lý một trang
ảnh mới. Luyện tập trên kho khuôn dạng, xem lịch sử, đọc bản tin tối đều không
bao giờ bị giới hạn và không bao giờ bị khóa khi thuê bao hết hạn (BR-09, BR-19).

Lượt chỉ được ghi **sau khi** đã có kết quả trả về cho phụ huynh, nên một lần
máy đọc hỏng không tốn lượt của họ (BR-31).

Trần gói miễn phí đặt ở một chỗ duy nhất, `TRAN_MIEN_PHI_TRANG_THANG` trong
`src/lib/domain/pricing.ts`, để đổi được trong một dòng khi VM-07 được chốt.

## Bố cục mã nguồn

```
src/
  lib/domain/      kho khuôn dạng, ngân hàng bẫy, thang gợi ý, nhịp phiên,
                   phần thưởng theo nỗ lực, bản tin tối, chấm cột dọc, lời giảng
  lib/privacy/     ba lớp bảo vệ và cơ chế đồng ý theo từng mục đích
  lib/vision/      giao diện nhà cung cấp xử lý ảnh và bản giả lập
  lib/server/      cơ sở dữ liệu, kho dữ liệu, cổng mã PIN, yêu cầu của người dùng
  app/be/          bề mặt của trẻ
  app/phu-huynh/   bề mặt của phụ huynh
  app/api/         chấm bài, mở gợi ý, xử lý ảnh — nơi duy nhất biết đáp án
tests/             115 bài kiểm thử, phần lớn canh các yêu cầu bắt buộc
docs/              ma trận truy vết yêu cầu nghiệp vụ
```

## Những gì bản dựng này CHƯA làm

Nói rõ để không ai nhầm bản dựng này với sản phẩm sẵn sàng mở bán.

- **Chưa cắm nhà cung cấp xử lý ảnh thật.** `src/lib/vision/mock.ts` là bản giả
  lập cho kết quả tất định từ nội dung ảnh. Đây vừa là lựa chọn kỹ thuật vừa là
  lựa chọn tuân thủ: CR-03 và CR-16 đòi ký thỏa thuận xử lý dữ liệu trước khi xử
  lý dữ liệu thật. Đổi sang nhà cung cấp thật là viết một lớp cài đặt
  `NhaCungCapXuLyAnh` mới, không phải sửa luồng nghiệp vụ.
- **Chưa có tài khoản thật.** Mã PIN bốn số chỉ chặn một đứa trẻ tò mò, đúng
  mối đe dọa mà NT-10 cần chặn. Phần xác minh độ tuổi và sự đồng ý của người đại
  diện theo pháp luật (CR-05) chưa làm.
- **Chưa có thanh toán** (CR-12, CR-13). Gói cước hiện là dữ liệu tĩnh.
- **Kho nội dung mới có 12 khuôn dạng**, chưa phải khoảng 350 khuôn dạng mà
  GD-03 ước tính cần để phủ lớp 1–2.
- **BR-18 mới có chỗ cắm**, chưa có cơ chế thật để đánh dấu đề đầu vào nghi ngờ.
- Toàn bộ hạng mục Giai đoạn 2 và Giai đoạn 3 chưa làm, đúng như phạm vi đã
  duyệt.

Danh mục tuân thủ CR-01 đến CR-20 phần lớn là nghĩa vụ tổ chức và hồ sơ, không
phải hạng mục phần mềm. Phần nào thể hiện được trong sản phẩm thì đã thể hiện;
xem `docs/truy-vet-yeu-cau.md` để biết phần nào nằm ngoài mã nguồn.
