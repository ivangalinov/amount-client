/** @type {import('next').NextConfig} */
const categoryBackend =
  process.env.CATEGORY_API_INTERNAL_URL ?? "http://127.0.0.1:8000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/category-proxy/:path*",
        destination: `${categoryBackend}/:path*`,
      },
    ];
  },
};

export default nextConfig;;
