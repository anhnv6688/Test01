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

## Cách thường dùng: để GitHub Actions đưa lên

Ba bước trên là đường gõ tay, dùng cho lần đầu và lúc dò lỗi. Đường thường dùng
là `.github/workflows/dua-len.yml`, và nó khác ở một điểm quan trọng: **ảnh được
dựng đúng MỘT lần** ở phần chạy tự động, đưa lên bản thử, rồi khi đạt thì sang
bản thật là **đúng ảnh đó**.

`trien-khai.sh` dựng ngay trên máy chủ. Máy 8 GB thừa sức, nên nghe thì không
sao — nhưng dựng lại cho bản thật là một lần biên dịch khác, một cây phụ thuộc
có thể khác. Thứ lên bản thật không còn là thứ vừa thử xong, và toàn bộ việc
thử mất ý nghĩa. Đây là nguyên tắc số 2 ở `docs/moi-truong.md`.

### Khai báo một lần

Tạo khóa SSH riêng cho phần chạy tự động, **khác** khóa cá nhân của anh — rút
được mà không ảnh hưởng tới đường vào của chính anh:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/oly-trien-khai -C "github-actions" -N ""
ssh-copy-id -i ~/.ssh/oly-trien-khai.pub oly@109.123.233.46
ssh-keyscan 109.123.233.46            # giữ kết quả cho OLY_MAY_CHU_KHOA
```

Trên máy chủ, hạn bớt quyền của khóa đó trong `~/.ssh/authorized_keys` — thêm
`restrict,pty` vào đầu dòng chứa khóa vừa thêm. Nó cắt chuyển tiếp cổng và
chuyển tiếp tác nhân, những thứ việc triển khai không cần tới.

Trên GitHub, vào **Settings → Secrets and variables → Actions**:

| Loại | Tên | Nội dung |
|---|---|---|
| Secret | `VPS_HOST` | `109.123.233.46` |
| Secret | `VPS_USERNAME` | `oly` |
| Secret | `VPS_SSH_KEY` | nội dung `~/.ssh/oly-trien-khai` |
| Secret | `VPS_HOST_KEY` | kết quả `ssh-keyscan` ở trên |
| Secret | `VPS_PORT` | cổng SSH; để trống thì dùng 22 |
| **Variable** | `VPS_URL` | `https://thu.oly.vn`, hoặc `https://109.123.233.46` nếu chưa có tên miền |

`VPS_URL` nằm ở tab **Variables**, không phải tab Secrets — hai kho khác nhau,
và workflow đọc tab Variables. Để nhầm sang Secrets thì workflow thấy rỗng rồi
lặng lẽ bỏ qua bước soi, trong khi nhìn bảng điều khiển lại thấy đã khai rồi.

Địa chỉ đó công khai nên nó không phải secret. Giấu nó đi còn có hại: GitHub sẽ
che luôn trong nhật ký, và giá trị bị che thì không truyền được sang việc soi.

`VPS_HOST_KEY` là cái duy nhất không bỏ được. Không có nó thì chỉ còn cách thêm
`StrictHostKeyChecking=no`, mà dòng đó chấp nhận **bất cứ máy nào** trả lời ở
địa chỉ đó — một lần chiếm quyền DNS là đủ để nhận trọn khóa triển khai và toàn
bộ nội dung gửi lên. Kho mã có bài kiểm thử cấm dòng đó.

Đổi cổng SSH khỏi 22 là việc nên làm, nhưng biết rõ nó là gì: cổng 22 công khai
hứng hàng nghìn lượt dò mật khẩu mỗi ngày, đổi cổng làm nhật ký sạch hơn và
fail2ban đỡ việc. Nó **không** phải là bảo mật — ai quét cổng cũng tìm ra. Đổi
cổng thì `ssh-keyscan` phải chạy kèm `-p <cổng>`, và workflow kiểm lại điều đó
ngay từ đầu chứ không để `ssh` báo "Host key verification failed", vì lỗi ấy đọc
lên tưởng bị tấn công chứ không nghĩ là dán thiếu cổng.

### Repository secrets là đủ cho lúc này

Khai ở Repository secrets thì **mọi** việc trong workflow đọc được, kể cả việc
đưa lên bản thật. Về nguyên tắc đó là một lỗ: một lần bấm nhầm `that` sẽ trỏ bản
thật vào đúng cái máy đang chạy bản thử, mà hai bên dùng chung tên dự án Compose
nên bản thật **thay chỗ** bản thử chứ không chạy song song.

