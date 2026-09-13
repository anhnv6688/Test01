import { NextResponse } from "next/server";
import { tinhPhanThuong } from "@/lib/domain/rewards";
import { laPhienQuaDai } from "@/lib/domain/session";
import { dongPhien, lanTraLoiTheoPhien } from "@/lib/server/repo";
import { layPhien, xoaPhien } from "@/lib/server/session-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) return NextResponse.json({ loi: "thiếu sessionId" }, { status: 400 });
  const p = layPhien(sessionId);
  if (!p) return NextResponse.json({ loi: "phiên đã kết thúc" }, { status: 404 });

  const attempts = lanTraLoiTheoPhien(sessionId);
  const thuong = tinhPhanThuong(attempts);
  dongPhien(sessionId, thuong.hatGiong);
  xoaPhien(sessionId);

  return NextResponse.json({
    thuong,
    // Tín hiệu xấu theo thước đo của BR-05, ghi nhận để theo dõi chứ không hiện cho trẻ.
    phienQuaDai: laPhienQuaDai(p.batDau, new Date().toISOString()),
  });
}
