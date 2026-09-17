import Link from "next/link";
import { tinhTran } from "@/lib/domain/metering";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { dieuKienXuLy } from "@/lib/server/du-dieu-kien";
import { NOI_GI_KHI_THIEU } from "@/lib/privacy/nguoi-giam-ho";
import { MUC_DICH, type MucDich } from "@/lib/privacy/consent";
import type { Con } from "@/lib/server/repo";
import { danhSachCon, mucDaDung } from "@/lib/server/repo";
import { CongPin } from "../CongPin";
import { goiYPinHoMau } from "@/lib/server/moi-truong";
import { LuongChup, type ConChonDuoc } from "./LuongChup";

export const dynamic = "force-dynamic";

export default async function TrangChup() {
  const ho = await daMoCong();
  if (!ho) return <CongPin goiY={goiYPinHoMau()} />;

  const tran = tinhTran(ho.goi, mucDaDung(ho.id));
  /*
   * Truyền CẢ danh sách việc còn thiếu, không chỉ việc đầu tiên.
   *
   * `noiGiVoiPhuHuynh` cố ý chỉ nêu thiếu[0] — hợp lý cho một dòng nhắc ngắn.
   * Nhưng một hộ mới thiếu tới ba thứ cùng lúc: chưa có người đại diện, chưa
   * bật đồng ý cho mục đích này, và với bạn từ 7 tuổi thì còn cần chính con
   * đồng ý (CR-05). Chỉ nói việc đầu thì phụ huynh làm xong lại gặp một ngõ cụt
   * mới, rồi lại một cái nữa — ba lần bế tắc thay vì một lần nhìn thấy cả đường.
   */
  /*
   * Truyền cả MÃ của việc còn thiếu, không chỉ câu chữ.
   *
   * Có mã thì trang chụp xin được đồng ý cho ĐÚNG mục đích đang cần, ngay tại
   * chỗ tắc. Trước đây nó chỉ biết một câu "anh chị bật riêng trong mục Quyền
   * riêng tư nhé" — mà mục ấy có bốn ô, trong đó chỉ một ô liên quan tới việc
   * họ đang làm. Phụ huynh không đoán được ô nào, nên bật hết cho chắc.
   *
   * Bật hết "cho chắc" chính là thứ mà đồng ý THEO MỤC ĐÍCH sinh ra để tránh:
   * nó biến bốn quyết định riêng thành một cái gật đầu. Xin đúng một mục đích
   * vừa đỡ mất công hơn, vừa là tuân thủ đúng hơn — hiếm khi hai thứ đó cùng
   * chiều, và ở đây chúng cùng chiều.
   */
  const thieuChoMucDich = (c: Con, mucDich: MucDich) =>
    dieuKienXuLy(ho.id, c, mucDich).thieu.map((ma) => ({ ma, loi: NOI_GI_KHI_THIEU[ma] }));

  const cacCon: ConChonDuoc[] = danhSachCon(ho.id).map((c) => ({
    id: c.id,
    tenGoi: c.tenGoi,
    lop: c.lop,
    vuongGi: {
      "doc-de-bai": thieuChoMucDich(c, "doc-anh-de-bai"),
      "cham-bai-lam": thieuChoMucDich(c, "cham-bai-viet-tay"),
    },
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Chụp bài</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Con vẫn làm bài trên giấy như ở trường. Ô Ly đứng phía sau, giúp anh chị giảng lại và chấm
        cho con.
      </p>

      <LuongChup
        moTaMucDich={Object.fromEntries(
          MUC_DICH.map((m) => [
            m.ma,
            { ten: m.ten, giaiThich: m.giaiThich, matGi: m.matGi, hoiCon: m.hoiCon },
          ]),
        )}
        cacCon={cacCon}
        conLaiHomNay={tran.conLaiHomNay}
        tranNgay={tran.tranNgay}
        conLaiThangNay={tran.conLaiThangNay}
        tranThang={tran.tranThang}
      />

      <p className="mt-6 text-sm">
        <Link href="/cach-cham-bai">Ô Ly chấm bài thế nào, và khi nào thì máy đọc sai →</Link>
      </p>
    </main>
  );
}
