import {
  HAN_RUT_DONG_Y_GIO, HAN_TIEP_NHAN_NGAY_LAM_VIEC, HAN_XEM_CHINH_SUA_NGAY,
  danhSachYeuCauDuLieu,
} from "@/lib/server/requests";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { danhSachCon, lichSuCuaCon, lichSuViecAnh } from "@/lib/server/repo";
import { CongPin } from "../CongPin";
import { hanhDongYeuCauDuLieu } from "../actions";

export const dynamic = "force-dynamic";

const LOAI = [
  { ma: "xem", ten: "Xem dữ liệu Ô Ly đang giữ" },
  { ma: "chinh-sua", ten: "Sửa lại thông tin chưa đúng" },
  { ma: "xuat-du-lieu", ten: "Xuất dữ liệu ra tệp" },
  { ma: "rut-dong-y", ten: "Rút lại sự đồng ý đã cho" },
  { ma: "xoa", ten: "Xóa dữ liệu" },
];

/**
 * BR-39: yêu cầu của người dùng về dữ liệu của mình phải được xử lý trong thời
 * hạn luật định. Đây là ràng buộc vận hành cứng, không phải cam kết dịch vụ tự
 * đặt ra — nên trang này hiện luôn hạn chót của từng yêu cầu ngay khi nhận, và
 * hạn đó tính tự động chứ không do người trực tự ghi.
 */
export default async function TrangDuLieu() {
  const ho = await daMoCong();
  if (!ho) return <CongPin />;

  const con = danhSachCon(ho.id);
  const yeuCau = danhSachYeuCauDuLieu(ho.id);
  const soLuotBai = con.reduce((s, c) => s + lichSuCuaCon(c.id, 500).length, 0);
  const soViecAnh = lichSuViecAnh(ho.id, 500).length;

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Dữ liệu của tôi</h1>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Ô Ly đang giữ những gì của hộ mình</h2>
        <ul className="m-0 list-disc space-y-2 pl-5">
          <li>Tên gọi ở nhà và khối lớp của {con.length} bé. Không có họ tên đầy đủ, không có ngày sinh.</li>
          <li>{soLuotBai} lượt làm bài: con làm bài gì, trả lời ra sao, vướng ở lỗi nào.</li>
          <li>{soViecAnh} lần chụp: chỉ kết quả đã đọc ra thành chữ và số.</li>
          <li>Lịch sử bật tắt từng mục đích xử lý.</li>
        </ul>
        <p className="mt-4 mb-0 the p-4 text-sm" style={{ background: "var(--tim-nen)", borderColor: "var(--tim)" }}>
          <strong>Ô Ly không giữ ảnh nào của hộ mình.</strong> Mỗi ảnh anh chị chụp bị xóa ngay sau
          khi trả kết quả. Ảnh gốc nằm trong thư viện ảnh của điện thoại anh chị, không nằm trên máy
          chủ của Ô Ly. Ô Ly cũng không giữ ảnh khuôn mặt của bé, và không lưu lại nét chữ của bé
          dưới bất kỳ dạng nào có thể dùng để nhận ra bé.
        </p>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Gửi một yêu cầu</h2>
        <p className="text-sm" style={{ color: "var(--muc-nhat)" }}>
          Ô Ly phản hồi đã nhận trong {HAN_TIEP_NHAN_NGAY_LAM_VIEC} ngày làm việc. Yêu cầu xem hoặc
          sửa được xử lý trong {HAN_XEM_CHINH_SUA_NGAY} ngày. Yêu cầu rút lại đồng ý hoặc xóa được
          xử lý trong {HAN_RUT_DONG_Y_GIO} giờ.
        </p>
        <form action={hanhDongYeuCauDuLieu} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="block font-semibold">Anh chị muốn</span>
            <select name="loai" className="mt-1 w-full rounded-xl px-3 py-2 sm:w-auto"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}>
              {LOAI.map((l) => <option key={l.ma} value={l.ma}>{l.ten}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="block font-semibold">Nói rõ thêm, nếu cần</span>
            <textarea name="noiDung" rows={3} className="mt-1 w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }} />
          </label>
          <button type="submit" className="nut nut-chinh">Gửi yêu cầu</button>
        </form>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Các yêu cầu đã gửi</h2>
        {yeuCau.length === 0 ? (
          <p className="m-0 text-sm" style={{ color: "var(--muc-nhat)" }}>Chưa có yêu cầu nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ color: "var(--muc-nhat)" }}>
                  <th className="py-2 pr-4 text-left font-semibold">Yêu cầu</th>
                  <th className="py-2 pr-4 text-left font-semibold">Nhận lúc</th>
                  <th className="py-2 pr-4 text-left font-semibold">Hạn phản hồi</th>
                  <th className="py-2 pr-4 text-left font-semibold">Hạn hoàn thành</th>
                  <th className="py-2 text-left font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {yeuCau.map((y) => (
                  <tr key={y.id} className="border-t" style={{ borderColor: "var(--vien)" }}>
                    <td className="py-2 pr-4">{LOAI.find((l) => l.ma === y.loai)?.ten ?? y.loai}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(y.nhanLuc).toLocaleString("vi-VN")}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(y.hanTiepNhan).toLocaleDateString("vi-VN")}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(y.hanHoanThanh).toLocaleString("vi-VN")}</td>
                    <td className="py-2">{y.trangThai === "moi" ? "đã tiếp nhận" : y.trangThai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
