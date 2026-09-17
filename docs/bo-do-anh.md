# Bộ đo ảnh

Thư mục ảnh vào, bảng độ chính xác ra. Bộ đo này tồn tại để trả lời bốn câu hỏi,
và chỉ bốn câu đó:

1. Ô Ly đọc đúng được bao nhiêu, và **hỏng ở đâu** — dạng bài nào, ánh sáng nào.
2. Bao nhiêu lần Ô Ly nói sai về bài của trẻ (điều kiện ra mắt số 9).
3. Một trang tốn **thật** bao nhiêu tiền (điều kiện ra mắt số 3).
4. Phụ huynh phải chờ bao lâu.

Bộ đo **không** tự đặt ngưỡng đạt hay không đạt. BRD nói ngưỡng do chủ đầu tư
đặt, nên ở đây chỉ có số đo; ai đặt ngưỡng thì so lấy.

## Chạy thử ngay hôm nay, chưa cần ảnh

```
npm run do-anh
```

Lệnh này chạy ở **chế độ diễn tập**: nó tự sinh một bộ ảnh giả, tự gài vào đó
một số lỗi đã biết trước, rồi đòi bộ đo nêu đúng những lỗi ấy ra.

Mọi con số nó in ra đều là số diễn tập và **không nói gì về sản phẩm thật**.
Việc của nó là chứng minh cái thước đo chạy được và bắt được lỗi, trước khi có
ảnh thật. Một bộ đo chưa ai thử thì lúc chạy trên ảnh thật mà báo "0 báo động
giả", con số đó có thể nghĩa là sản phẩm tốt, mà cũng có thể nghĩa là hàm so
sánh hỏng — và không cách nào phân biệt.

Dòng cuối của bản in nói bộ đo có tự kiểm được không. Nếu nó báo LỆCH thì sửa bộ
đo trước đã, đừng mang ra dùng trên ảnh thật.

## Chụp cái gì

Hai luồng khác nhau, cần hai loại ảnh khác nhau:

| Luồng | Chụp cái gì | `loaiViec` |
|---|---|---|
| Chấm bài con làm | **Vở bài tập của con, có chữ con viết** | `cham-bai-lam` |
| Giảng đề cho phụ huynh | **Đề trong sách giáo khoa**, chưa làm | `doc-de-bai` |

Phần lớn bộ ảnh nên là loại thứ nhất, vì đó là việc phụ huynh làm nhiều nhất và
cũng là chỗ Ô Ly có thể nói sai về con họ.

## Trước khi đưa ảnh vào thư mục: che phần ghi tên

**Che kín phần đầu trang ghi tên con, lớp và trường** (BR-32). Che bằng máy:

```bash
npm run che-anh-do -- --tu ~/Downloads/anh-vo
```

Để ảnh gốc ở một thư mục **ngoài kho mã**. Lệnh này không sửa gì trong đó; nó
đọc từng ảnh, tô đè dải đầu trang, rồi ghi bản đã che sang `bo-anh-do/`. Bản đã
che là thứ duy nhất đi tiếp. Vẽ qua canvas nên siêu dữ liệu EXIF — trong đó có
tọa độ nơi chụp — cũng rụng luôn.

Dải che lấy thẳng hằng số của luồng phụ huynh, không đặt một con số riêng, và có
bài kiểm thử buộc hai bên bằng nhau. Đó không phải chuyện gọn gàng: bộ đo phải
đo thứ mô hình **thật sự** nhìn thấy khi chạy thật. Che rộng hơn thì báo cáo bi
quan hơn thực tế; che hẹp hơn thì báo cáo lạc quan hơn thực tế, và còn để lọt
tên trẻ.

**Ảnh nằm ngang thì lệnh từ chối, không đoán.** Trang vở khổ dọc; ảnh nằm ngang
nghĩa là điện thoại cầm ngang (`xoay-90`) và dải họ tên nằm ở cạnh bên, hoặc
chụp cả hai trang mở ra. Tô đè dải trên cùng trong hai trường hợp ấy là xóa một
dải giấy trắng rồi báo "đã che" trong khi tên trẻ còn nguyên — tệ hơn hẳn không
che, vì nó tạo ra niềm tin sai. Chạy lại riêng những ảnh đó:

