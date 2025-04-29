import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient as createSupabaseMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { createMiddlewareClient as createLocalMiddlewareClient } from './lib/supabase-client';

// Rotas que não requerem autenticação
const publicRoutes = [
  '/',
  '/sign-in*',
  '/sign-up*',
  '/api/webhook*',
  '/api/mercadopago/webhook*'
];

// Verifica se a rota atual é pública
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.replace('*', ''));
    }
    return pathname === route;
  });
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Tenta criar o cliente usando nossas configurações locais primeiro
  let supabase;
  try {
    // Usa nossa função que já tem as chaves configuradas
    supabase = createLocalMiddlewareClient();
  } catch (error) {
    console.error("Erro ao criar cliente middleware local:", error);
    // Fallback para a versão padrão se houver erro
    supabase = createSupabaseMiddlewareClient({ req, res });
  }
  
  // Verifica a sessão do usuário
  const { data: { session } } = await supabase.auth.getSession();
  const pathname = req.nextUrl.pathname;
  
  // Redireciona usuários não autenticados tentando acessar rotas protegidas
  if (!session && !isPublicRoute(pathname)) {
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Redireciona usuários autenticados tentando acessar páginas de autenticação
  if (session && (pathname === '/sign-in' || pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  return res;
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};

