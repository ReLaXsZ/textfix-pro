import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/', // Забранява на ботовете да влизат в API-то ни
    },
    sitemap: 'https://textfix-pro.vercel.app/sitemap.xml',
  }
}