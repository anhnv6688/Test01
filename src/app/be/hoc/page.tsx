import { Suspense } from "react";
import { PhienHoc } from "./PhienHoc";

export const dynamic = "force-dynamic";

export default function TrangHoc() {
  return (
    <Suspense fallback={<p className="p-8 text-lg">Đang mở vở…</p>}>
      <PhienHoc />
    </Suspense>
  );
}
