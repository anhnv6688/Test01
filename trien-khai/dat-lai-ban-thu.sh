#!/usr/bin/env bash
#
# Xóa sạch dữ liệu của bản thử rồi dựng lại từ đầu. Chạy TRÊN MÁY CHỦ.
#
#   bash trien-khai/dat-lai-ban-thu.sh
#
# Vì sao một môi trường thử cần nút này: sau một đợt người nội bộ bấm thử, cơ
# sở dữ liệu đầy tài khoản dở dang, sự đồng ý bấm nửa chừng, thuê bao mua rồi
# hủy. Đợt sau mà chạy trên đống đó thì không ai biết lỗi gặp phải là lỗi của
# bản mới hay là rác của đợt trước — và một môi trường thử không nói được điều
# đó thì nó chỉ còn là một máy chủ tốn tiền.
#
# Xóa cũng là một việc nên làm đều: dữ liệu người nội bộ gõ vào tuy là giả,
# nhưng "giả" là lời hứa của người gõ chứ không phải sự thật kiểm chứng được.
# Giữ càng lâu thì càng có khả năng trong đó có một cái tên thật.
set -euo pipefail
cd "$(dirname "$0")/.."

do_()  { printf ' HỎNG  %s\n' "$1"; }
xanh() { printf '  ok   %s\n' "$1"; }

[ -f .env ] || { do_ "Chưa có .env — máy này chưa triển khai lần nào."; exit 1; }
set -a; . ./.env; set +a

#
# Chốt: kịch bản này KHÔNG bao giờ chạm vào bản thật.
#
# Nó xóa một vùng đĩa. Trên bản thật, vùng đĩa đó là tài khoản, lịch sử học và
# bằng chứng đồng ý của các hộ có thật — mất là mất hẳn, và mất luôn cả khả
# năng chứng minh đã tuân thủ. Không có cờ nào ép được; muốn xóa bản thật thì
# tự gõ lệnh docker, để việc đó không bao giờ là một lần bấm nhầm.
#
DANG_CHAY=$(grep -E '^OLY_MOI_TRUONG_DANG_CHAY=' .env | cut -d= -f2- || echo "")
if [ "$DANG_CHAY" = "that" ]; then
  do_ "Máy này đang phục vụ bản THẬT. Kịch bản này không chạy ở đó."
  exit 1
fi

[ -n "${OLY_TEN_MIEN:-}" ] && export OLY_CADDYFILE="Caddyfile" || export OLY_CADDYFILE="Caddyfile.khong-ten-mien"
COMPOSE=(docker compose -f compose.yaml -f compose.thu.yaml -f trien-khai/compose.caddy.yaml)
[ -n "${OLY_ANH:-}" ] && COMPOSE+=(-f trien-khai/compose.anh-ghcr.yaml)

SO_HO=$("${COMPOSE[@]}" exec -T o-ly node -e "
  const D=require('better-sqlite3');
  try { console.log(new D(process.env.OLY_DB).prepare('select count(*) n from households').get().n); }
  catch { console.log('?'); }
" 2>/dev/null || echo "?")

cat <<CANHBAO

  Sắp XÓA toàn bộ dữ liệu của bản thử: $SO_HO hộ, cùng mọi lịch sử học,
  sự đồng ý và biên lai đi kèm. Không khôi phục được.

  Sau đó máy dựng lại hộ mẫu với PIN trong .env, đúng như lần đầu.

CANHBAO
read -r -p "  Gõ 'xoa ban thu' để tiếp tục: " tra
[ "$tra" = "xoa ban thu" ] || { do_ "Dừng, không xóa gì."; exit 1; }

"${COMPOSE[@]}" down
# Chỉ xóa đúng vùng đĩa của bản thử. Tên này phải khớp compose.thu.yaml; sai
# tên thì lệnh báo lỗi chứ không xóa nhầm — docker không xóa một vùng đĩa
# không tồn tại.
docker volume rm "$(basename "$PWD")_oly-du-lieu-thu" 2>/dev/null \
  || docker volume rm oly-du-lieu-thu 2>/dev/null \
  || { do_ "Không tìm thấy vùng đĩa của bản thử. Xem: docker volume ls"; exit 1; }
"${COMPOSE[@]}" up -d
xanh "đã xóa và dựng lại. PIN hộ mẫu: ${OLY_PIN_MAU:-xem .env}"