```bash
npm run che-anh-do -- --tu ~/Downloads/xoay-ngang --canh trai
npm run che-anh-do -- --tu ~/Downloads/le-thap   --day 0.24
```

**Rồi nhìn một lượt.** Lệnh viết ra `bo-anh-do/xem-lai-che.html`, mở lên là thấy
hết ảnh đã che trên một trang. Đừng bỏ bước này: dải che nằm ở chỗ tên **thường**
nằm, mà "thường" không phải "luôn" — có trang ghi tên chen vào giữa, có ảnh chụp
lệch làm dải tên tụt xuống dưới vạch. Không phép đo tự động nào ở đây đọc được
chữ để mà chắc, và nếu có thì chính nó đã đọc tên trẻ rồi. Một đôi mắt, một lần,
một trang — vẫn ít hơn hẳn việc che tay từng ảnh.

Lời phê của cô giáo: che phần **chữ viết** của cô nếu có (RR-13), nhưng giữ lại
dấu mực đỏ chấm đúng/sai — trang gắn nhãn dùng chính những dấu ấy để đối chiếu,
và đó là chỗ phát hiện ra bộ chấm sai.

Thư mục `bo-anh-do/` đã nằm trong `.gitignore`, và `npm run khong-ro-ri` canh
thêm một lượt. Đừng đưa ảnh vở của trẻ vào kho mã: một lần lỡ tay đẩy lên là
không gỡ được khỏi lịch sử git.

Phụ huynh dùng sản phẩm thì **không phải làm gì cả** — lớp che chạy sẵn trên máy
họ và dải mặc định đã bật từ đầu (`src/app/phu-huynh/chup/che-anh.ts`). Việc che
tay chỉ đặt ra ở đây, vì bộ ảnh đo đi đường khác: chép thẳng từ thẻ nhớ vào một
thư mục, không có trình duyệt nào ở giữa để chạy lớp che ấy.

## Nên chụp trong những điều kiện nào

Chụp cả ảnh **xấu**, đừng chỉ chụp ảnh đẹp. Một bộ toàn ảnh chụp ban ngày trên
bàn phẳng sẽ cho một tỷ lệ đẹp và vô dụng, vì người dùng thật là phụ huynh cầm
điện thoại chụp lúc chín giờ tối.

| `dieuKienChup` | Nghĩa |
|---|---|
| `tot` | Đủ sáng, thẳng, rõ |
| `den-ban-buoi-toi` | Ánh đèn bàn buổi tối — điều kiện **thật** hay gặp nhất |
| `thieu-sang` | Tối, nhưng người vẫn đọc được |
| `nhoe` | Rung tay |
| `nghieng` | Cầm máy chéo với mặt bàn |
| `mat-goc` | Mất một góc trang |

Nhớ để vào vài tấm mà **người còn không đọc nổi** (`nguoiDocDuoc: false`). Với
những tấm đó, Ô Ly **phải** từ chối và nói rõ lý do (BR-31); đọc bừa một tấm như
thế là lỗi nặng hơn hẳn từ chối.

## Gắn nhãn

Đặt ảnh vào một thư mục, kèm tệp `nhan.json`. Xem mẫu đầy đủ ở
[`docs/nhan-mau.json`](./nhan-mau.json).

### Một quy tắc, và đây là chỗ dễ làm sai nhất

> Nhãn ghi những gì **trẻ đã viết trên giấy**, không phải đáp án đúng của bài.

Con viết `47 + 28 = 65` thì nhãn ghi `65`. Việc 65 là sai là chuyện của bộ chấm,
không phải của nhãn. Gắn nhãn theo đáp án đúng sẽ làm mọi bài con làm sai biến
thành "máy đọc sai", và bản báo cáo sẽ vô nghĩa.

Ảnh mà người không đọc nổi thì **không cần** gắn nhãn nội dung — nhãn của nó là
`nguoiDocDuoc: false`, và nó dùng để kiểm Ô Ly có biết từ chối hay không.

