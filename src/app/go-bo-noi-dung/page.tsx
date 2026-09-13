import Link from "next/link";
import { revalidatePath } from "next/cache";
import { HAN_GO_BO_GIO, nhatKyGoBo, taoYeuCauGoBo } from "@/lib/server/requests";
import { moiDuLieu } from "@/lib/server/seed";

export const dynamic = "force-dynamic";

/**
 * Kênh tiếp nhận yêu cầu gỡ bỏ nội dung.
 *
 * BR-23 và CR-06: phải có đầu mối CÔNG KHAI, quy trình bằng văn bản, nhật ký xử
 * lý đầy đủ, và đáp ứng đúng các mốc thời hạn luật định — hoạt động ngay từ ngày
 * sản phẩm mở cho người dùng, không phải sau khi có sự cố đầu tiên. Đây cũng là
 * điều kiện để giữ miễn trừ trách nhiệm cho luồng nội dung người dùng tải lên.
 *
 * Vì là đầu mối công khai nên trang này nằm ngoài cổng mã PIN và không đòi đăng
 * nhập: người gửi yêu cầu gỡ bỏ thường không phải người dùng của Ô Ly.
 */
async function guiYeuCau(form: FormData) {
  "use server";
  moiDuLieu();
  taoYeuCauGoBo({
    nguoiGui: String(form.get("nguoiGui") ?? "").trim(),
    lienHe: String(form.get("lienHe") ?? "").trim(),
    doiTuong: String(form.get("doiTuong") ?? "").trim(),
    lyDo: String(form.get("lyDo") ?? "").trim(),
  });
  revalidatePath("/go-bo-noi-dung");
}

export default function TrangGoBo() {
  moiDuLieu();
  const nhatKy = nhatKyGoBo(20);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="m-0 text-sm">
        <Link href="/" style={{ color: "var(--muc-nhat)" }}>← Về trang đầu</Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold">Yêu cầu gỡ bỏ nội dung</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Nếu quý vị cho rằng một nội dung trên Ô Ly xâm phạm quyền của mình, quý vị gửi yêu cầu ở đây.
        Ô Ly tiếp nhận và xử lý trong vòng {HAN_GO_BO_GIO} giờ kể từ khi nhận được yêu cầu hợp lệ.
      </p>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Đầu mối tiếp nhận</h2>
        <ul className="m-0 list-none space-y-1 p-0 text-sm">
          <li>Bộ phận phụ trách: Bộ phận nội dung và tuân thủ</li>
          <li>Thư điện tử: gobo@oly.example</li>
          <li>Thời gian trực: các ngày làm việc trong tuần</li>
        </ul>
        <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
          Địa chỉ trên là địa chỉ mẫu của bản dựng thử nghiệm; đầu mối thật được công bố trước khi
          Ô Ly mở cho người dùng.
        </p>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Gửi yêu cầu</h2>
        <form action={guiYeuCau} className="mt-3 space-y-3">
          <label className="block text-sm">
            <span className="block font-semibold">Người gửi</span>
            <input name="nguoiGui" required className="mt-1 w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }} />
          </label>
          <label className="block text-sm">
            <span className="block font-semibold">Cách liên hệ lại</span>
            <input name="lienHe" required className="mt-1 w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }} />
          </label>
          <label className="block text-sm">
            <span className="block font-semibold">Nội dung cần gỡ</span>
            <input name="doiTuong" required placeholder="Mã khuôn dạng, đường dẫn, hoặc mô tả"
              className="mt-1 w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }} />
          </label>
          <label className="block text-sm">
            <span className="block font-semibold">Căn cứ yêu cầu</span>
            <textarea name="lyDo" rows={4} required className="mt-1 w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }} />
          </label>
          <button type="submit" className="nut nut-chinh">Gửi yêu cầu</button>
        </form>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Nhật ký xử lý</h2>
        <p className="text-sm" style={{ color: "var(--muc-nhat)" }}>
          Mỗi yêu cầu được ghi nhận kèm thời điểm nhận và hạn xử lý. Nhật ký này là hồ sơ chứng minh
          quy trình khi bị kiểm tra.
        </p>
        {nhatKy.length === 0 ? (
          <p className="m-0 text-sm">Chưa có yêu cầu nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr style={{ color: "var(--muc-nhat)" }}>
                  <th className="py-2 pr-4 text-left font-semibold">Nhận lúc</th>
                  <th className="py-2 pr-4 text-left font-semibold">Nội dung</th>
                  <th className="py-2 pr-4 text-left font-semibold">Hạn xử lý</th>
                  <th className="py-2 text-left font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {nhatKy.map((y) => (
                  <tr key={y.id} className="border-t" style={{ borderColor: "var(--vien)" }}>
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(y.nhanLuc).toLocaleString("vi-VN")}</td>
                    <td className="py-2 pr-4">{y.doiTuong}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(y.hanXuLy).toLocaleString("vi-VN")}</td>
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
