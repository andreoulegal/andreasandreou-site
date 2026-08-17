import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase/server';

export const onRequest = defineMiddleware(async ({ request, cookies, redirect, url }, next) => {
  const path = url.pathname;
  const isAdminPath = path === '/admin' || path.startsWith('/admin/');
  const isLoginPath = path === '/admin/login';

  if (!isAdminPath) return next();

  const supabase = createSupabaseServerClient(request, cookies);

  const authCode = isLoginPath ? url.searchParams.get('code') : null;
  if (authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);
    if (!error) return redirect('/admin');
  }

  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null;
  const isAuthenticated = !error && Boolean(userId);
  const { data: adminMembership, error: adminError } = userId
    ? await supabase.from('site_admins').select('user_id').eq('user_id', userId).maybeSingle()
    : { data: null, error: null };
  const isSiteAdmin = !adminError && Boolean(adminMembership?.user_id);

  if (!isLoginPath && (!isAuthenticated || !isSiteAdmin)) return redirect('/admin/login');
  if (isLoginPath && isSiteAdmin) return redirect('/admin');

  return next();
});