Nhưng lúc này lỗ đó đã bị bịt hai lớp, nên chưa cần tách:

1. Nút bấm tay chỉ hiện khi tệp workflow nằm trên nhánh mặc định, mà nó chưa
   nằm ở đó — nên **chưa có đường nào** chạy `that`.
2. `trien-khai/chay-anh.sh` ghi `OLY_MOI_TRUONG_DANG_CHAY` vào `.env` trên máy
   chủ và từ chối nhận môi trường khác. Chốt này nằm trên máy chủ vì đó là chỗ
   duy nhất biết máy đang chạy gì.

Khi nào có máy trong nước cho bản thật thì tạo Environment `that` và khai lại
bốn secret đó **trong environment**. GitHub cho environment ghi đè secret cùng
tên của repository, nên đến lúc ấy không phải sửa một dòng mã nào — chỉ thêm
khai báo, và **đặt "Required reviewers" cho `that`**. Đây là việc phải bấm tay
trên GitHub, không khai trong tệp workflow được, và nó là cửa duy nhất ngăn một
lần đưa lên bản thật xảy ra mà không ai biết. Bản thật chạm vào dữ liệu thật của
các hộ.

### Bước 2 vẫn phải làm bằng tay, và đó là chủ đích

Phần chạy tự động chỉ **đưa ảnh lên một máy đã sẵn sàng**. Nó cố tình không tự
cài Docker: làm thế thì khóa triển khai phải có quyền root trên máy chủ, và khóa
đó bị lộ lúc ấy là mất cả máy chứ không chỉ mất ứng dụng.

Nên `dung-may-chu.sh` chạy một lần bằng root, do người làm. Workflow kiểm trước
khi triển khai và nói rõ còn thiếu gì nếu chưa làm.

Còn `.env` thì workflow **tự sinh** ở lần triển khai đầu, với mã trực và PIN hộ
mẫu ngẫu nhiên. Nó không in hai mã đó ra nhật ký — nhật ký Actions ai đọc được
kho là đọc được. Lấy chúng bằng cách đăng nhập máy chủ một lần:

```bash
cat ~/o-ly/.env
```

### Rồi sau đó

Đẩy lên nhánh chính là tự đưa lên **bản thử**. Bản thật thì vào tab Actions,
chọn "Đưa lên máy chủ", bấm chạy, chọn `that` — và phải có người duyệt.

Sau mỗi lần đưa lên, phần chạy tự động tự gõ vào máy chủ vừa triển khai để thử
PIN `1234` và mã trực `truc2026` rồi **đòi bị từ chối**. Đó là chỗ duy nhất phát
hiện một máy chủ chạy đúng mã nguồn nhưng sai cấu hình.

Máy chủ không cần bất kỳ thông tin đăng nhập GitHub nào: cấu hình được gửi lên
qua SSH, còn thẻ đăng nhập sổ đăng ký là thẻ của chính lần chạy đó, hết hạn khi
việc kết thúc và được đăng xuất ngay sau khi kéo ảnh xong.

Máy chủ đang chạy bản nào thì xem `OLY_ANH` và `OLY_MOI_TRUONG_DANG_CHAY` trong
`~/o-ly/.env`.

## Tên miền

Chưa có tên miền thì Caddy tự ký chứng chỉ, trình duyệt sẽ kêu "kết nối không
riêng tư". Chấp nhận được cho bản thử, **không** chấp nhận được cho bản thật:
đường này chở mã PIN của bố mẹ, mã một lần gửi qua điện thoại và ảnh trang vở.

Có tên miền rồi thì hai bước, và **không** phải đăng nhập máy chủ.

**1. Trỏ bản ghi A ở nhà cung cấp tên miền.** Ví dụ với GoDaddy, tên miền
`testingwebs.online`, muốn dùng `oly.testingwebs.online`:

| Ô | Điền |
|---|---|
| Type | `A` |
| Name | `oly` — chỉ phần con, KHÔNG gõ cả `oly.testingwebs.online` |
| Value | `109.123.233.46` |
| TTL | 600 giây (1/2 giờ cũng được) |

Đợi DNS lan rồi kiểm từ máy mình — đây là bước hay bị bỏ qua, và bỏ qua thì lần
triển khai sau hỏng ở chỗ khó đoán:

```bash
nslookup oly.testingwebs.online      # phải trả về 109.123.233.46
```

