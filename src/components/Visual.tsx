"use client";

import type { VisualSpec } from "@/lib/domain/types";

/**
 * Biểu diễn trực quan.
 *
 * BR-02: trẻ phải thao tác được với biểu diễn trực quan TRƯỚC khi viết ra con
 * số, và biểu diễn phải bám đúng cách sách giáo khoa hiện hành đang dạy — khối
 * trăm chục đơn vị, tia số, sơ đồ đoạn thẳng. Nếu vẽ theo kiểu khác thì bố mẹ
 * và cô giáo lại dạy hai kiểu ngược nhau, đúng thứ BR-12 muốn tránh.
 */
export function Visual({ spec }: { spec: VisualSpec }) {
  switch (spec.kind) {
    case "khong-co":
      return null;

    case "khoi-tram-chuc-donvi": {
      const { hundreds, tens, ones } = spec;
      return (
        <figure className="m-0 flex flex-wrap items-end justify-center gap-4" aria-label="Khối trăm, chục và đơn vị">
          {Array.from({ length: hundreds }).map((_, i) => (
            <svg key={`t${i}`} width="56" height="56" viewBox="0 0 56 56" aria-hidden>
              <rect width="56" height="56" rx="4" fill="var(--tim-nen)" stroke="var(--tim)" strokeWidth="2" />
              {Array.from({ length: 9 }).map((_, k) => (
                <line key={k} x1={(k % 3 + 1) * 14} y1="0" x2={(k % 3 + 1) * 14} y2="56" stroke="var(--tim)" strokeWidth=".5" />
              ))}
            </svg>
          ))}
          {Array.from({ length: tens }).map((_, i) => (
            <svg key={`c${i}`} width="16" height="56" viewBox="0 0 16 56" aria-hidden>
              <rect width="16" height="56" rx="3" fill="var(--xanh-la-nen)" stroke="var(--xanh-la)" strokeWidth="2" />
              {Array.from({ length: 9 }).map((_, k) => (
                <line key={k} x1="0" y1={(k + 1) * 5.6} x2="16" y2={(k + 1) * 5.6} stroke="var(--xanh-la)" strokeWidth=".5" />
              ))}
            </svg>
          ))}
          <span className="flex flex-wrap gap-1" style={{ maxWidth: 180 }}>
            {Array.from({ length: ones }).map((_, i) => (
              <svg key={`d${i}`} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
                <rect width="14" height="14" rx="2" fill="var(--cam-nen)" stroke="var(--cam)" strokeWidth="2" />
              </svg>
            ))}
          </span>
          <figcaption className="sr-only">
            {hundreds} trăm, {tens} chục, {ones} đơn vị
          </figcaption>
        </figure>
      );
    }

    case "tia-so": {
      const { from, to, step, mark } = spec;
      const moc: number[] = [];
      for (let v = from; v <= to; v += step) moc.push(v);
      const w = 560;
      const x = (v: number) => 20 + ((v - from) / (to - from)) * (w - 40);
      return (
        <svg viewBox={`0 0 ${w} 70`} className="w-full" role="img" aria-label={`Tia số từ ${from} đến ${to}`}>
          <line x1="12" y1="34" x2={w - 8} y2="34" stroke="var(--muc)" strokeWidth="2" />
          <polygon points={`${w - 8},34 ${w - 20},28 ${w - 20},40`} fill="var(--muc)" />
          {moc.map((v) => (
            <g key={v}>
              <line x1={x(v)} y1="26" x2={x(v)} y2="42" stroke="var(--muc-nhat)" strokeWidth="2" />
              <text x={x(v)} y="60" textAnchor="middle" fontSize="13" fill="var(--muc-nhat)">{v}</text>
            </g>
          ))}
          {mark !== undefined && (
            <circle cx={x(mark)} cy="34" r="9" fill="var(--son)" stroke="var(--giay)" strokeWidth="2" />
          )}
        </svg>
      );
    }

    case "doan-thang": {
      const max = Math.max(...spec.segments.map((s) => s.length), 1);
      return (
        <div className="flex w-full flex-col gap-3" role="img" aria-label="Sơ đồ đoạn thẳng">
          {spec.segments.map((s, i) => (
            <div key={`${s.label}-${i}`} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-sm font-semibold">{s.label}</span>
              {/*
                Đường ray chiếm hết phần còn lại, rồi thanh mới lấy phần trăm
                CỦA ĐƯỜNG RAY.

                Trước đây thanh lấy phần trăm ngay trong hàng flex, mà bề rộng
                hàng lại do chính nội dung quyết định — phần trăm quy chiếu vào
                một số gần bằng không, và mọi thanh đều rộng 0px. Trẻ chỉ thấy
                hai cái nhãn chữ, đúng thứ mà BR-01 muốn tránh: bài hình học
                lặng lẽ biến thành bài đọc hiểu.
              */}
              <span className="min-w-0 flex-1">
                <span
                  className="block h-5 rounded-full"
                  style={{
                    width: `${(s.length / max) * 100}%`,
                    background: i === 0 ? "var(--tim)" : "var(--xanh-la)",
                  }}
                />
              </span>
            </div>
          ))}
        </div>
      );
    }

    case "cay-va-khoang": {
      const n = spec.trees;
      const w = 560;
      const buoc = (w - 80) / Math.max(n - 1, 1);
      return (
        <svg viewBox={`0 0 ${w} 120`} className="w-full" role="img" aria-label={`${n} cây trồng thành hàng`}>
          <line x1="20" y1="96" x2={w - 20} y2="96" stroke="var(--muc-nhat)" strokeWidth="2" />
          {Array.from({ length: n }).map((_, i) => {
            const cx = 40 + i * buoc;
            return (
              <g key={i}>
                <rect x={cx - 3} y="60" width="6" height="36" fill="#8a5a2b" />
                <circle cx={cx} cy="52" r="18" fill="var(--xanh-la-nen)" stroke="var(--xanh-la)" strokeWidth="2" />
              </g>
            );
          })}
          {Array.from({ length: Math.max(n - 1, 0) }).map((_, i) => {
            const a = 40 + i * buoc;
            const b = 40 + (i + 1) * buoc;
            return (
              <g key={`k${i}`}>
                <line x1={a} y1="108" x2={b} y2="108" stroke="var(--son)" strokeWidth="2" strokeDasharray="4 3" />
                <text x={(a + b) / 2} y="120" textAnchor="middle" fontSize="12" fill="var(--son)">{i + 1}</text>
              </g>
            );
          })}
        </svg>
      );
    }

    case "nhom-hinh": {
      const { rows, perRow, shape } = spec;
      return (
        <div className="flex flex-col items-center gap-2" role="img" aria-label={`${rows} hàng, mỗi hàng ${perRow} hình`}>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="flex gap-2">
              {Array.from({ length: perRow }).map((_, c) => (
                <svg key={c} width="34" height="34" viewBox="0 0 34 34" aria-hidden>
                  {shape === "tron" && <circle cx="17" cy="17" r="14" fill="var(--tim-nen)" stroke="var(--tim)" strokeWidth="2" />}
                  {shape === "vuong" && <rect x="3" y="3" width="28" height="28" rx="3" fill="var(--xanh-la-nen)" stroke="var(--xanh-la)" strokeWidth="2" />}
                  {shape === "tam-giac" && <polygon points="17,3 31,31 3,31" fill="var(--cam-nen)" stroke="var(--cam)" strokeWidth="2" />}
                </svg>
              ))}
            </div>
          ))}
        </div>
      );
    }

    case "dong-ho": {
      const gioGoc = ((spec.hour % 12) + spec.minute / 60) * 30 - 90;
      const phutGoc = spec.minute * 6 - 90;
      const kim = (goc: number, dai: number) => ({
        x2: 60 + dai * Math.cos((goc * Math.PI) / 180),
        y2: 60 + dai * Math.sin((goc * Math.PI) / 180),
      });
      const kg = kim(gioGoc, 28);
      const kp = kim(phutGoc, 42);
      return (
        <svg viewBox="0 0 120 120" width="180" height="180" className="mx-auto block" role="img" aria-label="Đồng hồ kim">
          <circle cx="60" cy="60" r="54" fill="var(--giay)" stroke="var(--muc)" strokeWidth="3" />
          {Array.from({ length: 12 }).map((_, i) => {
            const g = (i * 30 - 90) * (Math.PI / 180);
            return (
              <text key={i} x={60 + 42 * Math.cos(g)} y={60 + 42 * Math.sin(g) + 5}
                textAnchor="middle" fontSize="12" fill="var(--muc-nhat)">{i === 0 ? 12 : i}</text>
            );
          })}
          <line x1="60" y1="60" x2={kg.x2} y2={kg.y2} stroke="var(--muc)" strokeWidth="6" strokeLinecap="round" />
          <line x1="60" y1="60" x2={kp.x2} y2={kp.y2} stroke="var(--son)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="60" cy="60" r="4" fill="var(--muc)" />
        </svg>
      );
    }

    case "thuoc-do": {
      const w = 560;
      const met = Math.floor(spec.totalCm / 100);
      const du = spec.totalCm - met * 100;
      return (
        <svg viewBox={`0 0 ${w} 90`} className="w-full" role="img" aria-label="Thước đo chia theo mét">
          {Array.from({ length: met }).map((_, i) => (
            <rect key={i} x={20 + i * ((w - 60) / (met + (du > 0 ? 1 : 0)))} y="28"
              width={(w - 60) / (met + (du > 0 ? 1 : 0)) - 6} height="26" rx="4"
              fill="var(--tim-nen)" stroke="var(--tim)" strokeWidth="2" />
          ))}
          {du > 0 && (
            <rect x={20 + met * ((w - 60) / (met + 1))} y="28"
              width={((w - 60) / (met + 1)) * (du / 100) - 6} height="26" rx="4"
              fill="var(--cam-nen)" stroke="var(--cam)" strokeWidth="2" />
          )}
          <text x="20" y="74" fontSize="13" fill="var(--muc-nhat)">
            mỗi ô tím = 1 mét = 100 xăng-ti-mét{du > 0 ? "; ô cam là phần lẻ còn lại" : ""}
          </text>
        </svg>
      );
    }
  }
}
