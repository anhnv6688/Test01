/**
 * Bề mặt dành cho trẻ.
 *
 * NT-10 và BR-03: bề mặt này TÁCH BẠCH với bề mặt phụ huynh. Trong toàn bộ cây
 * thư mục src/app/be không được nhập bất kỳ thứ gì từ src/lib/domain/teaching.ts
 * — đó là nơi duy nhất chứa lời giải đầy đủ — và không có liên kết nào dẫn thẳng
 * sang trang kết quả chấm bài. Có một bài kiểm thử canh đúng điều này, xem
 * tests/tach-bach-be-mat.test.ts.
 *
 * Lối duy nhất sang phần của bố mẹ là nút "Bố mẹ ơi", và nó dẫn tới cổng nhập
 * mã PIN chứ không dẫn thẳng vào nội dung.
 */
export default function BeLayout({ children }: { children: React.ReactNode }) {
  return <div className="giay-o-ly min-h-screen">{children}</div>;
}
