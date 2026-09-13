import type { Trap } from "./types";

/**
 * Ngân hàng bẫy.
 *
 * Quan sát 2 của BRD: phần lớn câu sai của trẻ lớp 1–2 không phải sai tính mà
 * là sai bẫy ngôn ngữ. Mỗi bẫy ở đây gồm ba câu chữ cho ba người đọc khác nhau:
 * câu chữa cho trẻ (nói vì sao sai, tuyệt đối không nói đáp án — BR-03),
 * câu ghi chú cho phụ huynh, và đúng một câu để phụ huynh hỏi con (BR-08).
 */
export const TRAPS: Trap[] = [
  {
    id: "BAY-DON-VI",
    name: "Cho đơn vị này, hỏi đơn vị khác",
    childFix:
      "Con tính đúng rồi đấy, nhưng đề hỏi bằng một đơn vị khác với đơn vị trong đề. Con đọc lại xem đề hỏi bao nhiêu gì nhé.",
    parentNote:
      "Con làm đúng phép tính nhưng trả lời sai đơn vị: đề cho xăng-ti-mét mà hỏi mét, hoặc ngược lại.",
    parentQuestion: "Đề bài này hỏi con bao nhiêu xăng-ti-mét hay bao nhiêu mét?",
  },
  {
    id: "BAY-KHOANG-CACH",
    name: "Năm cây chỉ có bốn khoảng",
    childFix:
      "Con đếm số cây rồi, nhưng đề hỏi về khoảng cách giữa các cây. Con thử nhìn hình và đếm xem có mấy khoảng trống nhé.",
    parentNote: "Con lấy luôn số cây làm số khoảng. Đây là lỗi lệch một đơn vị rất phổ biến ở lứa tuổi này.",
    parentQuestion: "Nếu có 2 cái cây thì ở giữa chúng có mấy khoảng trống hả con?",
  },
  {
    id: "BAY-NHIEU-HON-TRU",
    name: "Thấy 'nhiều hơn' là cộng",
    childFix:
      "Trong đề có chữ nhiều hơn nhưng chưa chắc đã là phép cộng. Con thử xem ai nhiều hơn ai, và đề đang hỏi về ai nhé.",
    parentNote:
      "Con phản xạ theo từ khóa: thấy 'nhiều hơn' là cộng, thấy 'ít hơn' là trừ, không xét xem đề hỏi về ai.",
    parentQuestion: "Trong bài này ai nhiều hơn, và đề đang hỏi con về bạn nào?",
  },
  {
    id: "BAY-QUEN-NHO",
    name: "Quên nhớ khi cộng, quên mượn khi trừ",
    childFix:
      "Cột đơn vị của con cộng ra hơn 10 rồi. Khi đó có một chục phải chuyển sang cột bên cạnh. Con làm lại cột đơn vị trước nhé.",
    parentNote: "Con làm đúng cách đặt tính nhưng bỏ quên số nhớ ở cột đơn vị.",
    parentQuestion: "Cột đơn vị con cộng được bao nhiêu, và số đó có lớn hơn 9 không?",
  },
  {
    id: "BAY-DEM-TRUNG",
    name: "Đếm hình lộn xộn nên đếm trùng",
    childFix:
      "Con đang đếm chưa có thứ tự nên dễ đếm trùng. Con thử đếm hết hàng trên trước, rồi mới xuống hàng dưới nhé.",
    parentNote: "Con đếm hình không theo thứ tự nên bỏ sót hoặc đếm trùng. Đây là thiếu chiến lược chứ không thiếu kiến thức.",
    parentQuestion: "Con chỉ cho mẹ xem con đếm theo thứ tự nào nhé?",
  },
  {
    id: "BAY-THU-TU-PHEP-TINH",
    name: "Làm tắt hai bước thành một",
    childFix:
      "Bài này có hai việc phải làm, con mới làm một việc thôi. Con thử kể ra hai việc cần làm theo thứ tự nhé.",
    parentNote: "Con giải bài hai bước bằng một phép tính, thường là bỏ qua bước đầu tiên.",
    parentQuestion: "Bài này con phải làm mấy việc, việc nào làm trước?",
  },
  {
    id: "BAY-DOC-GIO",
    name: "Đọc nhầm kim ngắn và kim dài",
    childFix:
      "Con thử nhìn lại: kim ngắn chỉ giờ, kim dài chỉ phút. Con xem kim ngắn đang ở giữa hai số nào nhé.",
    parentNote: "Con đổi vai hai kim đồng hồ, hoặc đọc kim giờ theo số mà kim dài đang chỉ.",
    parentQuestion: "Kim ngắn chỉ cái gì, kim dài chỉ cái gì hả con?",
  },
];

export const TRAP_BY_ID = new Map(TRAPS.map((t) => [t.id, t]));

export function getTrap(id: string): Trap {
  const t = TRAP_BY_ID.get(id);
  if (!t) throw new Error(`Không có bẫy với mã ${id}`);
  return t;
}
