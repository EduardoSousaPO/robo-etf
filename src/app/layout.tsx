import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Robo-ETF - Carteira Inteligente de ETFs',
  description: 'Crie uma carteira global de ETFs alinhada ao seu perfil de risco em até 5 minutos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider 
      localization={ptBR}
      appearance={{
        layout: {
          logoPlacement: 'inside',
          logoImageUrl: '/logo.png',
        },
        variables: {
          colorPrimary: '#0066FF',
        },
      }}
      redirectUrl="/dashboard"
      signInUrl="/(auth)/sign-in"
      signUpUrl="/(auth)/sign-up"
    >
      <html lang="pt-BR" suppressHydrationWarning>
        <head />
        <body className={inter.className}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
