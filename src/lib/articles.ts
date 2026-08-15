import { getSupabasePublicClient } from './supabase/public';

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: unknown;
  cover_image_path: string | null;
  category: string | null;
  tags: string[] | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
}

export async function getPublishedArticles(): Promise<Article[]> {
  const { data, error } = await getSupabasePublicClient()
    .from('articles')
    .select('id,title,slug,excerpt,body,cover_image_path,category,tags,status,published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Article[];
}

export async function getPublishedArticle(slug: string): Promise<Article | null> {
  const { data, error } = await getSupabasePublicClient()
    .from('articles')
    .select('id,title,slug,excerpt,body,cover_image_path,category,tags,status,published_at')
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle();
  if (error) throw error;
  return (data as Article | null) ?? null;
}

export function bodyBlocks(body: unknown): unknown[] {
  if (body && typeof body === 'object' && 'content' in body && Array.isArray(body.content)) return body.content;
  if (Array.isArray(body)) return body;
  if (typeof body === 'string' && body.trim()) return [{ type: 'paragraph', content: [{ text: body }] }];
  return [];
}

export function nodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  if ('text' in node && typeof node.text === 'string') return node.text;
  if ('content' in node && Array.isArray(node.content)) return node.content.map(nodeText).join('');
  return '';
}
