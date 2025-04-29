/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://iikdiavzocnpspebjasp.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2RpYXZ6b2NucHNwZWJqYXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MTc1NzQsImV4cCI6MjA2MTE5MzU3NH0.c7Yw_UQenZABl5tg5AtOGaQbv_VE2gu3Wbo6zPJ3rAw',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpa2RpYXZ6b2NucHNwZWJqYXNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTYxNzU3NCwiZXhwIjoyMDYxMTkzNTc0fQ.bwQZqwTpEvmFdVMzgNxPovEvCaTHInBoXEKfFTTquJg',
    MERCADOPAGO_ACCESS_TOKEN: 'APP_USR-4180894767703290-052416-62b0f4ca4c6c3cad88b08bd3a43d36f8-1595653868'
  },
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig; 