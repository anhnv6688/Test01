/**
 * Cấu hình cho bản chạy thật, và những chốt chặn không được thiếu.
 *
 * Bản dựng phát triển cố tình dễ tính: có sẵn một hộ mẫu, mã PIN 1234, mã trực
 * đoán được. Nhờ vậy mở máy ra là chạy được ngay, không phải khai báo gì. Điều
 * đó đúng ở máy người viết mã, và SAI HOÀN TOÀN trên một địa chỉ công khai:
 *
 *   Một hộ mẫu với PIN 1234 nghĩa là bất cứ ai gõ đúng địa chỉ cũng vào được
 *   phần của bố mẹ. Một mã trực mặc định nghĩa là bất cứ ai cũng mở được bảng
 *   trực — nơi XUẤT và XÓA dữ liệu của các hộ.
 *
 * Vì vậy những tiện nghi đó phải tự tắt khi chạy bản phát hành, và chỉ bật lại
 * được bằng một khai báo có chủ ý. Chốt nằm ở đây, một chỗ duy nhất, để không
 * ai phải nhớ tắt thủ công trước khi đưa lên mạng — thứ mà người ta luôn quên
 * đúng vào lần quan trọng nhất.
 */

export function laBanPhatHanh(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Có dựng sẵn hộ mẫu không.
 *
 * Bản phát triển: luôn có. Bản phát hành: chỉ khi khai báo rõ OLY_DU_LIEU_MAU,
 * dùng cho bản trình diễn để người khác mở thử bằng điện thoại. Bản phục vụ
 * người dùng thật thì KHÔNG được bật, vì hộ mẫu là một tài khoản không có chủ.
 */
export function choPhepDuLieuMau(): boolean {
  if (!laBanPhatHanh()) return true;
  return process.env.OLY_DU_LIEU_MAU === "true";
}

/**
 * Mã PIN của hộ mẫu. Ở bản phát hành phải tự đặt, không được để mặc định.
 *
 * ĐÚNG BỐN chữ số, không phải "4 tới 8".
 *
 * Bản đầu nhận 4–8, và đó là một cái bẫy im lặng: ô nhập duy nhất dẫn vào phần
 * của bố mẹ có maxLength={4} và nhãn "Mã PIN bốn số". Một mã sáu số được cấu
 * hình chấp nhận, được ghi vào cơ sở dữ liệu, hộ mẫu dựng lên bình thường — rồi
 * không ai gõ nổi nó vào, vì trình duyệt cắt ở ký tự thứ tư. Máy chủ chỉ thấy
 * bốn số đầu và trả về "Mã PIN chưa đúng", đúng một câu, mãi mãi.
 *
 * Đã xảy ra thật trên bản thử: chay-anh.sh sinh PIN sáu số, và không ai vào
 * được phần của bố mẹ. Nới rộng chỗ này ra hơn thứ gõ được là tạo ra một dải
 * giá trị "hợp lệ mà vô dụng" — thà từ chối và ghi cảnh báo.
 */
export function pinHoMau(): string | null {
  if (!laBanPhatHanh()) return "1234";
  const pin = process.env.OLY_PIN_MAU;
  return pin && /^\d{4}$/.test(pin) ? pin : null;
}

/**
 * Câu gợi ý dưới ô nhập PIN. Trả null nghĩa là không hiện gì.
 *
 * Bản đầu viết cứng "Bản dựng thử nghiệm dùng sẵn mã 1234." ngay trong giao
 * diện, không kèm điều kiện nào. Trên máy chủ thật câu đó là một lời nói dối:
 * bản phát hành không bao giờ dùng 1234, mà người đọc thì tin nó và gõ 1234 rồi
 * kết luận sản phẩm hỏng.
 *
 * Và KHÔNG in mã thật ra đây. Trang này công khai — in mã hộ mẫu lên nó thì lớp
 * khóa còn lại đúng bằng không. Người vận hành tự xem trong ~/o-ly/.env.
 */
export function goiYPinHoMau(): string | null {
  if (!laBanPhatHanh()) return "Bản dựng thử nghiệm dùng sẵn mã 1234.";
  if (!choPhepDuLieuMau() || !pinHoMau()) return null;
  // Không nhắc tới 1234 dù chỉ để phủ định nó. Người đọc lướt qua một dòng chữ
  // nhỏ sẽ nhớ con số chứ không nhớ chữ "không phải" đứng trước nó.
  return "Bản thử có sẵn một hộ mẫu. Mã PIN do người vận hành đặt.";
}

export const MA_TRUC_MAC_DINH = "truc2026";

/**
 * Mã mở bảng trực. Trả null nghĩa là KHÔNG AI mở được.
 *
 * Ở bản phát hành mà quên khai báo thì khóa hẳn, chứ không rơi về mã mặc định.
 * Một bảng trực khóa hẳn thì phiền cho người vận hành; một bảng trực mở bằng
 * mã ai cũng đoán được thì là một sự cố lộ dữ liệu trẻ em.
 */
export function maTruc(): string | null {
  const dat = process.env.OLY_MA_TRUC;
  if (dat) return dat;
  return laBanPhatHanh() ? null : MA_TRUC_MAC_DINH;
}

/**
 * Bản này là bản gì: thử hay thật.
 *
 * Không đoán theo tên miền, vì tên miền đổi được mà cấu hình thì không theo.
 * Khai rõ bằng OLY_MOI_TRUONG để người vận hành phải nói ra ý định của mình.
 */
export type TenMoiTruong = "phat-trien" | "thu" | "that";

export function moiTruong(): TenMoiTruong {
  const khai = process.env.OLY_MOI_TRUONG;
  if (khai === "thu" || khai === "that") return khai;
  if (!laBanPhatHanh()) return "phat-trien";
  /*
   * Bản phát hành mà quên khai thì coi là THẬT, không coi là thử.
   *
   * Đoán nhầm theo hướng này thì hậu quả là chặt hơn cần thiết — máy tìm kiếm
   * không đánh chỉ mục, cảnh báo kêu. Đoán nhầm theo hướng kia thì một bản
   * thật bị đối xử như bản thử, và những nới lỏng dành cho bản thử sẽ áp lên
   * dữ liệu của trẻ thật.
   */
  return "that";
}

/**
 * Nội dung robots.txt theo từng môi trường.
 *
 * Bản thử chặn hết: nó có dữ liệu giả trông như thật, và một trang thử nằm
 * trên máy tìm kiếm thì phụ huynh có thể vào nhầm rồi tưởng đó là sản phẩm.
 *
 * Bản thật chỉ mở trang giới thiệu. Bề mặt của trẻ và bề mặt của phụ huynh đều
 * bị chặn: chúng không có gì để tìm kiếm, và việc để máy quét đi vào đó chỉ tạo
 * thêm một đường nữa tới dữ liệu của các hộ.
 */
export function noiDungRobots(mt: TenMoiTruong = moiTruong()): string {
  if (mt !== "that") {
    return "# Bản thử. Không đánh chỉ mục bất cứ thứ gì.\nUser-agent: *\nDisallow: /\n";
  }
  return [
    "User-agent: *",
    "Allow: /$",
    "Allow: /cach-cham-bai",
    "Allow: /go-bo-noi-dung",
    "Disallow: /be",
    "Disallow: /phu-huynh",
    "Disallow: /truc",
    "Disallow: /api",
    "",
  ].join("\n");
}

export interface ThieuCauHinh {
  bien: string;
  viSao: string;
}

/**
 * Những khai báo còn thiếu để chạy thật.
 *
 * Trả về danh sách chứ không ném lỗi: thiếu cấu hình thì phải nói cho người
 * vận hành biết thiếu gì, chứ không làm sập cả ứng dụng để họ đi đoán.
 */
export function thieuGiDeChayThat(): ThieuCauHinh[] {
  if (!laBanPhatHanh()) return [];
  const thieu: ThieuCauHinh[] = [];

  if (!process.env.OLY_MA_TRUC) {
    thieu.push({
      bien: "OLY_MA_TRUC",
      viSao:
        "Chưa đặt thì bảng trực khóa hẳn, không ai xử lý được yêu cầu gỡ bỏ hay yêu cầu dữ liệu đúng hạn (CR-06).",
    });
  }
  if (process.env.OLY_DU_LIEU_MAU === "true" && !pinHoMau()) {
    thieu.push({
      bien: "OLY_PIN_MAU",
      viSao:
        "Đã bật hộ mẫu nhưng chưa đặt mã PIN cho nó. Phải là 4 tới 8 chữ số. Không đặt thì hộ mẫu sẽ không được dựng.",
    });
  }
  if (!process.env.OLY_DB) {
    thieu.push({
      bien: "OLY_DB",
      viSao:
        "Chưa đặt thì cơ sở dữ liệu nằm ở .data/oly.sqlite trong thư mục làm việc. Trên máy chủ dùng vùng đĩa tạm, toàn bộ dữ liệu hộ sẽ mất sau mỗi lần khởi động lại.",
    });
  }
  return thieu;
}

/** In cảnh báo khi khởi động. Gọi một lần, ở chỗ dựng cơ sở dữ liệu. */
export function canhBaoCauHinh(): void {
  const thieu = thieuGiDeChayThat();
  if (thieu.length === 0) return;
  console.warn("[Ô Ly] Bản phát hành còn thiếu khai báo:");
  for (const t of thieu) console.warn(`  ${t.bien} — ${t.viSao}`);
}
