import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase/server';

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(request, cookies);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return new Response('Unauthorized', { status: 401 });

  return new Response(JSON.stringify({ session }), {
    headers: { 'content-type': 'application/json' }
  });
};
