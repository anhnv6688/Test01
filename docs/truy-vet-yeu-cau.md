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
| BR-16 | Bám yêu cầu cần đạt, theo kịp khi chương trình sửa | Đủ | `domain/curriculum.ts` — 14 mã; mỗi khuôn dạng gắn một mã, và có kiểm thử bắt mã nào chưa có khuôn dạng nào | `kho-noi-dung`, `do-kho-noi-dung` |
| BR-17 | Nội dung phụ huynh tải lên không vào kho chung | Đủ | Không có đường dữ liệu nào từ `photo_jobs` sang `templates` — kho khuôn dạng là mã nguồn tĩnh | `luong-chup-anh` |
| BR-18 | Báo khi đề đầu vào có vấn đề, không giải bừa | Đủ | Trường `nghiNgo` được lời nhắc hệ thống yêu cầu tường minh; nhánh `chua-nhan-dang` và kết quả `dung: null` phủ mọi trường hợp Ô Ly không dám kết luận | `cham-moi-dang-bai`, `luong-chup-anh` |

## Nhóm D — Kinh tế vận hành

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-19 | Giới hạn đúng chỗ phát sinh hóa đơn, và chỉ chỗ đó | Đủ | `domain/metering.ts` — chỉ một hành vi bị đếm | `kinh-te-van-hanh` |
| BR-20 | Trần gói miễn phí đủ chặt | Một phần | `TRAN_MIEN_PHI_TRANG_NGAY` = 2 lượt mỗi ngày, không cộng dồn (VM-07 đã chốt). Trần này **lỏng hơn** mức mô hình chi phí chịu được — xem cảnh báo ở README và hằng số `TRAN_HOA_VON_TRANG_HO_MIEN_PHI` | `kinh-te-van-hanh` (6 bài) |
| BR-21 | Đo tỷ lệ chuyển đổi từ ngày đầu mở bán | Chưa | Cần có thanh toán trước, xem CR-12 | — |
| BR-22 | Theo dõi chi phí thật ở mức từng hộ | Đủ | `server/repo.ts` ghi từng lượt kèm chi phí; hiện lên trang gói cước | `kinh-te-van-hanh`, `luu-tru` |

## Nhóm E — Vận hành và niềm tin

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-23 | Kênh tiếp nhận yêu cầu gỡ bỏ, có nhật ký | Đủ | Nhận ở `app/go-bo-noi-dung` (công khai); xử lý ở `app/truc` với nhật ký đầy đủ và hạn đếm ngược | `luu-tru`, `bang-truc` |
| BR-24 | Nguồn gốc mỗi khuôn dạng truy vết được | Đủ | `provenance` và `approval` trong `domain/templates.ts` | `kho-noi-dung` |
| BR-25 | Gắn nhãn nội dung do máy tạo | Đủ | `domain/generator.ts` sinh nhãn hiển thị và dấu máy đọc được | `kho-noi-dung` |

## Nhóm F — Chụp ảnh, giảng bài và chấm bài

