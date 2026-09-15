import { noiDungRobots } from "@/lib/server/moi-truong";

export const dynamic = "force-dynamic";

/**
 * robots.txt sinh theo môi trường, không phải tệp tĩnh.
 *
 * Tệp tĩnh thì cùng một nội dung đi theo ảnh Docker sang cả bản thử lẫn bản
 * thật — mà hai bản cần hai câu trả lời khác hẳn nhau. Sinh lúc chạy thì cùng
 * một ảnh dùng được cho cả hai, đúng nguyên tắc "một ảnh đi qua mọi môi
 * trường" ở docs/moi-truong.md.
 */
export function GET(): Response {
  return new Response(noiDungRobots(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
