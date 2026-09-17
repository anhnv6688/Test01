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
# Tên miền, do phần chạy tự động rút ra từ chính VPS_URL. Xem khối dưới.
TEN_MIEN_KHAI="${3:-}"

xanh() { printf '  ok   %s\n' "$1"; }
vang() { printf '  !!   %s\n' "$1"; }
do_()  { printf ' HỎNG  %s\n' "$1"; }

#
# Chưa có .env thì TỰ SINH, đừng bắt người ta đăng nhập vào máy chủ gõ tay.
#
# Bản đầu đòi chạy trien-khai.sh một lần trước. Nghe thì hợp lý, nhưng nó biến
# một đường ống tự động thành một đường ống tự động CÓ ĐIỀU KIỆN, và điều kiện
# đó chỉ lộ ra ở lần triển khai đầu tiên — đúng lúc người ta đang bận nhất.
#
# Mã sinh ngẫu nhiên tại chỗ. KHÔNG in ra màn hình: kịch bản này chạy qua SSH từ
# phần chạy tự động, nên mọi thứ in ra đều nằm lại trong nhật ký Actions, mà
# nhật ký đó ai đọc được kho là đọc được. Người vận hành lấy mã bằng cách tự
# đăng nhập và xem tệp — một việc chỉ làm một lần.
#
if [ ! -f .env ]; then
  umask 077
  {
    printf 'OLY_MA_TRUC=%s\n' "$(openssl rand -base64 33 | tr -d '/+=' | cut -c1-32)"
    printf 'OLY_PIN_MAU=%s\n' "$(shuf -i 1000-9999 -n 1)"
    printf 'OLY_TEN_MIEN=\n'
  } > .env
  chmod 600 .env
  xanh "chưa có .env — đã sinh mới (mã trực và PIN hộ mẫu ngẫu nhiên)"
  vang "Xem hai mã đó bằng:  cat ~/o-ly/.env   — không in ra đây vì nhật ký lưu lại."
fi
set -a; . ./.env; set +a

#
# Sửa lại PIN hộ mẫu nếu nó không gõ được.
#
# Bản đầu sinh PIN SÁU số, mà ô nhập duy nhất dẫn vào phần của bố mẹ có
# maxLength=4. Cấu hình nhận, cơ sở dữ liệu ghi, hộ mẫu dựng lên bình thường —
# rồi không ai vào nổi, vì trình duyệt cắt ở ký tự thứ tư và máy chủ chỉ thấy
# bốn số đầu. Triệu chứng là đúng một câu "Mã PIN chưa đúng", lặp lại mãi.
#
# Sửa ở đây chứ không chỉ sửa dòng sinh phía trên: những máy đã chạy rồi vẫn
# đang giữ một PIN sáu số trong .env, và .env chỉ được sinh khi nó chưa tồn tại.
# Không tự sửa thì bản vá này không tới được đúng cái máy đang hỏng.
#
PIN_CU=$(grep -E '^OLY_PIN_MAU=' .env | cut -d= -f2- || true)
if [ -n "$PIN_CU" ] && ! printf '%s' "$PIN_CU" | grep -qE '^[0-9]{4}$'; then
  PIN_MOI=$(shuf -i 1000-9999 -n 1)
  sed -i "s|^OLY_PIN_MAU=.*|OLY_PIN_MAU=$PIN_MOI|" .env
  export OLY_PIN_MAU="$PIN_MOI"
  vang "PIN hộ mẫu cũ không gõ được (phải đúng 4 chữ số) — đã sinh mã mới."
  vang "Xem bằng:  cat ~/o-ly/.env   — không in ra đây vì nhật ký Actions lưu lại."
fi

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

#
# Tên miền khai ở MỘT chỗ: biến VPS_URL của kho mã. Không khai ở hai chỗ.
#
# Hai chỗ thì chúng lệch nhau được, và kiểu lệch đó rất khó đọc ra: Caddy xin
# chứng chỉ cho tên A trong khi bộ soi gõ vào tên B, rồi báo "không kết nối
# được" mà không ai nghĩ tới chuyện hai cái tên khác nhau. Rút từ VPS_URL thì
# chúng không lệch được, vì chỉ có một cái tên tồn tại.
#
# Vẫn ghi xuống .env, để một lệnh `docker compose up -d` gõ tay trên máy chủ
# sau này dùng đúng tên đó — và để máy chủ tự nói ra nó đang phục vụ tên nào.
#
if [ -n "$TEN_MIEN_KHAI" ]; then
  if grep -qE '^OLY_TEN_MIEN=' .env; then
    sed -i "s|^OLY_TEN_MIEN=.*|OLY_TEN_MIEN=$TEN_MIEN_KHAI|" .env
  else
    printf 'OLY_TEN_MIEN=%s\n' "$TEN_MIEN_KHAI" >> .env
  fi
  [ "$TEN_MIEN_KHAI" != "${OLY_TEN_MIEN:-}" ] && xanh "tên miền đổi thành $TEN_MIEN_KHAI"
  export OLY_TEN_MIEN="$TEN_MIEN_KHAI"