**2. Sửa biến `VPS_URL` trong kho mã** thành `https://oly.testingwebs.online`
(Settings → Secrets and variables → Actions → tab **Variables**), rồi chạy lại
phần đưa lên.

Hết. Tên miền chỉ khai ở **một** chỗ: `VPS_URL`. Phần chạy tự động rút tên miền
ra từ chính địa chỉ đó rồi truyền sang máy chủ, máy chủ ghi vào `.env` và Caddy
chuyển sang `trien-khai/Caddyfile` — bản có chứng chỉ Let's Encrypt thật, HSTS
và nhật ký truy cập.

Vì sao một chỗ chứ không hai: khai hai chỗ thì chúng lệch nhau được, và kiểu
lệch đó rất khó đọc ra — Caddy xin chứng chỉ cho tên A trong khi bộ soi gõ vào
tên B, rồi báo "không kết nối được" mà không ai nghĩ tới chuyện hai cái tên khác
nhau.

Let's Encrypt cần **cổng 80 mở ra Internet** để gọi ngược vào xác minh. Phần
dựng nền đã mở sẵn; đừng đóng nó lại vì thấy Ô Ly chỉ chạy ở 443.

Đổi từ IP sang tên miền là thay chứng chỉ, nên trình duyệt nào đã từng bấm qua
cảnh báo ở địa chỉ IP thì nay vào bằng tên miền sẽ **không** thấy cảnh báo nữa.
Đó chính là điều mong muốn: người test không nên quen tay bấm qua cảnh báo bảo
mật, vì thói quen đó theo họ sang cả bản thật.

Máy chủ này vẫn là bản **THỬ** sau khi có tên miền. Tên miền không đổi được
chuyện nó đặt ở Singapore (Nghị định 53) — xem phần đầu tài liệu.

## Sau khi lên

Từ **máy của anh**, không phải từ máy chủ:

```bash
npm run kiem-moi-truong -- --goc https://oly.testingwebs.online --cho thu
```

Bộ này tự thử PIN `1234` và mã trực `truc2026` vào chính máy chủ đó rồi **đòi bị
từ chối**. Hơn bốn trăm bài kiểm thử trong Node không làm được việc này: chúng
không biết máy ngoài kia được khởi động với biến môi trường nào.

Rồi bật sao lưu:

```bash
bash trien-khai/sao-luu.sh --cai-lich
```

## Mời người nội bộ vào thử

Máy này tồn tại để người trong nhà bấm vào sản phẩm trước khi phụ huynh thật
bấm. Ba điều phải chuẩn bị, và điều đầu tiên là điều hay bị bỏ qua nhất.

### 1. Nói trước với người test: đừng chụp bài thật của con

Người test một sản phẩm **chấm bài** sẽ chụp bài thật của con mình. Đó là phản
xạ đúng đắn, không phải sự bất cẩn — muốn biết nó chấm có đúng không thì phải
đưa cho nó một bài mà mình đã biết đáp án.

Nhưng máy này đặt ở Singapore. Ảnh trang vở của một đứa trẻ có thật, kèm tên và
lớp ở đầu trang, nằm trên một máy ngoài Việt Nam là đúng thứ Nghị định 53 nói
tới. Và nếu khóa API đã cắm thì nó còn đi tiếp ra nhà cung cấp xử lý ảnh.

Trước đây sản phẩm tự nói ra điều đó bằng một dải báo trên mọi trang. **Dải báo
ấy đã gỡ theo quyết định của chủ đầu tư ngày 17/9/2026** (VM-09 ở
`docs/truy-vet-yeu-cau.md`), nên từ nay nó là việc của **người**, không còn lớp
chặn kỹ thuật nào.

Trước mỗi đợt, nói thẳng ba câu này với người test — nhắn vào nhóm, đừng nói
miệng rồi thôi:

> 1. Đây là bản thử đặt ở Singapore. **Đừng nhập tên thật của con, đừng chụp bài
>    thật của con.** Cần bài để thử thì tự viết tay một trang.
> 2. Dữ liệu ở đây có thể bị xóa bất cứ lúc nào.
> 3. Ảnh chụp ở đây **không đi đâu cả** — đang dùng bản giả lập, nên kết quả chấm
>    là dữ liệu dựng sẵn, không phải máy đọc ảnh của anh chị.

