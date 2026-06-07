import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages에 정적 사이트로 배포. 모든 페이지가 클라이언트 컴포넌트라 SSR 불필요.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