elif [ -n "${OLY_TEN_MIEN:-}" ]; then
  # VPS_URL nay là một địa chỉ IP, nhưng máy chủ vẫn nhớ một tên miền. KHÔNG tự
  # xóa: xóa tên miền là hạ máy đang chạy chứng chỉ thật xuống chứng chỉ tự ký,
  # và một việc như thế phải do người gõ ra, không phải do một khoảng trắng.
  vang "VPS_URL không có tên miền, nhưng máy này vẫn đang phục vụ $OLY_TEN_MIEN."
  vang "Giữ nguyên tên miền. Thật sự muốn bỏ thì xóa tay dòng đó trong ~/o-ly/.env."
fi

if [ -n "${OLY_TEN_MIEN:-}" ]; then
  export OLY_CADDYFILE="Caddyfile"
elif [ "$MOI_TRUONG" = "that" ]; then
  do_ "Bản thật bắt buộc có tên miền và chứng chỉ thật — đường này chở mã PIN,"
  do_ "mã một lần và ảnh trang vở của trẻ."
  exit 1
else
  export OLY_CADDYFILE="Caddyfile.khong-ten-mien"
  # Chưa có tên miền thì địa chỉ site là IP của chính máy này. Tự tìm ở đây chứ
  # không bắt khai thêm một biến nữa — máy chủ biết rõ IP của nó hơn bất kỳ ai.
  OLY_DIA_CHI_MAY=$(hostname -I 2>/dev/null | awk '{print $1}')
  if [ -z "$OLY_DIA_CHI_MAY" ]; then
    do_ "Không tự tìm được địa chỉ IP của máy này, mà cũng chưa khai OLY_TEN_MIEN."
    do_ "Caddy cần một tên cụ thể mới xuất được chứng chỉ. Khai tay vào ~/o-ly/.env:"
    do_ "    OLY_DIA_CHI_MAY=<ip-hoặc-tên-miền>"
    exit 1
  fi
  export OLY_DIA_CHI_MAY
  xanh "chưa có tên miền — Caddy tự ký chứng chỉ cho $OLY_DIA_CHI_MAY"
fi

#
# Dựng hàng rào mật khẩu — CHỈ cho bản thử.
#
# Bản thử nằm ở một địa chỉ công khai, và từ lúc có chứng chỉ Let's Encrypt thì
# tên miền ấy nằm trong Certificate Transparency log: công khai, và có bot quét
# log đó liên tục. robots.txt chặn máy quét nhưng đó là lời đề nghị, không phải
# cái khóa.
#
# Bản THẬT thì ngược lại hẳn: phụ huynh thật vào bằng mã PIN của hộ mình, không
# thể bắt họ qua thêm một mật khẩu dùng chung của đội phát triển. Nên ở đây
# không chỉ bỏ qua mà DỪNG HẲN nếu ai đó khai mật khẩu cho bản thật — khai như
# thế gần như chắc chắn là nhầm, và cái nhầm ấy khóa người dùng ra ngoài.
#
# Băm ngay trên máy chủ bằng chính ảnh Caddy sẽ chạy, nên không có bản băm nào
# đi qua kho mã hay nhật ký. Không in mật khẩu, không in chuỗi băm.
#
BAO_VE="trien-khai/bao-ve.caddy"
if [ -n "${OLY_MAT_KHAU_THU:-}" ] && [ "$MOI_TRUONG" = "that" ]; then
  do_ "Có OLY_MAT_KHAU_THU nhưng đây là bản THẬT. Không dựng hàng rào."
  do_ "Bản thật có phụ huynh thật vào bằng PIN của hộ mình; một mật khẩu dùng"
  do_ "chung đặt trước cửa là khóa họ ra ngoài. Gỡ khai báo đó rồi chạy lại."
  exit 1
fi

if [ -n "${OLY_MAT_KHAU_THU:-}" ]; then
  BAM=$(printf '%s' "$OLY_MAT_KHAU_THU" \
    | docker run --rm -i caddy:2-alpine caddy hash-password 2>/dev/null | tr -d '\r\n')
  if [ -z "$BAM" ]; then
    do_ "Không băm được mật khẩu hàng rào (caddy hash-password không trả về gì)."
    exit 1
  fi
  umask 077
  {
    printf '# Sinh bởi trien-khai/chay-anh.sh. Đừng sửa tay, mỗi lần triển khai ghi đè.\n'
    printf 'basic_auth {\n\tnoi-bo %s\n}\n' "$BAM"
  } > "$BAO_VE"
  xanh "hàng rào mật khẩu: BẬT (tên đăng nhập noi-bo)"
