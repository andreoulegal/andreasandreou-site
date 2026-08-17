import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase/server';

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseServerClient(request, cookies);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return new Response('Unauthorized', { status: 401 });
  const { data: adminMembership, error: adminError } = await supabase
    .from('site_admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (adminError || !adminMembership) return new Response('Forbidden', { status: 403 });

  return new Response(JSON.stringify({ session }), {
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json'
    }
  });
};