Câu thứ ba quan trọng ngang hai câu đầu: bản giả lập trả về dữ liệu dựng sẵn, nên
không nói thì người test sẽ báo "Ô Ly đọc sai hết" trong khi nó chưa đọc gì cả.
Nếu đã cắm khóa API thật thì câu ấy phải đổi lại cho đúng — và lúc đó ảnh ĐI RA
NGOÀI thật.

Cần bài để thử thì lấy từ `src/lib/do-anh/bo-dien-tap.ts` hoặc tự viết tay một
trang rồi chụp. Trang vở tự viết thì không có tên đứa trẻ nào trên đó.

### 2. Chọn đọc ảnh thật hay bản giả lập

| | Bản giả lập (mặc định) | Nhà cung cấp thật |
|---|---|---|
| Thử được luồng chụp, cắt, gửi, hiện kết quả | có | có |
| Thử được ĐỘ CHÍNH XÁC khi đọc chữ viết tay | **không** | có |
| Tốn tiền | không | có |
| Cần ba cờ `OLY_DPA_*` | không | **có** |

Đợt thử đầu tiên nên để bản giả lập: thứ cần biết trước là luồng có chạy trơn
không, màn hình có khó hiểu chỗ nào không. Độ chính xác đo bằng `npm run do-anh`
trên bộ ảnh đã che, không đo bằng cách để người nội bộ chụp con mình.

### 3. Xóa sạch giữa các đợt

```bash
bash trien-khai/dat-lai-ban-thu.sh
```

Sau một đợt bấm thử, cơ sở dữ liệu đầy tài khoản dở dang và sự đồng ý bấm nửa
chừng. Đợt sau chạy trên đống đó thì không phân biệt được lỗi của bản mới với
rác của đợt trước.

Xóa đều còn vì một lý do nữa: dữ liệu người nội bộ gõ vào tuy là "giả", nhưng
đó là lời hứa của người gõ chứ không phải sự thật kiểm chứng được. Giữ càng lâu
thì càng có khả năng trong đó có một cái tên thật.

Kịch bản này từ chối chạy nếu máy đang phục vụ bản thật.

### Lớp mật khẩu ở Caddy

`robots.txt` của bản thử chặn mọi máy quét, nhưng đó là lời đề nghị chứ không
phải cái khóa. Và từ lúc có chứng chỉ Let's Encrypt, tên miền nằm trong
Certificate Transparency log — công khai, có bot quét liên tục. Cái link "chỉ
mình biết" không còn tồn tại.

Bật bằng **một** khai báo: secret `VPS_MAT_KHAU_THU` trong kho mã (Settings →
Secrets and variables → Actions → tab **Secrets**). Tên đăng nhập luôn là
`noi-bo`. Không khai thì bản thử mở toang, và mỗi lần triển khai nói ra điều đó.

Phần còn lại tự động: `chay-anh.sh` băm mật khẩu ngay trên máy chủ bằng chính
ảnh Caddy sẽ chạy, rồi sinh `trien-khai/bao-ve.caddy`. Không có bản băm nào đi
qua kho mã hay nhật ký Actions, và mật khẩu đi sang máy chủ qua **stdin** chứ
không qua dòng lệnh — tham số của lệnh chạy từ xa hiện trong `ps` của mọi người
dùng trên máy chủ.

**Bản THẬT không bao giờ có hàng rào này, và khai nhầm thì triển khai dừng hẳn.**
Nghe ngược với trực giác, nên nói rõ: bản thật có phụ huynh thật vào bằng mã PIN
của hộ mình. Một mật khẩu dùng chung của đội phát triển đặt trước cửa không bảo
vệ thêm được gì — nó chỉ khóa đúng những người sản phẩm sinh ra để phục vụ. Nên
`chay-anh.sh` dừng và nói ra, chứ không âm thầm bỏ qua: bỏ qua thì người khai
tưởng đã bật, và tưởng sai theo hướng nguy hiểm hơn.

Hai bộ soi tự động cũng phải qua được hàng rào, nếu không mọi bước kiểm nhận 401
và cả đường ống đỏ vì một lý do chẳng liên quan gì tới sản phẩm. Chúng nhận mật
khẩu qua `OLY_MAT_KHAU_THU` và tự in ra một dòng "Đi qua hàng rào mật khẩu của
bản thử" — để dòng "đạt" ở cuối không bị đọc rộng hơn sự thật.

