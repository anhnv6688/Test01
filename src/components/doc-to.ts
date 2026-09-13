"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Đọc đề thành tiếng.
 *
 * BR-01 là yêu cầu bắt buộc đầu tiên của cả sản phẩm: trẻ phải làm được bài mà
 * không bị chặn bởi khả năng đọc của mình. Đề lớp 1–2 gần như toàn văn xuôi, có
 * câu dài hai dòng — rào cản đầu tiên là đọc, không phải tính.
 *
 * Việc đọc chạy ngay trên thiết bị bằng bộ đọc sẵn có của trình duyệt. Chọn như
 * vậy có hai cái lợi cùng lúc: không có dữ liệu nào của trẻ rời khỏi máy để đi
 * tổng hợp giọng, và không phát sinh đồng chi phí biến đổi nào (BR-19).
 */
export function useDocTo() {
  const [coBoDoc, setCoBoDoc] = useState(false);
  const [dangDoc, setDangDoc] = useState(false);
  const giong = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const nap = () => {
      const ds = window.speechSynthesis.getVoices();
      giong.current =
        ds.find((v) => v.lang?.toLowerCase().startsWith("vi")) ??
        ds.find((v) => v.lang?.toLowerCase().includes("vn")) ??
        null;
      setCoBoDoc(ds.length > 0);
    };
    nap();
    window.speechSynthesis.addEventListener("voiceschanged", nap);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", nap);
      window.speechSynthesis.cancel();
    };
  }, []);

  const doc = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    if (giong.current) u.voice = giong.current;
    // Chậm hơn giọng mặc định: trẻ 6–8 tuổi cần thời gian để bắt kịp câu dài.
    u.rate = 0.88;
    u.pitch = 1.05;
    u.onstart = () => setDangDoc(true);
    u.onend = () => setDangDoc(false);
    u.onerror = () => setDangDoc(false);
    window.speechSynthesis.speak(u);
  }, []);

  const dung = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setDangDoc(false);
    }
  }, []);

  return { doc, dung, dangDoc, coBoDoc };
}
