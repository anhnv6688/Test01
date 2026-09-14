import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * Cấu hình ESLint.
 *
 * Từ eslint-config-next 16, gói này xuất thẳng cấu hình phẳng, nên không còn
 * phải bắc cầu qua FlatCompat của @eslint/eslintrc nữa. Bắc cầu qua đó với bản
 * 16 sẽ hỏng ngay lúc nạp cấu hình.
 */
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
