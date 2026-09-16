#!/usr/bin/env bash
#
# Triển khai Ô Ly lên máy chủ đã dựng bằng dung-may-chu.sh.
#
#   bash trien-khai/trien-khai.sh              # bản thử (mặc định)
#   bash trien-khai/trien-khai.sh --that       # bản thật — đọc kỹ phần pháp lý
#   bash trien-khai/trien-khai.sh --khong-keo  # không kéo mã mới về
#
# Chạy bằng người vận hành thường, KHÔNG phải root.
#
# Kịch bản dừng và LÙI LẠI ảnh cũ nếu bản mới không đứng dậy được. Đây là lý do
# nó tồn tại thay vì một dòng `docker compose up -d`: một bản dựng hỏng mà vẫn
# thay chỗ bản đang chạy thì sản phẩm chết cho tới khi có người nhìn vào, và
# người đó thường nhìn vào lúc bố mẹ đã mở máy lên rồi.
set -euo pipefail
cd "$(dirname "$0")/.."

MOI_TRUONG="thu"
KEO=1
for co in "$@"; do
  case "$co" in
    --that) MOI_TRUONG="that" ;;
    --thu)  MOI_TRUONG="thu" ;;
    --khong-keo) KEO=0 ;;
    *) echo "Cờ lạ: $co"; exit 1 ;;
  esac
done

xanh() { printf '\033[32m  ok  \033[0m%s\n' "$1"; }
vang() { printf '\033[33m  !!  \033[0m%s\n' "$1"; }
do_()  { printf '\033[31m HỎNG \033[0m%s\n' "$1"; }
buoc() { printf '\n\033[1m%s\033[0m\n' "$1"; }

[ "$(id -u)" -ne 0 ] || { do_ "Đừng chạy bằng root. Dùng người vận hành thường."; exit 1; }
docker compose version >/dev/null 2>&1 || { do_ "Chưa có Docker Compose. Chạy dung-may-chu.sh trước."; exit 1; }

buoc "1. Khai báo"
if [ ! -f .env ]; then
  # Sinh ra chứ không hỏi. Mã do người tự nghĩ trong lúc đang dựng máy chủ gần
  # như luôn là mã yếu, và bảng trực là nơi XUẤT và XÓA được dữ liệu của các hộ.
  MA_TRUC=$(openssl rand -base64 33 | tr -d '/+=' | cut -c1-32)
  PIN_MAU=$(shuf -i 100000-999999 -n 1)
  umask 077
  cat > .env <<CAUHINH
# Sinh tự động lúc triển khai lần đầu. Giữ tệp này như giữ chìa khóa nhà.
OLY_MA_TRUC=$MA_TRUC
OLY_PIN_MAU=$PIN_MAU

# Tên miền đã trỏ về máy này. Để TRỐNG thì Caddy tự ký chứng chỉ và trình duyệt
# sẽ kêu — chỉ chấp nhận được với bản thử.
OLY_TEN_MIEN=

# Đọc ảnh thật cần khóa API VÀ đủ ba cờ thỏa thuận xử lý dữ liệu. Thiếu một cờ
# thì Ô Ly tự quay về bản giả lập và ghi cảnh báo. Xem CR-03, CR-16.
# ANTHROPIC_API_KEY=
# OLY_DPA_DA_KY=true
# OLY_DPA_CAM_HUAN_LUYEN=true
# OLY_DPA_CAM_LUU_GIU=true
CAUHINH
  chmod 600 .env
  xanh "đã sinh .env"
  echo ""
  echo "    Mã vào bảng trực /truc : $MA_TRUC"
  echo "    PIN hộ mẫu             : $PIN_MAU"
  echo ""
  vang "Chép hai dòng trên vào chỗ giữ mật khẩu NGAY. Sau lần này chúng chỉ còn trong .env."
else
  xanh ".env đã có, giữ nguyên"
fi
set -a; . ./.env; set +a

if [ -n "${OLY_TEN_MIEN:-}" ]; then
  export OLY_CADDYFILE="Caddyfile"
  DIA_CHI="https://$OLY_TEN_MIEN"
  xanh "tên miền $OLY_TEN_MIEN — Caddy sẽ xin chứng chỉ Let's Encrypt"
else
  export OLY_CADDYFILE="Caddyfile.khong-ten-mien"
  DIA_CHI="https://$(hostname -I | awk '{print $1}')"
  vang "chưa có tên miền — chứng chỉ tự ký, trình duyệt sẽ kêu. Chỉ dùng cho bản thử."
  if [ "$MOI_TRUONG" = "that" ]; then
    do_ "Bản THẬT bắt buộc phải có tên miền và chứng chỉ thật."
    do_ "Đường này chở mã PIN, mã một lần và ảnh trang vở của trẻ."
    exit 1
  fi
fi

TEP_MT="compose.${MOI_TRUONG}.yaml"
COMPOSE=(docker compose -f compose.yaml -f "$TEP_MT" -f trien-khai/compose.caddy.yaml)
# Tên ảnh do trien-khai/compose.caddy.yaml đặt, không đoán theo tên thư mục.
ANH="o-ly:dang-chay"

