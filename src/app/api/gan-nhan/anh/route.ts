import { NextResponse } from "next/server";
import { congCuGanNhanMoKhong, docAnh } from "@/lib/server/kho-anh-do";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Phục vụ một tấm ảnh trong thư mục bộ đo cho trang gắn nhãn.
 *
 * Không đặt ảnh vào public/: mọi thứ trong public/ đi thẳng ra bản dựng và ra
 * mạng, còn đây là ảnh trang vở của trẻ. Đi qua một địa chỉ có chốt thì ảnh ở
 * yên trong thư mục đã bị .gitignore chặn, và chốt tắt hẳn ở bản phát hành.
 *
 * `no-store` để trình duyệt không giữ lại ảnh trong bộ đệm trên đĩa sau khi
 * gắn nhãn xong.
 */
export async function GET(req: Request) {
  if (!congCuGanNhanMoKhong()) {
    return NextResponse.json({ loi: "không có" }, { status: 404 });
  }
  const tep = new URL(req.url).searchParams.get("tep");
  if (!tep) return NextResponse.json({ loi: "thiếu tham số tep" }, { status: 400 });
  try {
    const { du, kieu } = await docAnh(tep);
    return new NextResponse(new Uint8Array(du), {
      headers: { "content-type": kieu, "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ loi: "không đọc được tệp" }, { status: 404 });
  }
}
