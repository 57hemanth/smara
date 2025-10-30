/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  env: {
    CF_PAGES: process.env.CF_PAGES,
  },
}

module.exports = nextConfig
