import Link from "next/link";
import { tinhTran } from "@/lib/domain/metering";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { dieuKienXuLy } from "@/lib/server/du-dieu-kien";
import { NOI_GI_KHI_THIEU } from "@/lib/privacy/nguoi-giam-ho";
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
  const conThieu = (c: (typeof danhSachCon extends (...a: never[]) => (infer T)[] ? T : never)) => ({
    "doc-de-bai": dieuKienXuLy(ho.id, c, "doc-anh-de-bai").thieu.map((t) => NOI_GI_KHI_THIEU[t]),
    "cham-bai-lam": dieuKienXuLy(ho.id, c, "cham-bai-viet-tay").thieu.map((t) => NOI_GI_KHI_THIEU[t]),
  });

  const cacCon: ConChonDuoc[] = danhSachCon(ho.id).map((c) => ({
    id: c.id,
    tenGoi: c.tenGoi,
    lop: c.lop,
    vuongGi: conThieu(c),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Chụp bài</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Con vẫn làm bài trên giấy như ở trường. Ô Ly đứng phía sau, giúp anh chị giảng lại và chấm
        cho con.
      </p>

      <LuongChup
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
