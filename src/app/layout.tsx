import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Robo-ETF - Carteira Inteligente de ETFs',
  description: 'Crie uma carteira global de ETFs alinhada ao seu perfil de risco em até 5 minutos.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Inicializar o Supabase para o lado do servidor
  const supabase = createServerComponentClient({ cookies });
  
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
