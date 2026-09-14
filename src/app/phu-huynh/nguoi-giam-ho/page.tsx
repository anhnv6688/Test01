import Link from "next/link";
import { MUC_DICH, dangBat, treDaDongY } from "@/lib/privacy/consent";
import { PHUONG_THUC_BY_MA, TEN_QUAN_HE, canhBaoXacMinh } from "@/lib/privacy/nguoi-giam-ho";
import { cheSo } from "@/lib/privacy/so-dien-thoai";
import { TUOI_TU_DONG_Y, cheDoDongY, ngayChuyenCheDo, tuoiTron } from "@/lib/privacy/tuoi";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { danhSachCon, lichSuDongY, nguoiGiamHoHienTai } from "@/lib/server/repo";
import { CongPin } from "../CongPin";
import {
  hanhDongConDongY, hanhDongGhiNguoiGiamHo, hanhDongGhiThangNamSinh,
} from "../actions";
import { XacMinhSoDienThoai } from "./XacMinhSoDienThoai";

export const dynamic = "force-dynamic";

/**
 * Người đại diện theo pháp luật của con (CR-05).
 *
 * Trang này tồn tại vì cơ chế đồng ý cũ trả lời được câu "đồng ý cho làm gì"
 * nhưng không trả lời được câu "AI đồng ý". Người bấm nút có thể là mẹ, có thể
 * là bác hàng xóm, có thể là chính đứa trẻ.
 *
 * Phần dưới cùng — hỏi chính con — là phần dễ làm sai nhất và đáng giải thích.
 * Quy định đòi trẻ từ đủ 7 tuổi phải tự đồng ý, bên cạnh người giám hộ. Ô Ly
 * phục vụ lớp 1 và lớp 2, nên cái mốc đó cắt ngang giữa tập người dùng: bé lớp
 * 1 sáu tuổi và bé lớp 2 tám tuổi thuộc hai chế độ khác nhau, và một bé sẽ
 * chuyển chế độ ngay trong thời gian dùng sản phẩm.
 *
 * Phần hỏi con đặt ở bề mặt phụ huynh chứ không đặt trong bề mặt của trẻ, và
 * đó là chủ đích: bề mặt của trẻ phải là chỗ con làm toán, không phải chỗ con
 * gặp một bức tường pháp lý. Câu hỏi viết cho một bạn bảy tuổi tự đọc được, và
 * người lớn ngồi cạnh khi con trả lời.
 */
