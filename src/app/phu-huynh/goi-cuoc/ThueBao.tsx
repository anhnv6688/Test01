"use client";

import { useActionState } from "react";
import { GOI, dinhDangTien, type MaGoi } from "@/lib/domain/pricing";
import { SO_NGAY_BAO_TRUOC_GIA_HAN, type TrangThaiThueBao } from "@/lib/domain/thue-bao";
import { hanhDongHuyGoi, hanhDongMuaGoi } from "../actions";

const NOI_TRANG_THAI: Record<TrangThaiThueBao, string> = {
  "mien-phi": "Hộ mình đang dùng gói miễn phí.",
  "dung-thu": "Đang trong kỳ dùng thử.",
  "dang-chay": "Thuê bao đang chạy.",
  "sap-het-han": "Thuê bao sắp hết hạn.",
  "het-han": "Thuê bao đã hết hạn.",
  "da-huy-cho-het-chu-ky": "Đã hủy. Anh chị vẫn dùng bình thường tới hết chu kỳ đã trả tiền.",
};

/**
 * Phần mua, gia hạn và hủy.
 *
 * Nút hủy đặt NGANG HÀNG với nút mua, cùng một trang, không giấu sau một lớp
 * "liên hệ hỗ trợ" nào. Đó là điều 1 ở src/lib/domain/thue-bao.ts viết thành
 * giao diện: hủy phải dễ như mua. Đừng dời nó xuống cuối trang, đừng bắt xác
 * nhận hai lần, và đừng hỏi lý do như một cửa ải.
 */
export function ThueBao({ trangThai, goiHienTai, soNgayConLai, tuDongGiaHan, coBienLaiGiaLap }: {
  trangThai: TrangThaiThueBao;
  goiHienTai: MaGoi;
  soNgayConLai: number | null;
  tuDongGiaHan: boolean;
  coBienLaiGiaLap: boolean;
}) {
  const [mua, muaAction, dangMua] = useActionState(hanhDongMuaGoi, null);
  const [hUy, huyAction, dangHuy] = useActionState(hanhDongHuyGoi, null);
  const coThueBao = goiHienTai !== "vo-nhap" && trangThai !== "het-han";

  return (
    <section className="the mt-6 p-6">
      <h2 className="mt-0 text-lg font-bold">Thuê bao của hộ mình</h2>
      <p className="m-0 text-sm">
        {NOI_TRANG_THAI[trangThai]}
        {soNgayConLai !== null && soNgayConLai > 0 && ` Còn ${soNgayConLai} ngày.`}
      </p>

      {coBienLaiGiaLap && (
        <p className="the mt-4 mb-0 p-4 text-sm"
          style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
          <strong>Bản dựng thử:</strong> Ô Ly chưa nối cổng thanh toán thật, nên những lần mua ghi
          ở đây <strong>không có đồng tiền nào được chuyển</strong>. Biên lai bên dưới là biên lai
          diễn tập, không dùng làm chứng từ được.
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {(Object.values(GOI) as (typeof GOI)[MaGoi][])
          .filter((g) => g.ma !== "vo-nhap")
          .map((g) => (
            <form key={g.ma} action={muaAction} className="the p-4">
              <input type="hidden" name="goi" value={g.ma} />
              <p className="m-0 font-semibold">{g.ten}</p>
              <p className="m-0 mt-1 text-sm" style={{ color: "var(--muc-nhat)" }}>
                {dinhDangTien(g.giaThang)} mỗi tháng · {g.giaiThich}
              </p>
              <label className="mt-3 flex items-start gap-2 text-sm">
                {/* Không đánh dấu sẵn. Xem CR-13 và điều 4 ở domain/thue-bao.ts. */}
                <input type="checkbox" name="tuDongGiaHan" value="1" className="mt-1" />
                <span>
                  Cho Ô Ly tự trừ tiền gia hạn hằng tháng. Ô Ly sẽ báo trước{" "}
                  {SO_NGAY_BAO_TRUOC_GIA_HAN} ngày mỗi lần, và anh chị hủy được bất cứ lúc nào ngay
                  tại trang này.
                </span>
              </label>
              <button type="submit" className="nut mt-3" disabled={dangMua}>
                {dangMua ? "Đang xử lý…" : goiHienTai === g.ma ? "Gia hạn thêm một tháng" : "Chọn gói này"}
              </button>
            </form>
          ))}
      </div>

      {mua?.thongBao && (
        <p className="the mt-4 mb-0 p-4 text-sm"
          style={mua.ok ? undefined : { background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
          {mua.thongBao}
        </p>
      )}

      {coThueBao && (
        <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--vien)" }}>
          <form action={huyAction}>
            <button type="submit" className="nut" disabled={dangHuy}>
              {dangHuy ? "Đang hủy…" : "Hủy thuê bao"}
            </button>
          </form>
          <p className="m-0 mt-3 text-sm" style={{ color: "var(--muc-nhat)" }}>
            Hủy xong anh chị <strong>vẫn dùng hết chu kỳ đã trả tiền</strong>, và{" "}
            <strong>lịch sử học của con thì giữ nguyên mãi</strong> — kể cả sau khi hết hạn. Dữ
            liệu học là của gia đình, Ô Ly không giữ làm điều kiện gia hạn.
            {tuDongGiaHan && " Hủy cũng tắt luôn việc tự trừ tiền hằng tháng."}
          </p>
          {hUy?.thongBao && (
            <p className="the mt-3 mb-0 p-4 text-sm"
              style={hUy.ok ? undefined : { background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
              {hUy.thongBao}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
