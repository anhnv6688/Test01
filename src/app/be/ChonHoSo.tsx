"use client";

import { useRouter } from "next/navigation";
import { useDocTo } from "@/components/doc-to";

const HINH = ["🐥", "🐢", "🐨", "🦊", "🐬", "🦉"];
const MAU = ["var(--cam-nen)", "var(--xanh-la-nen)", "var(--tim-nen)", "var(--do-nen)"];

export function ChonHoSo({ con }: { con: { id: string; tenGoi: string; lop: number }[] }) {
  const router = useRouter();
  const { doc } = useDocTo();

  if (con.length === 0) {
    return (
      <p className="the p-6 text-lg">
        Hộ mình chưa có hồ sơ nào. Bố mẹ vào mục Bố mẹ ơi để thêm cho con nhé.
      </p>
    );
  }

  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
      {con.map((c, i) => (
        <li key={c.id}>
          <button
            type="button"
            className="the flex w-full cursor-pointer items-center gap-4 p-5 text-left"
            style={{ background: MAU[i % MAU.length] }}
            onPointerEnter={() => doc(c.tenGoi)}
            onClick={() => {
              doc(`Chào ${c.tenGoi}. Mình bắt đầu nhé.`);
              router.push(`/be/hoc?childId=${c.id}`);
            }}
          >
            <span aria-hidden className="text-5xl">{HINH[i % HINH.length]}</span>
            <span>
              <span className="block text-2xl font-bold">{c.tenGoi}</span>
              <span className="text-sm" style={{ color: "var(--muc-nhat)" }}>Lớp {c.lop}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
