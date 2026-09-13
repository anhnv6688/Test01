# Ma trận truy vết yêu cầu nghiệp vụ

Đối chiếu từng yêu cầu trong Tài liệu yêu cầu nghiệp vụ Ô Ly v1.2 với chỗ thực
hiện trong mã nguồn và bài kiểm thử canh nó.

Ký hiệu cột "Tình trạng":
**Đủ** — đã làm và có kiểm thử canh ·
**Một phần** — có phần lõi, còn thiếu phần ghi rõ ·
**Ngoài phần mềm** — là nghĩa vụ tổ chức hoặc hồ sơ, không phải hạng mục mã nguồn ·
**Chưa** — chưa làm trong bản dựng này.

## Nhóm A — Trải nghiệm học của trẻ

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-01 | Trẻ làm được bài không bị chặn bởi khả năng đọc | Đủ | `components/doc-to.ts`, mọi bài có trường `speech`, bàn phím số thay bàn phím chữ | `kho-noi-dung` |
| BR-02 | Thao tác với biểu diễn trực quan trước khi viết số | Đủ | `components/Visual.tsx` — khối trăm chục đơn vị, tia số, sơ đồ đoạn thẳng | `kho-noi-dung` |
| BR-03 | Gợi ý nhiều bậc, không bao giờ cho trẻ xem đáp án | Đủ | `domain/present.ts` lọc gói gửi đi; chấm ở máy chủ tại `api/tra-loi` | `khong-lo-dap-an` (4 bài) |
| BR-04 | Nhận diện bẫy và chữa ngay lúc trẻ mắc | Đủ | `domain/traps.ts`, `domain/marking.ts` | `chan-doan-loi` |
| BR-05 | Phiên kết thúc dứt điểm trong 10–12 phút | Đủ | `domain/session.ts` | `nhip-va-khich-le` |
| BR-06 | Khích lệ theo nỗ lực, không theo tỷ lệ đúng | Đủ | `domain/rewards.ts` | `nhip-va-khich-le` |
| BR-07 | Tên riêng và bối cảnh Việt Nam, nhất quán | Đủ | `domain/names.ts` là nguồn duy nhất | `kho-noi-dung` |

## Nhóm B — Giá trị cho phụ huynh

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-08 | Bản tin tối, đúng một câu để hỏi con | Đủ | `domain/digest.ts`, `app/phu-huynh/page.tsx` | `ban-tin-toi` |
| BR-09 | Lịch sử không bao giờ bị khóa khi hết hạn | Đủ | `server/repo.ts` (hàm đọc lịch sử không nhận tham số gói cước), `domain/metering.ts` | `kinh-te-van-hanh`, `luu-tru` |
| BR-10 | Phụ huynh hiểu vì sao có phí và tiền đi đâu | Đủ | `app/phu-huynh/goi-cuoc` nêu rõ chi phí thật một trang | — |
| BR-11 | Một thuê bao cho cả hộ, không tính theo số con | Đủ | `domain/pricing.ts`, `server/repo.ts` | `kinh-te-van-hanh`, `luu-tru` |
| BR-12 | Hướng dẫn phụ huynh giảng theo cách nhà trường dạy | Một phần | `domain/teaching.ts` bám đúng thang gợi ý trẻ đang dùng; chưa có trang hướng dẫn riêng theo từng dạng | `ban-tin-toi` |

## Nhóm C — Nội dung

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-13 | Kho dựng từ nguồn có căn cứ pháp lý sạch | Đủ | `domain/templates.ts` — mỗi khuôn dạng khai `provenance` | `kho-noi-dung`, `nguyen-tac-bat-di-bat-dich` |
| BR-14 | Dùng được ngay lần mở đầu, không cần người dùng tải lên | Đủ | `server/seed.ts` | `luu-tru` |
| BR-15 | Người thật duyệt trước khi bài đến tay trẻ | Đủ | `domain/generator.ts` chặn ở cổng phát hành duy nhất | `kho-noi-dung` |
| BR-16 | Bám yêu cầu cần đạt, theo kịp khi chương trình sửa | Đủ | `domain/curriculum.ts`; mỗi khuôn dạng gắn một mã yêu cầu cần đạt | `kho-noi-dung` |
| BR-17 | Nội dung phụ huynh tải lên không vào kho chung | Đủ | Không có đường dữ liệu nào từ `photo_jobs` sang `templates` — kho khuôn dạng là mã nguồn tĩnh | `luong-chup-anh` |
| BR-18 | Báo khi đề đầu vào có vấn đề, không giải bừa | Một phần | Có trường `nghiNgo` trong kết quả đọc đề và nhánh từ chối khi không khớp khuôn dạng nào; chưa có cơ chế phát hiện đề sai | `luong-chup-anh` |

