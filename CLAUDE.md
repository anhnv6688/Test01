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

Sau khi đưa lên máy chủ, chạy thêm — bộ này soi bản ĐÃ TRIỂN KHAI qua mạng:

```bash
npm run kiem-moi-truong -- --goc https://oly.vn --cho that
```

Nó tự thử PIN `1234` và mã trực `truc2026` vào chính máy chủ đó rồi đòi bị từ
chối. Bài kiểm thử trong Node không làm được việc này: nó không biết máy chủ
ngoài kia được khởi động với biến môi trường nào. Xem `docs/moi-truong.md`.

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
| Bản đã triển khai từ chối mọi mã mặc định | — | `npm run kiem-moi-truong` |
| Hết hạn thuê bao không khóa lịch sử học; hủy dễ như mua | `domain/thue-bao.ts` | `thue-bao.test.ts` |
| Trang gắn nhãn khóa hẳn ở bản phát hành, không biến nào mở lại được | `server/kho-anh-do.ts` | `gan-nhan.test.ts` + `npm run kiem-giao-dien` |
| Ô Ly không công bố cổng ra máy chủ — Docker đi vòng qua ufw | `trien-khai/compose.caddy.yaml` | `trien-khai.test.ts` |
| Một ảnh đi qua cả hai môi trường; máy chủ không dựng lại | `trien-khai/compose.anh-ghcr.yaml` | `trien-khai.test.ts` |
| Triển khai không bao giờ tắt kiểm khóa máy chủ | `.github/workflows/dua-len.yml` | `trien-khai.test.ts` |

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

**Dữ liệu không bao giờ chảy ngược từ bản thật sang bản thử.** Chép cơ sở dữ
liệu thật sang một máy có mã yếu hơn và nhiều người vào hơn không phải là tiện
lợi, đó là một sự cố lộ dữ liệu trẻ em tự gây ra. Cần dữ liệu để thử thì sinh
ra. Lỗi chỉ tái hiện được trên dữ liệu thật thì lấy HÌNH DẠNG của nó — mã khuôn
dạng, hạt giống, mã lỗi — rồi dựng lại một ca giả cùng hình dạng; gần như lúc
nào cũng làm được, và nó còn để lại một bài kiểm thử. Xem `docs/moi-truong.md`.

**Hết hạn thuê bao chỉ dừng đúng một thứ: xử lý trang ảnh.** Lịch sử học của
con, phần luyện tập, bản tin tối và xuất dữ liệu giữ nguyên mãi — dữ liệu học là
của gia đình, không phải con tin để đòi gia hạn. Hằng số
`KHOA_LICH_SU_KHI_HET_HAN` phải luôn là `false`, và có bài kiểm thử chỉ đích
danh nó. Cũng đừng gộp ô bật trừ tiền định kỳ vào nút mua (CR-13).

## Dữ liệu thật của trẻ

Không bao giờ gọi nhà cung cấp xử lý ảnh thật bằng dữ liệu thật khi chưa bật đủ
ba cờ xác nhận đã ký thỏa thuận xử lý dữ liệu: `OLY_DPA_DA_KY`,
`OLY_DPA_CAM_HUAN_LUYEN`, `OLY_DPA_CAM_LUU_GIU`. Thiếu một cờ thì hệ thống tự
quay về bản giả lập và ghi cảnh báo — đừng gỡ chốt đó.

Ảnh trang vở để trong `bo-anh-do/` (đã nằm trong `.gitignore`), và phải được che
phần ghi tên, lớp, trường **trước khi** đưa vào thư mục. Đừng che tay — tay thì
chậm, và thứ gì chậm cũng có ngày bị bỏ qua:

```bash
npm run che-anh-do -- --tu ~/Downloads/anh-vo     # ảnh gốc để NGOÀI kho mã
```

Lệnh này chạy tại chỗ, tô đè đúng dải mà luồng phụ huynh tô đè (cùng hằng số,
có bài kiểm thử buộc hai bên bằng nhau — lệch nhau là bộ đo đo một thứ khác với
thứ đang chạy thật). Ảnh nằm ngang thì nó **từ chối** chứ không đoán: trang vở
khổ dọc, nên ảnh ngang nghĩa là điện thoại cầm ngang và dải họ tên nằm ở cạnh
bên. Che xong nó viết `bo-anh-do/xem-lai-che.html` — nhìn một lượt trước khi đi
tiếp, vì không phép đo tự động nào ở đây đọc được chữ để mà chắc.