else
  printf '# Không có hàng rào: OLY_MAT_KHAU_THU chưa khai.\n' > "$BAO_VE"
  if [ "$MOI_TRUONG" != "that" ]; then
    vang "hàng rào mật khẩu: TẮT — ai dò trúng địa chỉ cũng vào được bản thử này."
    vang "Bật bằng cách khai secret VPS_MAT_KHAU_THU trong kho mã."
  fi
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

#
# Bắt Caddy đọc lại Caddyfile. KHÔNG được bỏ dòng này.
#
# Compose chỉ dựng lại một thùng chứa khi ĐỊNH NGHĨA dịch vụ đổi: ảnh, biến môi
# trường, cổng. Caddyfile thì vào bằng đường gắn thư mục, nên sửa nội dung tệp
# không đổi định nghĩa nào cả — Compose nói "Container o-ly-caddy-1 Running" và
# bỏ qua, còn Caddy thì vẫn chạy cấu hình nó đã nạp từ lần khởi động trước.
#
# Đã mất một vòng chạy vì đúng chuyện này: bản sửa default_sni được gửi lên máy
# chủ đầy đủ, nằm đúng chỗ, mà máy chủ vẫn hỏng y hệt — vì chưa ai bảo Caddy đọc
# lại. Nhìn nhật ký triển khai thì mọi bước đều xanh.
#
# Dùng `reload` chứ không dựng lại thùng chứa: reload thay cấu hình mà không cắt
# kết nối đang mở và không phải xin lại chứng chỉ. Đổi biến môi trường thì
# Compose tự dựng lại ở dòng `up -d` trên, nên hai cách bù đúng chỗ cho nhau.
#
# reload tự kiểm cấu hình trước khi áp: sai cú pháp thì nó từ chối và GIỮ cấu
# hình cũ. Giữ cấu hình cũ mà báo xanh là kiểu hỏng tệ nhất, nên ở đây sai là
# đỏ ngay.
#
#
# Trước hết: Caddy có ĐANG NHÌN THẤY bản vừa gửi lên không.
#
# Câu hỏi nghe thừa, nhưng ba lần triển khai liên tiếp chết vì đúng nó. Bản đầu
# gắn riêng một tệp vào thùng chứa, mà Docker gắn tệp theo inode; `tar xzf` xóa
# tệp cũ rồi tạo tệp mới, nên thùng chứa trỏ mãi vào inode đã bị xóa. Trên đĩa
# máy chủ Caddyfile mới tinh, bên trong thùng chứa vẫn là bản cũ.
#
# `caddy reload` lúc đó trả lời "config is unchanged" và thoát 0 — không sai,
# nhưng đọc lên thì tưởng là đã nạp xong. Nay gắn cả thư mục nên chuyện đó không
# còn, và dòng dưới canh để nó đừng quay lại dưới hình dạng khác.
#
if ! "${COMPOSE[@]}" exec -T caddy cat "/etc/caddy-nguon/$OLY_CADDYFILE" 2>/dev/null \
     | diff -q - "trien-khai/$OLY_CADDYFILE" >/dev/null; then
  do_ "Caddy đang đọc một bản Caddyfile KHÁC bản vừa gửi lên máy chủ."
  do_ "Thường là do thùng chứa gắn vào một inode cũ — dựng lại nó:"
  do_ "    cd ~/o-ly && docker compose ... up -d --force-recreate caddy"
  exit 1
fi

if LOI_CADDY=$("${COMPOSE[@]}" exec -T caddy caddy reload \
      --config "/etc/caddy-nguon/$OLY_CADDYFILE" --adapter caddyfile 2>&1); then
  xanh "Caddy đã nạp lại cấu hình"
else
  do_ "Caddy KHÔNG nạp được cấu hình mới — nó vẫn đang chạy cấu hình CŨ:"
  printf '%s\n' "$LOI_CADDY"
  exit 1
fi

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

