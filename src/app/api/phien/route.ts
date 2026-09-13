import { NextResponse } from "next/server";
import { sinhBai } from "@/lib/domain/generator";
import { guiChoTre } from "@/lib/domain/present";
import { nhipPhien } from "@/lib/domain/session";
import { dangBat } from "@/lib/privacy/consent";
import { layCon, lichSuDongY } from "@/lib/server/repo";
import { batDauPhien, capNhatPhien, layPhien } from "@/lib/server/session-store";

export const runtime = "nodejs";

/** Mở một phiên học mới cho trẻ. */
export async function POST(req: Request) {
  const { childId } = (await req.json()) as { childId?: string };
  if (!childId) return NextResponse.json({ loi: "thiếu childId" }, { status: 400 });
  const con = layCon(childId);
  if (!con) return NextResponse.json({ loi: "không có hồ sơ này" }, { status: 404 });

  const caNhanHoa = dangBat(lichSuDongY(con.householdId), "goi-y-ca-nhan-hoa");
  const p = batDauPhien(childId, caNhanHoa);
  const dau = p.ke[0];
  const bai = sinhBai(dau.templateId, dau.seed);
  p.batDauBai = Date.now();
  capNhatPhien(p);

  return NextResponse.json({
    sessionId: p.sessionId,
    tenGoi: con.tenGoi,
    tongSoBai: p.ke.length,
    viTri: 0,
    nhip: nhipPhien(p.batDau),
    bai: guiChoTre(bai, 0),
  });
}

/** Lấy bài hiện tại, dùng khi tải lại trang giữa phiên. */
export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ loi: "thiếu sessionId" }, { status: 400 });
  const p = layPhien(sessionId);
  if (!p) return NextResponse.json({ loi: "phiên đã kết thúc" }, { status: 404 });
  const cur = p.ke[p.viTri];
  const bai = sinhBai(cur.templateId, cur.seed);
  return NextResponse.json({
    sessionId,
    viTri: p.viTri,
    tongSoBai: p.ke.length,
    nhip: nhipPhien(p.batDau),
    bai: guiChoTre(bai, p.bacGoiYDaMo),
  });
}
