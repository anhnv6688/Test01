import { Suspense } from "react";
import Link from "next/link";
import { DaiBaoBanThu } from "@/components/DaiBaoBanThu";
import { khuonDangDaDuyet } from "@/lib/domain/generator";
import { YCCD } from "@/lib/domain/curriculum";
import { TRAPS } from "@/lib/domain/traps";

export const dynamic = "force-dynamic";

/**
 * Trang đầu — chỗ rẽ nhánh giữa hai bề mặt.
 *
 * NT-10: bề mặt của trẻ và bề mặt của phụ huynh tách bạch. Ngay từ trang đầu,
 * hai lối vào đã khác hẳn nhau về màu và về chữ, để một đứa trẻ bảy tuổi bấm
 * đúng cửa của mình mà không cần đọc.
 */
export default function TrangDau() {
  const soKhuonDang = khuonDangDaDuyet().length;

  return (
    <>
      {/*
        Bọc Suspense vì DaiBaoBanThu gọi `connection()` để đọc biến môi trường
        LÚC CHẠY. Không bọc thì cả trang bị kéo sang chế độ dựng theo từng yêu
        cầu.
      */}
      <Suspense fallback={null}>
        <DaiBaoBanThu />
      </Suspense>
        <main className="mx-auto w-full max-w-4xl px-4 py-10">
        <header>
          <p className="m-0 text-sm font-semibold tracking-wide" style={{ color: "var(--son)" }}>
            Ô LY · HỌC TOÁN TIỂU HỌC
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            Đáp án thì ở đâu cũng có.
            <br />
            Cái thiếu là <span style={{ color: "var(--son)" }}>biết con sai vì lý do gì</span>.
          </h1>
          <p className="mt-4 max-w-2xl text-lg" style={{ color: "var(--muc-nhat)" }}>
            Ô Ly dành cho học sinh lớp 1–2 và cho bố mẹ ngồi kèm con ba mươi phút mỗi tối. Con làm bài
            mà không cần ai đọc hộ đề. Bố mẹ biết tối nay nên hỏi con đúng một câu gì.
          </p>
        </header>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Link href="/be" className="the block p-7 no-underline"
            style={{ background: "var(--cam-nen)", borderColor: "var(--cam)", color: "var(--muc)" }}>
            <span aria-hidden className="text-5xl">🐥</span>
            <span className="mt-3 block text-2xl font-bold">Con vào học</span>
            <span className="mt-1 block text-sm" style={{ color: "var(--muc-nhat)" }}>
              Đề tự đọc lên thành tiếng. Con bấm vào số, không phải gõ chữ.
            </span>
          </Link>

          <Link href="/phu-huynh" className="the block p-7 no-underline"
            style={{ background: "var(--tim-nen)", borderColor: "var(--tim)", color: "var(--muc)" }}>
            <span aria-hidden className="text-5xl">👋</span>
            <span className="mt-3 block text-2xl font-bold">Bố mẹ</span>
            <span className="mt-1 block text-sm" style={{ color: "var(--muc-nhat)" }}>
              Bản tin tối, chụp bài con làm để chấm, và phần lời giải đầy đủ. Có khóa mã PIN.
            </span>
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-bold">Ô Ly khác chỗ nào</h2>
          <dl className="mt-5 grid gap-5 sm:grid-cols-3">
            <div className="the p-5">
              <dt className="font-bold">Không chặn con ở khâu đọc</dt>
              <dd className="m-0 mt-2 text-sm" style={{ color: "var(--muc-nhat)" }}>
                Đề lớp 1–2 gần như toàn văn xuôi. Rào cản đầu tiên của trẻ là đọc, không phải tính.
                Mọi đề trong Ô Ly đều đọc lên được, và con trả lời bằng cách bấm số.
              </dd>
            </div>
            <div className="the p-5">
              <dt className="font-bold">Chữa bẫy ngay lúc con mắc</dt>
              <dd className="m-0 mt-2 text-sm" style={{ color: "var(--muc-nhat)" }}>
                Cho xăng-ti-mét nhưng hỏi mét. Năm cái cây chỉ có bốn khoảng. Ô Ly nhận ra {TRAPS.length} kiểu
                bẫy như vậy và chữa đúng lúc con vừa mắc, chứ không đợi tới cuối bài.
              </dd>
            </div>
            <div className="the p-5">
              <dt className="font-bold">Không bao giờ cho con xem đáp án</dt>
              <dd className="m-0 mt-2 text-sm" style={{ color: "var(--muc-nhat)" }}>
                Gợi ý của Ô Ly đi theo bậc thang: đọc lại đề, nhìn hình, làm mẫu một bài khác. Bậc cuối
                cùng vẫn không phải đáp án. Lời giải đầy đủ chỉ nằm ở phần của bố mẹ.
              </dd>
            </div>
          </dl>
        </section>

        <section className="the mt-8 p-6">
          <h2 className="mt-0 text-lg font-bold">Những điều Ô Ly không làm</h2>
          <ul className="m-0 list-disc space-y-2 pl-5 text-sm">
            <li>Không quảng cáo, không vòng quay may mắn, không vật phẩm mua bằng tiền.</li>
            <li>Không bảng xếp hạng theo điểm. Con chỉ so với chính con của tuần trước.</li>
            <li>Không thu ảnh khuôn mặt của con, không giữ lại ảnh trang vở sau khi chấm xong.</li>
            <li>Không dùng dữ liệu học của con cho quảng cáo, dưới bất kỳ hình thức nào.</li>
            <li>Không khóa lịch sử học của con khi thuê bao hết hạn.</li>
          </ul>
        </section>

        <section className="mt-8 text-sm" style={{ color: "var(--muc-nhat)" }}>
          <p className="m-0">
            Kho bài hiện có {soKhuonDang} khuôn dạng đã được giáo viên tiểu học duyệt, gắn với {YCCD.length} yêu
            cầu cần đạt của Chương trình giáo dục phổ thông môn Toán. Mỗi khuôn dạng sinh ra vô số bài
            khác nhau, nên con luyện mãi không gặp lại bài cũ.
          </p>
          <p className="mt-4">
            <Link href="/cach-cham-bai" style={{ color: "inherit" }}>Ô Ly chấm bài thế nào</Link>
            {" · "}
            <Link href="/go-bo-noi-dung" style={{ color: "inherit" }}>Yêu cầu gỡ bỏ nội dung</Link>
          </p>
        </section>
      </main>
    </>
  );
}
