import { NextResponse } from "next/server";
import { sinhBai } from "@/lib/domain/generator";
import { cham } from "@/lib/domain/marking";
import { guiChoTre } from "@/lib/domain/present";
import { nhipPhien } from "@/lib/domain/session";
import { ghiLanTraLoi } from "@/lib/server/repo";
import { capNhatPhien, layPhien } from "@/lib/server/session-store";

export const runtime = "nodejs";

/**
 * Chấm một lần trả lời.
 *
 * Việc chấm nằm ở máy chủ vì đây là chỗ duy nhất được biết đáp án (BR-03).
 * Phản hồi trả về chỉ gồm đúng hay sai và câu chữa; không kèm đáp án, kể cả khi
 * trẻ đã sai nhiều lần.
 */
export async function POST(req: Request) {
  const { sessionId, given } = (await req.json()) as { sessionId?: string; given?: number };
  if (!sessionId || typeof given !== "number") {
    return NextResponse.json({ loi: "thiếu dữ liệu" }, { status: 400 });
  }
  const p = layPhien(sessionId);
  if (!p) return NextResponse.json({ loi: "phiên đã kết thúc" }, { status: 404 });

  const cur = p.ke[p.viTri];
  const bai = sinhBai(cur.templateId, cur.seed);
  const kq = cham(bai, given);

  ghiLanTraLoi(p.sessionId, p.childId, {
    itemId: bai.id,
    templateId: bai.templateId,
    yccd: bai.yccd,
    given,
    correct: kq.correct,
    trapId: kq.trap?.id ?? null,
    hintsUsed: p.bacGoiYDaMo,
    attemptNo: p.lanThu,
    elapsedMs: Date.now() - p.batDauBai,
    at: new Date().toISOString(),
  });

  if (kq.correct) {
    p.viTri += 1;
    p.bacGoiYDaMo = 0;
    p.lanThu = 1;
    p.batDauBai = Date.now();
    capNhatPhien(p);
    const nhip = nhipPhien(p.batDau);
    const conBai = p.viTri < p.ke.length && nhip.pha !== "het-gio";
    const tiep = conBai ? p.ke[p.viTri] : null;
    return NextResponse.json({
      correct: true,
      phanHoi: kq.phanHoi,
      speech: kq.speech,
      nhip,
      viTri: p.viTri,
      tongSoBai: p.ke.length,
      bai: tiep ? guiChoTre(sinhBai(tiep.templateId, tiep.seed), 0) : null,
    });
  }

  p.lanThu += 1;
  capNhatPhien(p);
  return NextResponse.json({
    correct: false,
    phanHoi: kq.phanHoi,
    speech: kq.speech,
    tenBay: kq.trap?.name ?? null,
    nhip: nhipPhien(p.batDau),
    viTri: p.viTri,
    tongSoBai: p.ke.length,
  });
}
