import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rotas que não requerem autenticação
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhook(.*)',
  '/api/mercadopago/webhook(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  // Se não for uma rota pública, proteger
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Redirecionar usuários autenticados tentando acessar páginas de autenticação
  const { userId } = await auth();
  if (userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  // Permitir acesso para todas as rotas
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Ignorar arquivos estáticos e internos do Next.js
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Sempre executar para rotas API
    '/(api|trpc)(.*)'
  ],
};
