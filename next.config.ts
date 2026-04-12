import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parseはNext.jsのwebpackバンドラーと相性が悪いため、外部パッケージとして扱う
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
