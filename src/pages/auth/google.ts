import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../lib/supabase/server';

export const GET: APIRoute = async ({ request, cookies, redirect, url }) => {
  const supabase = createSupabaseServerClient(request, cookies);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL('/admin/login', url).toString() }
  });

  if (error || !data.url) {
    return new Response(error?.message || 'Unable to start Google sign-in.', { status: 502 });
  }

  return redirect(data.url);
};
