#!/usr/bin/env bash
#
# Chạy một ảnh đã dựng sẵn trên máy chủ. Kịch bản này chạy TRÊN MÁY CHỦ, do
# phần chạy tự động gọi qua SSH:
#
#   bash trien-khai/chay-anh.sh ghcr.io/chu/kho:mã-băm thu
#
# Khác trien-khai.sh ở đúng một điểm, nhưng là điểm quan trọng: nó KHÔNG dựng.
# Ảnh đã được dựng một lần ở phần chạy tự động, đã qua bản thử, và sang bản
# thật là đúng ảnh đó chứ không phải một lần biên dịch mới.
set -euo pipefail
cd "$(dirname "$0")/.."

ANH_MOI="${1:?thiếu tên ảnh}"
MOI_TRUONG="${2:-thu}"

xanh() { printf '  ok   %s\n' "$1"; }
vang() { printf '  !!   %s\n' "$1"; }
do_()  { printf ' HỎNG  %s\n' "$1"; }

[ -f .env ] || { do_ "Chưa có .env. Chạy trien-khai/trien-khai.sh một lần trước."; exit 1; }
set -a; . ./.env; set +a

#
# Một máy chỉ phục vụ MỘT môi trường, và nó nhớ mình là môi trường nào.
#
# Chốt này ra đời từ một câu hỏi thật: khai báo để ở Repository secrets thì MỌI
# việc trong workflow đều đọc được, kể cả việc đưa lên bản thật — nên một lần
# bấm nhầm sẽ trỏ bản thật vào đúng cái máy đang chạy bản thử. Với máy đặt
# ngoài Việt Nam thì đó là dữ liệu trẻ em lưu sai nơi (Nghị định 53).
#
# Tệ hơn: hai bên dùng chung tên dự án Compose, nên bản thật không chạy song
# song mà THAY CHỖ bản thử. Vùng đĩa thì tách riêng, nên bản thử vẫn còn nguyên
# trên đĩa và không ai mất gì — nhưng cũng vì thế mà không ai nhận ra, cho tới
# lúc có người hỏi sao bản thử biến mất.
#
# Chốt đặt ở đây chứ không đặt trong workflow vì đây là chỗ DUY NHẤT biết sự
# thật: workflow chỉ biết mình được khai gì, còn máy chủ thì biết mình đang
# chạy gì. Gỡ chốt bằng tay, có chủ ý, sau khi đã đọc dòng chữ dưới.
#
DANG_CHAY=$(grep -E '^OLY_MOI_TRUONG_DANG_CHAY=' .env | cut -d= -f2- || true)
if [ -n "$DANG_CHAY" ] && [ "$DANG_CHAY" != "$MOI_TRUONG" ]; then
  do_ "Máy này đang phục vụ bản '$DANG_CHAY', không đưa bản '$MOI_TRUONG' lên đây."
  do_ ""
  do_ "Thử và thật phải nằm trên hai máy khác nhau. Ở đây chúng dùng chung tên"
  do_ "dự án Compose, nên bản mới sẽ thay chỗ bản cũ chứ không chạy song song."
  do_ "Và nếu máy này đặt ngoài Việt Nam thì nó không được giữ dữ liệu thật."
  do_ ""
  do_ "Thật sự muốn đổi thì sửa tay OLY_MOI_TRUONG_DANG_CHAY trong ~/o-ly/.env."
  exit 1
fi

if [ -n "${OLY_TEN_MIEN:-}" ]; then
  export OLY_CADDYFILE="Caddyfile"
elif [ "$MOI_TRUONG" = "that" ]; then
  do_ "Bản thật bắt buộc có tên miền và chứng chỉ thật — đường này chở mã PIN,"
  do_ "mã một lần và ảnh trang vở của trẻ."
  exit 1
else
  export OLY_CADDYFILE="Caddyfile.khong-ten-mien"
fi

COMPOSE=(docker compose
  -f compose.yaml -f "compose.${MOI_TRUONG}.yaml"
  -f trien-khai/compose.caddy.yaml -f trien-khai/compose.anh-ghcr.yaml)

# Nhớ ảnh ĐANG chạy để còn đường lùi. Đọc từ .env chứ không đọc mã băm của ảnh
# trên máy: một mã băm cục bộ chỉ lùi được chừng nào ảnh đó chưa bị dọn, còn
# tên đầy đủ trong sổ đăng ký thì kéo lại được bất cứ lúc nào.
ANH_CU=$(grep -E '^OLY_ANH=' .env | cut -d= -f2- || true)
[ -n "$ANH_CU" ] && xanh "đang chạy: $ANH_CU" || xanh "chưa có ảnh cũ — lần đầu"

dat_anh() {
  # Ghi vào .env để một lệnh `docker compose up -d` gõ tay sau này vẫn dùng
  # đúng ảnh đang chạy, và để máy chủ tự nói ra nó đang chạy bản nào.
  if grep -qE '^OLY_ANH=' .env; then
    sed -i "s|^OLY_ANH=.*|OLY_ANH=$1|" .env
  else
    printf 'OLY_ANH=%s\n' "$1" >> .env
  fi
  export OLY_ANH="$1"
}

# Ghi lại môi trường TRƯỚC khi khởi động, để một lần triển khai chết giữa chừng
# vẫn để lại dấu — máy dở dang mà không ai biết nó là máy gì thì lần sau lại
# đưa nhầm thứ lên đó.
if grep -qE '^OLY_MOI_TRUONG_DANG_CHAY=' .env; then
  sed -i "s|^OLY_MOI_TRUONG_DANG_CHAY=.*|OLY_MOI_TRUONG_DANG_CHAY=$MOI_TRUONG|" .env
else
  printf 'OLY_MOI_TRUONG_DANG_CHAY=%s\n' "$MOI_TRUONG" >> .env
fi

dat_anh "$ANH_MOI"
"${COMPOSE[@]}" pull o-ly
"${COMPOSE[@]}" up -d

# Đợi trạng thái KHỎE, không đợi "đang chạy": một tiến trình Node vừa ném lỗi
# và đang trên đường chết thì vẫn đang chạy.
SONG=0
for _ in $(seq 1 60); do
  TT=$(docker inspect -f '{{.State.Health.Status}}' "$("${COMPOSE[@]}" ps -q o-ly)" 2>/dev/null || echo "chua-co")
  case "$TT" in
    healthy) SONG=1; break ;;
    unhealthy) break ;;
  esac
  sleep 2
done

if [ "$SONG" -ne 1 ]; then
  do_ "Ảnh mới không đứng dậy được. Hai chục dòng nhật ký cuối:"
  "${COMPOSE[@]}" logs --tail 20 o-ly || true
  if [ -n "$ANH_CU" ]; then
    dat_anh "$ANH_CU"
    "${COMPOSE[@]}" up -d
    vang "đã lùi về $ANH_CU"
  else
    do_ "Không có ảnh cũ để lùi về."
  fi
  exit 1
fi

xanh "Ô Ly khỏe, đang chạy $ANH_MOI"

THIEU=$("${COMPOSE[@]}" logs o-ly 2>/dev/null | grep -A20 'còn thiếu khai báo' || true)
[ -n "$THIEU" ] && { vang "máy chủ báo thiếu khai báo:"; echo "$THIEU"; }

# Dọn ảnh cũ không còn ai dùng. Không dọn thì ổ 100 GB đầy dần sau vài chục lần
# triển khai, và nó đầy vào lúc đang triển khai chứ không phải lúc đang xem.
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
exit 0
