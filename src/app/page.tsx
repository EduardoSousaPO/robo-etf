import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header com Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            Carteira Inteligente de ETFs em 5 minutos
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Crie uma carteira global de ETFs alinhada ao seu perfil de risco, otimizada em custos e
            tributação, com relatório explicativo em português.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a href="/onboarding" className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-2 text-lg font-medium text-primary-foreground shadow hover:bg-primary/90">
              Criar Minha Carteira
            </a>
            <a href="#pricing" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-lg font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
              Ver Planos
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Por que escolher o Robo-ETF?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border p-6">
              <h3 className="mb-3 text-xl font-semibold">Otimização Inteligente</h3>
              <p className="text-muted-foreground">
                Algoritmo Mean-Variance que maximiza retornos e minimiza riscos com base no seu
                perfil.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-3 text-xl font-semibold">Eficiência Tributária</h3>
              <p className="text-muted-foreground">
                Seleção de ETFs domiciliados na Irlanda para perfis conservadores, reduzindo a carga
                tributária.
              </p>
            </div>
            <div className="rounded-lg border p-6">
              <h3 className="mb-3 text-xl font-semibold">Explicações Claras</h3>
              <p className="text-muted-foreground">
                Relatório detalhado em português explicando cada ETF da sua carteira e por que ele
                foi selecionado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Como Funciona</h2>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="mb-2 text-lg font-semibold">Responda ao Questionário</h3>
              <p className="text-muted-foreground">
                6 perguntas simples para determinar seu perfil de investidor.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="mb-2 text-lg font-semibold">Receba Sua Carteira</h3>
              <p className="text-muted-foreground">
                Nosso algoritmo seleciona os melhores ETFs globais para você.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="mb-2 text-lg font-semibold">Entenda Cada Escolha</h3>
              <p className="text-muted-foreground">
                Explicações detalhadas sobre cada ETF e por que ele foi selecionado.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                4
              </div>
              <h3 className="mb-2 text-lg font-semibold">Rebalanceamento</h3>
              <p className="text-muted-foreground">
                Receba alertas para rebalancear sua carteira a cada 6 meses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Planos</h2>
          <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
            <div className="rounded-lg border p-6">
              <h3 className="mb-2 text-xl font-semibold">Gratuito</h3>
              <p className="mb-4 text-3xl font-bold">R$ 0</p>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-5 w-5 text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  1 carteira de ETFs
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-5 w-5 text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Exportação CSV
                </li>
                <li className="flex items-center text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-5 w-5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Sem rebalanceamento
                </li>
                <li className="flex items-center text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-5 w-5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                  Sem relatório PDF
                </li>
              </ul>
              <a href="/onboarding" className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 font-medium shadow-sm hover:bg-accent hover:text-accent-foreground">
                Começar Grátis
              </a>
            </div>
            <div className="rounded-lg border border-primary bg-primary/5 p-6">
              <div className="mb-4 inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                Recomendado
              </div>
              <h3 className="mb-2 text-xl font-semibold">Premium</h3>
              <p className="mb-1 text-3xl font-bold">R$ 49</p>
              <p className="mb-4 text-sm text-muted-foreground">por mês</p>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-5 w-5 text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Carteiras ilimitadas
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-5 w-5 text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Exportação CSV e PDF
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-5 w-5 text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Alertas de rebalanceamento
                </li>
                <li className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-5 w-5 text-green-500"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Suporte prioritário
                </li>
              </ul>
              <a href="/sign-up" className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground shadow hover:bg-primary/90">
                Assinar Agora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2025 Robo-ETF. Todos os direitos reservados.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Termos de Uso
              </Link>
              <Link href="#" className="text-sm text-muted-foreground hover:underline">
                Política de Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
