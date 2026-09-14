"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Visual } from "@/components/Visual";
import { useDocTo } from "@/components/doc-to";
import type { BaiChoTre } from "@/lib/domain/present";
import type { TrangThaiNhip } from "@/lib/domain/session";
import { BanPhimSo } from "./BanPhimSo";

/**
 * Vòng lặp học của trẻ.
 *
 * Bốn điều được cài cứng ở đây, tương ứng bốn yêu cầu bắt buộc:
 *
 *   BR-01  Đề tự đọc lên khi bài mới hiện ra, và luôn có nút nghe lại.
 *   BR-03  Máy khách không bao giờ biết đáp án; mọi lần trả lời đều hỏi máy chủ.
 *   BR-04  Sai do mắc bẫy thì chữa ngay tại chỗ, bằng câu nói vì sao sai.
 *   BR-05  Hết mười phút thì mời dừng, hết mười hai phút thì dừng hẳn.
 *
 * Và một điều KHÔNG có ở đây, cũng quan trọng ngang vậy: không có ô hiển thị số
 * câu đúng trên tổng số câu. Đếm điểm là cách nhanh nhất dạy trẻ né bài khó
 * (BR-06, NT-02).
 */
type PhanHoi = { dung: boolean; loi: string; tenBay: string | null } | null;