| Mã | Yêu cầu | Tình trạng | Thực hiện ở | Kiểm thử |
|---|---|---|---|---|
| BR-26 | Chụp đề, nhận lời giải từng bước | Đủ | Hai tầng: `domain/giang-de-doc-duoc.ts` (tất định, không gọi mô hình) và `vision/claude.ts` (mô hình soạn, chỉ cho bài lời văn). Cả hai bám đúng đề trong ảnh | `hai-tang-giang-de` (20 bài) |
| BR-27 | Viết bằng ngôn ngữ giảng bài, có câu hỏi dẫn dắt | Đủ | `domain/teaching.ts` — mỗi bước bắt buộc có `hoiCon` | `ban-tin-toi` |
| BR-28 | Chấm bài trên giấy, chỉ đúng bước sai | Đủ | `domain/cham-bai/` — sổ đăng ký 11 bộ chấm, vét cạn theo kiểu | `chan-doan-loi`, `cham-moi-dang-bai` (32 bài) |
| BR-29 | Sai thì giải thích vì sao, đúng thì nói rõ đúng ở đâu | Đủ | Mỗi bộ chấm đều viết câu `choPhuHuynh` riêng cho cả trường hợp đúng lẫn sai | `chan-doan-loi`, `cham-moi-dang-bai` |
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
| CR-03 | Đủ phần thuộc phần mềm | `NhaCungCapClaude` TỪ CHỐI dựng nếu chưa bật đủ ba cờ xác nhận đã ký; hệ thống quay về bản giả lập thay vì gửi dữ liệu thật. Bản hợp đồng là việc ngoài mã nguồn |
| CR-04 | Đủ | Đồng ý tách theo mục đích, không đánh dấu sẵn, lưu bằng chứng kèm phiên bản văn bản |
| CR-05 | Đủ phần thuộc phần mềm | Bản ghi người đại diện có phương thức xác minh và độ mạnh; tháng năm sinh của trẻ; chế độ đồng ý tính lại theo thời gian quanh mốc 7 tuổi; cổng chặn ở tuyến xử lý ảnh. Xem mục riêng bên dưới. Việc chọn phương thức xác minh nào là đủ cần ý kiến pháp lý |
| CR-06 | Đủ | Đầu mối công khai, hạn xử lý, và nhật ký xử lý đầy đủ ở bảng trực. Nhật ký không có khóa ngoại nên sống sót cả khi hộ đã bị xóa theo yêu cầu |
| CR-07 | Đủ | Nhãn hiển thị và dấu máy đọc được trong `domain/generator.ts` |
| CR-08 | Đủ | Bản ghi người duyệt là điều kiện chặn ở cổng phát hành |
| CR-09 đến CR-15 | Ngoài phần mềm | Hồ sơ đánh giá tác động, nhân sự phụ trách, thủ tục thuế và thương mại điện tử, hợp đồng biên soạn, chính sách nguồn nội dung |
| CR-16 | Đủ phần thuộc phần mềm | Như CR-03 |
| CR-17 | Đủ | Bốn nghĩa vụ: thông báo xử lý tự động, trang giải thích (`/cach-cham-bai`), cơ chế không tham gia theo từng mục đích, và rà soát định kỳ — ba phần đầu đã có trong sản phẩm |
| CR-18, CR-19 | Một phần | Các điều cấm kỹ thuật về nét chữ đã cài vào lược đồ và vào kiểm thử; quyết định nội bộ bằng văn bản là việc ngoài mã nguồn |
| CR-20 | Ngoài phần mềm | Chỉ áp dụng nếu thiết kế ba lớp không làm đủ — bản dựng này làm đủ cả ba |

## Vấn đề còn mở ảnh hưởng tới mã nguồn

| Mã | Vấn đề | Ảnh hưởng tới mã nguồn |
|---|---|---|
| VM-01 | Thiết bị chính là điện thoại, máy tính bảng hay máy tính | Giao diện hiện làm theo hướng điện thoại trước; đổi quyết định thì phải xem lại cỡ nút của bề mặt trẻ |
| VM-02 | Có cần hoạt động khi không có mạng hay không | Đã có tệp khai báo ứng dụng web; chưa có bộ đệm ngoại tuyến |
| VM-06 | Tên thương mại chính thức | Tên "Ô Ly" đang dùng ở tiêu đề, tệp khai báo và biểu tượng |
| VM-07 | ĐÃ CHỐT 13/9/2026: gói miễn phí ĐƯỢC chụp, 2 lượt mỗi ngày, không cộng dồn | Đã thực hiện. Trần đổi ở `TRAN_MIEN_PHI_TRANG_NGAY` trong `domain/pricing.ts`. Hệ quả tài chính đã ghi lại ở `TRAN_HOA_VON_TRANG_HO_MIEN_PHI` và có kiểm thử canh |
| VM-08 | ĐÃ CHỐT 13/9/2026: chấm mọi dạng bài ngay ở bản đầu | Đã thực hiện: 10 dạng có bộ chấm riêng, cộng nhánh bắt buộc cho dạng chưa nhận ra. Thêm dạng mới là thêm một nhánh vào `cham-bai/index.ts`; quên viết bộ chấm thì trình biên dịch báo lỗi |

## Ranh giới giữa mô hình và mã nguồn

Một quyết định kiến trúc quan trọng không nằm trong BRD nhưng quyết định việc
BR-28 và BR-29 có đạt được hay không: **mô hình đọc ảnh chỉ phiên âm, mã nguồn
mới chấm**.

| Việc | Ai làm | Vì sao |
|---|---|---|
| Đọc chữ viết tay của trẻ thành dữ liệu | Mô hình đọc ảnh | Không mã nguồn nào đọc được chữ trẻ lớp 1 viết nghiêng trên giấy ô ly |
| Nhận dạng bài thuộc dạng nào | Mô hình đọc ảnh | Là việc nhận dạng bố cục, không phải việc tính toán |
| Tính lại từng cột, từng biểu thức | Mã nguồn tất định | Mã nguồn không bao giờ tính sai; mô hình thì có lúc |
| Kết luận đúng hay sai | Mã nguồn tất định | BR-28 đòi chỉ ĐÚNG vị trí bước sai, không phải nêu nhận xét nghe hợp lý |
| Quyết định có dám kết luận không | Mã nguồn tất định | "Chưa kết luận" phải là lựa chọn có thật, không phụ thuộc vào mức tự tin của mô hình |
| Giải đề có cấu trúc rồi soạn lời giảng | Mã nguồn tất định (tầng 1) | Phép tính thì mã nguồn không bao giờ sai, và không tốn một đồng nào |
| Soạn lời giảng cho bài toán có lời văn | Mô hình mạnh (tầng 2) | Cần hiểu ngữ cảnh và diễn đạt sư phạm — việc mã nguồn không làm được |