Và nói thẳng về sức mạnh của lớp này: nó chặn người lạ dò trúng địa chỉ và bot
quét, **không** chặn người quyết tâm. Một mật khẩu ngắn dùng chung thì đúng là
như vậy. Với một máy thử không có dữ liệu thật của trẻ, đổi như thế là hợp lý —
nhưng đừng nhầm nó với một lớp bảo vệ cho bản thật.

## Vận hành hằng ngày

```bash
cd ~/o-ly
docker compose -f compose.yaml -f compose.thu.yaml -f trien-khai/compose.caddy.yaml logs -f o-ly
bash trien-khai/trien-khai.sh                    # triển khai bản mới
bash trien-khai/sao-luu.sh                       # sao lưu ngay
bash trien-khai/sao-luu.sh --phuc-hoi <tệp.gz>   # ĐÈ dữ liệu đang chạy
bash trien-khai/dat-lai-ban-thu.sh               # xóa sạch bản thử, dựng lại
```

Sao lưu dùng lệnh của chính SQLite chứ không chép tệp — chép giữa một giao dịch
sẽ ra bản sao đứt đoạn mà **mở lên vẫn thấy có dữ liệu**, nên không ai biết là
hỏng cho tới hôm cần dùng. Mỗi bản sao được **mở thử ngay sau khi tạo** vì cùng
lý do đó.

Bản sao nằm trên chính máy này, nên ổ hỏng là mất cả gốc lẫn sao. Chuyển một bản
ra ngoài mỗi tuần, và **mã hóa trước khi chuyển**: tệp đó có tên, khối lớp và
tháng năm sinh của từng đứa trẻ.

## Ba cái bẫy đã trả giá rồi, đừng gỡ ra

Ba thứ dưới đây mỗi thứ đều làm chết ít nhất một lần triển khai, và không thứ
nào tự nói ra. Điểm chung của cả ba: một chỗ trong hệ thống báo xanh trong khi
thứ nó nói về thì hỏng.

**Docker gắn TỆP theo inode, không theo đường dẫn.** `trien-khai/compose.caddy.yaml`
gắn cả thư mục `trien-khai/` vào Caddy, không gắn riêng tệp Caddyfile. Lý do:
phần triển khai đưa cấu hình lên bằng `tar xzf`, mà tar xóa tệp cũ rồi tạo tệp
mới — inode mới. Thùng chứa vẫn trỏ vào inode cũ đã bị xóa, nên bên trong nó
Caddyfile không bao giờ đổi, dù trên đĩa máy chủ tệp đã mới tinh.

Ba lần triển khai liên tiếp gửi bản sửa lên đầy đủ mà không lần nào tới được
Caddy. Triệu chứng còn đánh lừa thêm một tầng nữa: `caddy reload` chạy trơn tru
rồi trả lời `config is unchanged` — đúng sự thật, từ chỗ nó đứng nhìn.

**Compose không dựng lại thùng chứa khi chỉ nội dung tệp cấu hình đổi.** Nó chỉ
nhìn ĐỊNH NGHĨA dịch vụ: ảnh, biến môi trường, cổng. Sửa Caddyfile thì Compose
in `Container o-ly-caddy-1 Running` rồi bỏ qua. Vì vậy `chay-anh.sh` gọi
`caddy reload` sau mỗi lần `up -d`, và trước đó còn `diff` tệp bên trong thùng
chứa với tệp trên đĩa để bắt trường hợp inode cũ quay lại dưới hình dạng khác.

**Caddy chọn chứng chỉ theo SNI, mà khách gọi tới địa chỉ IP thì không gửi SNI.**
Ghi rõ IP làm địa chỉ site đã đủ để Caddy XIN được chứng chỉ, nhưng chưa đủ để
nó ĐƯA RA — không có tên để khớp, nó trả về TLS alert 80 rồi đóng. Nhật ký Caddy
lúc đó vẫn nói "certificate obtained successfully". Chốt là dòng `default_sni`
trong `Caddyfile.khong-ten-mien`. Có tên miền thật thì cả lớp vấn đề này biến
mất.

Và một lời hứa nhỏ đi kèm: sau khi Ô Ly báo khỏe, `chay-anh.sh` tự gõ `curl` vào
chính cổng 443 từ trên máy chủ. Thùng chứa Ô Ly khỏe KHÔNG có nghĩa là người
ngoài vào được — Caddy đứng trước nó. Ba lần hỏng vừa rồi đều đi qua một bước
"khỏe" màu xanh.

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