## Nhóm D — Kinh tế vận hành

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-19 | Giới hạn đúng chỗ phát sinh hóa đơn, và chỉ chỗ đó | Đủ | `domain/metering.ts` — chỉ một hành vi bị đếm | `kinh-te-van-hanh` |
| BR-20 | Trần gói miễn phí đủ chặt | Đủ | `TRAN_MIEN_PHI_TRANG_THANG` ở một chỗ duy nhất | `kinh-te-van-hanh` |
| BR-21 | Đo tỷ lệ chuyển đổi từ ngày đầu mở bán | Chưa | Cần có thanh toán trước, xem CR-12 | — |
| BR-22 | Theo dõi chi phí thật ở mức từng hộ | Đủ | `server/repo.ts` ghi từng lượt kèm chi phí; hiện lên trang gói cước | `kinh-te-van-hanh`, `luu-tru` |

## Nhóm E — Vận hành và niềm tin

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-23 | Kênh tiếp nhận yêu cầu gỡ bỏ, có nhật ký | Đủ | `app/go-bo-noi-dung` — công khai, ngoài cổng mã PIN | `luu-tru` |
| BR-24 | Nguồn gốc mỗi khuôn dạng truy vết được | Đủ | `provenance` và `approval` trong `domain/templates.ts` | `kho-noi-dung` |
| BR-25 | Gắn nhãn nội dung do máy tạo | Đủ | `domain/generator.ts` sinh nhãn hiển thị và dấu máy đọc được | `kho-noi-dung` |

## Nhóm F — Chụp ảnh, giảng bài và chấm bài

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-26 | Chụp đề, nhận lời giải từng bước | Đủ | `domain/teaching.ts`, `api/anh/xu-ly` | `ban-tin-toi` |
| BR-27 | Viết bằng ngôn ngữ giảng bài, có câu hỏi dẫn dắt | Đủ | `domain/teaching.ts` — mỗi bước bắt buộc có `hoiCon` | `ban-tin-toi` |
| BR-28 | Chấm bài trên giấy, chỉ đúng bước sai | Đủ | `domain/column-marking.ts` | `chan-doan-loi` (5 bài) |
| BR-29 | Sai thì giải thích vì sao, đúng thì nói rõ đúng ở đâu | Đủ | `domain/column-marking.ts`, `domain/marking.ts` | `chan-doan-loi` |
| BR-30 | Dùng được trong điều kiện ánh sáng bàn học buổi tối | Đủ | `chup/che-anh.ts` đo độ sáng và tương phản ngay ở máy khách | `luong-chup-anh` |
| BR-31 | Đọc không được thì nói rõ lý do, không trừ lượt | Đủ | `api/anh/xu-ly` ghi lượt sau khi có kết quả | `luong-chup-anh`, `luu-tru` |
| BR-32 | Che họ tên, lớp, trường ngay trên thiết bị | Đủ | `chup/che-anh.ts` (lớp 1), `privacy/redaction.ts` (chặn phụ ở máy chủ) | `ba-lop-bao-ve` (6 bài) |
| BR-33 | Ít nhất hai mức chi tiết của lời giải | Đủ | `domain/teaching.ts` | `ban-tin-toi` |
| BR-34 | Gửi đi không kèm mã truy ngược | Đủ | `privacy/envelope.ts` (lớp 2) | `ba-lop-bao-ve` (4 bài) |
| BR-35 | Xóa ảnh gốc ngay sau khi trả kết quả | Đủ | `privacy/retention.ts` (lớp 3); lược đồ không có cột ảnh | `ba-lop-bao-ve`, `luong-chup-anh` |
| BR-36 | Ảnh cũ nằm trên thiết bị của phụ huynh | Đủ | Nói rõ ngay tại màn hình chụp và trang dữ liệu của tôi | — |
| BR-37 | Tắt riêng từng mục đích, không làm hỏng phần còn lại | Đủ | `privacy/consent.ts` khai rõ "tắt thì mất gì" và "vẫn chạy gì" | `ba-lop-bao-ve` (6 bài) |
| BR-38 | Trang giải thích cách chấm bài, ngôn ngữ phổ thông | Đủ | `app/cach-cham-bai` | — |
| BR-39 | Yêu cầu về dữ liệu xử lý trong thời hạn luật định | Đủ | `server/requests.ts` tính hạn tự động; `app/phu-huynh/du-lieu-cua-toi` | `kinh-te-van-hanh`, `luu-tru` |

## Nguyên tắc bất di bất dịch — mục 7

Toàn bộ nhóm này có bài kiểm thử quét mã nguồn tại
`tests/nguyen-tac-bat-di-bat-dich.test.ts`. Một câu cấm trong tài liệu chỉ có
hiệu lực nếu có thứ gì đó kiểm tra nó ở mỗi lần chạy kiểm thử.

