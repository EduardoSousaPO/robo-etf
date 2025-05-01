// src/app/portfolio/page.tsx
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPortfoliosByUserId, getProfileById } from "@/lib/repository"; // Import getProfileById
import PortfolioDisplay from "@/components/portfolio/portfolio-display";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Helper component for loading state
function PortfolioLoadingSkeleton() {
  // ... (skeleton code remains the same)
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[100px] w-full" />
      </div>
      <Skeleton className="mt-6 h-[400px] w-full" />
      <Skeleton className="mt-6 h-[100px] w-full" />
    </div>
  );
}

// Helper component to fetch and display portfolio data
async function PortfolioData() {
  const { userId } = auth();

  if (!userId) {
    redirect("/sign-in");
  }

  let portfolios;
  let profile;
  try {
    // Fetch both portfolio and profile data concurrently
    [portfolios, profile] = await Promise.all([
      getPortfoliosByUserId(userId),
      getProfileById(userId),
    ]);
  } catch (error) {
    console.error("Erro ao buscar dados da carteira ou perfil:", error);
    return (
      <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao Carregar Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-muted-foreground">
              Não foi possível buscar seus dados. Por favor, tente recarregar a página.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="container mx-auto flex min-h-[70vh] flex-col items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Nenhuma Carteira Encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Você ainda não gerou nenhuma carteira otimizada. Complete o onboarding ou vá para o dashboard.
            </p>
            {/* TODO: Add link/button to onboarding or dashboard */}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get the latest portfolio
  const latestPortfolio = portfolios[0];

  // Get risk score from profile, default to a moderate score (e.g., 3) if not found
  const riskScore = profile?.risk_score ?? 3;

  // Pass portfolio and riskScore to the client component
  return <PortfolioDisplay portfolio={latestPortfolio} riskScore={riskScore} />;
}

// Main Page Component (Server Component)
export default function PortfolioPage() {
  return (
    <Suspense fallback={<PortfolioLoadingSkeleton />}>
      <PortfolioData />
    </Suspense>
  );
}

