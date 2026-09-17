import { connection } from "next/server";
import { moiTruong } from "@/lib/server/moi-truong";
import { anhCoGuiRaNgoaiKhong } from "@/lib/vision/chon-nha-cung-cap";

/**
 * Dải báo trên mọi trang của BẢN THỬ.
 *
 * Trước dải này, bản thử trông y hệt bản thật. Với một máy chỉ để đội phát
 * triển bấm thì không sao; với một máy mời người nội bộ vào dùng thử thì đó là
 * hai vấn đề:
 *
 * 1. Người test một sản phẩm chấm bài sẽ chụp bài THẬT của con mình. Đó là
 *    phản xạ tự nhiên, không phải sự bất cẩn — muốn biết nó chấm có đúng không
 *    thì phải đưa cho nó một bài có đáp án mình đã biết. Không nói trước thì
 *    ảnh trang vở của trẻ thật vào một máy đặt ngoài Việt Nam, và có thể đi
 *    tiếp ra nhà cung cấp xử lý ảnh.
 *
 * 2. Người test không biết mình đang xem kết quả thật hay kết quả bịa. Bản giả
 *    lập trả về dữ liệu dựng sẵn, nên người test sẽ báo "Ô Ly đọc sai hết" khi
 *    thật ra nó chưa đọc gì cả — một báo cáo lỗi vừa vô ích vừa làm mất lòng
 *    tin vào phần đang chạy đúng.
 *
 * Vì vậy dải này nói cả hai: đây là bản thử, và ảnh của anh ĐI ĐÂU.
 *
 * `connection()` là phần quan trọng nhất của tệp, và là phần dễ bị "dọn dẹp"
 * nhất. Cùng MỘT ảnh Docker chạy ở cả bản thử lẫn bản thật (nguyên tắc số 2,
 * docs/moi-truong.md), nên biến môi trường phải được đọc LÚC CHẠY. Không có
 * dòng đó thì Next dựng sẵn trang này lúc `next build` — lúc đó
 * OLY_MOI_TRUONG chưa được đặt, `moiTruong()` trả "that", và dải báo bị nướng
 * cứng thành "không hiện" trong ảnh. Bản thử sẽ im lặng đúng như bản thật, mà
 * không có lỗi nào.
 */
export async function DaiBaoBanThu() {
  await connection();
  if (moiTruong() !== "thu") return null;
  const guiRaNgoai = anhCoGuiRaNgoaiKhong();

  return (
    <aside
      role="note"
      className="w-full px-4 py-2 text-center text-sm"
      style={{ background: "var(--cam-nen)", borderBottom: "2px solid var(--cam)", color: "var(--muc)" }}
    >
      <strong>BẢN THỬ — không phải sản phẩm thật.</strong>{" "}
      Dữ liệu ở đây có thể bị xóa bất cứ lúc nào.{" "}
      <strong>Đừng nhập tên thật của con, đừng chụp bài thật của con.</strong>{" "}
      {guiRaNgoai ? (
        <span style={{ color: "var(--son)" }}>
          Ảnh chụp ở đây <strong>ĐƯỢC GỬI RA</strong> nhà cung cấp xử lý ảnh.
        </span>
      ) : (
        <span>
          Ảnh chụp ở đây <strong>không đi đâu cả</strong> — đang dùng bản giả lập, nên kết quả
          chấm là dữ liệu dựng sẵn, không phải máy đọc ảnh của anh chị.
        </span>
      )}
    </aside>
  );
}