if [ "$MOI_TRUONG" = "that" ]; then
  buoc "Bản THẬT — đọc trước khi tiếp tục"
  cat <<'PHAPLY'
  Cơ sở dữ liệu sắp chạy sẽ chứa tên gọi của trẻ, khối lớp, tháng năm sinh,
  lịch sử làm bài và số điện thoại đã băm của người đại diện.

  Nghị định 53/2022 buộc lưu trữ dữ liệu người dùng Việt Nam TẠI VIỆT NAM.
  Một máy chủ ở Singapore, Đức hay Mỹ đều không đạt điều đó.

  Nếu máy này không đặt trong nước, hãy dừng lại và hỏi luật sư trước.
PHAPLY
  read -r -p "  Gõ 'toi da hoi' để tiếp tục: " tra
  [ "$tra" = "toi da hoi" ] || { do_ "Dừng."; exit 1; }
fi

buoc "2. Lấy mã mới"
if [ "$KEO" -eq 1 ] && [ -d .git ]; then
  if [ -n "$(git status --porcelain)" ]; then
    vang "cây làm việc có thay đổi chưa commit — không kéo, dựng đúng thứ đang có trên đĩa"
  else
    git pull --ff-only
    xanh "đã kéo về $(git rev-parse --short HEAD)"
  fi
else
  xanh "bỏ qua bước kéo mã"
fi

buoc "3. Dựng ảnh"
# Nhớ ảnh đang chạy TRƯỚC khi dựng, để còn đường lùi. Sau khi dựng xong thì
# nhãn đã trỏ sang ảnh mới, lúc đó hỏi thì muộn rồi.
ANH_CU=$(docker image inspect -f '{{.Id}}' "$ANH" 2>/dev/null || echo "")
[ -n "$ANH_CU" ] && xanh "ảnh đang chạy: ${ANH_CU:7:12}" || xanh "chưa có ảnh cũ — đây là lần đầu"
"${COMPOSE[@]}" build

buoc "4. Khởi động"
"${COMPOSE[@]}" up -d

buoc "5. Đợi đứng dậy"
#
# Đợi trạng thái SỨC KHỎE, không đợi trạng thái "đang chạy". Một thùng chứa
# "đang chạy" có thể là một tiến trình Node vừa ném lỗi và đang trên đường
# chết. Dockerfile đã khai sẵn cách kiểm tra sống chết, dùng đúng cái đó.
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
  do_ "Ô Ly không đứng dậy được. Hai chục dòng nhật ký cuối:"
  "${COMPOSE[@]}" logs --tail 20 o-ly || true
  if [ -n "$ANH_CU" ]; then
    buoc "Lùi lại ảnh cũ"
    docker tag "$ANH_CU" "$ANH"
    "${COMPOSE[@]}" up -d
    vang "đã lùi về ảnh ${ANH_CU:7:12}. Sản phẩm chạy lại bằng bản cũ."
    vang "Sửa lỗi rồi triển khai lại; đừng để nguyên đây."
  else
    do_ "Không có ảnh cũ để lùi về."
  fi
  exit 1
fi
xanh "Ô Ly khỏe"

buoc "6. Máy chủ có kêu thiếu khai báo gì không"
# Ứng dụng tự in ra danh sách thiếu lúc khởi động. Nhật ký thì không ai đọc,
# nên lôi nó ra đây, ngay lúc người vận hành còn đang nhìn màn hình.
THIEU=$("${COMPOSE[@]}" logs o-ly 2>/dev/null | grep -A20 'còn thiếu khai báo' || true)
if [ -n "$THIEU" ]; then
  vang "máy chủ báo thiếu khai báo:"
  echo "$THIEU"
else
  xanh "không thiếu khai báo nào"
fi

buoc "7. Soi bản đang chạy"
LOI=0
kiem() {
  local duong="$1" mong="$2" ma
  ma=$(curl -sk -o /dev/null -w '%{http_code}' --max-time 15 "${DIA_CHI}${duong}" || echo "000")
  if [ "$ma" = "$mong" ]; then
    xanh "${duong} trả ${ma}"
  else
    do_ "${duong} trả ${ma}, đáng lẽ ${mong}"
    LOI=$((LOI + 1))
  fi
}
kiem "/" 200
# Công cụ gắn nhãn phục vụ ảnh trang vở chưa che, đọc thẳng từ đĩa. Trên một
# địa chỉ công khai nó phải KHÔNG TỒN TẠI. Kiểm ở đây chứ không chỉ tin bài
# kiểm thử: giữa hàm chốt và một máy chủ đã dựng còn có việc định tuyến.
kiem "/gan-nhan" 404
kiem "/api/gan-nhan" 404

buoc "Xong"
echo "  Địa chỉ      : $DIA_CHI"
echo "  Môi trường   : $MOI_TRUONG"
echo "  Bảng trực    : $DIA_CHI/truc"
echo ""
if [ "$LOI" -ne 0 ]; then
  do_ "$LOI điều không đạt ở trên. Xử lý trước khi mở cho ai vào."
  exit 1
fi
cat <<'CONLAI'
  Hai việc nữa, làm từ MÁY CỦA ANH chứ không phải từ máy chủ:

    npm run kiem-moi-truong -- --goc <địa-chỉ> --cho thu

  Bộ này tự thử PIN 1234 và mã trực truc2026 vào chính máy chủ vừa dựng rồi
  đòi bị từ chối. Bài kiểm thử trong Node không làm được việc đó vì nó không
  biết máy ngoài kia khởi động với biến môi trường nào.

    bash trien-khai/sao-luu.sh --cai-lich

  Bật sao lưu hằng ngày. Một cơ sở dữ liệu không có bản sao thì không phải là
  một cơ sở dữ liệu, nó là một canh bạc.
CONLAI