Phụ huynh thì **không phải làm gì**: lớp che chạy sẵn trên máy họ
(`src/app/phu-huynh/chup/che-anh.ts`), dải mặc định đã bật từ đầu.

## Hai tệp không phải do người viết

`AGENTS.md` và phần lớn `tsconfig.json` do chính Next sinh ra và ghi đè lại mỗi
lần chạy `next dev`. Đừng sửa tay và đừng xóa — xóa thì lần chạy sau nó hiện lại
thành thay đổi chưa commit, làm bẩn cây làm việc của mọi người. Quy ước của kho
mã nằm ở tệp này (`CLAUDE.md`), không nằm ở đó.

## Bố cục

```
trien-khai/        kịch bản dựng máy chủ, Caddy, triển khai có đường lùi, sao lưu
src/lib/domain/    kho khuôn dạng, bẫy, thang gợi ý, chấm bài, lời giảng, chi phí
src/lib/privacy/   ba lớp bảo vệ, đồng ý theo mục đích, người đại diện, mốc 7 tuổi
src/lib/vision/    giao diện nhà cung cấp xử lý ảnh, bản thật và bản giả lập
src/lib/do-anh/    bộ đo độ chính xác trên ảnh thật, có bản diễn tập tự kiểm
src/lib/server/    cơ sở dữ liệu, kho dữ liệu, cổng, yêu cầu của người dùng
src/app/be/        bề mặt của trẻ — tuyệt đối không biết đáp án
src/app/phu-huynh/ bề mặt của phụ huynh
src/app/api/       chấm bài, mở gợi ý, xử lý ảnh — nơi duy nhất biết đáp án
docs/              ma trận truy vết, hướng dẫn bộ đo ảnh, vận hành máy chủ
```

## Gắn nhãn bộ ảnh đo

`npm run dev` rồi mở `/gan-nhan`. Trang đọc thẳng ảnh từ thư mục `bo-anh-do/`
(đổi bằng `OLY_THU_MUC_ANH`), ghi `nhan.json` ngay cạnh ảnh. Ảnh không rời máy
người gắn nhãn, và trang **khóa hẳn** ở bản phát hành — nó phục vụ ảnh chưa che
đọc thẳng từ đĩa, nên không có trường hợp dùng đúng nào trên máy chủ công khai.
Đừng thêm biến môi trường để bật lại.

Nhãn ghi thứ **trẻ đã viết**, không phải đáp án đúng. Trang có hiện kết luận của
bộ chấm, nhưng để đối chiếu với dấu mực đỏ của cô giáo trên chính trang vở đó —
lệch nhau nghĩa là hoặc gõ nhầm, hoặc bộ chấm có lỗi. Sửa nhãn cho thành đúng là
xóa mất tỷ lệ báo động giả, chỉ số nguy hiểm nhất của cả bộ đo.

## Đưa lên máy chủ

Đường thường dùng là `.github/workflows/dua-len.yml`: dựng **một** ảnh, đưa lên
bản thử, đạt thì đưa **đúng ảnh đó** sang bản thật. `trien-khai/trien-khai.sh`
là đường gõ tay cho lần đầu và lúc dò lỗi — nó dựng ngay trên máy chủ, nên đừng
dùng cho bản thật.

Xem `docs/vps-contabo.md`. Bốn điều không được quên: máy ngoài Việt Nam chỉ chạy
bản **thử**; đừng công bố cổng của Ô Ly ra máy chủ (Docker đi vòng qua ufw);
đừng xóa vùng đĩa của Caddy (Let's Encrypt có hạn mức xin chứng chỉ); và đừng
bao giờ thêm `StrictHostKeyChecking=no` vào lệnh SSH của phần triển khai.

## Thêm một dạng bài chấm được

Thêm nhánh vào `domain/cham-bai/dang-bai-lam.ts`, viết bộ chấm trong
`bo-cham.ts`, đăng ký ở `cham-bai/index.ts`. Câu lệnh `switch` ở đó có kiểm tra
`never`, nên quên viết bộ chấm là trình biên dịch báo lỗi ngay.

Dạng `chua-nhan-dang` phải luôn tồn tại: "mọi dạng bài" của một chương trình có
thật luôn rộng hơn danh sách mà đội phát triển nghĩ ra được, và nói thật với phụ
huynh rằng Ô Ly đọc được nhưng chưa dám kết luận thì tốt hơn là chấm bừa.
