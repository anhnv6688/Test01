import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Canh ba chốt nằm trong kịch bản triển khai.
 *
 * Bài kiểm thử quét chữ thì yếu hơn bài kiểm thử chạy thật, và ở đây không có
 * cách nào chạy thật: không thể dựng một máy chủ ảo trong một lần chạy vitest.
 * Nhưng ba điều dưới đây có chung một tính chất khiến chúng đáng canh kể cả
 * bằng cách yếu — chúng hỏng một cách IM LẶNG. Không có thông báo lỗi nào,
 * không có màn hình đỏ nào; chỉ có một cánh cửa mở mà mọi bảng điều khiển đều
 * báo là đã đóng.
 */

const doc = (t: string) => readFileSync(t, "utf8");

describe("Ô Ly không được công bố cổng ra máy chủ", () => {
  /*
   * Docker tự viết luật iptables ở một bảng nằm TRƯỚC luật của ufw. Một dòng
   * `ports: "3000:3000"` vì thế mở cổng 3000 ra thẳng Internet ngay cả khi
   * `ufw status` nói cổng đó bị chặn. Người vận hành nhìn vào tường lửa, thấy
   * xanh, và tin là đã đóng.
   *
   * Ô Ly chỉ cần Caddy gọi tới, mà Caddy nằm cùng mạng Docker. Không công bố
   * cổng nào là đủ, và là cách duy nhất không phụ thuộc vào việc ai đó nhớ ra
   * cái bẫy trên.
   */
  const caddy = doc("trien-khai/compose.caddy.yaml");

  it("tệp phủ xóa hẳn danh sách cổng của o-ly", () => {
    expect(caddy).toMatch(/ports:\s*!override\s*\[\]/);
  });

  it("dùng !override chứ không phải một danh sách rỗng thường", () => {
    // `ports: []` không xóa được gì: Compose GỘP danh sách của tệp phủ vào
    // danh sách gốc. Viết vậy thì cổng 3000 vẫn mở, mà nhìn tệp lại tưởng đã
    // đóng — đúng kiểu hỏng im lặng.
    expect(caddy).not.toMatch(/ports:\s*\[\]\s*$/m);
  });

  it("chỉ Caddy công bố cổng, và chỉ 80 với 443", () => {
    // Bỏ chú thích trước khi quét. Chính khối chú thích giải thích cái bẫy ở
    // trên có viết chuỗi "3000:3000" làm ví dụ, và bài kiểm thử mà đọc cả chú
    // thích thì nó đang canh văn xuôi chứ không canh cấu hình.
    const yaml = caddy.split("\n").filter((d) => !/^\s*#/.test(d)).join("\n");
    const cong = [...yaml.matchAll(/"(\d+):(\d+)(\/udp)?"/g)].map((m) => m[1]);
    expect(cong.sort()).toEqual(["443", "443", "80"]);
  });
});

describe("kịch bản dựng máy không được tự khóa mình ra ngoài", () => {
  /*
   * Máy Contabo giao ra mặc định là root kèm mật khẩu. Tắt đăng nhập bằng mật
   * khẩu trong khi người vận hành chưa có khóa công khai là khóa cửa rồi ném
   * chìa vào trong — và phải dựng lại máy từ đầu.
   *
   * Đây là trường hợp BÌNH THƯỜNG, không phải ngoại lệ hiếm, nên chốt phải nằm
   * trong mã chứ không nằm trong trí nhớ người chạy.
   */
  const dung = doc("trien-khai/dung-may-chu.sh");

  it("chỉ tắt mật khẩu khi đã có khóa công khai", () => {
    const i = dung.indexOf("PasswordAuthentication no");
    const j = dung.indexOf('if [ -s "$NHA/.ssh/authorized_keys" ]');
    expect(j, "không thấy chốt kiểm khóa công khai").toBeGreaterThan(-1);
    expect(j, "tắt mật khẩu nằm ngoài chốt").toBeLessThan(i);
  });

  it("kiểm cú pháp cấu hình SSH trước khi nạp lại", () => {
    // Nạp một tệp sshd_config sai cú pháp là mất luôn dịch vụ SSH, và lúc đó
    // không còn đường nào vào để sửa.
    const i = dung.indexOf("sshd -t");
    const j = dung.indexOf("systemctl reload ssh");
    expect(i).toBeGreaterThan(-1);
    expect(i).toBeLessThan(j);
  });
});

describe("bản thật không chạy được nếu chưa có chứng chỉ thật", () => {
  const tk = doc("trien-khai/trien-khai.sh");

  it("từ chối --that khi chưa khai tên miền", () => {
    // Chứng chỉ tự ký mã hóa được đường truyền nhưng không chứng minh được máy
    // bên kia là ai. Đường này chở mã PIN của bố mẹ, mã một lần và ảnh trang
    // vở, nên "có mã hóa" là chưa đủ.
    expect(tk).toMatch(/OLY_TEN_MIEN[\s\S]{0,900}MOI_TRUONG"\s*=\s*"that"[\s\S]{0,400}exit 1/);
  });

  it("hỏi lại về nơi đặt máy trước khi dựng bản thật", () => {
    expect(tk).toMatch(/Nghị định 53/);
  });

  it("đợi trạng thái KHỎE chứ không đợi trạng thái đang chạy", () => {
    // Một thùng chứa "đang chạy" có thể là một tiến trình Node vừa ném lỗi và
    // đang trên đường chết.
    expect(tk).toMatch(/State\.Health\.Status/);
    expect(tk).toMatch(/healthy\)/);
  });

  it("có đường lùi khi bản mới không đứng dậy được", () => {
    expect(tk).toMatch(/docker tag "\$ANH_CU"/);
  });
});
