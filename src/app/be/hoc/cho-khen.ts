/**
 * Giữ lời khen trên màn hình bao lâu trước khi sang bài mới.
 *
 * Lỗi đã có thật, và nó hiện ra đúng như thế này trên điện thoại:
 *
 *   Số liền trước của 100 là số nào?          ← bài MỚI
 *   [tia số 95…105]
 *   🎉 Đúng rồi! Con đã nhìn đúng kim ngắn.   ← lời khen của bài CŨ (đồng hồ)
 *
 * Trẻ đọc xong đề mới rồi mới đọc tới lời khen, và lời khen nói về một cái đồng
 * hồ không còn trên màn hình. Với một đứa bảy tuổi đang tập đọc thì đó không
 * phải "một chi tiết nhỏ chưa đẹp" — nó là một câu vô nghĩa xuất hiện giữa bài,
 * và làm hỏng đúng thứ lời khen sinh ra để làm.
 *
 * Nguyên nhân: phần tiếng ĐÃ chờ, phần hình thì không. Mã cũ gọi setBai() ngay
 * rồi hẹn giờ 2,2 giây cho giọng đọc đề mới — nên giọng nói đúng thứ tự, còn
 * màn hình đổi tức thì. Hai kênh lệch nhau, và chỉ nhìn màn hình mới thấy.
 *
 * Nay cả hai cùng chờ, và chờ theo ĐỘ DÀI câu khen chứ không phải một con số cố
 * định: "Đúng rồi!" đọc nhanh hơn hẳn "Đúng rồi! Con đã đổi 1 chục thành 10 đơn
 * vị trước khi trừ." Một mốc cố định thì hoặc quá ngắn cho câu dài, hoặc bắt trẻ
 * ngồi chờ vô ích sau câu ngắn.
 */

/**
 * Ngắn nhất, kể cả với câu khen chỉ hai chữ.
 *
 * 2,2 giây là con số mã cũ dùng cho giọng đọc, và chính nó là chỗ hỏng: câu
 * "Đúng rồi! Con đã nhìn đúng kim ngắn." dài 36 ký tự, ước lượng ra chưa tới
 * hai giây nên rơi đúng vào sàn — tức là câu khen dài nhất trong nhóm ngắn lại
 * được chờ đúng bằng câu "Giỏi!". Đó là lý do người dùng thấy "đọc chưa xong đã
 * sang câu sau".
 *
 * Ba giây tính cho người đọc chậm nhất mà sản phẩm phục vụ: một đứa bảy tuổi
 * đang tập đọc, không phải người lớn liếc một cái là xong. Cái giá là khoảng 24
 * giây cho cả một phiên tám bài, trên trần mười phút của BR-05 — 4% thời lượng,
 * đổi lấy việc lời khen thật sự tới được nơi nó cần tới.
 */
export const CHO_KHEN_TOI_THIEU_MS = 3_000;

/**
 * Dài nhất. Có trần vì im lặng quá lâu giữa hai bài thì trẻ tưởng máy treo và
 * bắt đầu bấm lung tung — quan sát thật ở lứa tuổi này.
 */
export const CHO_KHEN_TOI_DA_MS = 7_000;

/**
 * Ước lượng tốc độ đọc thành tiếng, tính theo mỗi ký tự.
 *
 * Không đo bằng số từ vì tiếng Việt nhiều âm tiết ngắn; đếm ký tự bám sát thời
 * lượng đọc hơn. Con số này chỉ cần đúng ở mức "đủ chờ", không cần chính xác.
 *
 * 80ms/ký tự là tốc độ đọc của TRẺ, không phải tốc độ máy đọc thành tiếng. Máy
 * đọc xong không có nghĩa là em đã đọc xong — và em mới là người cần hiểu câu
 * đó. Chờ dư vài trăm mili giây thì không ai mất gì; chờ thiếu thì lời khen
 * biến mất trước khi được đọc, đúng cái lỗi này.
 */
const MOI_KY_TU_MS = 80;

export function choKhenMs(loiKhen: string): number {
  const uoc = loiKhen.trim().length * MOI_KY_TU_MS;
  return Math.min(CHO_KHEN_TOI_DA_MS, Math.max(CHO_KHEN_TOI_THIEU_MS, uoc));
}
