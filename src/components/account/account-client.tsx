// src/components/account/account-client.tsx
"use client";

import { useState } from "react";
import { Profile } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast"; // Corrected import path
import { UserProfile, useAuth } from "@clerk/nextjs"; // Import UserProfile for Clerk integration

interface AccountClientProps {
  profile: Profile | null;
}

export default function AccountClient({ profile }: AccountClientProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth(); // Get token for API calls

  // Determine current subscription status from profile
  const isPremium = profile?.subscription_status === "premium"; // Assuming 'premium' status indicates active subscription

  // Função para iniciar o processo de assinatura
  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const token = await getToken(); // Get Clerk token

      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      // Chamar API para criar assinatura
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send token
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Erro ao processar assinatura"
        );
      }

      const data = await response.json();

      if (data.subscription?.init_point) {
        // Redirecionar para página de pagamento do Mercado Pago
        window.location.href = data.subscription.init_point;
      } else {
        throw new Error("Link de pagamento não recebido.");
      }
    } catch (error: any) {
      console.error("Erro ao iniciar assinatura:", error);
      toast({
        title: "Erro",
        description:
          error.message ||
          "Não foi possível processar sua assinatura. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar assinatura (Exemplo - API não implementada ainda)
  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      if (!token) {
        throw new Error("Usuário não autenticado");
      }

      // TODO: Implementar API para cancelar assinatura no Mercado Pago e no DB
      // const response = await fetch("/api/subscription/cancel", {
      //   method: "POST",
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error("Erro ao cancelar assinatura");
      // }

      // Simulação de sucesso
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: "Cancelamento Solicitado",
        description:
          "Seu pedido de cancelamento foi recebido. A assinatura será desativada ao final do período atual.",
      });

      // Idealmente, atualizar o estado da UI ou recarregar dados sem refresh completo
      // setTimeout(() => {
      //   window.location.reload();
      // }, 2000);
    } catch (error: any) {
      console.error("Erro ao cancelar assinatura:", error);
      toast({
        title: "Erro",
        description:
          error.message ||
          "Não foi possível cancelar sua assinatura. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Minha Conta</h1>

      <Tabs defaultValue="subscription">
        <TabsList>
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Plano Atual</CardTitle>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                // Usuário Premium
                <div className="mb-6">
                  <h3 className="mb-2 text-lg font-semibold">Plano Premium</h3>
                  <p className="mb-4 text-muted-foreground">
                    Você tem acesso a todos os recursos!
                    {/* TODO: Adicionar data de expiração ou próxima cobrança se disponível */}
                  </p>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center">
                      <CheckIcon className="mr-2 h-5 w-5 text-green-500" />
                      Carteiras ilimitadas
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="mr-2 h-5 w-5 text-green-500" />
                      Exportação CSV e PDF
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="mr-2 h-5 w-5 text-green-500" />
                      Alertas de rebalanceamento
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="mr-2 h-5 w-5 text-green-500" />
                      Suporte prioritário
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Cancelar Assinatura"}
                  </Button>
                </div>
              ) : (
                // Usuário Gratuito
                <div className="mb-6">
                  <h3 className="mb-2 text-lg font-semibold">Plano Gratuito</h3>
                  <p className="mb-4 text-muted-foreground">
                    Você está utilizando o plano gratuito com recursos limitados.
                  </p>
                  <ul className="mb-6 space-y-2">
                    <li className="flex items-center">
                      <CheckIcon className="mr-2 h-5 w-5 text-green-500" />1
                      carteira de ETFs
                    </li>
                    <li className="flex items-center">
                      <CheckIcon className="mr-2 h-5 w-5 text-green-500" />
                      Exportação CSV
                    </li>
                    <li className="flex items-center text-muted-foreground">
                      <XIcon className="mr-2 h-5 w-5" />
                      Sem rebalanceamento automático
                    </li>
                    <li className="flex items-center text-muted-foreground">
                      <XIcon className="mr-2 h-5 w-5" />
                      Sem relatório PDF
                    </li>
                  </ul>
                  <Button onClick={handleSubscribe} disabled={loading}>
                    {loading ? "Processando..." : "Fazer Upgrade para Premium"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          {/* Integrar componente UserProfile do Clerk */}
          <UserProfile routing="path" path="/account" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Icons (pode mover para um arquivo separado)
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

