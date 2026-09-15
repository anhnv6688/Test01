# Ô Ly — quy ước của kho mã

Sản phẩm dạy toán cho trẻ lớp 1–2 ở Việt Nam và cho bố mẹ các em. Tài liệu yêu
cầu nghiệp vụ là nguồn sự thật; `docs/truy-vet-yeu-cau.md` nối từng yêu cầu tới
chỗ thực hiện nó trong mã nguồn.

## Trước khi gửi mã

```bash
npm run kiem-tra           # kiểm kiểu, lint, toàn bộ kiểm thử
npm run khong-ro-ri        # không có ảnh hay dữ liệu của trẻ lọt vào kho mã
npm run kiem-giao-dien     # dựng bản phát hành rồi mở bằng trình duyệt thật
npm run kiem-giao-dien-dev # kiểm luôn chế độ phát triển
```

**Đụng vào giao diện thì phải chạy `kiem-giao-dien`.** Hơn ba trăm bài kiểm thử
kia chạy trong Node và **không dựng lấy một điểm ảnh nào** — chúng từng để lọt
một lỗi làm mọi hình minh họa co về bề rộng 0 trên màn hình của trẻ, biến bài
hình học thành bài đọc hiểu. Kiểm cả hai chế độ, vì bản phát triển gọi hiệu ứng
React hai lần và đã từng treo màn hình trong khi bản phát hành vẫn chạy tốt.

Cài đặt bằng `npm ci` hoặc `npm install`, **không cần** `--legacy-peer-deps`.
Nếu có lúc nào phải thêm cờ đó thì đấy là dấu hiệu cây phụ thuộc đã lệch, hãy
sửa cây phụ thuộc chứ đừng thêm cờ.

## Ngôn ngữ

Mọi thứ viết bằng **tiếng Việt**: tên hàm, tên biến, tên tệp, chú thích, thông
điệp giao diện, thông điệp commit. Đây là sản phẩm cho người Việt và người bảo
trì là người Việt.

Ngoại lệ duy nhất là những gì hệ sinh thái bắt buộc: `page.tsx`, `POST`,
`useState`, tên cột của thư viện bên thứ ba.

## Chú thích giải thích VÌ SAO, không kể lại mã làm gì

Mã nguồn đã nói nó làm gì. Chú thích để lại cái người đọc sau không tự suy ra
được: vì sao chọn cách này, đã cân nhắc cách nào khác, và hỏng chuyện gì nếu ai
đó "dọn dẹp" nó đi. Chỗ nào đánh đổi giữa hai cái đều có lý, hãy viết ra cả hai
phía rồi nói vì sao chọn phía này.

Nếu một quyết định chỉ đúng vì một ràng buộc nghiệp vụ hay pháp lý, hãy nêu mã
của ràng buộc đó (BR-xx, NT-xx, CR-xx, RR-xx) để người sau tra lại được.

## Những điều không được phá vỡ

Mỗi điều dưới đây có bài kiểm thử canh. Bài kiểm thử ấy **không phải** thủ tục
hành chính — nó là chỗ duy nhất phát hiện ra khi một thay đổi trông vô hại làm
hỏng lời hứa của sản phẩm.

| Điều | Ở đâu | Kiểm thử |
|---|---|---|
| Đáp án không bao giờ tới bề mặt của trẻ | `domain/present.ts` | `khong-lo-dap-an.test.ts` |
| Không quảng cáo, không xếp hạng, không nhận dạng khuôn mặt, không nét chữ | toàn kho | `nguyen-tac-bat-di-bat-dich.test.ts` |
| Ba lớp bảo vệ ảnh: che tại máy, danh sách trắng, xóa ảnh | `privacy/` | `ba-lop-bao-ve.test.ts` |
| Trẻ từ đủ 7 tuổi phải tự đồng ý, tính lại theo thời gian | `privacy/tuoi.ts` | `nguoi-giam-ho.test.ts` |
| Ảnh và dữ liệu của trẻ không vào kho mã | `scripts/khong-ro-ri.ts` | `khong-ro-ri.test.ts` |
| Mã một lần và số điện thoại không lưu dạng rõ; mức xác minh phải giành được | `privacy/ma-mot-lan.ts` | `ma-mot-lan.test.ts` |
| Hình minh họa phải hiện ra thật, không co về 0 | `components/Visual.tsx` | `npm run kiem-giao-dien` |
| Bản phát hành không tự dựng hộ mẫu, mã trực thiếu thì khóa hẳn | `server/moi-truong.ts` | `cau-hinh-phat-hanh.test.ts` |

Nếu một thay đổi làm những bài này trượt, **sửa thay đổi, đừng sửa bài kiểm
thử** — trừ khi chủ đầu tư đã đổi chính yêu cầu nghiệp vụ, và khi đó phải sửa
cả `docs/truy-vet-yeu-cau.md` trong cùng một lần gửi mã.

## Bốn quyết định kiến trúc hay bị hiểu nhầm

**Mô hình phiên âm, mã nguồn chấm.** Bên xử lý ảnh chỉ đọc chữ trên giấy thành
dữ liệu có cấu trúc; nó **không bao giờ** kết luận đúng sai. Lược đồ gửi cho mô
hình không có trường `dung`, `correct` hay `diem`, và có bài kiểm thử quét mã để
không ai thêm vào. Phép cộng trừ thì mã nguồn không bao giờ sai; mô hình ngôn
ngữ thì có lúc sai.