Tệp nhãn được kiểm **trước** lần gọi đầu tiên: sai một chỗ là dừng ngay, chứ
không chạy nửa bộ rồi mới hỏng sau khi đã tiêu tiền.

## Chạy trên ảnh thật

```
npm run do-anh -- --thu-muc bo-anh-do
npm run do-anh -- --thu-muc bo-anh-do --ket-qua ket-qua.bao-cao.json
```

Mặc định vẫn là bản giả lập. Muốn gọi mô hình thật thì phải có khóa API **và**
bật đủ ba cờ xác nhận đã ký thỏa thuận xử lý dữ liệu (CR-03, CR-16):

```
OLY_DPA_DA_KY=true OLY_DPA_CAM_HUAN_LUYEN=true OLY_DPA_CAM_LUU_GIU=true \
  npm run do-anh -- --thu-muc bo-anh-do
```

Thiếu bất kỳ điều kiện nào thì hệ thống quay về bản giả lập và in một dòng cảnh
báo, chứ không lặng lẽ gửi ảnh vở của trẻ ra ngoài.

Đổi mô hình để so hai bên với nhau:

```
OLY_MODEL_DOC_ANH=claude-sonnet-5 npm run do-anh -- --thu-muc bo-anh-do
```

## Đọc bản báo cáo

Mục 1 đứng trước mục 2 là cố ý. Một bản báo cáo mở đầu bằng "đọc đúng 94%" sẽ
làm người đọc yên tâm rồi bỏ qua ba dòng báo động giả ở cuối trang, nên ở đây
phần tai hại nhất được đặt lên đầu.

Bốn kiểu lệch kết luận, xếp theo mức tai hại giảm dần:

| Kiểu | Nghĩa | Vì sao xếp ở đó |
|---|---|---|
| **Báo động giả** | Con làm **đúng**, Ô Ly bảo sai | Tệ nhất. Bố mẹ chữa một bài vốn không cần chữa, đứa trẻ bị mắng oan |
| **Bỏ sót** | Con làm **sai**, Ô Ly bảo đúng | Mất cơ hội chữa, nhưng không gây hại trực tiếp |
| **Mất kết luận** | Nhãn kết luận được, Ô Ly không dám | An toàn, chỉ phí |
| **Thêm kết luận** | Nhãn không kết luận được mà Ô Ly lại dám | Đáng ngờ |

Ảnh bị **từ chối** không bị tính là "đọc sai". Từ chối và đọc sai là hai chuyện
khác hẳn: từ chối thì phụ huynh chụp lại và không ai bị mắng oan. Trộn hai thứ
vào một tỷ lệ sẽ làm một sản phẩm hay từ chối trông giống một sản phẩm hay nói
bậy.

Mục 5 và 6 cắm chi phí vừa đo được thẳng vào mô hình lỗ lãi. Để hai con số đó ở
hai bản báo cáo khác nhau là cách chắc chắn nhất để không ai ghép chúng lại.

## Tệp nào làm gì

| Tệp | Việc |
|---|---|
| `src/lib/do-anh/nhan.ts` | Lược đồ nhãn và phần kiểm nhãn trước khi chạy |
| `src/lib/do-anh/so-khop.ts` | So phiên âm, và quan trọng hơn — so **kết luận** |
| `src/lib/do-anh/bao-cao.ts` | Gộp thành các con số |
| `src/lib/do-anh/in-bao-cao.ts` | In ra chữ cho người đọc |
| `src/lib/do-anh/chay.ts` | Chạy cả bộ qua một nhà cung cấp |
| `src/lib/do-anh/nha-cung-cap-dien-tap.ts` | Bản diễn tập, gài lỗi biết trước |
| `src/lib/do-anh/tu-kiem.ts` | Kiểm lại chính bộ đo |
| `tests/bo-do-anh.test.ts` | 40 bài kiểm thử, chạy không cần mạng |

Bộ đo chạy bộ chấm trên **cả hai** đầu vào — nhãn và phiên âm của mô hình — rồi
so hai kết luận. Nhờ thế mọi khác biệt về kết luận đều quy được về đúng một
nguyên nhân là lỗi đọc, không lẫn với lỗi của bộ chấm.
