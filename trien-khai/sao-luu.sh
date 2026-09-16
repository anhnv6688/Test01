#!/usr/bin/env bash
#
# Sao lưu cơ sở dữ liệu Ô Ly.
#
#   bash trien-khai/sao-luu.sh                 # sao lưu một lần, ngay
#   bash trien-khai/sao-luu.sh --cai-lich      # bật sao lưu hằng ngày lúc 3 giờ sáng
#   bash trien-khai/sao-luu.sh --phuc-hoi TỆP  # ĐÈ dữ liệu đang chạy bằng bản sao
#
# Toàn bộ dữ liệu của mọi hộ nằm trong ĐÚNG MỘT TỆP SQLite. Nghĩa là sao lưu
# rất dễ, và mất sạch cũng rất dễ.
#
# Hai điều kịch bản này làm mà một lệnh `cp` không làm:
#
# 1. Dùng lệnh sao lưu của chính SQLite, không chép tệp. Chép một tệp SQLite
#    trong lúc máy chủ đang ghi sẽ ra một bản sao đứt giữa giao dịch — mở lên
#    vẫn thấy có dữ liệu, nên không ai biết là hỏng cho tới hôm cần dùng.
#
# 2. MỞ THỬ bản sao ngay sau khi tạo. Một bản sao chưa ai mở lại không phải là
#    bản sao, nó là một lời hứa. Kiểm ngay thì biết hỏng từ hôm nay, còn hơn
#    biết vào hôm mất dữ liệu.
set -euo pipefail
cd "$(dirname "$0")/.."

THU_MUC="${OLY_THU_MUC_SAO_LUU:-$HOME/sao-luu-oly}"
GIU_NGAY="${OLY_GIU_SAO_LUU_NGAY:-14}"
MOI_TRUONG="${OLY_MOI_TRUONG_SAO_LUU:-thu}"

xanh() { printf '\033[32m  ok  \033[0m%s\n' "$1"; }
vang() { printf '\033[33m  !!  \033[0m%s\n' "$1"; }
do_()  { printf '\033[31m HỎNG \033[0m%s\n' "$1"; }

COMPOSE=(docker compose -f compose.yaml -f "compose.${MOI_TRUONG}.yaml" -f trien-khai/compose.caddy.yaml)

cai_lich() {
  local dong="0 3 * * * cd $PWD && bash trien-khai/sao-luu.sh >> $THU_MUC/nhat-ky.txt 2>&1"
  install -d -m 700 "$THU_MUC"
  # Gỡ dòng cũ trước khi thêm, để chạy lại không nhân đôi lịch.
  ( crontab -l 2>/dev/null | grep -v 'trien-khai/sao-luu.sh' || true; echo "$dong" ) | crontab -
  xanh "đã bật sao lưu hằng ngày lúc 3 giờ sáng, giữ $GIU_NGAY bản"
  vang "Bản sao nằm trên CHÍNH máy này. Ổ hỏng là mất cả gốc lẫn sao."
  vang "Chuyển một bản ra ngoài mỗi tuần, và MÃ HÓA trước khi chuyển —"
  vang "tệp này có tên, khối lớp và tháng năm sinh của từng đứa trẻ."
  exit 0
}

phuc_hoi() {
  local tep="$1"
  [ -f "$tep" ] || { do_ "Không thấy tệp $tep"; exit 1; }
  cat <<'CANHBAO'

  Việc sắp làm sẽ ĐÈ toàn bộ dữ liệu đang chạy bằng nội dung bản sao.
  Mọi thứ các hộ làm kể từ lúc bản sao được tạo sẽ mất và không lấy lại được:
  bài đã làm, thuê bao vừa mua, sự đồng ý vừa ghi.

CANHBAO
  read -r -p "  Gõ 'dong y de len' để tiếp tục: " tra
  [ "$tra" = "dong y de len" ] || { do_ "Dừng."; exit 1; }

  local tam="/tmp/oly-phuc-hoi-$$.sqlite"
  if [[ "$tep" == *.gz ]]; then gunzip -c "$tep" > "$tam"; else cp "$tep" "$tam"; fi
  sqlite3 "$tam" "pragma integrity_check" | grep -qx "ok" \
    || { do_ "Bản sao này HỎNG, không phục hồi."; rm -f "$tam"; exit 1; }

  # Dừng hẳn trước khi đè. Đè một tệp SQLite dưới chân tiến trình đang mở nó là
  # cách chắc chắn nhất để hỏng cả bản vừa phục hồi.
  "${COMPOSE[@]}" stop o-ly
  docker cp "$tam" "$("${COMPOSE[@]}" ps -aq o-ly):/du-lieu/oly.sqlite"
  "${COMPOSE[@]}" start o-ly
  rm -f "$tam"
  xanh "đã phục hồi từ $tep"
  exit 0
}

case "${1:-}" in
  --cai-lich) cai_lich ;;
  --phuc-hoi) phuc_hoi "${2:?thiếu đường dẫn tệp sao lưu}" ;;
  "") ;;
  *) do_ "Cờ lạ: $1"; exit 1 ;;
esac

install -d -m 700 "$THU_MUC"
LUC=$(date +%Y%m%d-%H%M)
DICH="$THU_MUC/oly-$MOI_TRUONG-$LUC.sqlite"

"${COMPOSE[@]}" exec -T o-ly node -e "
  const D = require('better-sqlite3');
  new D(process.env.OLY_DB).backup('/du-lieu/.dang-sao-luu.sqlite')
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); });
"
docker cp "$("${COMPOSE[@]}" ps -q o-ly):/du-lieu/.dang-sao-luu.sqlite" "$DICH"
"${COMPOSE[@]}" exec -T o-ly rm -f /du-lieu/.dang-sao-luu.sqlite

if ! sqlite3 "$DICH" "pragma integrity_check" | grep -qx "ok"; then
  do_ "Bản sao vừa tạo KHÔNG mở được. Giữ lại để soi: $DICH"
  exit 1
fi
SO_HO=$(sqlite3 "$DICH" "select count(*) from households" 2>/dev/null || echo "?")

gzip -f "$DICH"
chmod 600 "$DICH.gz"
xanh "$(basename "$DICH.gz") — $(du -h "$DICH.gz" | cut -f1), $SO_HO hộ, mở thử được"

# Dọn bản cũ. Chỉ dọn theo tuổi, không dọn theo số lượng: một đợt sao lưu hỏng
# chạy nhiều lần trong ngày không được phép đẩy các bản tốt của tuần trước ra.
XOA=$(find "$THU_MUC" -name 'oly-*.sqlite.gz' -mtime "+$GIU_NGAY" -print -delete | wc -l)
[ "$XOA" -gt 0 ] && xanh "đã xóa $XOA bản quá $GIU_NGAY ngày"
exit 0
