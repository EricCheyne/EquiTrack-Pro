/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    transpilePackages: ["@equitrack/shared", "@equitrack/db"],
};

module.exports = nextConfig;
