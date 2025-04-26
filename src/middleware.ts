import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

// Rotas que requerem autenticação
const PROTECTED_ROUTES = [
  '/dashboard', 
  '/portfolio', 
  '/my-portfolios',
  '/api/optimize',
  '/api/subscription'
];

// Rotas específicas para usuários não autenticados
const AUTH_ROUTES = [
  '/sign-in',
  '/sign-up'
];

export async function middleware(req: NextRequest) {
  // Criar cliente Supabase para o middleware
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // Verificar a sessão atual
  const { data: { session }} = await supabase.auth.getSession();
  
  // Consideramos logado se existir uma sessão
  const isAuthenticated = !!session;
  
  // Obter o caminho da URL
  const path = req.nextUrl.pathname;
  
  // Verificar se a rota requer autenticação
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => path.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => path.startsWith(route));
  
  // Redirecionar baseado nas condições
  if (isProtectedRoute && !isAuthenticated) {
    // Redirecionar para login se tentar acessar rota protegida sem autenticação
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(redirectUrl);
  }
  
  if (isAuthRoute && isAuthenticated) {
    // Redirecionar para dashboard se tentar acessar página de login já autenticado
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public/* (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