| Mã | Nguyên tắc | Cách canh |
|---|---|---|
| NT-01 | Không quảng cáo, vòng quay may mắn, vật phẩm mua bằng tiền | Quét mã tìm dấu vết mạng quảng cáo và mua trong ứng dụng |
| NT-02 | Không bảng xếp hạng theo điểm tuyệt đối | Quét mã; thêm kiểm tra `rewards.ts` không nhận tỷ lệ đúng làm đầu vào |
| NT-03 | Không thu thập ảnh khuôn mặt của trẻ | Quét mã tìm máy ảnh trước và nhận dạng khuôn mặt; lược đồ không có cột liên quan |
| NT-04 | Không dùng dữ liệu học cho quảng cáo | Quét mã tìm thư viện theo dõi hành vi của bên thứ ba |
| NT-05 | Không sao chép sách giáo khoa | Kiểm tra không khuôn dạng nào khai nguồn là sách giáo khoa |
| NT-06 | Không thu thập nội dung tự động | Quét mã tìm thư viện thu thập dữ liệu web |
| NT-07 | Không nhận định chẩn đoán tâm lý hoặc y tế | `domain/digest.ts` có danh sách từ ngữ cấm; kiểm mọi bản tin và mọi lời giảng |
| NT-08 | Không mở kho bài cho người chưa đăng ký | Toàn bộ luồng học nằm sau `/be`, cần hồ sơ con mới vào được |
| NT-09 | Không tổ chức lớp học trực tuyến | Quét mã tìm thư viện gọi video |
| NT-10 | Hai bề mặt tách bạch | Quét thư mục `app/be` cấm nhập khẩu mô-đun lời giảng, kho khuôn dạng và bộ chấm |

## Danh mục tuân thủ CR-01 đến CR-20

| Mã | Tình trạng | Ghi chú |
|---|---|---|
| CR-01 | Ngoài phần mềm | Thành lập pháp nhân |
| CR-02 | Đủ | Khử nhận dạng trước khi gửi ra ngoài — `privacy/envelope.ts` |
| CR-03 | Một phần | Trường `thoaThuan` bắt mọi nhà cung cấp phải khai đã ký, cấm huấn luyện, cấm lưu giữ; bản hợp đồng thật là việc ngoài mã nguồn |
| CR-04 | Đủ | Đồng ý tách theo mục đích, không đánh dấu sẵn, lưu bằng chứng kèm phiên bản văn bản |
| CR-05 | Chưa | Xác minh độ tuổi và sự đồng ý của người đại diện theo pháp luật |
| CR-06 | Đủ | `app/go-bo-noi-dung` — đầu mối công khai, hạn xử lý, nhật ký |
| CR-07 | Đủ | Nhãn hiển thị và dấu máy đọc được trong `domain/generator.ts` |
| CR-08 | Đủ | Bản ghi người duyệt là điều kiện chặn ở cổng phát hành |
| CR-09 đến CR-15 | Ngoài phần mềm | Hồ sơ đánh giá tác động, nhân sự phụ trách, thủ tục thuế và thương mại điện tử, hợp đồng biên soạn, chính sách nguồn nội dung |
| CR-16 | Một phần | Như CR-03 |
| CR-17 | Đủ | Bốn nghĩa vụ: thông báo xử lý tự động, trang giải thích (`/cach-cham-bai`), cơ chế không tham gia theo từng mục đích, và rà soát định kỳ — ba phần đầu đã có trong sản phẩm |
| CR-18, CR-19 | Một phần | Các điều cấm kỹ thuật về nét chữ đã cài vào lược đồ và vào kiểm thử; quyết định nội bộ bằng văn bản là việc ngoài mã nguồn |
| CR-20 | Ngoài phần mềm | Chỉ áp dụng nếu thiết kế ba lớp không làm đủ — bản dựng này làm đủ cả ba |

## Vấn đề còn mở ảnh hưởng tới mã nguồn

| Mã | Vấn đề | Ảnh hưởng tới mã nguồn |
|---|---|---|
| VM-01 | Thiết bị chính là điện thoại, máy tính bảng hay máy tính | Giao diện hiện làm theo hướng điện thoại trước; đổi quyết định thì phải xem lại cỡ nút của bề mặt trẻ |
| VM-02 | Có cần hoạt động khi không có mạng hay không | Đã có tệp khai báo ứng dụng web; chưa có bộ đệm ngoại tuyến |
| VM-06 | Tên thương mại chính thức | Tên "Ô Ly" đang dùng ở tiêu đề, tệp khai báo và biểu tượng |
| VM-07 | Gói miễn phí có được chụp ảnh không, trần bao nhiêu | Đổi một dòng: `TRAN_MIEN_PHI_TRANG_THANG` trong `domain/pricing.ts` |
| VM-08 | Phạm vi dạng bài mà chấm viết tay phải xử lý được | Hiện chấm phép cộng trừ đặt cột dọc; mở rộng là thêm bộ chấm mới bên cạnh `column-marking.ts` |
