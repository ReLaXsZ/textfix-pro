import { MetadataRoute } from 'next'
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://textfix-pro.vercel.app';
  
  // Взимаме статиите от блога
  const postsDirectory = path.join(process.cwd(), 'content/blog');
  let blogUrls: any[] = [];
  
  if (fs.existsSync(postsDirectory)) {
    const filenames = fs.readdirSync(postsDirectory);
    blogUrls = filenames.map((filename) => {
      const filePath = path.join(postsDirectory, filename);
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContents);
      return {
        url: `${baseUrl}/blog/${filename.replace('.md', '')}`,
        lastModified: new Date(data.date),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      };
    });
  }

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 }, // Новата блог страница
    ...blogUrls, // Всички статии
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ]
}