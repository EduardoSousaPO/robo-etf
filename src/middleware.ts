import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define as rotas públicas que não precisam de autenticação
const publicRoutes = createRouteMatcher([
  '/',
  '/api/mercadopago',
  '/api/docs',
  '/(auth)/sign-in(.*)',  // Padrão catchall para sign-in com grupo (auth)
  '/(auth)/sign-up(.*)',  // Padrão catchall para sign-up com grupo (auth)
  '/onboarding',
]);

// Define as rotas privadas que exigem autenticação
const privateRoutes = createRouteMatcher([
  '/dashboard(.*)',  // Dashboard e subpáginas
  '/portfolio(.*)',  // Páginas de portfólio
  '/account(.*)',    // Páginas de conta
]);

export default clerkMiddleware(
  (auth, req) => {
    // Checar se o usuário está tentando acessar uma página protegida
    if (privateRoutes(req)) {
      auth.protect();
    }
  },
  {
    debug: process.env.NODE_ENV === 'development'
  }
);

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
