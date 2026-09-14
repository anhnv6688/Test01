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
npm run kiem-tra     # kiểm kiểu, lint và toàn bộ 307 bài kiểm thử
npm test             # chỉ chạy kiểm thử
npm run build        # dựng bản phát hành
```

Không cần khóa API để chạy: mặc định Ô Ly dùng bản giả lập xử lý ảnh, không gọi
ra mạng. Xem `.env.example` để biết cách cắm nhà cung cấp thật.

## Ba bề mặt, tách bạch

Đây là quyết định kiến trúc quan trọng nhất của sản phẩm, theo NT-10 và BR-03.

| | Bề mặt của trẻ `/be` | Bề mặt của phụ huynh `/phu-huynh` | Bảng trực `/truc` |
|---|---|---|---|
| Người dùng | Trẻ 6–8 tuổi | Bố mẹ | Nhân sự trực của Ô Ly |
| Vào bằng | Chạm vào hình của mình | Mã PIN bốn số | Tên người trực + mã trực |
| Nhìn thấy dữ liệu của | Chính mình | Hộ mình | **Mọi hộ** |
| Có lời giải đầy đủ | **Không bao giờ** | Có | — |
| Đáp án trong gói dữ liệu tải về | **Không có trường nào** | — | — |

Bảng trực tách hẳn khỏi hai bề mặt kia vì nó nhìn thấy yêu cầu của mọi hộ. Gộp
nó vào phần của phụ huynh là tạo ra một đường để một phụ huynh nhìn sang dữ
liệu nhà khác — đúng loại lỗi không ai phát hiện cho tới khi quá muộn.

Việc chấm bài diễn ra ở máy chủ. Máy của trẻ không bao giờ nhận được đáp án, kể
cả khi đã mở hết thang gợi ý, kể cả khi trẻ mở công cụ nhà phát triển. Có bốn bài
kiểm thử canh riêng điều này, xem `tests/khong-lo-dap-an.test.ts`.

## Kho nội dung

Kho chỉ lưu **khuôn dạng bài** — cấu trúc toán học cùng tham số và ràng buộc. Từ
một khuôn dạng sinh ra vô hạn bài cụ thể, nên kho hữu hạn mà trẻ luyện bốn tuần
không gặp lại bài cũ. Hiện có **32 khuôn dạng phủ đủ 14 yêu cầu cần đạt** của
lớp 2 học kỳ 2, mỗi khuôn dạng đều có bản ghi người duyệt và hồ sơ nguồn gốc.

Khuôn dạng nằm ở `src/lib/domain/templates/`, chia theo mạch nội dung của
Chương trình: số học, đo lường, hình học, giải toán. Quy tắc viết một khuôn
dạng mới nằm ở `templates/chung.ts` — đọc phần đó trước khi thêm.

### Đo kho nội dung

```bash
npm run kho    # độ phủ, không gian tham số từng khuôn dạng, độ lặp bốn tuần
```

Điều kiện ra mắt số 4 đòi kho "đủ để một trẻ lớp 2 học liên tục tối thiểu bốn
tuần mà không lặp bài". Câu đó có hai cách hiểu và cả hai đều được đo:

| | Số đo hiện tại |
|---|---|
| 160 bài trong 20 buổi | 159 đề khác nhau, **1 đề lặp lại** |
| Mỗi *dạng* bài lặp lại | **5,3 lần** trong bốn tuần |
| Khuôn dạng có không gian tham số quá bé | **không có** |

Con số thứ hai mới là thứ trẻ cảm nhận được: đề khác nhau mà cứ một kiểu thì
trẻ vẫn chán. Có bài kiểm thử canh cả hai ngưỡng, nên kho không thể lặng lẽ
tụt xuống dưới mức đó khi ai đó sửa bộ lập kế hoạch.

Bộ đo vân tay cả **hình vẽ** chứ không chỉ chữ đề — bài xem giờ hỏi đúng một
câu như nhau mọi lần, cái đổi nằm hết ở hai kim đồng hồ. Vài khuôn dạng có
không gian nhỏ vì bản thân chương trình nhỏ (bảng nhân 2 và 5 chỉ có ngần ấy
phép tính); những trường hợp đó phải ghi rõ lý do ngay trong khuôn dạng, và bộ
đo tách chúng ra khỏi danh sách cần sửa nhưng vẫn liệt kê để không ai quên.

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

## Chấm bài viết tay — mọi dạng bài

VM-08 chốt ngày 13/9/2026: bản đầu tiên chấm được mọi dạng bài của chương trình
lớp 1–2. Mười dạng có bộ chấm riêng, cộng một nhánh bắt buộc cho dạng chưa nhận
ra:

| Dạng | Mức tin cậy | Ô Ly kiểm được gì |
|---|---|---|
| Đặt tính cột dọc | cao | Tính lại từng cột, chỉ đúng cột sai đầu tiên |
| Tính hàng ngang | cao | Tính lại cả biểu thức |
| Điền số vào chỗ trống | cao | Thử mọi giá trị để tìm số đúng |
| So sánh | cao | Tính lại cả hai vế rồi so |
| Đổi đơn vị đo | cao | Quy đổi lại, bắt đúng bẫy chép nguyên con số |
| Bài giải có lời văn | trung bình | Có đủ ba phần không, phép tính tính có đúng không, đáp số có khớp không |
| Trắc nghiệm | trung bình | So với đáp án, nếu đọc được đáp án từ đề |
| Nối ghép | trung bình | Từng cặp, và số cặp bỏ sót |
| Đếm hình | thấp | So với số hình đếm được trên ảnh |
| Xem giờ | thấp | So với vị trí kim đọc được trên ảnh |
| Dạng chưa nhận ra | — | Không chấm, nói thẳng và không trừ lượt |

Ba điều quan trọng về thiết kế này:

**Mô hình chỉ phiên âm, không chấm.** Bên xử lý ảnh chép lại những gì trẻ viết
thành dữ liệu có cấu trúc; lược đồ đầu ra không có trường nào để ghi đúng hay
sai. Việc chấm do mã tất định trong `src/lib/domain/cham-bai` làm. Đọc chữ viết
tay là việc mô hình làm tốt hơn hẳn mã nguồn; cộng trừ có nhớ là việc mã nguồn
không bao giờ sai còn mô hình thì có lúc sai.

## Hai tầng, hai mô hình

Việc nhận dạng và việc soạn lời giảng khác hẳn nhau về bản chất, nên chúng dùng
hai mô hình khác nhau.

| | Chạy khi nào | Mô hình | Chi phí |
|---|---|---|---|
| **Phiên âm ảnh** | Mọi trang ảnh | Haiku 4.5 | ~309đ |
| **Giảng tầng 1** | Đề có cấu trúc mã nguồn giải được | *không gọi mô hình nào* | 0đ |
| **Giảng tầng 2** | Đề là bài toán có lời văn | Opus 5 | ~2.386đ |

Tầng 1 phủ phép tính, điền số, so sánh và đổi đơn vị: đáp án tính tất định, lời
giảng lắp từ khuôn có sẵn. Tầng 2 chỉ chạy cho bài toán có lời văn, và chỉ khi
phụ huynh đã bật mục Soạn lời giảng trong phần Quyền riêng tư.

**Luồng chấm bài không bao giờ chạm tầng 2.** Vì phần lớn lượt chụp là chấm bài
con làm chứ không phải nhờ giảng đề, tỷ lệ tầng 2 trên tổng số trang nhiều khả
năng thấp — nhưng chưa ai đo. Mỗi lượt xử lý được ghi kèm tầng trong bảng
`meter_events` để đo được con số đó ngay khi có người dùng thật.

Một điều cả hai tầng đều phải giữ: **lời giảng bám đúng đề trong ảnh của phụ
huynh**. Bản trước sinh một bài khác từ kho rồi giảng bài đó, nghĩa là hộ chụp
"45 + 27" có thể nhận lời giảng cho "38 + 24". Có một bài kiểm thử canh riêng
điều này.

**"Chưa kết luận" là một kết quả hợp lệ.** Chấm được mọi dạng không đồng nghĩa
với dám kết luận mọi bài. Khi Ô Ly không chắc, nó nói thẳng thay vì đoán — và
con số đó hiện ngang hàng với đúng và sai chứ không giấu xuống dưới.

**Mỗi dạng khai rõ phần nằm ngoài tầm kiểm.** Với bài giải có lời văn, Ô Ly kiểm
được phép tính con viết có tính đúng không, nhưng KHÔNG kiểm được phép tính đó
đã hợp với đề chưa. Điều đó hiện ngay trên màn hình, theo đúng BR-38.

## Bảng trực xử lý yêu cầu

BR-39 nói thẳng: "Cần có người trực và quy trình, không chỉ có một địa chỉ thư
điện tử." Điều kiện ra mắt số 5 đòi quy trình gỡ bỏ "đã chạy thử và có người
trực". Trước khi có `/truc`, Ô Ly có form nhận yêu cầu và có hạn tính tự động,
nhưng không có chỗ nào để ai đó XỬ LÝ chúng — quy trình dừng ở bước tiếp nhận.

Bảng trực gom hai hàng đợi vào một chỗ, **xếp theo mức khẩn chứ không theo thứ
tự nhận**: một yêu cầu gỡ bỏ nhận sau nhưng chỉ có 24 giờ phải đứng trước một
yêu cầu xem dữ liệu nhận trước nhưng có 10 ngày. Xếp theo thứ tự nhận là cách
vi phạm hạn mà vẫn thấy mình công bằng.

Ngưỡng báo sớm tính theo **tỷ lệ** (còn dưới một phần tư thời gian) chứ không
theo số giờ cố định, vì hai loại yêu cầu có hạn cách nhau mười lần.

### Bấm hoàn thành là làm thật

Đổi trạng thái mà không làm gì thì người dùng vẫn không nhận được thứ họ xin.
Nên nút hoàn thành thực thi đúng việc được yêu cầu:

| Yêu cầu | Ô Ly làm gì |
|---|---|
| Xem hoặc xuất dữ liệu | Dựng bản xuất đầy đủ mọi bảng có dính tới hộ |
| Rút lại sự đồng ý | Tắt toàn bộ mục đích, **giữ nguyên** lịch sử đồng ý cũ làm bằng chứng CR-04 |
| Xóa dữ liệu | Xóa thật, xóa dây chuyền, không có "đánh dấu đã xóa" rồi giữ lại |

### Nhật ký sống sót qua việc xóa

Bảng `nhat_ky_xu_ly` **cố ý không có khóa ngoại** tới `households`. Khi một hộ
yêu cầu xóa và Ô Ly xóa thật, bản ghi yêu cầu mất theo — đúng, vì nó chứa nội
dung của người dùng. Nhưng dấu vết "đã nhận yêu cầu này, đã xử lý lúc này, đúng
hạn hay không" phải còn lại. Nếu nhật ký cũng bị xóa dây chuyền thì **việc tuân
thủ tốt nhất lại xóa mất bằng chứng tuân thủ**.

Đổi lại, nhật ký tuyệt đối không chứa dữ liệu cá nhân — chỉ mã yêu cầu, loại,
hành động, người trực và mốc thời gian. Có kiểm thử canh cả hai điều này.

Cột "đúng hạn" được **chốt tại thời điểm xử lý**, không tính lại về sau. Tính
lại chỉ là suy đoán từ dữ liệu còn lại; chốt sẵn mới là bằng chứng. Và một yêu
cầu đã xong mà không có dòng nhật ký nào thì **không** được tính là đúng hạn —
không chứng minh được thì coi như không đạt.

## Kinh tế vận hành

Chỉ **một** hành vi duy nhất trong toàn bộ mã nguồn bị đếm lượt: xử lý một trang
ảnh mới. Luyện tập trên kho khuôn dạng, xem lịch sử, đọc bản tin tối đều không
bao giờ bị giới hạn và không bao giờ bị khóa khi thuê bao hết hạn (BR-09, BR-19).

Lượt chỉ được ghi **sau khi** đã có kết quả trả về cho phụ huynh, nên một lần
máy đọc hỏng không tốn lượt của họ (BR-31).

**Gói miễn phí: 2 lượt chụp mỗi ngày, không cộng dồn** (VM-07, chốt 13/9/2026).
Việc "không cộng dồn" không cần cơ chế nào để thực hiện — phép đếm chỉ nhìn vào
số trang đã dùng trong đúng ngày hôm nay, nên không tồn tại kho lượt tích lũy
nào để mà cộng dồn. Mốc ngày cắt theo nửa đêm giờ Việt Nam, không theo giờ quốc
tế, để lượt làm mới đúng lúc nửa đêm ở nhà người dùng.

### Mô hình lỗ lãi chạy lại được

```bash
npm run chi-phi                      # bảng lỗ lãi theo từng mô hình đọc ảnh
npm run chi-phi -- --suy-nghi 2500   # thử mức token suy nghĩ khác
npm run chi-phi -- --gia-trang 450   # cắm chi phí THẬT đo được vào
npm run chi-phi -- --tang-2 0.1      # thử tần suất tầng 2 khác
```

BR-22 đòi theo dõi chi phí liên tục, điều kiện ra mắt số 3 đòi đo chi phí thật
một trang. Cả hai cần một chỗ chạy lại được, nên mô hình nằm ở
`src/lib/domain/mo-hinh-chi-phi.ts` chứ không nằm trong một bảng tính.

Có một bài kiểm thử dựng lại đúng con số mà chính BRD công bố ở mục 9.1 — biên
đóng góp 36.200đ và điểm hòa vốn khoảng 500 hộ ở kịch bản phiên bản 1.0 — để
bảo đảm mô hình này khớp với mô hình của tài liệu chứ không phải một mô hình
khác nghe cũng hợp lý.

**Hai ngưỡng gãy cần theo dõi**, tính ở mức suy nghĩ 1.200 token mỗi trang:

| Mô hình đọc ảnh | Chi phí/trang | Hộ trả phí lỗ khi vượt | Hộ miễn phí chỉ được trung bình |
|---|---|---|---|
| Haiku + Opus, tầng 2 ở 10% *(đang dùng)* | ~547đ | 111 trang/tháng | 7,0 trang/tháng |
| Opus 5 cho mọi việc | ~1.664đ | **36 trang/tháng** | 0,6 trang/tháng |
| Sonnet 5 cho mọi việc | ~666đ | 91 trang/tháng | 5,4 trang/tháng |
| Haiku 4.5 cho mọi việc | ~309đ | 197 trang/tháng | 14,6 trang/tháng |

Cột thứ ba là con số chết người của việc dùng Opus cho mọi việc: trần gói trả
phí là 60 trang/tháng, nên **một hộ trả phí dùng nhiều sẽ lỗ ngay trong tập
khách hàng hài lòng nhất**. Cách chia hai tầng đưa con số đó lên 111 trang.

> **Cảnh báo tài chính, ghi lại để không trôi mất.** Mức trần này cho phép một
> hộ miễn phí dùng tới khoảng 60 trang mỗi tháng. Theo đúng các giả định của mô
> hình chi phí ngày 13/9/2026, biên đóng góp chỉ còn dương nếu hộ miễn phí dùng
> trung bình dưới khoảng **4 trang mỗi tháng**. Con số đó nằm ở hằng số
> `TRAN_HOA_VON_TRANG_HO_MIEN_PHI` và có một bài kiểm thử canh nó. Tỷ lệ dùng
> hết trần thật chưa ai đo — đó là con số cần đo sớm nhất sau khi mở bán.

## Kiểm tra tự động

```bash
npm run kiem-tra      # kiểm kiểu, lint, toàn bộ kiểm thử
npm run khong-ro-ri   # không có ảnh hay dữ liệu của trẻ lọt vào kho mã
```

`.github/workflows/kiem-tra.yml` chạy đủ những bước đó trên mọi nhánh và mọi yêu
cầu gộp mã. Phần lớn kiểm thử ở kho này không kiểm "mã có chạy không" mà kiểm
"sản phẩm có còn giữ đúng những điều đã hứa không", nên chúng chỉ có giá trị khi
chạy tự động ở **mọi** thay đổi, chứ không phải khi ai đó nhớ chạy.

Bước **Nguyên tắc bất di bất dịch** tách riêng và đặt trước bước chạy toàn bộ,
để khi hỏng thì tên bước đỏ tự nói ra là đã phá vỡ điều gì — không lộ đáp án cho
trẻ, không quảng cáo hay xếp hạng, ba lớp bảo vệ ảnh, mốc 7 tuổi, mô hình không
được chấm. 97 bài, chạy trong khoảng ba giây.

Có một bước riêng chặn **ảnh trang vở và cơ sở dữ liệu lọt vào kho mã**. Chỉ
`.gitignore` là chưa đủ: `git add -f` đi qua nó, và một tấm ảnh có tên và lớp
của một đứa trẻ đã vào lịch sử git thì không gỡ lại được. Bộ canh soát trên danh
sách tệp git **đang theo dõi**, nên nó bắt cả trường hợp thêm bằng `-f`.

## Người đại diện của con và mốc 7 tuổi

Quy định về dữ liệu trẻ em chia hai chế độ: dưới 7 tuổi thì cha mẹ đồng ý là đủ,
từ đủ 7 tuổi thì **chính đứa trẻ cũng phải được hỏi**. Ô Ly phục vụ lớp 1 và lớp
2, tức khoảng 6 đến 8 tuổi, nên mốc đó **cắt ngang giữa tập người dùng** — bé
lớp 1 sáu tuổi và bé lớp 2 tám tuổi trong cùng một hộ chịu hai chế độ khác nhau.

Hệ quả kiến trúc, và là chỗ dễ làm sai nhất: chế độ đồng ý **không phải trạng
thái lưu được**. Một hộ hợp lệ hôm nay thành thiếu điều kiện vào hôm con tròn
bảy tuổi, mà không có sự kiện nào xảy ra để đánh dấu — không ai bấm gì, chỉ có
thời gian trôi. Nên `cheDoDongY()` nhận mốc thời gian và được gọi lại ở mỗi lần
xử lý. Có một bài kiểm thử canh đúng chuyện đó, và mọi cách làm kiểu "chốt lúc
đăng ký rồi lưu" đều trượt đúng bài ấy.

Ô Ly chỉ lưu **tháng và năm sinh**, không lưu ngày: chừng đó đủ để biết con đã
đủ bảy tuổi chưa, còn ngày sinh đầy đủ là một mã định danh mạnh hơn hẳn mà sản
phẩm không cần. Khi không biết ngày thì làm tròn về phía **hỏi thêm**, vì hỏi
thừa một câu thì không sao, còn thiếu một sự đồng ý thì có.

Phần hỏi con nằm ở bề mặt phụ huynh chứ không nằm trong bề mặt của trẻ — chỗ của
con là chỗ làm toán, không phải chỗ gặp một bức tường pháp lý. Câu hỏi viết cho
một bạn bảy tuổi tự đọc được, người lớn ngồi cạnh, và **con nói không cũng
được**: phần luyện tập vẫn chạy đủ.

Mức xác minh hiện tại được nói thẳng chứ không giấu: mỗi phương thức khai rõ nó
chứng minh được gì và **không** chứng minh được gì, và trang người đại diện cảnh
báo khi mức đang dùng còn yếu. Một ô đánh dấu "tôi là cha mẹ cháu" không xác
minh gì cả, và gọi nó là xác minh thì còn tệ hơn không có — vì nó tạo ra hồ sơ
trông như đã tuân thủ.

## Bộ đo ảnh

Điều kiện ra mắt số 9 đòi đo tỷ lệ nhận dạng thành công **trên bộ ảnh chụp trong
điều kiện thật**, và điều kiện số 3 đòi đo chi phí thật một trang. Cả hai đều
cần một cái thước dựng sẵn, chạy được ngay khi ảnh về.

```bash
npm run do-anh                            # diễn tập, không gọi ra mạng
npm run do-anh -- --thu-muc bo-anh-do     # chạy trên bộ ảnh thật
```

Chế độ diễn tập tự sinh ảnh, tự gài lỗi đã biết trước, rồi đòi bộ đo nêu đúng
những lỗi ấy ra. Nó **không** cho biết gì về sản phẩm thật; việc của nó là chứng
minh cái thước chạy được trước khi có ảnh. Một bộ đo chưa ai thử mà báo "0 báo
động giả" thì con số đó có thể nghĩa là sản phẩm tốt, cũng có thể nghĩa là hàm
so sánh hỏng — và không cách nào phân biệt.

Điểm thiết kế đáng nói nhất: bộ đo chạy **bộ chấm trên cả hai đầu vào** — nhãn
và phiên âm của mô hình — rồi so hai kết luận. Vì thế mọi khác biệt về kết luận
đều quy được về đúng một nguyên nhân là lỗi đọc, không lẫn với lỗi của bộ chấm.

Đo độ chính xác phiên âm thôi là chưa đủ. Thứ làm hại một gia đình không phải là
máy đọc nhầm một chữ số, mà là **máy nói với bố mẹ rằng con làm sai trong khi
con làm đúng**. Nên báo cáo xếp bốn kiểu lệch kết luận theo mức tai hại, báo
động giả đứng đầu, và đặt cả mục đó lên trước tỷ lệ phiên âm.

Hướng dẫn chụp và gắn nhãn: [`docs/bo-do-anh.md`](docs/bo-do-anh.md). Quy tắc
gắn nhãn dễ làm sai nhất, nhắc lại ở đây: **nhãn ghi những gì trẻ đã viết trên
giấy, không phải đáp án đúng của bài.**

## Bố cục mã nguồn

```
src/
  lib/domain/      kho khuôn dạng, ngân hàng bẫy, thang gợi ý, nhịp phiên,
                   phần thưởng theo nỗ lực, bản tin tối, chấm cột dọc, lời giảng
  lib/privacy/     ba lớp bảo vệ, cơ chế đồng ý theo từng mục đích, người đại
                   diện theo pháp luật và mốc 7 tuổi
  lib/vision/      giao diện nhà cung cấp xử lý ảnh và bản giả lập
  lib/do-anh/      bộ đo độ chính xác trên bộ ảnh thật, có bản diễn tập tự kiểm
  lib/server/      cơ sở dữ liệu, kho dữ liệu, cổng mã PIN, yêu cầu của người dùng
  app/be/          bề mặt của trẻ
  app/phu-huynh/   bề mặt của phụ huynh
  app/api/         chấm bài, mở gợi ý, xử lý ảnh — nơi duy nhất biết đáp án
