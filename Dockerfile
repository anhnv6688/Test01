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

# ---- Tầng 1: cài gói ----
FROM node:22-bookworm-slim AS goi
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

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
