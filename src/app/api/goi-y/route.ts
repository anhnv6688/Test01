import { NextResponse } from "next/server";
import { sinhBai } from "@/lib/domain/generator";
import { guiChoTre } from "@/lib/domain/present";
import { capNhatPhien, layPhien } from "@/lib/server/session-store";

export const runtime = "nodejs";

/**
 * Mở thêm một bậc gợi ý.
 *
 * Thang gợi ý dừng ở bậc cuối cùng của khuôn dạng và KHÔNG có bậc nào là đáp án
 * (BR-03). Khi trẻ đã mở hết thang mà vẫn chưa làm được, sản phẩm chuyển sang
 * bài khác chứ không đưa đáp án — việc chữa bài đó là việc của bố mẹ tối hôm
 * ấy, và bản tin tối chính là chỗ giao việc đó.
 */
export async function POST(req: Request) {
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) return NextResponse.json({ loi: "thiếu sessionId" }, { status: 400 });
  const p = layPhien(sessionId);
  if (!p) return NextResponse.json({ loi: "phiên đã kết thúc" }, { status: 404 });

  const cur = p.ke[p.viTri];
  const bai = sinhBai(cur.templateId, cur.seed);
  p.bacGoiYDaMo = Math.min(p.bacGoiYDaMo + 1, bai.hints.length);
  capNhatPhien(p);

  return NextResponse.json({
    bai: guiChoTre(bai, p.bacGoiYDaMo),
    hetThang: p.bacGoiYDaMo >= bai.hints.length,
  });
}
