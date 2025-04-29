import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

// Rotas que não requerem autenticação
const publicRoutes = ['/', '/sign-in*', '/sign-up*', '/api/webhook*', '/api/mercadopago/webhook*'];

// Verifica se a rota atual é pública
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => {
    if (route.endsWith('*')) {
      return pathname.startsWith(route.replace('*', ''));
    }
    return pathname === route;
  });
}

export default function middleware(request: NextRequest) {
  const { userId } = getAuth(request);
  const pathname = request.nextUrl.pathname;

  // Redirecionar usuários não autenticados tentando acessar rotas protegidas
  if (!userId && !isPublicRoute(pathname)) {
    const redirectUrl = new URL('/sign-in', request.url);
    redirectUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirecionar usuários autenticados tentando acessar páginas de autenticação
  if (userId && (pathname === '/sign-in' || pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Permitir a solicitação para continuar
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
