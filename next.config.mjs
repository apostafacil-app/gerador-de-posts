/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Impede MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Impede clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Força HTTPS por 1 ano
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Limita referrer para não vazar URL
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restringe permissões de browser APIs desnecessárias
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          // CSP: permite Poppins (Google Fonts) nos posts gerados pela IA
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'", // unsafe-inline necessário para Next.js
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob:",         // data: para logos base64, blob: para export PNG
              "connect-src 'self'",                 // chamadas de API apenas para mesmo domínio
              "frame-src 'none'",                   // iframes usam srcdoc, não src externo
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Methods', value: 'POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
}

export default nextConfig
