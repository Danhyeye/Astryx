import type { NextConfig } from "next";
import withStylexTurbopack from '@stylexswc/nextjs-plugin/turbopack';

const nextConfig: NextConfig = withStylexTurbopack({
  rsOptions: {
    dev: process.env.NODE_ENV === 'development',
  },
})({
  transpilePackages: ['@astryxdesign/core'],
});

export default nextConfig;