export function PhienHoc() {
  const params = useSearchParams();
  const childId = params.get("childId");
  const { doc, dangDoc } = useDocTo();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [bai, setBai] = useState<BaiChoTre | null>(null);
  const [viTri, setViTri] = useState(0);
  const [tongSoBai, setTongSoBai] = useState(0);
  const [nhip, setNhip] = useState<TrangThaiNhip>({ pha: "dang-hoc", conLaiMs: 0 });
  const [phanHoi, setPhanHoi] = useState<PhanHoi>(null);
  const [hetThang, setHetThang] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [ketThuc, setKetThuc] = useState<{ hatGiong: number; lyDo: string[] } | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [nhap, setNhap] = useState("");
  const batDauRef = useRef<string | null>(null);

  const docBai = useCallback((b: BaiChoTre) => doc(b.speech), [doc]);

  /*
   * Ở chế độ phát triển, React gọi hiệu ứng này HAI lần, nên máy chủ mở hai
   * phiên và phiên đầu bị bỏ không. Trông thì phí, nhưng ĐỪNG chặn bằng một cờ
   * useRef kiểu "đã mở cho bạn này rồi thì thôi" — đã thử và nó làm hỏng hẳn
   * màn hình của trẻ:
   *
   *   lần chạy 1 đặt cờ rồi gọi máy chủ → React dọn dẹp, đặt huy = true →
   *   lần chạy 2 thấy cờ nên thoát sớm → kết quả của lần 1 về thì bị huy loại
   *   bỏ → không bao giờ có bài, màn hình đứng mãi ở "Đang mở vở…".
   *
   * Bản phát hành không gọi hai lần, nên phiên thừa chỉ có ở máy người viết mã.
   * Đổi một phiên bỏ không trong lúc phát triển lấy một màn hình trắng cho trẻ
   * là món hời cho không ai cả.
   */
  useEffect(() => {
    if (!childId) return;
    let huy = false;
    (async () => {
      const r = await fetch("/api/phien", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId }),
      });
      if (!r.ok) {
        setLoi("Chưa mở được vở. Con thử lại nhé.");
        return;
      }
      const d = await r.json();
      if (huy) return;
      setSessionId(d.sessionId);
      setBai(d.bai);
      setTongSoBai(d.tongSoBai);
      setNhip(d.nhip);
      batDauRef.current = new Date().toISOString();
      docBai(d.bai);
    })();
    return () => { huy = true; };
  }, [childId, docBai]);

  const ketThucPhien = useCallback(async () => {
    if (!sessionId) return;
    const r = await fetch("/api/ket-thuc-phien", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const d = await r.json();
    setKetThuc(d.thuong);
    doc(`Xong rồi! Hôm nay con được ${d.thuong.hatGiong} hạt giống.`);
  }, [sessionId, doc]);

  async function traLoi(gia: string) {
    if (!sessionId || dangGui || gia === "") return;
    setDangGui(true);
    setPhanHoi(null);
    const r = await fetch("/api/tra-loi", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, given: Number(gia) }),
    });
    const d = await r.json();
    setDangGui(false);
    setNhap("");
    setNhip(d.nhip);
    setPhanHoi({ dung: d.correct, loi: d.phanHoi, tenBay: d.tenBay ?? null });
    doc(d.speech);
    if (d.correct) {
      setHetThang(false);
      if (d.bai) {
        setBai(d.bai);
        setViTri(d.viTri);
        // Chờ câu khen nói xong rồi mới đọc đề mới, để hai giọng không chồng nhau.
        window.setTimeout(() => docBai(d.bai), 2200);
      } else {
        setBai(null);
        void ketThucPhien();
      }
    }
  }

  async function xinGoiY() {
    if (!sessionId) return;
    const r = await fetch("/api/goi-y", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    const d = await r.json();
    setBai(d.bai);
    setHetThang(d.hetThang);
    const moi = d.bai.goiYDaMo.at(-1);
    if (moi) doc(moi.speech ?? moi.text);
  }

  // Đồng hồ nhịp phiên. Kiểm ở ranh giới giữa hai bài, không cắt ngang bài dở.
  useEffect(() => {
    if (!batDauRef.current || ketThuc) return;
    const t = window.setInterval(() => {
      const troi = Date.now() - new Date(batDauRef.current as string).getTime();
      if (troi >= 12 * 60_000) {
        setNhip({ pha: "het-gio" });
        void ketThucPhien();
      } else if (troi >= 10 * 60_000) {
        setNhip({ pha: "sap-het-gio", conLaiMs: 12 * 60_000 - troi });
      }
    }, 5000);
    return () => window.clearInterval(t);
  }, [ketThuc, ketThucPhien]);

  if (!childId) return <ThongBao>Con quay lại trang trước và chọn hình của mình nhé.</ThongBao>;
  if (loi) return <ThongBao>{loi}</ThongBao>;

  if (ketThuc) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="the p-8 text-center">
          <p aria-hidden className="m-0 text-6xl">🌱</p>
          <h1 className="mt-4 text-3xl font-bold">Xong buổi học rồi!</h1>
          <p className="mt-2 text-xl">
            Hôm nay con được <strong>{ketThuc.hatGiong} hạt giống</strong>.
          </p>
          <ul className="mx-auto mt-5 max-w-sm list-none space-y-2 p-0 text-left text-lg">
            {ketThuc.lyDo.map((l) => (
              <li key={l} className="flex gap-2"><span aria-hidden>🌼</span><span>{l}</span></li>
            ))}
          </ul>
          <p className="mt-6 text-base" style={{ color: "var(--muc-nhat)" }}>
            Hạt giống được thưởng theo công con chịu khó làm và chịu khó sửa, không theo số câu đúng.
          </p>
          <Link href="/be" className="nut nut-chinh mt-6 inline-block no-underline">Về trang đầu</Link>
        </div>
      </main>
    );
  }

  if (!bai) return <ThongBao>Đang mở vở…</ThongBao>;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="m-0 text-sm font-semibold" style={{ color: "var(--muc-nhat)" }}>
          Bài {viTri + 1} trong {tongSoBai}
        </p>
        <button type="button" className="nut text-sm" onClick={() => void ketThucPhien()}>
          Dừng ở đây
        </button>
      </div>

      {nhip.pha === "sap-het-gio" && (
        <p className="the mb-4 p-4 text-base" style={{ background: "var(--cam-nen)", borderColor: "var(--cam)" }}>
          Sắp hết giờ học hôm nay rồi. Con làm nốt bài này rồi mình nghỉ nhé.
        </p>
      )}

      <section className="the p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <button
            type="button"
            className="nut nut-tre shrink-0"
            style={{ background: "var(--tim-nen)", borderColor: "var(--tim)" }}
            aria-label="Nghe đọc đề bài"
            onClick={() => docBai(bai)}
          >
            <span aria-hidden>{dangDoc ? "🔊" : "🔈"}</span>
          </button>
          <p className="m-0 text-2xl font-semibold leading-snug">{bai.prompt}</p>
        </div>

        {/*
          KHÔNG dùng flex ở đây.

          Bọc bằng flex justify-center thì hình trở thành phần tử flex, mà phần
          tử flex co lại vừa nội dung — nên mọi hình tính theo phần trăm hay
          theo w-full đều teo lại. Để khối thường thì hình nở hết chiều ngang,
          còn những hình có cỡ cố định tự canh giữa bằng mx-auto bên trong
          Visual.tsx.
        */}
        <div className="mt-6 overflow-x-auto">
          <Visual spec={bai.visual} />
        </div>

        {bai.goiYDaMo.length > 0 && (
          <ul className="mt-6 list-none space-y-3 p-0">
            {bai.goiYDaMo.map((h) => (
              <li key={h.level} className="the p-4 text-lg"
                style={{ background: "var(--xanh-la-nen)", borderColor: "var(--xanh-la)" }}>
                <button type="button" className="float-right ml-3 text-2xl"
                  aria-label={`Nghe gợi ý ${h.level}`} onClick={() => doc(h.speech ?? h.text)}>🔈</button>
                {h.text}
              </li>
            ))}
          </ul>
        )}

        {phanHoi && (
          <p
            className="the mt-6 p-4 text-lg"
            role="status"
            style={{
              background: phanHoi.dung ? "var(--xanh-la-nen)" : "var(--do-nen)",
              borderColor: phanHoi.dung ? "var(--xanh-la)" : "var(--son)",
            }}
          >
            <span aria-hidden className="mr-2">{phanHoi.dung ? "🎉" : "💡"}</span>
            {phanHoi.loi}
          </p>
        )}

        <div className="mt-7">
          {bai.choices ? (
            <div className="flex flex-wrap justify-center gap-3">
              {bai.choices.map((c) => (
                <button key={c} type="button" className="nut nut-tre px-7" disabled={dangGui}
                  onClick={() => void traLoi(String(c))}>
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <BanPhimSo
              gia={nhap}
              donVi={bai.unit}
              dangGui={dangGui}
              onDoi={setNhap}
              onGui={() => void traLoi(nhap)}
            />
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="nut" onClick={() => void xinGoiY()} disabled={hetThang}>
            {hetThang ? "Hết gợi ý rồi" : `Con cần gợi ý (${bai.goiYDaMo.length}/${bai.tongSoBacGoiY})`}
          </button>
          {hetThang && (
            <p className="m-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
              Bài này để tối nay bố mẹ giảng cho con nhé.
            </p>
          )}
        </div>

        {bai.nhanMay && (
          <p className="mt-5 text-xs" style={{ color: "var(--muc-nhat)" }}>{bai.nhanMay}</p>
        )}
      </section>
    </main>
  );
}

function ThongBao({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="the p-6 text-xl">{children}</p>
    </main>
  );
}
