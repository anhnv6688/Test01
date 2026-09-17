# Ảnh chạy Ô Ly.
#
# Ba tầng, và lý do tách ra: tầng cài gói chỉ chạy lại khi package-lock.json
# đổi, nên sửa mã nguồn thì dựng lại rất nhanh. Tầng cuối chỉ chứa thứ cần để
# chạy, không có mã nguồn, không có gói dùng để dựng.
#
# Dùng ảnh nền Debian (bookworm-slim). Hai gói có phần mã máy là better-sqlite3
# và sharp đều có sẵn bản dựng cho CẢ glibc lẫn musl, nên Alpine cũng chạy được
# và ảnh sẽ nhỏ hơn chừng ba chục megabyte. Chọn Debian vì lý do khác: bản musl
# của sharp hay vướng chuyện kích thước ngăn xếp luồng, mà phần thu nhỏ ảnh
# trang vở lại chạy đúng trên đó. Ai muốn ảnh nhỏ thì đổi được, nhưng phải chạy
# thử cả luồng chụp bài rồi mới đổi — đừng đổi vì con số megabyte.
#
# Ghi lại một lần tôi nói sai ở chính chỗ này, để người sau đừng tin suông: đoạn
# trên từng kèm câu "nên npm ci chạy được" — nhưng nó chưa bao giờ được dựng thử
# vì môi trường viết mã không có daemon Docker. Lần dựng thật đầu tiên ở phần
# chạy tự động thì hỏng ngay ở `npm ci`. Xem chú thích ở tầng 1.

# ---- Tầng 1: cài gói ----
FROM node:22-bookworm-slim AS goi
WORKDIR /app
COPY package.json package-lock.json ./

#
# `--ignore-scripts`, và vì sao cờ này ở đây KHÔNG phải là che lỗi.
#
# CLAUDE.md có một luật đúng: phải thêm cờ để npm chạy được là dấu hiệu cây phụ
# thuộc đã lệch, hãy sửa cây phụ thuộc. Trường hợp này là ngoại lệ đã đo, không
# phải ngoại lệ đoán:
#
#   better-sqlite3 có tệp binding.gyp nhưng KHÔNG khai script install. Thấy vậy
#   npm tự chèn `install: node-gyp rebuild`. Bước đó cần Python và trình biên
#   dịch, mà ảnh node:22-bookworm-slim không có — nên `npm ci` hỏng ở đây trong
#   khi vẫn chạy trơn trên máy có sẵn Python.
#
#   Nhưng bước đó KHÔNG DỰNG RA GÌ CẢ. Đã chạy thử trên máy có đủ Python:
#   `gyp info ok`, rồi không có build/Release/*.node nào xuất hiện. binding.gyp
#   của bản 13 chỉ dựng thật khi được truyền --force_build=1 — chính script
#   `build-release` của gói truyền cờ đó. Lúc chạy, gói nạp
#   prebuilds/linux-x64.node có sẵn trong chính gói.
#
# Nên lựa chọn thật là: cài cả bộ biên dịch (khoảng 200 MB ở tầng dựng) để chạy
# một bước rỗng, hay bỏ bước rỗng đó. Đã kiểm cả hai gói có mã máy —
# better-sqlite3 và sharp — đều nạp và chạy được sau khi bỏ script.
#
# Cái giá của cờ này là nó bỏ script của MỌI gói. Vì vậy có dòng kiểm ngay dưới:
# một ngày nào đó một gói thật sự cần biên dịch thì bản dựng đỏ ngay ở đây, chứ
# không đỏ lúc phụ huynh mở máy.
#
RUN npm ci --ignore-scripts

# Chốt cho cờ trên. better-sqlite3 giữ TOÀN BỘ dữ liệu của các hộ; nạp không
# được thì không có Ô Ly. Mở hẳn một cơ sở dữ liệu trong bộ nhớ rồi ghi đọc một
# dòng, chứ không chỉ require() — require() qua được cả khi phần mã máy hỏng ở
# một hàm nào đó sâu hơn.
RUN node -e "const D=require('better-sqlite3');const d=new D(':memory:');d.exec('create table t(a)');d.prepare('insert into t values (?)').run(1);if(d.prepare('select a from t').get().a!==1)throw new Error('better-sqlite3 không ghi đọc được');console.log('better-sqlite3 chạy được')" \
 && node -e "require('sharp');console.log('sharp chạy được')"

# ---- Tầng 2: dựng ----
FROM node:22-bookworm-slim AS dung
WORKDIR /app
COPY --from=goi /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Tầng 3: chạy ----
FROM node:22-bookworm-slim AS chay
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

#
# Ép địa chỉ lắng nghe về 0.0.0.0. Thiếu dòng này là hỏng, và hỏng rất khó đoán.
#
# Bản phát hành gọn của Next lấy địa chỉ nghe từ `process.env.HOSTNAME`, còn
# Docker thì TỰ ĐẶT biến HOSTNAME bằng mã container. Hai thứ vô can với nhau,
# gặp nhau thành ra máy chủ chỉ nghe ở địa chỉ mạng riêng của container.
#
# Ứng dụng vẫn chạy: Caddy gọi qua mạng Docker nên vào được. Chỉ mục kiểm tra
# sống chết ở dưới là hỏng, vì nó gọi 127.0.0.1 — mà 127.0.0.1 không còn được
# gắn. Thành ra Docker báo thùng chứa "unhealthy" trong khi nhật ký ứng dụng in
# "✓ Ready", và phần triển khai tự động thì lùi lại một bản chạy hoàn toàn tốt.
#
# Đã tái hiện: đặt HOSTNAME thành một mã container rồi gọi 127.0.0.1 -> không
# nối được; đặt 0.0.0.0 -> trả 200.
#
ENV HOSTNAME=0.0.0.0
# Mặc định trỏ vào vùng đĩa gắn ngoài. Để trong /app thì mỗi lần dựng lại ảnh
# là mất sạch dữ liệu của các hộ.
ENV OLY_DB=/du-lieu/oly.sqlite

# Không chạy bằng quyền cao nhất. Ảnh node đã có sẵn người dùng "node".
RUN mkdir -p /du-lieu && chown -R node:node /du-lieu

COPY --from=dung --chown=node:node /app/.next/standalone ./
COPY --from=dung --chown=node:node /app/.next/static ./.next/static
COPY --from=dung --chown=node:node /app/public ./public

USER node
EXPOSE 3000

# Máy chủ chấm bài phải tự đứng dậy được khi hỏng, nên khai báo cách kiểm tra
# sống chết ngay trong ảnh thay vì để mỗi nơi tự nghĩ ra một cách khác nhau.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
