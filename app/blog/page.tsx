import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export default function BlogIndex() {
  const postsDirectory = path.join(process.cwd(), 'content/blog');
  const filenames = fs.readdirSync(postsDirectory);

  const posts = filenames.map((filename: string) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data } = matter(fileContents);
    
    const lang = filename.split('.').slice(-2)[0];

    return {
      slug: filename.replace(`.${lang}.md`, ''),
      lang,
      title: data.title,
      date: data.date,
      excerpt: data.excerpt,
    };
  }).sort((a: any, b: any) => (a.date < b.date ? 1 : -1));

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Blog / Блог</h1>
      <div className="space-y-6">
        {posts.map((post) => (
          <article key={post.slug} className="border-b pb-4">
            <Link href={`/blog/${post.slug}?lang=${post.lang}`}>
              <h2 className="text-2xl font-semibold text-blue-600 hover:underline">
                <span className="text-xs text-slate-400 uppercase mr-2">[{post.lang}]</span>
                {post.title}
              </h2>
            </Link>
            <p className="text-sm text-gray-500 mb-2">{post.date}</p>
            <p>{post.excerpt}</p>
          </article>
        ))}
      </div>
    </main>
  );
}