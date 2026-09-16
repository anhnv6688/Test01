"use client";

import { useCallback, useEffect, useState } from "react";
import { chamBaiLam } from "@/lib/domain/cham-bai";
import type { DangBaiLam } from "@/lib/domain/cham-bai/dang-bai-lam";
import { MOI_MA_DANG } from "@/lib/domain/cham-bai/dang-bai-lam";
import {
  baiTrong, chuSoTreTuChuoi, chuoiTuChuSoTre, gopNhanMotAnh, MO_TA_DANG, type TienDo,
} from "@/lib/do-anh/gan-nhan";
import {
  MO_TA_DIEU_KIEN, MOI_DIEU_KIEN,
  type DieuKienChup, type NhanBoAnh, type NhanMotAnh,
} from "@/lib/do-anh/nhan";

interface DuLieu {
  thuMuc: string;
  tep: string[];
  nhan: NhanBoAnh;
  tienDo: TienDo;
  sanSang: { duoc: boolean; viSao: string | null };
}

function nhanMacDinh(tep: string): NhanMotAnh {
  return {
    tep,
    loaiViec: "cham-bai-lam",
    dieuKienChup: "tot",
    nguoiDocDuoc: true,
    lop: 2,
    cacBai: [],
  };
}

export function TrangGanNhan({ thuMucMacDinh }: { thuMucMacDinh: string }) {
  const [du, datDu] = useState<DuLieu | null>(null);
  const [loi, datLoi] = useState<string | null>(null);
  const [chiSo, datChiSo] = useState(0);
  const [xoay, datXoay] = useState(0);
  const [dangLuu, datDangLuu] = useState(false);
  /*
   * Bản đang sửa dở, và chỉ bản đang sửa dở.
   *
   * Không giữ một bản sao đầy đủ của nhãn hiện tại trong state rồi đồng bộ lại
   * mỗi lần đổi ảnh: đồng bộ kiểu đó phải làm trong một useEffect, và một
   * useEffect đặt state là đúng cái đã treo màn hình của trẻ ở bản phát triển —
   * React gọi hiệu ứng hai lần, lần hai chạy trên state của lần một.
   *
   * Ở đây nhãn hiện tại được TÍNH RA từ tệp đang chọn: chưa sửa gì thì lấy
   * thẳng từ bộ nhãn đã ghi, sửa rồi thì lấy bản nháp. Đổi ảnh chỉ việc xóa bản
   * nháp, trong chính chỗ xử lý cú bấm, không cần hiệu ứng nào.
   */
  const [nhap, datNhap] = useState<NhanMotAnh | null>(null);

  useEffect(() => {
    let huy = false;
    fetch("/api/gan-nhan")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`máy chủ trả ${r.status}`))))
      .then((d: DuLieu) => { if (!huy) datDu(d); })
      .catch((e: Error) => { if (!huy) datLoi(e.message); });
    return () => { huy = true; };
  }, []);

  const tepHienTai = du?.tep[chiSo] ?? null;
  const dang: NhanMotAnh | null =
    nhap ?? (tepHienTai
      ? du?.nhan.anh.find((a) => a.tep === tepHienTai) ?? nhanMacDinh(tepHienTai)
      : null);
  const chuaLuu = nhap !== null;

  const luu = useCallback(async (bo: NhanBoAnh) => {
    datDangLuu(true);
    try {
      const r = await fetch("/api/gan-nhan", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bo),
      });
      if (!r.ok) throw new Error(`máy chủ trả ${r.status}`);
      const { tienDo, sanSang } = await r.json();
      datDu((cu) => (cu ? { ...cu, nhan: bo, tienDo, sanSang } : cu));
      datNhap(null);
    } catch (e) {
      datLoi((e as Error).message);
    } finally {
      datDangLuu(false);
    }
  }, []);

  /*
   * Lưu trước rồi mới chuyển ảnh.
   *
   * Gắn nhãn một trăm ảnh mà phải tự bấm Lưu sau mỗi tấm thì sẽ có tấm quên
   * bấm, và người ta chỉ phát hiện ra sau khi đã gõ xong cả buổi. Mất công gõ
   * lại là chuyện nhỏ; nguy hiểm hơn là bộ đo chạy trên một bộ nhãn khuyết mà
   * con số vẫn in ra bình thường.
   */
  const chuyen = useCallback(
    async (toi: number) => {
      if (!du) return;
      if (nhap) await luu(gopNhanMotAnh(du.nhan, nhap));
      datNhap(null);
      datXoay(0);
      datChiSo(Math.max(0, Math.min(du.tep.length - 1, toi)));
    },
    [du, nhap, luu],
  );

  function sua(f: (a: NhanMotAnh) => NhanMotAnh) {
    if (dang) datNhap(f(dang));
  }

  if (loi) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-xl font-bold">Không mở được trang gắn nhãn</h1>
        <p className="the mt-4 p-5">{loi}</p>
      </main>
    );
  }
  if (!du) {
    return <main className="mx-auto w-full max-w-2xl px-4 py-10"><p>Đang đọc thư mục ảnh…</p></main>;
  }

  if (du.tep.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-xl font-bold">Chưa có ảnh nào để gắn nhãn</h1>
        <p className="the mt-4 p-5 text-sm">
          Đặt ảnh vào thư mục <code>{du.thuMuc}</code> rồi tải lại trang. Thư mục mặc định là{" "}
          <code>{thuMucMacDinh}/</code> ngay cạnh mã nguồn; đổi bằng biến{" "}
          <code>OLY_THU_MUC_ANH</code>.
        </p>
        <p className="the mt-4 p-5 text-sm" style={{ background: "var(--do-nen)", borderColor: "var(--son)" }}>
          <strong>Che trước khi bỏ vào thư mục.</strong> Phần ghi tên, lớp, trường và ô nhận xét
          của cô giáo phải được che ngay trên ảnh (BR-32, RR-13). Trang này không che giúp — nó
          chỉ hiện đúng thứ có trên đĩa.
        </p>
      </main>
    );
  }

  const daNhan = new Set(du.nhan.anh.map((a) => a.tep));
  const cacBai = dang?.cacBai ?? [];

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <header className="mb-4">
        <p className="m-0 text-sm font-semibold tracking-wide" style={{ color: "var(--son)" }}>
          Ô LY · CÔNG CỤ CỤC BỘ
        </p>
        <h1 className="mt-1 mb-1 text-2xl font-bold">Gắn nhãn bộ ảnh đo</h1>
        <p className="m-0 text-sm" style={{ color: "var(--muc-nhat)" }}>
          {du.thuMuc} · đã gắn {du.tienDo.daGanNhan}/{du.tienDo.tongAnh} ảnh
          {du.tienDo.nhanMoCoi.length > 0 && (
            <> · <span style={{ color: "var(--son)" }}>{du.tienDo.nhanMoCoi.length} nhãn không còn ảnh</span></>
          )}
        </p>
      </header>

      <section className="the mb-4 p-4 text-sm">
        <label className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">Người gắn nhãn</span>
          <input
            value={du.nhan.nguoiGanNhan}
            onChange={(e) => {
              const bo = { ...du.nhan, nguoiGanNhan: e.target.value };
              datDu({ ...du, nhan: bo });
            }}
            onBlur={() => luu(dang ? gopNhanMotAnh(du.nhan, dang) : du.nhan)}
            placeholder="tên hoặc bí danh"
            className="rounded-xl px-3 py-1.5"
            style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
          />
          <span style={{ color: "var(--muc-nhat)" }}>
            Ghi vào tệp nhãn để sau này biết ai đã quyết những nhãn khó.
          </span>
        </label>
        {!du.sanSang.duoc && (
          <p className="mt-3 mb-0" style={{ color: "var(--cam)" }}>
            Bộ đo chưa chạy được: {du.sanSang.viSao}
          </p>
        )}
      </section>

      <nav className="the mb-4 flex flex-wrap gap-1.5 p-3">
        {du.tep.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => chuyen(i)}
            title={t}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{
              border: `1px solid ${i === chiSo ? "var(--son)" : "var(--vien)"}`,
              background: daNhan.has(t) ? "var(--xanh-la-nen, transparent)" : "transparent",
              color: daNhan.has(t) ? "var(--xanh-la)" : "var(--muc-nhat)",
            }}
          >
            {daNhan.has(t) ? "✓ " : ""}{i + 1}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button type="button" className="nut text-sm" onClick={() => chuyen(chiSo - 1)} disabled={chiSo === 0}>
              ← Tấm trước
            </button>
            <button
              type="button"
              className="nut text-sm"
              onClick={() => chuyen(chiSo + 1)}
              disabled={chiSo >= du.tep.length - 1}
            >
              Tấm sau →
            </button>
            <button type="button" className="nut text-sm" onClick={() => datXoay((x) => (x + 90) % 360)}>
              ↻ Xoay xem
            </button>
            <span className="text-sm" style={{ color: "var(--muc-nhat)" }}>
              {chiSo + 1}/{du.tep.length} · {tepHienTai}
            </span>
          </div>

          {/*
            Xoay chỉ đổi CÁCH XEM, không sửa tệp ảnh.

            Ảnh gửi cho mô hình phải y hệt ảnh phụ huynh chụp, kể cả khi nó nằm
            ngang — đó chính là thứ bộ đo cần đo. Xoay tệp gốc để dễ gõ nhãn là
            tự tay xóa mất điều kiện chụp đang muốn đo.
          */}
          <div
            className="the overflow-auto p-2"
            style={{ maxHeight: "72vh", background: "var(--giay)" }}
          >
            {tepHienTai && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/gan-nhan/anh?tep=${encodeURIComponent(tepHienTai)}`}
                alt={`Trang vở ${tepHienTai}`}
                className="block w-full"
                style={{ transform: `rotate(${xoay}deg)`, transformOrigin: "center" }}
              />
            )}
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--muc-nhat)" }}>
            Xoay ở đây chỉ để dễ đọc. Tệp ảnh không bị sửa, và bộ đo vẫn gửi đi đúng tấm ảnh
            gốc — ảnh nằm ngang là một điều kiện chụp cần đo, không phải lỗi cần dọn.
          </p>
        </section>

        <section>
          {dang && (
            <>
              <div className="the p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="font-semibold">Điều kiện chụp</span>
                    <select
                      value={dang.dieuKienChup}
                      onChange={(e) => sua((a) => ({ ...a, dieuKienChup: e.target.value as DieuKienChup }))}
                      className="mt-1 block w-full rounded-xl px-3 py-2"
                      style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
                    >
                      {MOI_DIEU_KIEN.map((d) => (
                        <option key={d} value={d}>{d} — {MO_TA_DIEU_KIEN[d]}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="font-semibold">Loại việc</span>
                    <select
                      value={dang.loaiViec}
                      onChange={(e) =>
                        sua((a) => ({ ...a, loaiViec: e.target.value as NhanMotAnh["loaiViec"] }))
                      }
                      className="mt-1 block w-full rounded-xl px-3 py-2"
                      style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
                    >
                      <option value="cham-bai-lam">cham-bai-lam — chấm bài trẻ đã làm</option>
                      <option value="doc-de-bai">doc-de-bai — chỉ đọc đề, chưa làm</option>
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="font-semibold">Lớp</span>
                    <select
                      value={dang.lop ?? 2}
                      onChange={(e) => sua((a) => ({ ...a, lop: Number(e.target.value) as 1 | 2 }))}
                      className="mt-1 block w-full rounded-xl px-3 py-2"
                      style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
                    >
                      <option value={1}>Lớp 1</option>
                      <option value={2}>Lớp 2</option>
                    </select>
                  </label>

                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={dang.nguoiDocDuoc}
                      onChange={(e) => sua((a) => ({ ...a, nguoiDocDuoc: e.target.checked }))}
                      className="mt-1"
                    />
                    <span>
                      <span className="font-semibold">Người đọc được ảnh này</span>
                      <span className="block text-xs" style={{ color: "var(--muc-nhat)" }}>
                        Bỏ dấu nếu chính anh cũng không đọc nổi. Khi đó Ô Ly BẮT BUỘC phải từ
                        chối, và bộ đo sẽ tính là lỗi nặng nếu máy vẫn đọc bừa.
                      </span>
                    </span>
                  </label>
                </div>

                {xoay % 180 === 90 && dang.dieuKienChup !== "xoay-90" && (
                  <p className="mt-3 mb-0 text-sm" style={{ color: "var(--cam)" }}>
                    Anh vừa xoay ảnh này 90 độ để đọc. Nếu nó thật sự nằm ngang thì chọn điều
                    kiện <code>xoay-90</code>, để báo cáo tách được lỗi do xoay ra khỏi lỗi khác.
                  </p>
                )}

                <label className="mt-4 block text-sm">
                  <span className="font-semibold">Ghi chú</span>
                  <input
                    value={dang.ghiChu ?? ""}
                    onChange={(e) => sua((a) => ({ ...a, ghiChu: e.target.value || undefined }))}
                    placeholder="chỗ khó quyết, hoặc vì sao chọn dạng này"
                    className="mt-1 block w-full rounded-xl px-3 py-2"
                    style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
                  />
                </label>
              </div>

              {!dang.nguoiDocDuoc ? (
                <p className="the mt-4 p-5 text-sm">
                  Ảnh này người không đọc được, nên không cần gõ nội dung. Nó nằm trong bộ đo để
                  kiểm tra Ô Ly có biết từ chối tử tế hay không.
                </p>
              ) : dang.loaiViec === "doc-de-bai" ? (
                <label className="the mt-4 block p-5 text-sm">
                  <span className="font-semibold">Nguyên văn đề bài</span>
                  <textarea
                    value={dang.deBai ?? ""}
                    onChange={(e) => sua((a) => ({ ...a, deBai: e.target.value }))}
                    rows={6}
                    className="mt-1 block w-full rounded-xl px-3 py-2"
                    style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
                  />
                  <span className="mt-1 block text-xs" style={{ color: "var(--muc-nhat)" }}>
                    Gõ đúng các CON SỐ. Bộ đo so số trước, so chữ sau: đọc &quot;cái kẹo&quot;
                    thành &quot;chiếc kẹo&quot; thì lời giảng vẫn đúng, đọc 15 thành 16 thì sai
                    từ dòng đầu.
                  </span>
                </label>
              ) : (
                <>
                  <div className="mt-4 space-y-3">
                    {cacBai.map((b, i) => (
                      <TheBai
                        key={i}
                        b={b}
                        i={i}
                        doi={(moi) =>
                          sua((a) => ({ ...a, cacBai: (a.cacBai ?? []).map((x, j) => (j === i ? moi : x)) }))
                        }
                        xoa={() =>
                          sua((a) => ({ ...a, cacBai: (a.cacBai ?? []).filter((_, j) => j !== i) }))
                        }
                      />
                    ))}
                  </div>

                  <div className="the mt-4 p-4">
                    <p className="m-0 mb-2 text-sm font-semibold">Thêm bài thứ {cacBai.length + 1}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MOI_MA_DANG.map((d) => (
                        <button
                          key={d}
                          type="button"
                          title={MO_TA_DANG[d].nhanBiet}
                          onClick={() => sua((a) => ({ ...a, cacBai: [...(a.cacBai ?? []), baiTrong(d)] }))}
                          className="nut text-xs"
                        >
                          {MO_TA_DANG[d].ten}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="nut nut-chinh"
                  disabled={dangLuu}
                  onClick={() => luu(gopNhanMotAnh(du.nhan, dang))}
                >
                  {dangLuu ? "Đang ghi…" : "Lưu nhãn tấm này"}
                </button>
                <button
                  type="button"
                  className="nut"
                  disabled={chiSo >= du.tep.length - 1}
                  onClick={() => chuyen(chiSo + 1)}
                >
                  Lưu rồi sang tấm sau →
                </button>
                <span className="text-sm" style={{ color: chuaLuu ? "var(--cam)" : "var(--muc-nhat)" }}>
                  {chuaLuu ? "có thay đổi chưa ghi" : "đã ghi vào nhan.json"}
                </span>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="the mt-8 p-5">
        <h2 className="mt-0 text-base font-bold">Độ phủ theo dạng bài</h2>
        <p className="mt-1 text-sm" style={{ color: "var(--muc-nhat)" }}>
          Đây mới là thứ quyết định bộ đo nói được gì. Một trăm ảnh toàn cột dọc cho một tỷ lệ
          rất đẹp và không trả lời được câu hỏi nào.
        </p>
        <ul className="m-0 mt-3 grid list-none gap-2 p-0 text-sm sm:grid-cols-3">
          {MOI_MA_DANG.map((d) => {
            const n = du.tienDo.theoDang[d] ?? 0;
            return (
              <li key={d} className="flex items-baseline justify-between gap-2">
                <span style={{ color: n === 0 ? "var(--son)" : undefined }}>{MO_TA_DANG[d].ten}</span>
                <strong style={{ color: n === 0 ? "var(--son)" : "var(--xanh-la)" }}>{n}</strong>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

/**
 * Một bài trên trang, kèm kết luận của bộ chấm.
 *
 * Hiện kết luận là một quyết định có hai mặt, nên nói rõ cả hai. Mặt xấu: người
 * gắn nhãn nhìn thấy chữ "sai" rồi sửa nhãn cho thành đúng, và bộ nhãn biến
 * thành một bộ toàn bài đúng — lúc ấy chỉ số nguy hiểm nhất của cả bộ đo, tỷ lệ
 * BÁO ĐỘNG GIẢ (con làm đúng mà máy bảo sai), không còn đo được nữa.
 *
 * Mặt tốt, và là lý do vẫn hiện: trên chính những trang vở này CÔ GIÁO ĐÃ CHẤM
 * bằng mực đỏ. Đó là một nguồn sự thật thứ hai, độc lập với cả nhãn lẫn Ô Ly.
 * Kết luận ở đây lệch với dấu của cô là một tín hiệu đáng tiền: hoặc người gắn
 * nhãn gõ nhầm một chữ số, hoặc bộ chấm của Ô Ly có lỗi ở dạng bài đó. Cả hai
 * đều cần biết, và không có cách nào khác để phát hiện.
 *
 * Vì vậy: hiện, nhưng nói thẳng ngay cạnh rằng nhãn ghi thứ TRẺ VIẾT.
 */
function TheBai({
  b, i, doi, xoa,
}: { b: DangBaiLam; i: number; doi: (b: DangBaiLam) => void; xoa: () => void }) {
  const kq = chamBaiLam(b);
  const mau = kq.dung === true ? "var(--xanh-la)" : kq.dung === false ? "var(--son)" : "var(--muc-nhat)";
  return (
    <article className="the p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="m-0 text-sm font-bold">
          Bài {i + 1} · {MO_TA_DANG[b.dang].ten}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: mau }}>
            Ô Ly chấm nhãn này: {kq.dung === true ? "ĐÚNG" : kq.dung === false ? "SAI" : "chưa kết luận"}
          </span>
          <button type="button" className="nut text-xs" onClick={xoa}>Bỏ bài này</button>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SuaBai b={b} doi={doi} />
      </div>
      <p className="mt-3 mb-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
        Nhãn ghi thứ <strong>trẻ đã viết</strong>, không phải đáp án đúng. Kết luận ở trên để
        đối chiếu với dấu mực đỏ của cô giáo: lệch nhau thì hoặc gõ nhầm, hoặc bộ chấm có lỗi.
      </p>
    </article>
  );
}

function OChu({
  nhan, gia, doi, goiY,
}: { nhan: string; gia: string | null; doi: (v: string | null) => void; goiY?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{nhan}</span>
      <input
        value={gia ?? ""}
        onChange={(e) => doi(e.target.value === "" ? null : e.target.value)}
        placeholder={goiY}
        className="mt-1 block w-full rounded-xl px-3 py-2"
        style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
      />
    </label>
  );
}

function OSo({
  nhan, gia, doi, goiY,
}: { nhan: string; gia: number | null; doi: (v: number | null) => void; goiY?: string }) {
  return (
    <label className="block text-sm">
      <span className="font-semibold">{nhan}</span>
      <input
        inputMode="numeric"
        value={gia === null ? "" : String(gia)}
        onChange={(e) => {
          const v = e.target.value.trim();
          if (v === "") return doi(null);
          const n = Number(v);
          doi(Number.isFinite(n) ? n : null);
        }}
        placeholder={goiY}
        className="mt-1 block w-full rounded-xl px-3 py-2"
        style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
      />
    </label>
  );
}

const DON_VI = ["cm", "dm", "m", "kg", "g", "l"] as const;

function SuaBai({ b, doi }: { b: DangBaiLam; doi: (b: DangBaiLam) => void }) {
  switch (b.dang) {
    case "cot-doc":
      return (
        <>
          <OSo nhan="Số trên" gia={b.soA} doi={(v) => doi({ ...b, soA: v ?? 0 })} />
          <OSo nhan="Số dưới" gia={b.soB} doi={(v) => doi({ ...b, soB: v ?? 0 })} />
          <label className="block text-sm">
            <span className="font-semibold">Phép</span>
            <select
              value={b.phep}
              onChange={(e) => doi({ ...b, phep: e.target.value as "+" | "-" })}
              className="mt-1 block w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            >
              <option value="+">cộng</option>
              <option value="-">trừ</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Dòng kết quả trẻ viết</span>
            <input
              value={chuoiTuChuSoTre(b.chuSoTre)}
              onChange={(e) => doi({ ...b, chuSoTre: chuSoTreTuChuoi(e.target.value) })}
              placeholder="ví dụ 75, hoặc 7. nếu bỏ trống hàng đơn vị"
              className="mt-1 block w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            />
            <span className="mt-1 block text-xs" style={{ color: "var(--muc-nhat)" }}>
              Gõ từ TRÁI sang PHẢI như trên giấy. Dấu chấm là ô trẻ để trống — khác với viết số 0.
            </span>
          </label>
        </>
      );
    case "hang-ngang":
      return (
        <>
          <OChu nhan="Vế trái, chép đúng như trẻ viết" gia={b.veTrai} doi={(v) => doi({ ...b, veTrai: v ?? "" })} goiY="12 - 4 + 2" />
          <OSo nhan="Kết quả trẻ viết" gia={b.ketQuaTre} doi={(v) => doi({ ...b, ketQuaTre: v })} />
        </>
      );
    case "dien-so":
      return (
        <>
          <OChu
            nhan="Biểu thức, dùng ? cho ô trống"
            gia={b.bieuThuc}
            doi={(v) => doi({ ...b, bieuThuc: v ?? "" })}
            goiY="5 + ? = 8"
          />
          <OSo nhan="Số trẻ điền" gia={b.soTre} doi={(v) => doi({ ...b, soTre: v })} />
        </>
      );
    case "so-sanh":
      return (
        <>
          <OChu nhan="Vế trái" gia={b.veTrai} doi={(v) => doi({ ...b, veTrai: v ?? "" })} goiY="45" />
          <OChu nhan="Vế phải" gia={b.vePhai} doi={(v) => doi({ ...b, vePhai: v ?? "" })} goiY="54" />
          <label className="block text-sm">
            <span className="font-semibold">Dấu trẻ điền</span>
            <select
              value={b.dauTre ?? ""}
              onChange={(e) => doi({ ...b, dauTre: (e.target.value || null) as ">" | "<" | "=" | null })}
              className="mt-1 block w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            >
              <option value="">(bỏ trống)</option>
              <option value=">">&gt;</option>
              <option value="<">&lt;</option>
              <option value="=">=</option>
            </select>
          </label>
        </>
      );
    case "trac-nghiem":
      return (
        <>
          <div className="sm:col-span-2 space-y-2">
            {b.luaChon.map((lc, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <span className="w-5 font-semibold">{"ABCD"[i] ?? i + 1}</span>
                <input
                  value={lc}
                  onChange={(e) =>
                    doi({ ...b, luaChon: b.luaChon.map((x, j) => (j === i ? e.target.value : x)) })
                  }
                  className="flex-1 rounded-xl px-3 py-2"
                  style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
                />
              </label>
            ))}
            <button
              type="button"
              className="nut text-xs"
              onClick={() => doi({ ...b, luaChon: [...b.luaChon, ""] })}
            >
              Thêm lựa chọn
            </button>
          </div>
          <label className="block text-sm">
            <span className="font-semibold">Trẻ khoanh</span>
            <select
              value={b.chonTre ?? ""}
              onChange={(e) => doi({ ...b, chonTre: e.target.value === "" ? null : Number(e.target.value) })}
              className="mt-1 block w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            >
              <option value="">(chưa khoanh)</option>
              {b.luaChon.map((_, i) => <option key={i} value={i}>{"ABCD"[i] ?? i + 1}</option>)}
              <option value={-1}>khoanh nhiều hơn một</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Đáp án đúng, nếu đề cho biết</span>
            <select
              value={b.dapAnDung ?? ""}
              onChange={(e) => doi({ ...b, dapAnDung: e.target.value === "" ? null : Number(e.target.value) })}
              className="mt-1 block w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            >
              <option value="">(không suy ra được từ ảnh)</option>
              {b.luaChon.map((_, i) => <option key={i} value={i}>{"ABCD"[i] ?? i + 1}</option>)}
            </select>
          </label>
        </>
      );
    case "bai-giai-loi-van":
      return (
        <>
          <div className="sm:col-span-2">
            <OChu nhan="Đề bài, nếu đọc được trên trang" gia={b.deBai} doi={(v) => doi({ ...b, deBai: v })} />
          </div>
          <div className="sm:col-span-2">
            <OChu
              nhan="Câu lời giải trẻ viết"
              gia={b.cauLoiGiai}
              doi={(v) => doi({ ...b, cauLoiGiai: v })}
              goiY="Số quả cam còn lại là:"
            />
          </div>
          <OChu nhan="Phép tính trẻ viết" gia={b.phepTinh} doi={(v) => doi({ ...b, phepTinh: v })} goiY="32 - 8 = 24" />
          <OChu nhan="Đáp số trẻ viết" gia={b.dapSo} doi={(v) => doi({ ...b, dapSo: v })} goiY="24 quả" />
        </>
      );
    case "doi-don-vi":
      return (
        <>
          <OSo nhan="Số nguồn" gia={b.soNguon} doi={(v) => doi({ ...b, soNguon: v ?? 0 })} />
          <OSo nhan="Kết quả trẻ viết" gia={b.ketQuaTre} doi={(v) => doi({ ...b, ketQuaTre: v })} />
          <label className="block text-sm">
            <span className="font-semibold">Đơn vị nguồn</span>
            <select
              value={b.donViNguon}
              onChange={(e) => doi({ ...b, donViNguon: e.target.value as typeof b.donViNguon })}
              className="mt-1 block w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            >
              {DON_VI.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-semibold">Đơn vị đích</span>
            <select
              value={b.donViDich}
              onChange={(e) => doi({ ...b, donViDich: e.target.value as typeof b.donViDich })}
              className="mt-1 block w-full rounded-xl px-3 py-2"
              style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
            >
              {DON_VI.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </>
      );
    case "dem-hinh":
      return (
        <>
          <OSo nhan="Số hình thật sự có trong đề" gia={b.soThat} doi={(v) => doi({ ...b, soThat: v })} />
          <OSo nhan="Số trẻ viết" gia={b.ketQuaTre} doi={(v) => doi({ ...b, ketQuaTre: v })} />
        </>
      );
    case "xem-gio":
      return (
        <>
          <OSo nhan="Giờ trên hình" gia={b.gioThat} doi={(v) => doi({ ...b, gioThat: v })} />
          <OSo nhan="Phút trên hình" gia={b.phutThat} doi={(v) => doi({ ...b, phutThat: v })} />
          <OSo nhan="Giờ trẻ viết" gia={b.gioTre} doi={(v) => doi({ ...b, gioTre: v })} />
          <OSo nhan="Phút trẻ viết" gia={b.phutTre} doi={(v) => doi({ ...b, phutTre: v })} />
        </>
      );
    case "noi-ghep":
      return (
        <div className="sm:col-span-2 space-y-3">
          <p className="m-0 text-sm font-semibold">Các cặp trẻ đã nối</p>
          {b.capTre.map((c, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <input
                value={c.trai}
                onChange={(e) =>
                  doi({ ...b, capTre: b.capTre.map((x, j) => (j === i ? { ...x, trai: e.target.value } : x)) })
                }
                placeholder="bên trái"
                className="flex-1 rounded-xl px-3 py-2 text-sm"
                style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
              />
              <span aria-hidden>↔</span>
              <input
                value={c.phai}
                onChange={(e) =>
                  doi({ ...b, capTre: b.capTre.map((x, j) => (j === i ? { ...x, phai: e.target.value } : x)) })
                }
                placeholder="bên phải"
                className="flex-1 rounded-xl px-3 py-2 text-sm"
                style={{ background: "var(--giay)", border: "1px solid var(--vien)", color: "var(--muc)" }}
              />
              <button
                type="button"
                className="nut text-xs"
                onClick={() => doi({ ...b, capTre: b.capTre.filter((_, j) => j !== i) })}
              >
                bỏ
              </button>
            </div>
          ))}
          <button
            type="button"
            className="nut text-xs"
            onClick={() => doi({ ...b, capTre: [...b.capTre, { trai: "", phai: "" }] })}
          >
            Thêm một cặp
          </button>
          <p className="m-0 text-xs" style={{ color: "var(--muc-nhat)" }}>
            Đáp án đúng để trống thì bộ chấm nói thẳng là chưa kết luận, đó là hành vi đúng khi
            không suy ra được từ ảnh.
          </p>
        </div>
      );
    case "chua-nhan-dang":
      return (
        <>
          <div className="sm:col-span-2">
            <OChu nhan="Đọc được gì" gia={b.docDuoc} doi={(v) => doi({ ...b, docDuoc: v ?? "" })} />
          </div>
          <div className="sm:col-span-2">
            <OChu nhan="Ghi chú" gia={b.ghiChu} doi={(v) => doi({ ...b, ghiChu: v })} />
          </div>
        </>
      );
    default: {
      const _het: never = b;
      return <p>Chưa có ô nhập cho dạng {String(_het)}</p>;
    }
  }
}