Ranh giới này có kiểm thử canh: lược đồ đầu ra gửi cho mô hình không có trường
nào tên `dung`, `correct` hay `diem`, và có bài kiểm thử quét mã để bảo đảm
không ai thêm vào.

## Điều kiện ra mắt số 4 — kho đủ cho bốn tuần

BRD mục 13: "Kho khuôn dạng đủ để một trẻ lớp 2 học liên tục tối thiểu bốn tuần
mà không lặp bài."

Câu này có hai cách hiểu, và `npm run kho` đo cả hai:

| Cách hiểu | Đo thế nào | Hiện tại | Kiểm thử canh |
|---|---|---|---|
| Không gặp lại đúng một ĐỀ | Vân tay đề + hình vẽ + đáp án, dựng đủ 20 buổi bằng chính bộ lập kế hoạch của trẻ | 1 trên 160 bài | dưới 5% |
| Không gặp lại một DẠNG quá dày | Đếm số lần mỗi khuôn dạng xuất hiện trong bốn tuần | 5,3 lần | dưới 8 lần |

Ngoài ra bộ đo bắt từng khuôn dạng phải có ít nhất 30 biến thể phân biệt được,
trừ khi tác giả ghi rõ lý do không gian nhỏ là chủ đích — trường
`ghiChuKhongGian` trong khuôn dạng. Lý do phải dài hơn 60 ký tự, để không ai
ghi cho có.

Điều kiện này hiện **đã đạt cho lớp 2 học kỳ 2**. Nó chưa đạt cho lớp 1, và kho
còn rất xa con số khoảng 350 khuôn dạng mà GD-03 ước tính cần để phủ cả lớp 1
và lớp 2 — nhưng đó là phạm vi giai đoạn 2, không phải điều kiện ra mắt.

## Điều kiện ra mắt số 5 — quy trình gỡ bỏ có người trực

BRD mục 13: "Quy trình tiếp nhận và xử lý yêu cầu gỡ bỏ đã chạy thử và có người
trực."

| Phần | Ở đâu | Trạng thái |
|---|---|---|
| Đầu mối công khai nhận yêu cầu | `app/go-bo-noi-dung` | Đủ |
| Hạn xử lý tính tự động | `server/requests.ts`, `domain/han-xu-ly.ts` | Đủ |
| Chỗ cho người trực xử lý | `app/truc` | Đủ |
| Nhật ký xử lý đầy đủ | bảng `nhat_ky_xu_ly` | Đủ |
| Thống kê tuân thủ để xuất trình khi bị kiểm tra | bảng trực, mục đầu | Đủ |
| Người trực thật, có ca trực thật | — | **Ngoài phần mềm** |
| Tài khoản nhân sự có phân quyền | — | **Chưa** — bản dựng dùng một mã trực chung |

Phần mềm đã sẵn sàng để quy trình chạy thử. Hai dòng cuối là việc của tổ chức,
không phải của mã nguồn, nhưng chúng vẫn nằm giữa Ô Ly và điều kiện số 5.

## Điều kiện ra mắt số 3 và số 9 — chi phí thật và tỷ lệ nhận dạng thật

BRD mục 13: chi phí xử lý một trang "đã được đo trên dữ liệu thật, không còn là
ước lượng", và tỷ lệ nhận dạng thành công ngay lần chụp đầu "đo trên bộ ảnh chụp
trong điều kiện thật" đạt ngưỡng do chủ đầu tư đặt.

Hai điều kiện này **chưa đạt**, và không thể đạt bằng mã nguồn: chúng cần ảnh
thật. Thứ mã nguồn làm được là dựng sẵn cái thước, để ngày có ảnh thì đo được
ngay chứ không mất thêm một vòng phát triển.

