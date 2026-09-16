import { NextResponse } from "next/server";
import { tienDoGanNhan } from "@/lib/do-anh/gan-nhan";
import type { NhanBoAnh } from "@/lib/do-anh/nhan";
import {
  congCuGanNhanMoKhong, danhSachAnh, docNhan, ghiNhan, sanSangChayDo, thuMucAnhDo,
} from "@/lib/server/kho-anh-do";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Đọc và ghi tệp nhãn của bộ ảnh đo. Chỉ chạy ở bản phát triển.
 *
 * Trả 404 chứ không trả 403 khi bị khóa: một địa chỉ trả "cấm" là một địa chỉ
 * xác nhận rằng nó có tồn tại và có thứ gì đó để lấy.
 */
function khoa() {
  return NextResponse.json({ loi: "không có" }, { status: 404 });
}

export async function GET() {
  if (!congCuGanNhanMoKhong()) return khoa();
  const [tep, bo] = await Promise.all([danhSachAnh(), docNhan()]);
  return NextResponse.json({
    thuMuc: thuMucAnhDo(),
    tep,
    nhan: bo,
    tienDo: tienDoGanNhan(bo, tep),
    sanSang: sanSangChayDo(bo),
  });
}

export async function PUT(req: Request) {
  if (!congCuGanNhanMoKhong()) return khoa();
  const bo = (await req.json()) as NhanBoAnh;
  if (!bo || !Array.isArray(bo.anh)) {
    return NextResponse.json({ loi: "thân yêu cầu không phải một bộ nhãn" }, { status: 400 });
  }
  await ghiNhan(bo);
  const tep = await danhSachAnh();
  return NextResponse.json({ tienDo: tienDoGanNhan(bo, tep), sanSang: sanSangChayDo(bo) });
}
