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

## Máy cần bao nhiêu — số đo thật, không phải ước lượng

Đo trên bản phát hành gọn, chạy bằng `node server.js`:

| Lúc nào | Bộ nhớ thật |
|---|---|
| Nghỉ, chưa ai vào | **97 MB** |
| Sau khi mở hết các trang chính | 115 MB |
| 30 phiên học mở cùng lúc, mỗi phiên sinh 8 bài | **133 MB** (hết 263 mili giây) |
| **Lúc DỰNG bản phát hành** | **1.490 MB** |

Hai điều rút ra, và điều thứ hai mới là điều hay bị mua thừa:

**Chạy thì nhẹ.** Ô Ly là một tiến trình Node với một tệp SQLite. Phần nặng nhất
— đọc ảnh trang vở — chạy ở máy của nhà cung cấp mô hình, không phải ở đây. Ba
mươi phiên cùng lúc mới hết 133 MB, nên **512 MB là đủ chạy**.

**Dựng thì nặng gấp mười lần chạy.** Đỉnh gần 1,5 GB. Đây mới là thứ quyết định
mua máy bao nhiêu RAM, và có ba cách tránh mua thừa:

1. Dựng ảnh Docker ở GitHub Actions rồi máy chủ chỉ việc tải về chạy. Kho này đã
   có sẵn phần chạy tự động, nên đây là cách gọn nhất.
2. Thêm 2 GB vùng tráo đổi (swap) trên máy 1 GB. Dựng chậm nhưng xong.
3. Mua 2 GB cho đỡ nghĩ.

Đừng mua 8 GB vì thấy hướng dẫn trên mạng bảo thế. Ô Ly không dùng tới.

## Chọn nơi đặt: Netlify hay Hostinger

| Nơi đặt | Chạy được không | Vì sao |
|---|---|---|
| **Netlify** | **Không** | Hàm không máy chủ, hệ tệp tạm cho mỗi lần gọi. Tệp SQLite bị xóa giữa các lần gọi, nên tài khoản và lịch sử học biến mất. Hỏng **âm thầm**: chạy được ở máy, lên mạng mới mất dữ liệu |
| **Hostinger gói Web/Shared** | **Không** | Không chạy được tiến trình Node đứng lâu |
| **Hostinger gói VPS (KVM)** | **Có** | Máy ảo có toàn quyền, chạy được Docker và ổ đĩa giữ lâu dài |
| Nhà cung cấp Việt Nam | **Có** | Như trên, và xem phần dưới về nơi đặt |

### AWS — đắt hơn, phức tạp hơn, nhưng có một thứ không nơi nào khác có

Tháng 6/2026 AWS mở **Local Zone tại Hà Nội**, có máy tính toán, ổ đĩa EBS và
ảnh chụp S3 ngay trong nước, kèm **lưu trú dữ liệu tại Việt Nam**.

Đó chính là câu trả lời cho Nghị định 53 ở phần trên, và là thứ Contabo, Vultr,
Hostinger đều không có. Nghĩa là nếu chọn AWS thì đường đi từ bản trình diễn ở
Singapore sang bản phục vụ người thật ở Hà Nội **không phải đổi nhà cung cấp** —
chỉ đổi vùng.

Hai điều phải biết trước khi chọn AWS vì lý do đó:

**Lightsail không chạy ở Local Zone.** Lightsail là dịch vụ theo vùng; muốn Hà
Nội thì phải dùng EC2 đầy đủ, kèm VPC, nhóm bảo mật, EBS, ảnh chụp sao lưu. Với
một tiến trình Node và một tệp SQLite thì đó là khá nhiều bộ máy cho khá ít việc.

**Hóa đơn AWS không phẳng.** Máy ảo có giá cố định, nhưng lưu lượng đi ra thì
tính theo lượng dùng. Ô Ly có gửi ảnh trang vở ra bên xử lý ảnh, nên khoản đó
tăng theo số hộ. Một máy ảo giá phẳng thì tháng nào cũng như tháng nào; AWS thì
phải theo dõi.

Giá Lightsail tại Singapore, tra tháng 9/2026:

| Gói | Máy | Mỗi tháng |
|---|---|---|
| IPv6 | 512 MB, 1 nhân, 20 GB | 3,50 đô |
| IPv4 | 512 MB, 2 nhân, 20 GB, 1 TB lưu lượng | 5 đô |
| IPv4 | 2 GB | 10 đô |
| IPv4 | 2 GB, 2 nhân, 60 GB, 3 TB lưu lượng | 12 đô |

