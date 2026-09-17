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
describe("ảnh Docker dựng được và phần mã máy chạy được", () => {
  const df = khongChuThich(doc("Dockerfile"));

  it("bỏ script lúc cài gói thì PHẢI có dòng kiểm phần mã máy đi kèm", () => {
    /*
     * `--ignore-scripts` bỏ script của mọi gói, không chỉ của better-sqlite3.
     * Hôm nay nó vô hại vì bước bị bỏ là một bước rỗng — binding.gyp của
     * better-sqlite3 chỉ dựng thật khi có --force_build=1, và gói nạp
     * prebuilds/linux-x64.node có sẵn bên trong nó.
     *
     * Ngày một gói thật sự cần biên dịch thì cờ này làm ảnh dựng ra THIẾU phần
     * mã máy mà không báo gì. Dòng kiểm là chỗ duy nhất biến chuyện đó thành
     * một bản dựng đỏ, thay vì một máy chủ lên được rồi sập lúc có người vào.
     * Gỡ cờ thì gỡ luôn dòng kiểm cũng được; giữ cờ mà gỡ dòng kiểm thì không.
     */
    if (!df.includes("--ignore-scripts")) return;
    expect(df, "có --ignore-scripts nhưng không kiểm lại phần mã máy")
      .toMatch(/require\(['"]better-sqlite3['"]\)/);
    // Phải ghi đọc thật, không chỉ require: require() qua được cả khi phần mã
    // máy hỏng ở một hàm sâu hơn.
    expect(df).toMatch(/create table/i);
  });

  it("ép địa chỉ lắng nghe về 0.0.0.0, không để Docker quyết hộ", () => {
    /*
     * Next lấy địa chỉ nghe từ process.env.HOSTNAME; Docker tự đặt biến đó
     * bằng mã container. Thiếu dòng ép này thì máy chủ chỉ nghe ở địa chỉ mạng
     * riêng của container, mục kiểm tra sống chết gọi 127.0.0.1 nên luôn đỏ,
     * và phần triển khai tự động lùi lại một bản chạy hoàn toàn tốt — trong
     * khi nhật ký ứng dụng vẫn in "Ready".
     */
    expect(df).toMatch(/ENV HOSTNAME=0\.0\.0\.0/);
    // Phải đặt TRƯỚC mục kiểm tra sống chết, nếu không thì kiểm cái chưa có.
    expect(df.indexOf("ENV HOSTNAME")).toBeLessThan(df.indexOf("HEALTHCHECK"));
  });

  it("dòng kiểm nằm trong cùng tầng với lệnh cài gói", () => {
    // Kiểm ở tầng khác thì tầng cài gói vẫn được ghi vào bộ đệm dù hỏng, và
    // lần dựng sau sẽ dùng lại đúng cái tầng thiếu phần mã máy đó.
    const iCai = df.indexOf("npm ci");
    const iKiem = df.indexOf("better-sqlite3");
    const iTangSau = df.indexOf("AS dung");
    expect(iCai).toBeLessThan(iKiem);
    expect(iKiem).toBeLessThan(iTangSau);
  });
});

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

  it("một máy chỉ phục vụ một môi trường, và nó tự nhớ mình là gì", () => {
    /*
     * Khai báo để ở Repository secrets thì MỌI việc trong workflow đọc được,
     * kể cả việc đưa lên bản thật — nên một lần bấm nhầm sẽ trỏ bản thật vào
     * đúng cái máy đang chạy bản thử. Với máy đặt ngoài Việt Nam thì đó là dữ
     * liệu trẻ em lưu sai nơi (Nghị định 53).
     *
     * Chốt nằm trên máy chủ chứ không nằm trong workflow, vì chỉ máy chủ biết
     * nó ĐANG chạy gì; workflow chỉ biết nó được khai gì.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    expect(ca).toMatch(/OLY_MOI_TRUONG_DANG_CHAY/);
    // Phải chặn TRƯỚC khi chạm vào docker, không phải sau khi đã `up -d`.
    expect(ca.indexOf("DANG_CHAY")).toBeLessThan(ca.indexOf("COMPOSE=("));
  });

  it("Caddyfile vào thùng chứa bằng thư mục, không bằng một tệp", () => {
    /**
     * Docker gắn một tệp theo INODE chứ không theo đường dẫn. Phần triển khai
     * đưa cấu hình lên bằng `tar xzf`, mà tar xóa tệp cũ rồi tạo tệp mới — inode
     * mới. Thùng chứa vẫn trỏ vào inode cũ đã bị xóa, nên bên trong nó Caddyfile
     * không bao giờ đổi, dù trên đĩa máy chủ tệp đã mới tinh.
     *
     * Ba lần triển khai liên tiếp chết vì đúng chuyện này, và nó không tự nói ra:
     * `caddy reload` chạy trơn tru rồi trả lời "config is unchanged".
     */
    const yaml = khongChuThich(doc("trien-khai/compose.caddy.yaml"));
    expect(yaml).toMatch(/\.\/trien-khai:\/etc\/caddy-nguon:ro/);
    // Không được quay lại kiểu gắn một tệp vào thẳng /etc/caddy/Caddyfile.
    expect(yaml).not.toMatch(/:\/etc\/caddy\/Caddyfile/);
  });

  it("bắt Caddy đọc lại Caddyfile sau khi up -d", () => {
    /**
     * Compose chỉ dựng lại thùng chứa khi ĐỊNH NGHĨA dịch vụ đổi. Caddyfile vào
     * bằng đường gắn thư mục, nên sửa nội dung tệp không đổi định nghĩa nào —
     * Compose in "Container o-ly-caddy-1 Running" rồi bỏ qua, và Caddy vẫn chạy
     * cấu hình cũ. Mọi bước triển khai xanh, máy chủ hỏng y hệt lần trước.
     *
     * Đã mất một vòng chạy vì đúng chuyện này, nên bài kiểm này canh dòng đó.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    expect(ca).toMatch(/caddy reload/);
    // Nạp lại SAU khi up -d, nếu không thì nó nạp lại cấu hình của lần trước.
    expect(ca.indexOf("up -d")).toBeLessThan(ca.indexOf("caddy reload"));
  });

  it("phép kiểm cổng 443 không tự nối thêm mã giả vào thứ curl đã in", () => {
    /**
     * Bản đầu viết `curl ... -w '%{http_code}' ... || echo "000"`. Khi bắt tay
     * đứt, curl ĐÃ in "000" theo %{http_code} rồi mới thoát khác 0, nên echo
     * nối thêm một "000" nữa: giá trị thành "000\n000", so sánh với "000"
     * trượt, và bước kiểm in ra "cổng 443 trả lời 000000 — người ngoài vào
     * được" trong khi ngoài kia không ai mở nổi trang.
     *
     * Một dòng thêm vào để bắt lỗi im lặng mà tự nó im lặng thì tệ hơn không
     * có dòng nào: nó biến một chỗ chưa được kiểm thành một chỗ tưởng đã kiểm.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    const dong = ca.split("\n").filter((d) => d.includes("%{http_code}"));
    expect(dong.length).toBeGreaterThan(0);
    for (const d of dong) expect(d).not.toMatch(/\|\|\s*echo/);
    // Và phải nhận đúng hình dạng một mã HTTP thật, chứ không chỉ khác "000".
    expect(ca).toMatch(/\^\[1-5\]\[0-9\]\[0-9\]\$/);
  });

  it("mọi bộ soi dùng --chung-chi-tu-ky đều được đặt biến TLS từ ngoài", () => {
    /**
     * `--chung-chi-tu-ky` chỉ dạy TRÌNH DUYỆT bỏ qua chứng chỉ tự ký. Hai bộ soi
     * còn gọi `fetch` thẳng, mà fetch của Node nghe biến môi trường chứ không
     * nghe cờ dòng lệnh — và trong ESM thì gán process.env trong mã là muộn, vì
     * `import` chạy trước mọi câu lệnh và playwright đã kéo `tls` vào rồi.
     *
     * Quên đặt thì hỏng ở chỗ đổ lỗi nhầm người: bước đợi máy chủ nuốt lỗi
     * chứng chỉ, đợi hết 90 giây, rồi báo "Máy chủ không lên" trong khi máy chủ
     * lên hoàn toàn bình thường. Đã mất một vòng chạy vì đúng nó.
     */
    for (const bo of ["kiem-moi-truong", "kiem-giao-dien"]) {
      const i = wf.indexOf(`npm run ${bo} --`);
      expect(i, `workflow phải gọi ${bo}`).toBeGreaterThan(-1);
      // Biến phải được đặt TRƯỚC dòng gọi, trong cùng một bước.
      const truoc = wf.slice(Math.max(0, i - 400), i);
      expect(truoc, `${bo} chạy mà chưa đặt biến TLS`).toMatch(
        /export NODE_TLS_REJECT_UNAUTHORIZED=0/,
      );
    }
  });

  it("tên miền chỉ khai ở MỘT chỗ — rút ra từ VPS_URL", () => {
    /**
     * Khai hai chỗ thì chúng lệch nhau được, và kiểu lệch đó rất khó đọc ra:
     * Caddy xin chứng chỉ cho tên A trong khi bộ soi gõ vào tên B, rồi báo
     * "không kết nối được" mà không ai nghĩ tới chuyện hai cái tên khác nhau.
     */
    expect(wf).toMatch(/DIA_CHI_CONG_KHAI:\s*\$\{\{\s*vars\.VPS_URL\s*\}\}/);
    // Tên miền phải được truyền sang máy chủ, không để máy chủ tự đoán.
    expect(wf).toMatch(/chay-anh\.sh '\$ANH' '\$MOI_TRUONG' '\$TEN_MIEN'/);
    // Và KHÔNG được đẻ ra một biến khai tên miền thứ hai.
    expect(wf).not.toMatch(/vars\.VPS_TEN_MIEN|secrets\.VPS_TEN_MIEN/);
  });

  it("phép gõ thử cổng 443 gửi SNI khi máy có tên miền", () => {
    /**
     * Gõ thẳng vào https://127.0.0.1/ là gọi tới một địa chỉ IP, mà gọi tới IP
     * thì không gửi SNI — đúng cái đã làm hỏng ba lần triển khai. Bản không tên
     * miền vá bằng default_sni; bản CÓ tên miền thì không, vì ở đó SNI là thứ
     * Caddy dùng để chọn đúng chứng chỉ chứ không phải thiếu sót cần bù.
     *
     * --resolve giữ đích là chính máy này nhưng gửi đi đúng tên, tức là bắt tay
     * y hệt một trình duyệt thật ngoài kia.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    expect(ca).toMatch(/--resolve "\$OLY_TEN_MIEN:443:127\.0\.0\.1"/);
    // Và phải đợi được lúc Caddy xin chứng chỉ, chứ không hỏi một lần rồi kết
    // luận — lần đầu có tên miền thì cổng 443 chưa trả lời ngay.
    const i = ca.indexOf("%{http_code}");
    expect(ca.slice(Math.max(0, i - 300), i)).toMatch(/for _ in \$\(seq/);
  });

  it("PIN hộ mẫu sinh ra phải gõ được — đúng bốn chữ số", () => {
    /**
     * chay-anh.sh từng sinh PIN sáu số (shuf -i 100000-999999), mà ô nhập duy
     * nhất dẫn vào phần của bố mẹ có maxLength={4}. Hộ mẫu dựng lên bình thường
     * và không ai vào nổi: trình duyệt cắt ở ký tự thứ tư, máy chủ trả về "Mã
     * PIN chưa đúng", đúng một câu, mãi mãi.
     *
     * Bản thử chạy cả buổi như thế. Không bộ kiểm nào bắt được, vì bộ soi môi
     * trường lúc ấy in "ok PIN 1234 vẫn mở được" từ một hằng số.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    expect(ca).toMatch(/shuf -i 1000-9999/);
    expect(ca).not.toMatch(/shuf -i 100000-999999/);
    // Và phải sửa được PIN cũ: .env chỉ sinh khi chưa có, nên máy đã chạy rồi
    // vẫn giữ mã sáu số cũ và bản vá không tới được đúng cái máy đang hỏng.
    expect(ca).toMatch(/PIN_CU/);
  });

  it("bộ soi môi trường không khẳng định PIN mà không kiểm", () => {
    /**
     * Dòng này từng là `nhac(..., true)` — một hằng số, không đọc kết quả lấy
     * một lần. Nó in "ok PIN 1234 vẫn mở được" kể cả khi máy chủ vừa từ chối,
     * và nó in đúng như thế trong khi trên máy thật không ai vào nổi phần của
     * bố mẹ.
     */
    const bs = khongChuThich(doc("scripts/kiem-moi-truong.mts"));
    expect(bs).not.toMatch(/nhac\([\s\S]*?vẫn mở được[\s\S]*?,\s*true\s*\)/);
    expect(bs).toMatch(/vaoDuoc\s*\?/);
  });

  it("hàng rào mật khẩu KHÔNG bao giờ dựng ở bản thật", () => {
    /**
     * Đây là chốt quan trọng nhất của lớp hàng rào, và nó ngược chiều trực giác:
     * thêm một lớp mật khẩu nghe như luôn an toàn hơn.
     *
     * Bản thật có phụ huynh thật vào bằng mã PIN của hộ mình. Một mật khẩu dùng
     * chung của đội phát triển đặt trước cửa không bảo vệ thêm được gì — nó chỉ
     * khóa đúng những người sản phẩm sinh ra để phục vụ. Khai nhầm một secret là
     * cả bản thật câm lặng với mọi người dùng.
     *
     * Nên chay-anh.sh DỪNG HẲN chứ không âm thầm bỏ qua: bỏ qua thì người khai
     * tưởng đã bật, và tưởng sai theo hướng nguy hiểm hơn.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));

    // Chỉ đích danh CHÍNH điều kiện của hàng rào, không chỉ "có chữ that ở đâu
    // đó". Bản đầu của bài kiểm này tìm `[ "$MOI_TRUONG" = "that" ]` rồi xem
    // gần đó có exit 1 không — và nó khớp nhầm nhánh "bản thật bắt buộc có tên
    // miền" nằm phía trên, nên thay điều kiện hàng rào bằng `if false` mà bài
    // kiểm vẫn xanh. Một bài kiểm bắt nhầm chỗ thì không canh gì cả.
    const dieuKien = '[ -n "${OLY_MAT_KHAU_THU:-}" ] && [ "$MOI_TRUONG" = "that" ]';
    const i = ca.indexOf(dieuKien);
    expect(i, "phải chặn đúng khi CÓ mật khẩu VÀ đang là bản thật").toBeGreaterThan(-1);
    expect(ca.slice(i, i + 500)).toMatch(/exit 1/);
  });

  it("mật khẩu hàng rào không đi qua dòng lệnh chạy từ xa", () => {
    // Tham số của lệnh chạy qua SSH hiện trong `ps` của mọi người dùng trên máy
    // chủ. Đưa qua stdin thì không.
    // Giá trị phải tới từ một biến đọc từ stdin, không phải một chuỗi nhúng
    // thẳng vào lệnh. Canh hình dạng chứ không canh đúng một cách viết: cơ chế
    // đã đổi một lần từ $(cat) sang read, và thứ cần giữ là "không nằm trong
    // tham số", không phải tên của thủ thuật.
    expect(wf).toMatch(/OLY_MAT_KHAU_THU=\\\$\w+/);
    expect(wf).not.toMatch(/OLY_MAT_KHAU_THU='\$/);
    expect(wf).not.toMatch(/OLY_MAT_KHAU_THU=\$\{\{/);
  });

  it("bản băm mật khẩu không nằm trong kho mã", () => {
    // bao-ve.caddy được commit ở dạng TRỐNG, chỉ để `import` của Caddy không
    // báo lỗi thiếu tệp. Máy chủ ghi đè nó ở mỗi lần triển khai.
    const bv = doc("trien-khai/bao-ve.caddy");
    expect(bv).not.toMatch(/basic_auth/);
    expect(bv).not.toMatch(/\$2[aby]\$/); // chuỗi băm bcrypt
    // Và cả hai Caddyfile đều phải móc vào nó, nếu không hàng rào sinh ra mà
    // không ai nạp.
    for (const t of ["trien-khai/Caddyfile", "trien-khai/Caddyfile.khong-ten-mien"]) {
      expect(doc(t), t).toMatch(/import \/etc\/caddy-nguon\/bao-ve\.caddy/);
    }
  });

  it("bộ soi đi qua được hàng rào, nếu không cả đường ống đỏ vì 401", () => {
    // Bật hàng rào mà quên cấp mã cho bộ soi thì mọi bước kiểm nhận 401 và cả
    // đường ống đỏ vì một lý do chẳng liên quan gì tới sản phẩm.
    for (const bo of ["kiem-moi-truong", "kiem-giao-dien"]) {
      const i = wf.indexOf(`npm run ${bo} --`);
      expect(i, `workflow phải gọi ${bo}`).toBeGreaterThan(-1);
      expect(wf.slice(Math.max(0, i - 600), i), bo).toMatch(/OLY_MAT_KHAU_THU:/);
    }
    // Và mọi cửa sổ trình duyệt đều mang thông tin đăng nhập — quên một chỗ là
    // một bước kiểm lặng lẽ soi trang 401 thay vì soi sản phẩm.
    for (const bo of ["scripts/kiem-moi-truong.mts", "scripts/kiem-giao-dien.mts"]) {
      const ma = doc(bo);
      const soContext = (ma.match(/newContext\(\{/g) ?? []).length;
      const soMa = (ma.match(/httpCredentials: thongTinHangRao\(\)/g) ?? []).length;
      expect(soMa, `${bo}: ${soContext} cửa sổ nhưng ${soMa} chỗ khai mã`).toBe(soContext);
    }
  });

  it("PIN hộ mẫu khai được từ ngoài, và phải đúng bốn chữ số", () => {
    /**
     * PIN hộ mẫu từng sinh ngẫu nhiên trên máy chủ và cố tình không in ra nhật
     * ký Actions. Đúng cho một bí mật thật, sai cho thứ này: đây là PIN của một
     * hộ chứa dữ liệu GIẢ, dựng ra để người nội bộ bấm thử. Giấu nó nghĩa là
     * muốn vào thử phải đăng nhập SSH đọc tệp .env — mà người cần bấm thử
     * thường không phải người có khóa SSH.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    expect(ca).toMatch(/OLY_PIN_MAU_KHAI/);
    // Khai sai độ dài thì đỏ ngay, đừng nhận rồi để không ai gõ vào được.
    const i = ca.indexOf("OLY_PIN_MAU_KHAI");
    expect(ca.slice(i, i + 500)).toMatch(/\^\[0-9\]\{4\}\$/);
    expect(ca.slice(i, i + 500)).toMatch(/exit 1/);
    expect(wf).toMatch(/PIN_MAU: \$\{\{ secrets\.VPS_PIN_MAU \}\}/);
  });

  it("hai bí mật đi qua stdin vẫn tách đúng nhau", () => {
    // Một dòng cho mật khẩu hàng rào, một dòng cho PIN. printf phải in đủ HAI
    // dòng kể cả khi giá trị rỗng — thiếu một dòng thì `read` thứ hai gặp EOF,
    // trả về khác 0, và cả lệnh triển khai không chạy.
    expect(wf).toMatch(/printf '%s\\n%s\\n'/);
    expect(wf).toMatch(/\{ read -r MK; read -r PM; \}/);
    // Và vẫn không có giá trị nào nằm trong tham số dòng lệnh chạy từ xa.
    expect(wf).not.toMatch(/OLY_PIN_MAU_KHAI='\$/);
  });

  it("mật khẩu đưa vào hash-password phải có dấu xuống dòng ở cuối", () => {
    /**
     * Bốn lần đưa lên liên tiếp chết ở đúng dòng này với đúng hai chữ
     * "Error: EOF". Lần đầu tôi đọc "EOF" thành "stdin không tới nơi" và đổi
     * `docker compose exec -T` sang `docker exec -i` — lần chạy sau vẫn y
     * nguyên hai chữ ấy, tức là đoán sai.
     *
     * Nguyên nhân thật ở modules/caddyhttp/caddyauth/command.go của Caddy:
     *
     *     plaintext, err = rd.ReadBytes('\n')
     *     if err != nil { return caddy.ExitCodeFailedStartup, err }
     *
     * `ReadBytes` gặp hết luồng trước khi thấy xuống dòng thì trả io.EOF, và
     * Caddy coi MỌI err là hỏng — đọc đủ chữ rồi vẫn hỏng. `printf '%s'` không
     * có `\n`; `printf '%s\n'` thì xong, Caddy tự cắt ký tự cuối.
     *
     * Bài kiểm này canh đúng cái ký tự ấy, vì nó là thứ vô hình khi đọc mã và
     * là thứ duy nhất phân biệt bản chạy được với bản chết bốn lần.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    expect(ca).toMatch(/printf '%s\\n' "\$OLY_MAT_KHAU_THU"[\s\S]{0,120}?caddy hash-password/);
    // Và không dùng --plaintext: tham số dòng lệnh hiện trong `ps` của mọi
    // người dùng trên máy chủ. Thà hỏng còn hơn rò.
    expect(ca).not.toMatch(/hash-password[^\n]*--plaintext/);
  });

  it("chỉ nhận kết quả CÓ HÌNH DẠNG băm bcrypt, không nhận mọi chuỗi khác rỗng", () => {
    /**
     * `[ -n "$BAM" ]` đơn thuần cho một chuỗi rác lọt qua, và lúc ấy tệp
     * bao-ve.caddy hỏng chỉ lộ ra ở `caddy reload` hai chục dòng bên dưới — xa
     * chỗ gây ra, đúng kiểu lỗi tốn cả buổi để lần ngược.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    expect(ca).toMatch(/grep -qE '\^\\\$2/);
  });

  it("hàng rào hỏng thì kêu to nhưng KHÔNG giữ lại bản Ô Ly cũ", () => {
    /**
     * Ba lần đưa lên liên tiếp đã chết vì băm mật khẩu hỏng, và mỗi cái chết ấy
     * giữ lại trên máy chủ một bản Ô Ly cũ hơn — trong khi hàng rào vẫn hệt như
     * trước, không hơn không kém. Chặn ở đó không bảo vệ thêm được gì, nó chỉ
     * ngăn mọi bản sửa khác đi lên.
     *
     * Hàng rào là lớp phòng thêm cho một máy THỬ, không phải điều kiện để sản
     * phẩm chạy — nên nó không được quyền giữ sản phẩm lại. Im lặng thì cũng
     * không được: phải nói thẳng rằng bản thử đang mở.
     */
    const ca = khongChuThich(doc("trien-khai/chay-anh.sh"));
    const i = ca.indexOf("KHÔNG băm được mật khẩu hàng rào");
    expect(i, "phải có nhánh báo khi băm hỏng").toBeGreaterThan(-1);
    // Nhánh ấy KHÔNG được exit — đó là điểm của cả bài kiểm này.
    expect(ca.slice(i, i + 700)).not.toMatch(/exit 1/);
    expect(ca.slice(i - 200, i + 700)).toMatch(/vang /);

    // Nhưng khai mật khẩu cho bản THẬT thì vẫn dừng hẳn — chốt kia không đổi.
    const j = ca.indexOf('[ -n "${OLY_MAT_KHAU_THU:-}" ] && [ "$MOI_TRUONG" = "that" ]');
    expect(j).toBeGreaterThan(-1);
    expect(ca.slice(j, j + 500)).toMatch(/exit 1/);
  });

  it("thẻ đăng nhập sổ đăng ký không ở lại trên máy chủ", () => {
    // Thẻ của lần chạy hết hạn khi việc kết thúc, nhưng tệp ~/.docker/config.json
    // thì ở lại. Đăng xuất kể cả khi triển khai hỏng.
    expect(wf).toMatch(/docker logout ghcr\.io/);
  });
});
