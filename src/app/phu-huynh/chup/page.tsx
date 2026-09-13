import Link from "next/link";
import { tinhTran } from "@/lib/domain/metering";
import { dangBat } from "@/lib/privacy/consent";
import { daMoCong } from "@/lib/server/cong-phu-huynh";
import { lichSuDongY, soTrangDaDungThangNay } from "@/lib/server/repo";
import { CongPin } from "../CongPin";
import { LuongChup } from "./LuongChup";

export const dynamic = "force-dynamic";

export default async function TrangChup() {
  const ho = await daMoCong();
  if (!ho) return <CongPin />;

  const dongY = lichSuDongY(ho.id);
  const tran = tinhTran(ho.goi, soTrangDaDungThangNay(ho.id));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mt-0 text-2xl font-bold">Chụp bài</h1>
      <p style={{ color: "var(--muc-nhat)" }}>
        Con vẫn làm bài trên giấy như ở trường. Ô Ly đứng phía sau, giúp anh chị giảng lại và chấm
        cho con.
      </p>

      <LuongChup
        batDocDe={dangBat(dongY, "doc-anh-de-bai")}
        batChamBai={dangBat(dongY, "cham-bai-viet-tay")}
        conLai={tran.conLai}
        tran={tran.tran}
      />

      <p className="mt-6 text-sm">
        <Link href="/cach-cham-bai">Ô Ly chấm bài thế nào, và khi nào thì máy đọc sai →</Link>
      </p>
    </main>
  );
}