tests/             307 bài kiểm thử, phần lớn canh các yêu cầu bắt buộc
docs/              ma trận truy vết yêu cầu nghiệp vụ
```

## Những gì bản dựng này CHƯA làm

Nói rõ để không ai nhầm bản dựng này với sản phẩm sẵn sàng mở bán.

- **Nhà cung cấp xử lý ảnh thật đã cắm nhưng chưa chạy thật.**
  `src/lib/vision/claude.ts` là bản cài đặt đầy đủ, nhưng hàm dựng của nó TỪ CHỐI
  chạy nếu chưa bật đủ ba cờ xác nhận đã ký thỏa thuận xử lý dữ liệu — CR-03 và
  CR-16 đòi ký trước khi xử lý dữ liệu thật. Chưa đủ điều kiện thì hệ thống quay
  về bản giả lập `src/lib/vision/mock.ts` và ghi một dòng cảnh báo. Chất lượng
  nhận dạng trên bộ ảnh thật **chưa được đo** (RR-10, điều kiện ra mắt số 9) —
  nhưng cái thước để đo thì đã dựng xong và đã tự kiểm được, xem phần Bộ đo ảnh.
- **Chưa có tài khoản thật.** Mã PIN bốn số chỉ chặn một đứa trẻ tò mò, đúng
  mối đe dọa mà NT-10 cần chặn. Phần người đại diện theo pháp luật (CR-05) đã
  làm, nhưng phương thức xác minh mạnh nhất đang dùng được mới là **tự khai** —
  chưa nối mã một lần qua số điện thoại hay xác nhận qua thanh toán.
- **Chưa có thanh toán** (CR-12, CR-13). Gói cước hiện là dữ liệu tĩnh.
- **Kho nội dung mới có 32 khuôn dạng**, chưa phải khoảng 350 khuôn dạng mà
  GD-03 ước tính cần để phủ lớp 1–2.
- **BR-18 mới có chỗ cắm**, chưa có cơ chế thật để đánh dấu đề đầu vào nghi ngờ.
- Toàn bộ hạng mục Giai đoạn 2 và Giai đoạn 3 chưa làm, đúng như phạm vi đã
  duyệt.

Danh mục tuân thủ CR-01 đến CR-20 phần lớn là nghĩa vụ tổ chức và hồ sơ, không
phải hạng mục phần mềm. Phần nào thể hiện được trong sản phẩm thì đã thể hiện;
xem `docs/truy-vet-yeu-cau.md` để biết phần nào nằm ngoài mã nguồn.
