import type { KetQuaGuiSms, NhaCungCapSms } from "./provider";

/**
 * Bản giả lập: không gửi đi đâu cả, chỉ ghi lại.
 *
 * Điểm phải nói thẳng, vì nó quyết định tính năng này là thật hay là diễn:
 *
 * Khi chạy bằng bản giả lập, mã hiện ngay trên màn hình người bấm. Nghĩa là
 * người đó KHÔNG chứng minh được gì về việc họ có giữ số máy kia hay không —
 * họ chỉ chép lại con số vừa thấy. Vì vậy phần ghi nhận người đại diện phải ghi
 * mức xác minh là "otp-gia-lap", chứ tuyệt đối không được ghi "otp-dien-thoai".
 *
 * Ghi mức mạnh hơn thứ đã thật sự làm là cách tạo ra một hồ sơ trông như đã
 * tuân thủ trong khi không có gì được xác minh. Với hồ sơ bảo vệ dữ liệu trẻ
 * em, thứ đó tệ hơn hẳn việc thừa nhận là chưa xác minh.
 */
export class NhaCungCapSmsGiaLap implements NhaCungCapSms {
  ten = "giả lập (không gửi ra ngoài)";
  laGiaLap = true;

  daGui: { so: string; noiDung: string; luc: Date }[] = [];

  async gui(soDaChuan: string, noiDung: string): Promise<KetQuaGuiSms> {
    this.daGui.push({ so: soDaChuan, noiDung, luc: new Date() });
    console.warn(
      `[Ô Ly] Bản giả lập tin nhắn — KHÔNG gửi ra ngoài. Tới ${soDaChuan}: ${noiDung}`,
    );
    return { ok: true };
  }
}
