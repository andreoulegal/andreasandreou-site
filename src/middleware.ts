import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerClient } from './lib/supabase/server';

export const onRequest = defineMiddleware(async ({ request, cookies, redirect, url }, next) => {
  const path = url.pathname;
  const isAdminPath = path === '/admin' || path.startsWith('/admin/');
  const isLoginPath = path === '/admin/login';

  if (!isAdminPath) return next();

  const supabase = createSupabaseServerClient(request, cookies);
  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);

  if (!isLoginPath && !isAuthenticated) return redirect('/admin/login');
  if (isLoginPath && isAuthenticated) return redirect('/admin');

  return next();
});
