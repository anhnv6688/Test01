#!/usr/bin/env bash
#
# Dựng một máy chủ ảo trống thành máy chạy được Ô Ly. Chạy MỘT LẦN, bằng root.
#
#   ssh root@<địa-chỉ-máy>
#   curl -fsSL <đường-dẫn-tới-tệp-này> -o dung-may-chu.sh
#   bash dung-may-chu.sh [tên-người-vận-hành]
#
# Chạy lại lần nữa không hỏng gì: mọi bước đều kiểm trước khi làm.
#
# Kịch bản này KHÔNG cài Ô Ly. Nó chỉ dựng phần nền: người dùng thường, khóa
# SSH, tường lửa, Docker. Cài Ô Ly là việc của trien-khai.sh, chạy bằng người
# dùng thường đó — hai việc tách nhau vì phần nền dựng một lần còn phần ứng
# dụng thì triển khai lại nhiều lần.
set -euo pipefail

NGUOI="${1:-oly}"
MUI_GIO="Asia/Ho_Chi_Minh"

xanh() { printf '\033[32m  ok  \033[0m%s\n' "$1"; }
vang() { printf '\033[33m  !!  \033[0m%s\n' "$1"; }
do_()  { printf '\033[31m HỎNG \033[0m%s\n' "$1"; }
buoc() { printf '\n\033[1m%s\033[0m\n' "$1"; }

[ "$(id -u)" -eq 0 ] || { do_ "Phải chạy bằng root."; exit 1; }
command -v apt-get >/dev/null || { do_ "Chỉ hỗ trợ Debian và Ubuntu."; exit 1; }

export DEBIAN_FRONTEND=noninteractive

buoc "1. Cập nhật hệ thống và cài gói nền"
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg ufw fail2ban unattended-upgrades sqlite3 >/dev/null
xanh "đã cài gói nền"

timedatectl set-timezone "$MUI_GIO"
xanh "múi giờ: $MUI_GIO (nhật ký xử lý yêu cầu tính hạn theo giờ Việt Nam)"

buoc "2. Người vận hành thường, không dùng root cho việc hằng ngày"
if id "$NGUOI" >/dev/null 2>&1; then
  xanh "người dùng $NGUOI đã có"
else
  adduser --disabled-password --gecos "" "$NGUOI" >/dev/null
  xanh "đã tạo người dùng $NGUOI"
fi
usermod -aG sudo "$NGUOI"

NHA="/home/$NGUOI"
install -d -m 700 -o "$NGUOI" -g "$NGUOI" "$NHA/.ssh"
if [ -s /root/.ssh/authorized_keys ]; then
  # Gộp chứ không đè: chạy lại kịch bản không được xóa mất khóa đã thêm sau đó.
  touch "$NHA/.ssh/authorized_keys"
  cat /root/.ssh/authorized_keys "$NHA/.ssh/authorized_keys" | sort -u > "$NHA/.ssh/.gop"
  mv "$NHA/.ssh/.gop" "$NHA/.ssh/authorized_keys"
  chown "$NGUOI:$NGUOI" "$NHA/.ssh/authorized_keys"
  chmod 600 "$NHA/.ssh/authorized_keys"
  xanh "đã chép khóa SSH của root sang $NGUOI"
fi

buoc "3. Khóa SSH lại"
#
# Chốt quan trọng nhất của cả tệp này.
#
# Tắt đăng nhập bằng mật khẩu trong khi người vận hành CHƯA có khóa công khai
# nghĩa là khóa cửa rồi ném chìa vào trong. Máy Contabo giao ra mặc định là
# root kèm mật khẩu, nên trường hợp này rất dễ xảy ra — nó là trường hợp BÌNH
# THƯỜNG chứ không phải ngoại lệ hiếm.
#
# Vì vậy: không có khóa thì bỏ qua bước này và nói to, chứ không làm "cho đúng
# quy trình". Một máy còn đăng nhập được bằng mật khẩu thì còn sửa được; một
# máy không ai vào được thì phải dựng lại từ đầu.
#
if [ -s "$NHA/.ssh/authorized_keys" ]; then
  cat > /etc/ssh/sshd_config.d/99-oly.conf <<'CAUHINH'