#
# Gõ thử vào chính cổng công khai, từ trên máy này.
#
# Bước trên chỉ hỏi Docker xem thùng chứa Ô Ly có khỏe không — mà Ô Ly khỏe
# KHÔNG có nghĩa là người ngoài vào được. Caddy đứng trước nó, và Caddy hỏng thì
# mọi thứ ở đây vẫn xanh trong khi ngoài kia không ai mở nổi trang.
#
# Đã xảy ra đúng như vậy, và mất sáu vòng chạy tự động mới lần ra: Caddy chạy,
# lấy được chứng chỉ, nhật ký sạch, cổng 443 công bố đầy đủ — mà bắt tay TLS thì
# đứt vì không có tên để khớp chứng chỉ. Một dòng curl ở đây bắt được chuyện đó
# trong ba giây, ngay trên máy chủ.
#
# Dùng -k vì chứng chỉ có thể là bản tự ký; ở đây ta hỏi "có bắt tay được
# không", còn "chứng chỉ có đáng tin không" là việc của npm run kiem-moi-truong.
#
#
# Đừng thêm `|| echo "000"` vào dòng dưới. Bản đầu có, và nó làm chính dòng kiểm
# này nói dối: khi bắt tay đứt, curl ĐÃ tự in "000" theo %{http_code} rồi mới
# thoát khác 0, nên echo nối thêm một "000" nữa. Giá trị thành "000\n000", phép
# so sánh với "000" trượt, và bước kiểm in ra:
#
#   ok   cổng 443 trả lời 000000 — người ngoài vào được
#
# Một dòng thêm vào để bắt lỗi im lặng, tự nó im lặng. `|| true` chỉ nuốt mã
# thoát để `set -e` không giết kịch bản, không đụng vào thứ curl đã in.
#
#
# Có tên miền thì phải gõ bằng ĐÚNG cái tên đó, qua --resolve.
#
# Gõ thẳng vào https://127.0.0.1/ là gọi tới một địa chỉ IP, mà gọi tới IP thì
# không gửi SNI — đúng cái đã làm hỏng ba lần triển khai trước. Bản không tên
# miền vá chuyện đó bằng default_sni; bản có tên miền thì không, và cũng không
# nên: ở đó SNI là thứ Caddy dùng để chọn đúng chứng chỉ, chứ không phải thứ
# thiếu sót cần bù.
#
# --resolve giữ nguyên đích là máy này, nhưng gửi đi đúng tên — tức là bắt tay
# y hệt một trình duyệt thật ngoài kia.
#
if [ -n "${OLY_TEN_MIEN:-}" ]; then
  DICH="https://$OLY_TEN_MIEN/"
  GIAI=(--resolve "$OLY_TEN_MIEN:443:127.0.0.1")
else
  DICH="https://127.0.0.1/"
  GIAI=()
fi

# Đợi, không hỏi một lần rồi kết luận: lần đầu có tên miền, Caddy còn đang xin
# chứng chỉ Let's Encrypt và cổng 443 chưa trả lời ngay. Một lần hỏi duy nhất ở
# đây sẽ làm đỏ một lần triển khai hoàn toàn đúng.
MA_HTTP=""
for _ in $(seq 1 30); do
  MA_HTTP=$(curl -sk "${GIAI[@]}" -o /dev/null -w '%{http_code}' --max-time 10 "$DICH" 2>/dev/null || true)
  printf '%s' "$MA_HTTP" | grep -qE '^[1-5][0-9][0-9]$' && break
  sleep 2
done

# Bắt tay được thì curl trả về một mã ba chữ số thật, kể cả 404 hay 502 — ở đây
# ta hỏi "có nói chuyện được với cổng 443 không", chứ chưa hỏi trang trả về gì.
if ! printf '%s' "$MA_HTTP" | grep -qE '^[1-5][0-9][0-9]$'; then
  do_ "Ô Ly khỏe nhưng KHÔNG ai vào được qua cổng 443 — Caddy không bắt tay được."
  do_ "Hai chục dòng nhật ký Caddy cuối:"
  "${COMPOSE[@]}" logs --tail 20 caddy || true
  do_ ""
  do_ "Xem chi tiết bắt tay:  openssl s_client -connect 127.0.0.1:443 </dev/null"
  [ -n "${OLY_TEN_MIEN:-}" ] && do_ "Tên miền $OLY_TEN_MIEN đã trỏ A về máy này chưa, và cổng 80 có mở không?"
  do_ "curl trả về: '''$MA_HTTP'''"
  exit 1
fi
xanh "cổng 443 trả lời $MA_HTTP cho $DICH — người ngoài vào được"

THIEU=$("${COMPOSE[@]}" logs o-ly 2>/dev/null | grep -A20 'còn thiếu khai báo' || true)
[ -n "$THIEU" ] && { vang "máy chủ báo thiếu khai báo:"; echo "$THIEU"; }

# Dọn ảnh cũ không còn ai dùng. Không dọn thì ổ 100 GB đầy dần sau vài chục lần
# triển khai, và nó đầy vào lúc đang triển khai chứ không phải lúc đang xem.
docker image prune -f --filter "until=168h" >/dev/null 2>&1 || true
exit 0