Gói 5 đô **chạy** Ô Ly thoải mái (cần 133 MB), nhưng **không dựng** được (cần
1.490 MB) — phải dựng ảnh ở GitHub Actions rồi máy chủ chỉ tải về. Lưu ý thêm:
mức lưu lượng kèm theo ở một số vùng châu Á bị giảm một nửa so với Mỹ, nên kiểm
lại con số đúng của Singapore lúc đăng ký.

So thẳng: Contabo 8,38 đô cho 4 nhân 8 GB, còn Lightsail 12 đô cho 2 nhân 2 GB.
AWS đắt hơn rõ rệt cho cùng lượng máy. Trả thêm là trả cho đường sang Hà Nội và
cho việc nó là AWS, không phải trả cho cấu hình.

### Nếu muốn trung tâm dữ liệu Singapore thật

Hostinger không có trung tâm dữ liệu Singapore thật — khu vực này được phục vụ
từ Malaysia và Indonesia. Những nơi có máy đặt thật tại Singapore, giá tra tháng
9/2026:

| Nơi | Máy | Giá mỗi tháng | Ghi chú |
|---|---|---|---|
| **Contabo** | 4 nhân, 8 GB | **~8,38 đô** (gồm 3,10 đô phụ phí Singapore) | Rẻ nhất, và rẻ hơn cả giá gia hạn của Hostinger |
| Vultr | 1 nhân, 1 GB | ~5 đô | Đủ chạy, không đủ dựng |
| DigitalOcean | 1 nhân, 1 GB | ~6 đô | Như trên |
| Linode / Akamai | 1 nhân, 2 GB | ~12 đô | Dựng được ngay trên máy |
| Hostinger KVM 2 | 2 nhân, 8 GB | 8,99 đô rồi **14,99 đô khi gia hạn** | Không có máy đặt tại Singapore |

Giá rẻ của Hostinger là giá khuyến mại; gia hạn lên 14,99 đô. So giá gia hạn với
giá gia hạn thì Contabo rẻ hơn gần một nửa, máy mạnh hơn, và đặt đúng Singapore.

Đổi lại, Contabo nổi tiếng là bán quá công suất và hỗ trợ chậm. Với một sản phẩm
mà bố mẹ mở vào lúc chín giờ tối để xem con làm bài, chậm vài trăm mili giây
không sao; nhưng nếu máy nằm nguyên một buổi thì đó là chuyện khác. Ai cần chắc
chắn hơn thì trả thêm cho Vultr hoặc Linode.

Chọn Hostinger thì phải là **VPS**, không phải gói Web hosting. Gói KVM 2 nhân,
8 GB là quá đủ: Ô Ly là một tiến trình Node với một tệp SQLite, phần nặng nhất
là gọi mô hình đọc ảnh mà việc đó chạy ở máy của nhà cung cấp mô hình.

### Nhưng với người dùng thật, câu hỏi không phải Netlify hay Hostinger

Nghị định 53/2022/NĐ-CP buộc lưu trữ **tại Việt Nam** dữ liệu của người dùng
Việt Nam, với doanh nghiệp cung cấp dịch vụ trên mạng viễn thông và Internet.
Loại dữ liệu nêu trong nghị định gồm họ tên, ngày sinh, số điện thoại — mà Ô Ly
giữ cả ba: tên gọi của trẻ, tháng năm sinh (CR-05), và số điện thoại người đại
diện dưới dạng băm.

Hostinger phục vụ khu vực Đông Nam Á từ Malaysia và Indonesia; Netlify chạy trên
hạ tầng Mỹ. Cả hai đều **ngoài Việt Nam**.

Vì vậy:

- **Bản trình diễn** chỉ có hộ mẫu do mình dựng, không có dữ liệu của ai — đặt
  đâu cũng được. Hostinger VPS là lựa chọn gọn và rẻ.
- **Bản phục vụ người thật** nhiều khả năng phải đặt trong nước. Viettel IDC,
  VNPT Cloud, FPT Cloud, CMC Cloud đều bán VPS chạy Docker được.

Ranh giới nằm ở chỗ **có người thật dùng hay chưa**, không nằm ở chỗ phần mềm
chạy thế nào. Việc nghị định có áp cho Ô Ly hay không, và áp tới mức nào, là câu
hỏi cho luật sư — phần mã nguồn không trả lời thay được.

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