export default async function TrangNguoiGiamHo() {
  const ho = await daMoCong();
  if (!ho) return <CongPin />;

  const ng = nguoiGiamHoHienTai(ho.id);
  const canhBao = canhBaoXacMinh(ng);
  const cacCon = danhSachCon(ho.id);
  const bangGhi = lichSuDongY(ho.id);
  const hienTai = PHUONG_THUC_BY_MA.get(ng?.phuongThuc ?? "tu-khai");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Người đại diện của con</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Dữ liệu của trẻ em có chế độ bảo vệ riêng. Ô Ly cần biết ai là cha, mẹ hoặc người giám hộ
        của con, và cần biết con bao nhiêu tuổi — vì từ đủ {TUOI_TU_DONG_Y} tuổi thì chính con cũng
        phải được hỏi, chứ không chỉ anh chị.
      </p>

      {/* ---- Ai là người đại diện ---- */}
      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Ai đang chịu trách nhiệm về tài khoản này</h2>
        {ng ? (
          <p className="m-0 text-sm">
            <strong>{ng.hoTen}</strong> — {TEN_QUAN_HE[ng.quanHe]}. Xác minh bằng{" "}
            {hienTai?.ten.toLowerCase()}
            {ng.haiSoCuoi ? ` tới số ${cheSo(ng.haiSoCuoi)}` : ""}, lúc{" "}
            {new Date(ng.xacMinhLuc).toLocaleString("vi-VN")}.
          </p>
        ) : (
          <p className="m-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
            Chưa có ai xác nhận. Phần chụp ảnh bài của con sẽ chưa dùng được.
          </p>
        )}

        <XacMinhSoDienThoai
          quanHeMacDinh={ng?.quanHe ?? "me"}
          hoTenMacDinh={ng?.hoTen ?? ""}
        />

        {/*
          Lối tự khai vẫn giữ, và cố ý để BÊN DƯỚI lối xác minh bằng mã.
          Chặn cứng ở đây sẽ khóa luôn cả phần luyện tập của con khi nhà mạng
          trục trặc, mà phần luyện tập thì không xử lý dữ liệu gì cần mức xác
          minh cao. Nhưng nó không còn là một lựa chọn ngang hàng: nó ghi xuống
          mức "tự khai", và lời cảnh báo bên dưới sẽ không im.
        */}
        <details className="the mt-4 p-5">
          <summary className="cursor-pointer text-sm font-semibold">
            Chưa nhận được tin nhắn? Khai tạm không qua xác minh
          </summary>
          <p className="m-0 mt-3 text-sm" style={{ color: "var(--muc-nhat)" }}>
            Cách này <strong>không xác minh được gì</strong> — một đứa trẻ tám tuổi cũng bấm được.
            Ô Ly ghi đúng như vậy vào hồ sơ, và vẫn nhắc anh chị xác minh lại bằng mã khi tiện.
          </p>
          <form action={hanhDongGhiNguoiGiamHo} className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-3">
              <label className="text-sm">
                Họ tên
                <input name="hoTen" required defaultValue={ng?.hoTen ?? ""}
                  className="the ml-2 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">
                Quan hệ với con
                <select name="quanHe" defaultValue={ng?.quanHe ?? "me"} className="the ml-2 px-3 py-2 text-sm">
                  {(["cha", "me", "nguoi-giam-ho"] as const).map((q) => (
                    <option key={q} value={q}>{TEN_QUAN_HE[q]}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="tuXacNhan" value="1" className="mt-1" required />
              <span>
                Tôi xác nhận tôi đã thành niên và là cha, mẹ hoặc người giám hộ của cháu, và tôi
                đồng ý chịu trách nhiệm về các lựa chọn quyền riêng tư của tài khoản này.
              </span>
            </label>
            <button type="submit" className="nut text-sm">Khai tạm</button>
          </form>
        </details>

        {canhBao && (
          <p className="the mt-4 mb-0 p-4 text-sm"
            style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
            {canhBao}
          </p>
        )}
      </section>

      {/* ---- Tuổi của từng bạn ---- */}
      {cacCon.map((con) => {
        const ns = con.thangNamSinh;
        const cheDo = ns ? cheDoDongY(ns) : null;
        const chuyen = ns ? ngayChuyenCheDo(ns) : null;
        return (
          <section key={con.id} className="the mt-6 p-6">
            <h2 className="mt-0 text-lg font-bold">{con.tenGoi} · lớp {con.lop}</h2>

            <form action={hanhDongGhiThangNamSinh} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="childId" value={con.id} />
              <label className="text-sm">
                Tháng sinh
                <input name="thang" type="number" min={1} max={12} required
                  defaultValue={ns?.thang ?? ""} className="the ml-2 w-20 px-3 py-2 text-sm" />
              </label>
              <label className="text-sm">
                Năm sinh
                <input name="nam" type="number" required
                  defaultValue={ns?.nam ?? ""} className="the ml-2 w-28 px-3 py-2 text-sm" />
              </label>
              <button type="submit" className="nut text-sm">Lưu</button>
              <span className="text-sm" style={{ color: "var(--muc-nhat)" }}>
                Ô Ly cố ý không hỏi ngày sinh — tháng và năm là đủ để biết con đã đủ{" "}
                {TUOI_TU_DONG_Y} tuổi chưa.
              </span>
            </form>

            {!ns ? (
              <p className="m-0 mt-4 text-sm" style={{ color: "var(--muc-nhat)" }}>
                Chưa khai tháng năm sinh, nên phần chụp ảnh bài của {con.tenGoi} chưa dùng được.
              </p>
            ) : cheDo === "chi-nguoi-giam-ho" ? (
              <p className="m-0 mt-4 text-sm">
                {con.tenGoi} {tuoiTron(ns)} tuổi, chưa đủ {TUOI_TU_DONG_Y} tuổi, nên chỉ cần anh
                chị đồng ý là đủ.{" "}
                {chuyen && (
                  <>
                    Từ tháng {chuyen.getUTCMonth() + 1}/{chuyen.getUTCFullYear()}, Ô Ly sẽ cần hỏi
                    thêm chính {con.tenGoi} — Ô Ly nhắc anh chị trước chứ không chặn đột ngột.
                  </>
                )}
              </p>
            ) : (
              <div className="mt-4">
                <p className="m-0 mb-3 text-sm">
                  {con.tenGoi} {tuoiTron(ns)} tuổi, từ đủ {TUOI_TU_DONG_Y} tuổi rồi. Theo quy định,
                  chính {con.tenGoi} cũng cần được hỏi. Anh chị ngồi cạnh và đọc cùng con nhé —{" "}
                  <strong>con nói không cũng được</strong>, phần luyện tập của con vẫn chạy bình
                  thường.
                </p>
                <div className="space-y-3">
                  {MUC_DICH.map((m) => {
                    const nguoiLonBat = dangBat(bangGhi, m.ma);
                    const conBat = treDaDongY(bangGhi, m.ma, con.id);
                    return (
                      <div key={m.ma} className="the p-4">
                        <p className="m-0 mb-2 text-sm">{m.hoiCon}</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <form action={hanhDongConDongY}>
                            <input type="hidden" name="childId" value={con.id} />
                            <input type="hidden" name="mucDich" value={m.ma} />
                            <input type="hidden" name="bat" value={conBat ? "0" : "1"} />
                            <button type="submit" className="nut text-sm">
                              {conBat ? "Con đổi ý, con không đồng ý nữa" : "Con đồng ý"}
                            </button>
                          </form>
                          <span className="text-sm" style={{ color: "var(--muc-nhat)" }}>
                            {conBat ? `${con.tenGoi} đã đồng ý.` : `${con.tenGoi} chưa trả lời.`}
                            {" · "}
                            {nguoiLonBat ? "Anh chị đã bật mục này." : "Anh chị chưa bật mục này."}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        );
      })}

      <p className="mt-6 text-sm">
        <Link href="/phu-huynh/quyen-rieng-tu">Bật tắt từng mục đích trong Quyền riêng tư →</Link>
      </p>
    </main>
  );
}