# Ô Ly. Máy này giữ dữ liệu cá nhân của trẻ em, nên không nhận mật khẩu.
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
CAUHINH
  # Kiểm cấu hình TRƯỚC khi nạp lại. Nạp một tệp sai cú pháp là mất luôn dịch
  # vụ SSH, và lúc đó không còn đường nào vào để sửa.
  if sshd -t; then
    systemctl reload ssh 2>/dev/null || systemctl reload sshd
    xanh "SSH: chỉ nhận khóa, không nhận mật khẩu, root không đăng nhập thẳng"
  else
    rm -f /etc/ssh/sshd_config.d/99-oly.conf
    do_ "cấu hình SSH sai cú pháp — đã bỏ đi, giữ nguyên cấu hình cũ"
  fi
else
  vang "CHƯA gia cố SSH: $NGUOI không có khóa công khai nào."
  vang "Từ MÁY CỦA ANH chạy:  ssh-copy-id $NGUOI@\$(hostname -I | awk '{print \$1}')"
  vang "Đăng nhập thử bằng khóa, rồi chạy lại kịch bản này."
fi

buoc "4. Tường lửa"
#
# Bật tường lửa là bước NGUY HIỂM NHẤT của cả tệp này: làm sai một nhịp là tự
# cắt đường SSH của chính mình, và lúc đó không còn đường nào vào để sửa.
#
# Đã xảy ra thật. Bản đầu mở cổng SSH bằng hồ sơ ứng dụng `ufw allow OpenSSH`,
# rồi in "ok chỉ mở 22, 80, 443" mà KHÔNG kiểm lại. Hồ sơ đó chỉ mở cổng 22;
# máy nào đổi cổng SSH sang chỗ khác là mất đường vào ngay khi ufw bật. Và vì
# ufw THẢ im lặng chứ không từ chối, triệu chứng là treo chứ không phải báo lỗi
# — người ta sẽ đi tìm ở mạng, ở nhà cung cấp, ở mọi chỗ trừ chỗ đúng.
#
# Nay: đọc cổng SSH thật từ chính sshd rồi mở đúng cổng đó, và KIỂM LẠI sau khi
# bật thay vì in "ok".
#
CONG_SSH=$(sshd -T 2>/dev/null | awk '/^port /{print $2}' | head -1)
[ -n "$CONG_SSH" ] || CONG_SSH=22

ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow "$CONG_SSH/tcp" >/dev/null
ufw allow 80/tcp  >/dev/null
ufw allow 443/tcp >/dev/null
ufw --force enable >/dev/null

# Kiểm bằng chính ufw, không tin vào việc mình vừa gõ đúng lệnh.
if ufw status | grep -qE "^${CONG_SSH}/tcp[[:space:]]+ALLOW"; then
  xanh "mở $CONG_SSH (SSH), 80, 443 — cổng 3000 của Ô Ly KHÔNG ra ngoài, chỉ Caddy gọi được"
else
  # Mở lại rồi mới kêu. Thà tường lửa lỏng hơn dự định còn hơn một máy chủ không
  # ai vào được: cái thứ nhất sửa được từ xa, cái thứ hai thì không.
  ufw allow "$CONG_SSH/tcp" >/dev/null 2>&1 || true
  ufw --force enable >/dev/null 2>&1 || true
  do_ "KHÔNG xác nhận được luật mở cổng SSH $CONG_SSH. Đã thử mở lại."
  do_ "ĐỪNG thoát phiên này cho tới khi mở một phiên SSH MỚI thành công."
  do_ "Không vào được thì dùng bảng điều khiển của nhà cung cấp:  ufw disable"
fi

systemctl enable --now fail2ban >/dev/null 2>&1 || true
xanh "fail2ban đang chạy"

buoc "5. Tự vá lỗi bảo mật"
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'CAUHINH'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
CAUHINH
systemctl enable --now unattended-upgrades >/dev/null 2>&1 || true
xanh "bản vá bảo mật tự cài"

