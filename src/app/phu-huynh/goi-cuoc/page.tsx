import { CHI_PHI_MOI_TRANG_GIA_DINH, chiPhiTrungBinhMoiHo, tinhTran } from "@/lib/domain/metering";
import { GOI, TRAN_MIEN_PHI_TRANG_THANG, dinhDangTien } from "@/lib/domain/pricing";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { luotDungCuaHo, soTrangDaDungThangNay } from "@/lib/server/repo";
import { CongPin } from "../CongPin";

export const dynamic = "force-dynamic";

/**
 * Trang chi phí và gói cước.
 *
 * BR-10: phụ huynh phải hiểu được vì sao có phí và khoản phí đó dùng vào việc
 * gì. Người dùng Việt Nam sòng phẳng khi hiểu tiền đi đâu; thứ họ phản ứng là
 * cảm giác bị tính tiền mập mờ. Vì vậy trang này nói thẳng con số chi phí thật
 * của một trang chụp, và nói thẳng rằng phần luyện tập gần như không tốn gì nên
 * không bị đếm.
 */
export default async function TrangGoiCuoc() {
  const ho = await daMoCong();
  if (!ho) return <CongPin />;

  const daDung = soTrangDaDungThangNay(ho.id);
  const tran = tinhTran(ho.goi, daDung);
  const luot = luotDungCuaHo(ho.id);
  const chiPhiHo = chiPhiTrungBinhMoiHo(luot, 1);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Chi phí và gói cước</h1>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Ô Ly tính tiền theo cái gì</h2>
        <p>
          Ô Ly bán công đoạn xử lý và phần theo dõi con học, <strong>không bán nội dung</strong>.
          Chỗ nào Ô Ly phải trả tiền thật thì chỗ đó có trần; chỗ nào không tốn gì thì miễn phí
          không giới hạn.
        </p>
        <dl className="m-0 mt-4 grid gap-4 sm:grid-cols-2">
          <div className="the p-4" style={{ background: "var(--xanh-la-nen)", borderColor: "var(--xanh-la)" }}>
            <dt className="font-semibold">Không tốn chi phí · không giới hạn</dt>
            <dd className="m-0 mt-1 text-sm">
              Con luyện tập trên kho bài của Ô Ly. Mỗi bài là một biến thể sinh ra từ khuôn dạng có
              sẵn, nên bài thứ một nghìn cũng không tốn thêm đồng nào.
            </dd>
          </div>
          <div className="the p-4" style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
            <dt className="font-semibold">Có hóa đơn thật · có trần</dt>
            <dd className="m-0 mt-1 text-sm">
              Mỗi trang ảnh anh chị chụp đều được gửi đi xử lý và Ô Ly phải trả tiền cho lần đó.
              Hiện Ô Ly ước tính khoảng {dinhDangTien(CHI_PHI_MOI_TRANG_GIA_DINH)} một trang.
            </dd>
          </div>
        </dl>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Tháng này của hộ mình</h2>
        <p className="m-0">
          Đã dùng <strong>{tran.daDung}</strong>
          {tran.tran !== null ? <> trên <strong>{tran.tran}</strong> trang</> : " trang"}.
          {tran.conLai !== null && <> Còn lại {tran.conLai} trang.</>}
        </p>
        <p className="mt-2 mb-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
          Tương ứng khoảng {dinhDangTien(Math.round(chiPhiHo))} chi phí xử lý mà Ô Ly đã chi cho hộ mình.
          Con số này Ô Ly theo dõi hằng tuần để biết mức giá hiện tại có đứng được không.
        </p>
        <p className="mt-3 mb-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
          Một lần chụp mà Ô Ly không đọc được ảnh thì không bị trừ lượt. Anh chị không phải trả tiền
          cho một lần máy đọc hỏng.
        </p>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Các gói</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr style={{ color: "var(--muc-nhat)" }}>
                <th className="py-2 pr-4 text-left font-semibold">Gói</th>
                <th className="py-2 pr-4 text-left font-semibold">Giá mỗi tháng</th>
                <th className="py-2 pr-4 text-left font-semibold">Trang chụp mỗi tháng</th>
                <th className="py-2 text-left font-semibold">Luyện tập</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(GOI).map((g) => (
                <tr key={g.ma} className="border-t" style={{ borderColor: "var(--vien)" }}>
                  <td className="py-3 pr-4 align-top">
                    <strong>{g.ten}</strong>
                    <span className="block text-xs" style={{ color: "var(--muc-nhat)" }}>{g.giaiThich}</span>
                  </td>
                  <td className="py-3 pr-4 align-top whitespace-nowrap">
                    {g.giaThang === 0 ? "miễn phí" : dinhDangTien(g.giaThang)}
                  </td>
                  <td className="py-3 pr-4 align-top">{g.tranTrangThang ?? "không giới hạn"}</td>
                  <td className="py-3 align-top">không giới hạn</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 mb-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
          Một thuê bao dùng cho cả nhà, không tính theo số con. Nhà nhiều con là nhà cần Ô Ly nhất.
        </p>
        <p className="mt-2 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
          Trần của gói miễn phí đang đặt ở {TRAN_MIEN_PHI_TRANG_THANG} trang mỗi tháng. Đây là con số
          của bản dựng thử nghiệm và còn chờ chốt chính thức.
        </p>
      </section>
    </main>
  );
}