| Phần | Ở đâu | Trạng thái |
|---|---|---|
| Nhà cung cấp báo số token và thời gian thật | `vision/provider.ts` — `ChiPhiLanGoi` | Đủ |
| Quy token thật ra tiền theo bảng giá | `do-anh/bao-cao.ts` | Đủ |
| Lược đồ nhãn và phần kiểm nhãn trước khi chạy | `do-anh/nhan.ts` | Đủ |
| So phiên âm **và so kết luận** của bộ chấm | `do-anh/so-khop.ts` | Đủ |
| Tách theo dạng bài và theo điều kiện chụp | `do-anh/bao-cao.ts` | Đủ |
| Cắm chi phí đo được vào mô hình lỗ lãi | `do-anh/in-bao-cao.ts` | Đủ |
| Bản diễn tập tự kiểm, chạy không cần mạng | `do-anh/nha-cung-cap-dien-tap.ts`, `do-anh/tu-kiem.ts` | Đủ |
| **Bộ ảnh thật, đã gắn nhãn** | — | **Chưa có** |
| **Thỏa thuận xử lý dữ liệu đã ký** (CR-03, CR-16) | — | **Chưa** — thiếu thì không gọi được nhà cung cấp thật |
| **Ngưỡng đạt do chủ đầu tư đặt** | — | **Chưa** — bộ đo cố ý không tự đặt ngưỡng |

Bộ đo đo **kết luận**, không chỉ đo phiên âm. Nó chạy bộ chấm trên cả nhãn lẫn
phiên âm của mô hình rồi so hai kết luận, nên mọi khác biệt đều quy được về đúng
một nguyên nhân là lỗi đọc. Bốn kiểu lệch xếp theo mức tai hại, và báo động giả
— con làm đúng mà Ô Ly bảo sai — đứng đầu, vì đó là kiểu lệch duy nhất khiến một
đứa trẻ bị mắng oan.

Cách chụp và cách gắn nhãn: `docs/bo-do-anh.md`.

## CR-05 — người đại diện theo pháp luật và xác minh tuổi

Quy định về dữ liệu cá nhân của trẻ em đặt ra hai chế độ, và mốc chia là 7 tuổi:

| Tuổi của trẻ | Cần sự đồng ý của ai |
|---|---|
| Dưới 7 | Cha, mẹ hoặc người giám hộ |
| Từ đủ 7 | **Cả trẻ, và** cha, mẹ hoặc người giám hộ |

Với phần lớn sản phẩm, đây là một dòng trong hồ sơ pháp lý. Với Ô Ly thì không:
Ô Ly phục vụ lớp 1 và lớp 2, tức trẻ khoảng 6 đến 8 tuổi, nên **mốc đó cắt ngang
giữa tập người dùng**. Bé lớp 1 sáu tuổi và bé lớp 2 tám tuổi trong cùng một hộ
chịu hai chế độ khác nhau.

Hệ quả kiến trúc quan trọng nhất, và cũng là chỗ dễ làm sai nhất: **chế độ đồng
ý không phải một trạng thái lưu được.** Một hộ hợp lệ hôm nay trở thành thiếu
điều kiện vào hôm con tròn bảy tuổi, mà không có sự kiện nào xảy ra để đánh dấu
— không ai bấm gì, chỉ có thời gian trôi. Vì vậy `cheDoDongY()` nhận mốc thời
gian và được gọi lại ở **mỗi lần xử lý**, không chốt một lần lúc đăng ký. Có một
bài kiểm thử canh đúng điều này (`tests/nguoi-giam-ho.test.ts`), và mọi cách làm
kiểu "chốt rồi lưu" đều trượt đúng bài đó.

| Phần | Ở đâu | Trạng thái |
|---|---|---|
| Mốc 7 tuổi, tính lại theo thời gian | `privacy/tuoi.ts` | Đủ |
| Tháng năm sinh, không lưu ngày | `children.nam_sinh`, `children.thang_sinh` | Đủ |
| Bản ghi người đại diện, có lịch sử | bảng `guardians` | Đủ |
| Phương thức xác minh và độ mạnh | `privacy/nguoi-giam-ho.ts` | Đủ |
| Sự đồng ý của trẻ, tách khỏi của người lớn | `consents.nguoi_dong_y`, `consents.child_id` | Đủ |
| Cổng chặn dùng chung cho giao diện và tuyến xử lý | `server/du-dieu-kien.ts` | Đủ |
| Giao diện khai báo và hỏi con | `app/phu-huynh/nguoi-giam-ho` | Đủ |
| Người đại diện nằm trong bản xuất dữ liệu và bị xóa cùng hộ | `server/thuc-thi-yeu-cau.ts` | Đủ |
| Luồng mã một lần qua số điện thoại | `privacy/ma-mot-lan.ts`, `server/ma-mot-lan.ts` | Đủ phần thuộc phần mềm |
| Giao diện nhà cung cấp tin nhắn, có bản giả lập | `sms/` | Đủ |
| **Cổng tin nhắn thật** | — | **Chưa** — cần hợp đồng với nhà mạng hoặc cổng tin nhắn, là việc ngoài mã nguồn |
| **Xác nhận phương thức nào là đủ** | — | **Ngoài phần mềm** — câu hỏi pháp lý, không phải hằng số trong mã nguồn |

