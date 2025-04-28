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
  // Verificar se as variáveis de ambiente do Supabase estão configuradas
  const hasSupabaseConfig = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Inicializar o Supabase para o lado do servidor apenas se as variáveis estiverem definidas
  let supabase;
  try {
    if (hasSupabaseConfig) {
      supabase = createServerComponentClient({ cookies });
    } else {
      console.warn('Variáveis de ambiente do Supabase não configuradas. Autenticação pode não funcionar corretamente.');
    }
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
  }
  
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
