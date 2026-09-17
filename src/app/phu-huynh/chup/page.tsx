import Link from "next/link";
import { tinhTran } from "@/lib/domain/metering";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { dieuKienXuLy } from "@/lib/server/du-dieu-kien";
import { danhSachCon, mucDaDung } from "@/lib/server/repo";
import { CongPin } from "../CongPin";
import { goiYPinHoMau } from "@/lib/server/moi-truong";
import { LuongChup, type ConChonDuoc } from "./LuongChup";

export const dynamic = "force-dynamic";

export default async function TrangChup() {
  const ho = await daMoCong();
  if (!ho) return <CongPin goiY={goiYPinHoMau()} />;

  const tran = tinhTran(ho.goi, mucDaDung(ho.id));
  const cacCon: ConChonDuoc[] = danhSachCon(ho.id).map((c) => ({
    id: c.id,
    tenGoi: c.tenGoi,
    lop: c.lop,
    vuongGi: {
      "doc-de-bai": dieuKienXuLy(ho.id, c, "doc-anh-de-bai").noiGiVoiPhuHuynh,
      "cham-bai-lam": dieuKienXuLy(ho.id, c, "cham-bai-viet-tay").noiGiVoiPhuHuynh,
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