**Hai tầng, hai mô hình.** Mọi trang đều được mô hình rẻ phiên âm. Chỉ đề là bài
toán có lời văn — thứ mã nguồn không giải được — mới gọi thêm mô hình mạnh để
soạn lời giảng. Đây là chỗ quyết định chi phí biến đổi; xem
`domain/mo-hinh-chi-phi.ts`.

**Đáp án chỉ tồn tại ở máy chủ.** `sinhBai()` là cổng duy nhất tạo ra bài, và
`guiChoTre()` là cổng duy nhất đưa bài ra ngoài — nó cắt bỏ `answer` và `traps`.
Có bài kiểm thử quét hệ thống tệp để cấm `src/app/be` nhập kho khuôn dạng hay bộ
chấm.

**Nhật ký xử lý yêu cầu không có khóa ngoại, và không được có dữ liệu cá nhân.**
Khi một hộ yêu cầu xóa dữ liệu và Ô Ly xóa thật, dấu vết "đã nhận yêu cầu này,
xử lý lúc này, đúng hạn hay không" phải sống sót. Nếu bảng đó cũng bị xóa dây
chuyền thì việc tuân thủ tốt nhất lại xóa mất bằng chứng tuân thủ.

**Hình minh họa là một phần của lời hứa, không phải trang trí.** BR-01 nói không
chặn con ở khâu đọc. Nếu hình biến mất thì bài hình học lặng lẽ thành bài đọc
hiểu, mà không bài kiểm thử nào trong Node thấy được. Đừng bọc `<Visual>` bằng
`flex`: phần tử flex co lại vừa nội dung, nên mọi hình tính theo phần trăm hay
theo `w-full` đều teo.

**Mức xác minh ghi đúng thứ đã thật sự xảy ra.** `mucDatDuocQuaMaMotLan()` là
chỗ duy nhất quyết định ghi mức nào, và nó nhận vào sự thật kỹ thuật — tin nhắn
có được gửi ra ngoài không — chứ không nhận lời khai từ biểu mẫu. Đừng bao giờ
thêm lại một ô cho người dùng tự chọn mức xác minh: ghi mức mạnh hơn thứ đã làm
là tạo ra hồ sơ trông như đã tuân thủ trong khi không có gì được xác minh.

**Tiện nghi của bản phát triển không được theo lên máy chủ.** Hộ mẫu, PIN 1234,
mã trực đoán được — cả ba tự tắt khi `NODE_ENV=production`, và chỉ bật lại bằng
khai báo có chủ ý ở `src/lib/server/moi-truong.ts`. Mã trực thiếu thì bảng trực
**khóa hẳn**, tuyệt đối không rơi về mã mặc định: bảng đó xuất và xóa được dữ
liệu của các hộ. Đừng thêm giá trị mặc định nào vào các hàm trong tệp đó.

## Dữ liệu thật của trẻ

Không bao giờ gọi nhà cung cấp xử lý ảnh thật bằng dữ liệu thật khi chưa bật đủ
ba cờ xác nhận đã ký thỏa thuận xử lý dữ liệu: `OLY_DPA_DA_KY`,
`OLY_DPA_CAM_HUAN_LUYEN`, `OLY_DPA_CAM_LUU_GIU`. Thiếu một cờ thì hệ thống tự
quay về bản giả lập và ghi cảnh báo — đừng gỡ chốt đó.

Ảnh trang vở để trong `bo-anh-do/` (đã nằm trong `.gitignore`), và phải được che
phần ghi tên, lớp, trường **trước khi** đưa vào thư mục.

## Hai tệp không phải do người viết

`AGENTS.md` và phần lớn `tsconfig.json` do chính Next sinh ra và ghi đè lại mỗi
lần chạy `next dev`. Đừng sửa tay và đừng xóa — xóa thì lần chạy sau nó hiện lại
thành thay đổi chưa commit, làm bẩn cây làm việc của mọi người. Quy ước của kho
mã nằm ở tệp này (`CLAUDE.md`), không nằm ở đó.

## Bố cục

```
src/lib/domain/    kho khuôn dạng, bẫy, thang gợi ý, chấm bài, lời giảng, chi phí
src/lib/privacy/   ba lớp bảo vệ, đồng ý theo mục đích, người đại diện, mốc 7 tuổi
src/lib/vision/    giao diện nhà cung cấp xử lý ảnh, bản thật và bản giả lập
src/lib/do-anh/    bộ đo độ chính xác trên ảnh thật, có bản diễn tập tự kiểm
src/lib/server/    cơ sở dữ liệu, kho dữ liệu, cổng, yêu cầu của người dùng
src/app/be/        bề mặt của trẻ — tuyệt đối không biết đáp án
src/app/phu-huynh/ bề mặt của phụ huynh
src/app/api/       chấm bài, mở gợi ý, xử lý ảnh — nơi duy nhất biết đáp án
docs/              ma trận truy vết, hướng dẫn bộ đo ảnh
```

## Thêm một dạng bài chấm được

Thêm nhánh vào `domain/cham-bai/dang-bai-lam.ts`, viết bộ chấm trong
`bo-cham.ts`, đăng ký ở `cham-bai/index.ts`. Câu lệnh `switch` ở đó có kiểm tra
`never`, nên quên viết bộ chấm là trình biên dịch báo lỗi ngay.

Dạng `chua-nhan-dang` phải luôn tồn tại: "mọi dạng bài" của một chương trình có
thật luôn rộng hơn danh sách mà đội phát triển nghĩ ra được, và nói thật với phụ
huynh rằng Ô Ly đọc được nhưng chưa dám kết luận thì tốt hơn là chấm bừa.
