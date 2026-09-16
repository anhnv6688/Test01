import { notFound } from "next/navigation";
import { congCuGanNhanMoKhong, THU_MUC_MAC_DINH } from "@/lib/server/kho-anh-do";
import { TrangGanNhan } from "./TrangGanNhan";

export const dynamic = "force-dynamic";

/**
 * Trang gắn nhãn bộ ảnh đo — công cụ cục bộ, không phải một phần của sản phẩm.
 *
 * Điều kiện ra mắt số 9 đòi một tỷ lệ nhận dạng đo trên ảnh chụp trong điều
 * kiện thật. Muốn có tỷ lệ đó thì phải có nhãn, và nhãn thì phải do người ngồi
 * nhìn từng trang vở mà gõ ra. Với khoảng một trăm ảnh, mỗi trang sáu bài, đó
 * là sáu trăm đối tượng — gõ thẳng vào JSON bằng tay thì vừa chậm vừa sai, mà
 * một nhãn sai thì bộ đo báo sai, còn tệ hơn là không đo.
 *
 * Trang này ở trong chính ứng dụng chứ không phải một kịch bản riêng, vì nó cần
 * HIỆN ẢNH cạnh biểu mẫu. Đổi lại thì phải có chốt, và chốt ở `kho-anh-do.ts`
 * khóa hẳn ở bản phát hành.
 *
 * Ảnh không rời máy người gắn nhãn: trang đọc thẳng từ thư mục trên đĩa, không
 * tải lên đâu cả.
 */
export default function TrangGanNhanCuaBoDo() {
  if (!congCuGanNhanMoKhong()) notFound();
  return <TrangGanNhan thuMucMacDinh={THU_MUC_MAC_DINH} />;
}
