import { getTrap } from "./traps";
import type { Item, Trap } from "./types";

/** Kết quả chấm một lần trả lời của trẻ. */
export interface KetQuaCham {
  correct: boolean;
  /** Bẫy nhận diện được, nếu có (BR-04). */
  trap: Trap | null;
  /**
   * Câu nói lại cho trẻ. Khi sai, câu này nói VÌ SAO sai chứ không nói đáp án
   * (BR-03). Khi đúng, câu này nói rõ đúng ở chỗ nào chứ không chỉ khen suông
   * (tinh thần BR-29 mang sang bề mặt trẻ).
   */
  phanHoi: string;
  speech: string;
}

/**
 * Chấm và nhận diện bẫy.
 *
 * Nhận diện là tra bảng: mỗi khuôn dạng đã khai sẵn con số mà trẻ viết ra khi
 * mắc từng bẫy. Nhờ vậy phần chẩn đoán không phụ thuộc vào suy đoán của máy và
 * kiểm thử được bằng ví dụ cụ thể.
 */
export function cham(item: Item, given: number): KetQuaCham {
  if (given === item.answer) {
    return {
      correct: true,
      trap: null,
      phanHoi: dungOChoNao(item),
      speech: dungOChoNao(item),
    };
  }
  const hit = item.traps.find((t) => t.wrongAnswer === given);
  if (hit) {
    const trap = getTrap(hit.id);
    return { correct: false, trap, phanHoi: trap.childFix, speech: trap.childFix };
  }
  return {
    correct: false,
    trap: null,
    phanHoi: "Chưa đúng rồi. Con thử đọc lại đề một lần nữa, rồi làm lại nhé.",
    speech: "Chưa đúng rồi. Con thử đọc lại đề một lần nữa nhé.",
  };
}

/** Nói rõ trẻ đúng ở chỗ nào, thay vì chỉ báo đúng. */
function dungOChoNao(item: Item): string {
  switch (item.visual.kind) {
    case "khoi-tram-chuc-donvi":
      return "Đúng rồi! Con đã nhớ chuyển một chục sang cột bên cạnh, chỗ này rất nhiều bạn quên.";
    case "cay-va-khoang":
      return "Đúng rồi! Con đã đếm số khoảng trống chứ không đếm số cây. Đây mới là chỗ khó của bài.";
    case "thuoc-do":
      return "Đúng rồi! Con đã đổi sang đúng đơn vị mà đề hỏi.";
    case "doan-thang":
      return "Đúng rồi! Con đã nhìn ra đoạn nào dài hơn trước khi chọn phép tính.";
    case "nhom-hinh":
      return "Đúng rồi! Con đếm có thứ tự nên không bị trùng.";
    case "dong-ho":
      return "Đúng rồi! Con đã nhìn đúng kim ngắn.";
    default:
      return "Đúng rồi! Con đã đọc kỹ câu hỏi trước khi làm.";
  }
}
