import Link from "next/link";
import { GIAI_THICH_LOI } from "@/lib/vision/provider";
import { layNhaCungCap } from "@/lib/vision/chon-nha-cung-cap";

export const dynamic = "force-dynamic";

/**
 * Trang giải thích cách hệ thống chấm bài.
 *
 * BR-38 và CR-17: nghĩa vụ minh bạch về xử lý tự động. Nội dung phải bằng ngôn
 * ngữ của người không làm kỹ thuật, và phải nêu rõ hai điều: hệ thống có thể
 * đọc sai, và phụ huynh là người quyết định cuối cùng. Đây KHÔNG phải nghĩa vụ
 * công khai mã nguồn hay thuật toán chi tiết, nên trang này cố ý dừng ở mức mô
 * tả nguyên tắc.
 */
export default function TrangCachChamBai() {
  const ncc = layNhaCungCap();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="m-0 text-sm">
        <Link href="/" style={{ color: "var(--muc-nhat)" }}>← Về trang đầu</Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold">Ô Ly chấm bài của con thế nào</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Trang này viết cho phụ huynh đọc, không phải cho kỹ sư đọc. Anh chị có quyền biết máy đang
        làm gì với bài của con mình.
      </p>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Điều quan trọng nhất, nói trước</h2>
        <p className="m-0">
          <strong>Máy có thể đọc sai, và anh chị là người quyết định cuối cùng.</strong> Nếu Ô Ly
          bảo con làm sai mà anh chị nhìn vào thấy con làm đúng, thì con đúng. Ô Ly chỉ đọc chữ trên
          giấy; nó không ngồi cạnh con lúc con làm bài như anh chị.
        </p>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Bốn bước, từ lúc anh chị bấm chụp</h2>
        <ol className="m-0 space-y-4 pl-5">
          <li>
            <strong>Che thông tin của con, ngay trên điện thoại.</strong> Trước khi ảnh rời khỏi máy
            anh chị, phần đầu trang — nơi con viết họ tên, lớp, tên trường — đã bị tô đè hẳn. Phần
            pixel đó không được gửi đi đâu cả, kể cả tới Ô Ly.
          </li>
          <li>
            <strong>Gửi đi mà không kèm tên tuổi.</strong> Gói gửi đi chỉ có ảnh đã che, loại việc
            cần làm, và khối lớp. Không kèm tài khoản, không kèm tên bé, không kèm mã nào để lần
            ngược về hộ mình.
          </li>
          <li>
            <strong>Đọc chữ và số trên giấy.</strong> Bên xử lý đọc ra các con số con đã viết ở từng
            cột. Ô Ly không đo nét chữ, không so chữ của bé này với bé kia, và không dùng nét chữ để
            nhận ra ai viết.
          </li>
          <li>
            <strong>Xóa ảnh, giữ lại kết quả.</strong> Ngay khi trả kết quả cho anh chị, ảnh bị xóa.
            Ô Ly chỉ giữ phần đã đọc ra thành chữ và số. Muốn xem lại ảnh cũ, anh chị mở thư viện ảnh
            trong điện thoại của mình.
          </li>
        </ol>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Ô Ly tìm chỗ sai bằng cách nào</h2>
        <p>
          Với phép tính đặt theo cột dọc, Ô Ly tính lại từng cột một, từ cột đơn vị sang trái, rồi so
          với con số con đã viết ở cột đó. Cột đầu tiên lệch chính là chỗ con bắt đầu sai — các cột
          bên phải nó con làm đúng rồi.
        </p>
        <p className="m-0">
          Ô Ly cũng đối chiếu kiểu sai với một danh sách lỗi quen thuộc của trẻ lớp 1–2: quên nhớ khi
          cộng, ngại mượn nên lấy số lớn trừ số bé, cho xăng-ti-mét mà hỏi mét, năm cái cây thì chỉ có
          bốn khoảng. Khi khớp một lỗi trong danh sách đó, Ô Ly nói luôn với anh chị rằng con vướng ở
          đâu, chứ không chỉ báo sai.
        </p>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Khi Ô Ly không đọc được ảnh</h2>
        <p>Ô Ly nói rõ lý do và <strong>không trừ lượt của anh chị</strong>. Các lý do có thể gặp:</p>
        <ul className="m-0 list-disc space-y-1 pl-5 text-sm">
          {Object.entries(GIAI_THICH_LOI).map(([ma, giai]) => (
            <li key={ma}>{giai.replace(" Lần chụp này không bị trừ lượt.", "")}</li>
          ))}
        </ul>
      </section>

      <section className="the mt-6 p-6">
        <h2 className="mt-0 text-lg font-bold">Ai xử lý ảnh cho Ô Ly</h2>
        <p className="m-0 text-sm">
          Bên xử lý hiện tại: <strong>{ncc.ten}</strong>.
          {ncc.thoaThuan.daKy ? " Ô Ly đã ký thỏa thuận với bên này," : " Chưa ký thỏa thuận với bên này,"}
          {ncc.thoaThuan.camLuuGiu ? " trong đó có điều khoản họ không được giữ lại dữ liệu," : ""}
          {ncc.thoaThuan.camDungDeHuanLuyen ? " và không được dùng dữ liệu để huấn luyện mô hình của họ." : ""}
        </p>
        <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
          Anh chị bật hoặc tắt từng việc kể trên trong mục Quyền riêng tư. Tắt một việc thì chỉ mất
          đúng việc đó, phần còn lại của Ô Ly vẫn chạy.
        </p>
      </section>
    </main>
  );
}