buoc "6. Vùng tráo đổi"
#
# Dựng bản phát hành ngốn đỉnh 1.490 MB (số đo thật, xem docs/dua-len-mang.md),
# trong khi chạy chỉ hết 133 MB. Máy từ 4 GB trở lên thì dựng thẳng được, không
# cần swap — thêm swap trên máy thừa RAM chỉ làm chậm khi hệ điều hành quyết
# định tráo nhầm thứ.
RAM_MB=$(free -m | awk '/^Mem:/{print $2}')
if [ "$RAM_MB" -ge 3500 ]; then
  xanh "RAM ${RAM_MB}MB — dựng thẳng được, không cần vùng tráo đổi"
elif swapon --show | grep -q .; then
  xanh "đã có vùng tráo đổi"
else
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap -q /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
  xanh "RAM ${RAM_MB}MB — đã thêm 2 GB vùng tráo đổi để dựng được"
fi

buoc "7. Docker"
if command -v docker >/dev/null; then
  xanh "Docker đã có: $(docker --version)"
else
  install -m 0755 -d /etc/apt/keyrings
  . /etc/os-release
  curl -fsSL "https://download.docker.com/linux/$ID/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/$ID $VERSION_CODENAME stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin >/dev/null
  xanh "đã cài Docker: $(docker --version)"
fi
systemctl enable --now docker >/dev/null

# Vào nhóm docker là quyền tương đương root: ai gọi được Docker thì gắn được ổ
# đĩa của máy vào một thùng chứa rồi đọc mọi thứ. Chấp nhận, vì đây là máy một
# việc và $NGUOI vốn đã có sudo; nhưng đừng thêm người vào nhóm này cho tiện.
usermod -aG docker "$NGUOI"
xanh "$NGUOI gọi được Docker (bằng quyền tương đương root — đừng thêm ai khác)"

# Nhật ký thùng chứa không có trần thì đầy đĩa rồi làm chết máy, và nó chết vào
# đúng lúc đang có người dùng chứ không phải lúc đang xem.
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'CAUHINH'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "20m", "max-file": "5" }
}
CAUHINH
systemctl restart docker
xanh "nhật ký Docker có trần 100 MB mỗi thùng chứa"

buoc "Xong phần nền"
DIA_CHI=$(hostname -I | awk '{print $1}')
cat <<HUONGDAN

Máy đã sẵn sàng. Phần còn lại do GitHub Actions làm — KHÔNG phải gõ tay ở đây.

Đẩy một commit lên nhánh làm việc là workflow "Đưa lên máy chủ" tự dựng ảnh,
đưa lên máy này, đợi nó khỏe, rồi gõ vào chính nó để soi. Lần đầu nó tự sinh
~/o-ly/.env với mã trực và PIN hộ mẫu ngẫu nhiên.

Sau lần triển khai đầu tiên, đăng nhập lấy hai mã đó — chúng KHÔNG in ra nhật
ký Actions, vì nhật ký đó ai đọc được kho là đọc được:

  ssh $NGUOI@$DIA_CHI
  cat ~/o-ly/.env

Hai việc nên làm ngay, trước khi rời máy này:

  1. Đưa khóa cá nhân của anh vào $NGUOI. SSH vừa bị khóa lại chỉ nhận khóa,
     nên nếu $NGUOI mới chỉ có khóa của GitHub Actions thì lát nữa chỉ Actions
     vào được máy, còn anh thì không. Từ MÁY CỦA ANH:
         ssh-copy-id $NGUOI@$DIA_CHI

  2. Đọc docs/vps-contabo.md. Có một quyết định phải chọn (tên miền hay chưa
     có tên miền) và một điều về pháp lý phải biết: máy này đặt ngoài Việt Nam
     nên nó chỉ chạy bản THỬ, không giữ dữ liệu của trẻ thật.

Còn trien-khai/trien-khai.sh là đường gõ tay, dành cho lúc dò lỗi. Nó dựng ảnh
ngay trên máy này nên đừng dùng cho bản thật — xem chú thích ở đầu tệp đó.

HUONGDAN
