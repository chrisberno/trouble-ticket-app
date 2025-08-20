/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    // Local development fallback - production uses vercel.json
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'ALLOWALL'
            }
          ]
        }
      ]
    }
    return []
  }
}

module.exports = nextConfig