Ba quyết định thiết kế đáng ghi lại:

**Chỉ lưu tháng và năm sinh, không lưu ngày.** Mục đích là biết trẻ đã đủ bảy
tuổi chưa, và tháng năm đủ làm việc đó với sai số nhiều nhất một tháng. Ngày
sinh đầy đủ là một mã định danh mạnh hơn hẳn, gắn với giấy khai sinh, mà Ô Ly
không cần. Cũng không lưu một cờ "đã đủ bảy tuổi", vì cờ đó hỏng theo thời gian.

**Thiếu ngày thì làm tròn về phía hỏi thêm.** Không biết ngày sinh thì phải làm
tròn về một phía. Coi như sinh cuối tháng sẽ khiến một em vừa tròn bảy tuổi bị
tính là sáu trong tối đa một tháng — tức là THIẾU sự đồng ý. Coi như sinh đầu
tháng thì cùng lắm hỏi thừa một câu, mà câu hỏi đó không lấy thêm dữ liệu nào.
Thiếu sự đồng ý là vi phạm; thừa một câu hỏi thì không.

**Phần hỏi con nằm ở bề mặt phụ huynh, không nằm ở bề mặt của trẻ.** Bề mặt của
trẻ phải là chỗ con làm toán, không phải chỗ con gặp một bức tường pháp lý. Câu
hỏi viết cho một bạn bảy tuổi tự đọc được — trường `hoiCon` của từng mục đích —
và người lớn ngồi cạnh khi con trả lời. Con nói không cũng được, và phần luyện
tập vẫn chạy đủ.

**Mức xác minh phải giành được, không phải khai ra.** Bản đầu của phần này có
một lỗ hổng do chính cách dựng giao diện tạo ra: trang người đại diện cho phụ
huynh tự chọn mức xác minh bằng một danh sách nút tròn, nên bất cứ ai cũng bấm
được vào "đã xác minh bằng mã một lần" mà không làm gì cả — và lời cảnh báo về
mức yếu thì im bặt. Thứ đó tệ hơn việc không có xác minh, vì nó tạo ra một hồ sơ
trông như đã tuân thủ.

Nay mức xác minh do `mucDatDuocQuaMaMotLan()` quyết định, và hàm đó nhận vào sự
thật kỹ thuật — tin nhắn có thật sự được gửi ra ngoài không — chứ không nhận lời
khai của ai. Hệ quả trực tiếp: khi chạy bằng bản giả lập, mã hiện ngay trên màn
hình nên người bấm không chứng minh được gì, và hồ sơ ghi mức `otp-gia-lap` với
độ mạnh 1, không ghi `otp-dien-thoai`. Lời cảnh báo vẫn kêu.

**Ô Ly không giữ số điện thoại.** Chỉ giữ hai số cuối để phụ huynh nhận ra số
của mình, cộng một vân tay băm có khóa để đếm được số lần đã nhắn tới cùng một
thuê bao. Việc cần làm là chứng minh một lần rằng người xác nhận giữ một thuê
bao chính chủ, chứ không phải giữ một danh bạ số máy của các bậc phụ huynh — mà
danh bạ đó thì mất mát được, bị đòi cung cấp được, và bán được.

Mã lưu bằng scrypt kèm muối riêng từng dòng, không lưu dạng rõ ở đâu cả. Mã chỉ
có sáu chữ số nên SHA-256 dò hết một triệu khả năng mất chưa tới một giây; scrypt
cố ý chậm. Cộng thêm hạn năm phút, trần năm lần sai, và mỗi lúc chỉ một mã sống.

Việc chặn gửi dồn đếm theo **cả hộ lẫn số máy**. Đếm theo hộ chặn một tài khoản
tự bấm liên tục; đếm theo số máy chặn việc dùng Ô Ly làm công cụ nhắn tin quấy
rối một người ngoài — kẻ muốn làm vậy chỉ cần lập nhiều tài khoản là qua được
giới hạn theo hộ, nhưng số máy nạn nhân thì vẫn chỉ có một.

Điều khoản cụ thể và cách diễn giải phải do luật sư rà lại. Mã nguồn thực hiện
quy tắc nội dung; nó không thay cho ý kiến pháp lý.
