import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export default async function BlogPost({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ lang?: string }> }) {
  const { slug } = await params;
  const { lang } = await searchParams;
  
  const articleLang = lang || 'bg';
  const filePath = path.join(process.cwd(), 'content/blog', `${slug}.${articleLang}.md`);
  
  if (!fs.existsSync(filePath)) {
    return <div className="p-8">Статията не е намерена (Article not found).</div>;
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  
  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return (
    <main className="max-w-3xl mx-auto p-8">
      <a href="/blog" className="text-blue-500 hover:underline mb-4 block">&larr; Back / Назад</a>
      <h1 className="text-4xl font-bold mb-2">{data.title}</h1>
      <p className="text-sm text-gray-500 mb-8">{data.date}</p>
      <div className="prose prose-lg dark:prose-invert" dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </main>
  );
}