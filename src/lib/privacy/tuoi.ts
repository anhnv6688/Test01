/**
 * Tuổi của trẻ, và cái mốc 7 tuổi cắt ngang đúng giữa tập người dùng của Ô Ly.
 *
 * Quy định về dữ liệu cá nhân của trẻ em đặt ra hai chế độ khác nhau:
 *
 *   Trẻ DƯỚI 7 tuổi   — chỉ cần sự đồng ý của cha, mẹ hoặc người giám hộ.
 *   Trẻ TỪ ĐỦ 7 tuổi  — cần CẢ sự đồng ý của chính đứa trẻ, VÀ của người giám hộ.
 *
 * Với phần lớn sản phẩm, mốc này là một dòng trong tài liệu pháp lý. Với Ô Ly
 * thì không: Ô Ly phục vụ lớp 1 và lớp 2, tức là trẻ khoảng 6 đến 8 tuổi, nên
 * cái mốc đó cắt ngang GIỮA tập người dùng. Một bé lớp 1 sáu tuổi và một bé lớp
 * 2 tám tuổi cần hai chế độ đồng ý khác nhau, dù dùng cùng một sản phẩm.
 *
 * Và điều quan trọng hơn mà một cổng kiểm tra tuổi thông thường sẽ bỏ sót: đứa
 * trẻ KHÔNG đứng yên. Một bé vào lớp 1 lúc sáu tuổi, được người giám hộ đồng ý
 * hợp lệ, sẽ sang tuổi bảy trong chính thời gian dùng sản phẩm — và từ đúng
 * ngày đó, sự đồng ý vốn đủ trở thành thiếu. Vì vậy chế độ đồng ý phải được
 * TÍNH LẠI mỗi lần xử lý, không được chốt một lần lúc đăng ký.
 *
 * Điều khoản cụ thể và cách diễn giải phải do luật sư rà lại; phần mã nguồn ở
 * đây thực hiện quy tắc nội dung, không thay cho ý kiến pháp lý.
 */

/** Mốc tuổi mà từ đó trẻ phải tự đồng ý, bên cạnh người giám hộ. */
export const TUOI_TU_DONG_Y = 7;

/**
 * Ngày sinh lưu ở mức tối thiểu: chỉ tháng và năm.
 *
 * Không lưu ngày, và đây là chủ đích chứ không phải thiếu sót. Nguyên tắc tối
 * thiểu hóa dữ liệu nói chỉ được thu đúng mức cần cho mục đích. Mục đích ở đây
 * là xác định trẻ đã đủ 7 tuổi chưa, và tháng năm sinh đủ để làm việc đó với
 * sai số nhiều nhất là một tháng. Ngày sinh đầy đủ là một mã định danh mạnh hơn
 * hẳn, gắn với giấy khai sinh, mà Ô Ly không cần tới.
 *
 * Vì sao không lưu luôn một cờ "đã đủ 7 tuổi": vì cờ đó hỏng theo thời gian.
 * Trẻ sang tuổi bảy thì cờ vẫn nằm im ở giá trị cũ, và sản phẩm sẽ xử lý dữ
 * liệu của một đứa trẻ bảy tuổi theo chế độ của trẻ sáu tuổi mà không ai hay.
 * Tháng năm sinh là thứ tối thiểu mà vẫn tính lại được về sau.
 */
export interface ThangNamSinh {
  nam: number;
  /** 1 tới 12. */
  thang: number;
}

export class ThangNamSinhKhongHopLeError extends Error {
  constructor(chiTiet: string) {
    super(`Tháng năm sinh không hợp lệ: ${chiTiet}`);
    this.name = "ThangNamSinhKhongHopLeError";
  }
}

export function kiemThangNamSinh(x: unknown, moc = new Date()): ThangNamSinh {
  const v = x as Partial<ThangNamSinh> | null;
  if (!v || typeof v.nam !== "number" || typeof v.thang !== "number") {
    throw new ThangNamSinhKhongHopLeError("thiếu tháng hoặc năm");
  }
  if (!Number.isInteger(v.thang) || v.thang < 1 || v.thang > 12) {
    throw new ThangNamSinhKhongHopLeError(`tháng phải từ 1 tới 12, nhận được ${v.thang}`);
  }
  const namNay = moc.getUTCFullYear();
  // Chặn cả hai đầu: năm sinh trong tương lai là gõ nhầm, còn năm sinh quá xa
  // thì đứa trẻ đó không còn là trẻ em và Ô Ly không phục vụ.
  if (!Number.isInteger(v.nam) || v.nam > namNay || v.nam < namNay - 18) {
    throw new ThangNamSinhKhongHopLeError(`năm sinh ${v.nam} nằm ngoài khoảng phục vụ được`);
  }
  return { nam: v.nam, thang: v.thang };
}

/**
 * Tuổi tròn, tính theo hướng AN TOÀN khi thiếu ngày sinh.
 *
 * Không biết ngày thì phải chọn làm tròn về một phía, và hai phía không tương
 * đương nhau chút nào:
 *
 *   Coi như sinh CUỐI tháng  → một đứa trẻ vừa tròn bảy tuổi bị tính là sáu
 *                              tuổi trong tối đa một tháng. Trong tháng đó Ô Ly
 *                              chỉ xin đồng ý của người giám hộ, trong khi lẽ
 *                              ra phải xin cả của trẻ. Đó là THIẾU sự đồng ý.
 *
 *   Coi như sinh ĐẦU tháng   → một đứa trẻ còn thiếu vài ngày mới bảy tuổi bị
 *                              tính là bảy. Ô Ly xin thêm sự đồng ý của chính
 *                              em ấy. Đó là THỪA một câu hỏi, và câu hỏi đó
 *                              không lấy thêm dữ liệu nào của em.
 *
 * Thiếu sự đồng ý là vi phạm; thừa một câu hỏi thì không. Nên làm tròn về đầu
 * tháng.
 */
export function tuoiTron(ns: ThangNamSinh, moc = new Date()): number {
  const namMoc = moc.getUTCFullYear();
  const thangMoc = moc.getUTCMonth() + 1;
  const soThang = (namMoc - ns.nam) * 12 + (thangMoc - ns.thang);
  return Math.floor(soThang / 12);
}

export type CheDoDongY = "chi-nguoi-giam-ho" | "ca-hai";

/**
 * Chế độ đồng ý áp dụng cho đứa trẻ này, TẠI THỜI ĐIỂM NÀY.
 *
 * Luôn truyền mốc thời gian hiện tại vào mỗi lần xử lý. Gọi hàm này một lần
 * lúc đăng ký rồi lưu kết quả lại là đúng cái sai mà cả tệp này viết ra để
 * tránh.
 */
export function cheDoDongY(ns: ThangNamSinh, moc = new Date()): CheDoDongY {
  return tuoiTron(ns, moc) >= TUOI_TU_DONG_Y ? "ca-hai" : "chi-nguoi-giam-ho";
}

/**
 * Ngày đứa trẻ chuyển sang chế độ cần cả sự đồng ý của chính mình.
 *
 * Dùng để báo trước cho người giám hộ, thay vì để sản phẩm lặng lẽ chặn vào
 * đúng hôm sinh nhật con. Trả về null nếu trẻ đã qua mốc đó rồi.
 */
export function ngayChuyenCheDo(ns: ThangNamSinh, moc = new Date()): Date | null {
  if (cheDoDongY(ns, moc) === "ca-hai") return null;
  // Làm tròn về đầu tháng, cùng hướng với tuoiTron.
  return new Date(Date.UTC(ns.nam + TUOI_TU_DONG_Y, ns.thang - 1, 1));
}
