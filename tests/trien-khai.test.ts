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

/**
 * Bỏ các dòng chú thích trước khi quét.
 *
 * Chú thích ở kho này giải thích cái bẫy bằng cách VIẾT RA chính đoạn nguy
 * hiểm — "tuyệt đối không dùng StrictHostKeyChecking=no", `ports: "3000:3000"`.
 * Bài kiểm thử đọc cả chú thích sẽ đỏ vì đúng những dòng dạy người ta tránh
 * điều đó, và cách sửa dễ nhất là xóa chú thích đi. Hỏng theo hướng ngược lại
 * với thứ nó bảo vệ.
 *
 * Dùng chung cho cả YAML lẫn shell vì cả hai đều lấy `#` làm dấu chú thích.
 */
const khongChuThich = (noiDung: string) =>
  noiDung.split("\n").filter((d) => !/^\s*#/.test(d)).join("\n");

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
    const yaml = khongChuThich(caddy);
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

/**
 * Canh phần chạy tự động đưa lên máy chủ.
 *
 * Quét chữ, không dựng YAML thành đối tượng: bộ phân tích YAML duy nhất có sẵn
 * ở kho này đến gián tiếp qua một gói khác, nên một lần nâng phụ thuộc là nó
 * biến mất và bài kiểm thử tắt ngóm mà không ai để ý. Thêm một gói chỉ để đọc
 * bốn dòng thì không đáng. Quét chữ yếu hơn, và ở đây chấp nhận được vì cả bốn
 * điều dưới đây đều là "có mặt hay không có mặt", không phải chuyện cấu trúc.
 */
describe("đưa lên máy chủ tự động", () => {
  const wf = khongChuThich(doc(".github/workflows/dua-len.yml"));

  it("không bao giờ tắt kiểm khóa máy chủ", () => {
    /*
     * StrictHostKeyChecking=no chấp nhận BẤT CỨ máy nào trả lời ở địa chỉ đó.
     * Một lần chiếm quyền DNS là đủ để nhận trọn khóa triển khai, thẻ đăng nhập
     * sổ đăng ký, và toàn bộ nội dung gửi lên. Dòng này hay được thêm vào lúc
     * ba giờ sáng khi triển khai không chạy, và không bao giờ được gỡ ra.
     */
    for (const tep of [".github/workflows/dua-len.yml", "trien-khai/chay-anh.sh", "trien-khai/trien-khai.sh"]) {
      const ma = khongChuThich(doc(tep));
      expect(ma, `${tep} tắt kiểm khóa máy chủ`).not.toMatch(/StrictHostKeyChecking[= ]*no/);
      expect(ma, `${tep} bỏ qua known_hosts`).not.toMatch(/UserKnownHostsFile[= ]*\/dev\/null/);
    }
    expect(wf).toMatch(/known_hosts/);
  });

  it("không đưa lên một bản chưa qua kiểm tra", () => {
    expect(wf).toMatch(/needs:\s*kiem/);
    expect(wf).toMatch(/npm run kiem-tra/);
    expect(wf).toMatch(/npm run khong-ro-ri/);
  });

  it("bản thật chỉ đưa lên được từ nhánh chính", () => {
    // Nhánh bất kỳ đẩy được lên bản thật nghĩa là mã chưa qua xét duyệt cũng
    // chạm được vào dữ liệu thật của các hộ.
    expect(wf).toMatch(/MOI_TRUONG == 'that'[\s\S]{0,200}default_branch/);
  });

  it("ảnh gắn nhãn bằng mã băm lần gửi mã, không phải latest", () => {
    // "latest" thì không nói được máy chủ đang chạy lần gửi mã nào, và lùi lại
    // cũng không lùi được về đâu cụ thể.
    expect(wf).toMatch(/\$\{\{ github\.sha \}\}/);
    expect(wf).not.toMatch(/:latest/);
  });

  it("máy chủ chạy ảnh đã dựng sẵn, không dựng lại từ mã nguồn", () => {
    /*
     * Nguyên tắc số 2 ở docs/moi-truong.md: MỘT ảnh đi qua cả hai môi trường.
     * Thiếu `!reset null` thì Compose vẫn thấy khối build của compose.yaml, dựng
     * lại trên máy chủ, và bỏ qua ảnh vừa kéo về — thứ lên bản thật không còn
     * là thứ vừa thử xong, mà mọi thứ vẫn xanh.
     */
    const ghcr = khongChuThich(doc("trien-khai/compose.anh-ghcr.yaml"));
    expect(ghcr).toMatch(/build:\s*!reset\s+null/);
    expect(ghcr).toMatch(/image:\s*\$\{OLY_ANH:\?/);
    expect(khongChuThich(doc("trien-khai/chay-anh.sh"))).not.toMatch(/\bbuild\b/);
  });

  it("thẻ đăng nhập sổ đăng ký không ở lại trên máy chủ", () => {
    // Thẻ của lần chạy hết hạn khi việc kết thúc, nhưng tệp ~/.docker/config.json
    // thì ở lại. Đăng xuất kể cả khi triển khai hỏng.
    expect(wf).toMatch(/docker logout ghcr\.io/);
  });
});
