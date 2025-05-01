// src/app/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs"; // Use Clerk hook
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

// Questions for risk assessment
const questions = [
  {
    id: "q1",
    text: "Qual é o seu principal objetivo ao investir com o Robo-ETF?",
    options: [
      { value: 1, label: "Preservar meu capital com risco mínimo." },
      { value: 2, label: "Gerar renda estável com baixo risco." },
      { value: 3, label: "Equilibrar crescimento e segurança." },
      { value: 4, label: "Buscar crescimento significativo, aceitando maior volatilidade." },
      { value: 5, label: "Maximizar o retorno potencial, mesmo com alto risco." },
    ],
  },
  {
    id: "q2",
    text: "Por quanto tempo você pretende manter seus investimentos?",
    options: [
      { value: 1, label: "Menos de 1 ano" },
      { value: 2, label: "1 a 3 anos" },
      { value: 3, label: "3 a 5 anos" },
      { value: 4, label: "5 a 10 anos" },
      { value: 5, label: "Mais de 10 anos" },
    ],
  },
  {
    id: "q3",
    text: "Como você reagiria a uma queda de 20% no valor da sua carteira em um curto período?",
    options: [
      { value: 1, label: "Venderia tudo imediatamente para evitar mais perdas." },
      { value: 2, label: "Venderia parte dos investimentos." },
      { value: 3, label: "Manteria a carteira, mas ficaria preocupado." },
      { value: 4, label: "Manteria a carteira e consideraria investir mais." },
      { value: 5, label: "Veria como uma oportunidade e investiria mais." },
    ],
  },
  {
    id: "q4",
    text: "Qual sua experiência com investimentos em renda variável (ações, ETFs)?",
    options: [
      { value: 1, label: "Nenhuma experiência." },
      { value: 2, label: "Pouca experiência, investi algumas vezes." },
      { value: 3, label: "Experiência moderada, invisto regularmente." },
      { value: 4, label: "Experiente, acompanho o mercado de perto." },
      { value: 5, label: "Muito experiente, utilizo estratégias avançadas." },
    ],
  },
];

export default function OnboardingPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, isLoaded } = useUser(); // Use Clerk hook
  const { toast } = useToast();

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: parseInt(value) }));
  };

  const calculateRiskScore = (): number => {
    const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / questions.length;
    // Simple average rounded - adjust logic as needed for better scoring
    return Math.max(1, Math.min(5, Math.round(averageScore)));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== questions.length) {
      toast({
        title: "Questionário Incompleto",
        description: "Por favor, responda todas as perguntas.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro de Autenticação",
        description: "Usuário não encontrado. Por favor, faça login novamente.",
        variant: "destructive",
      });
      router.push("/sign-in"); // Redirect to sign-in if user is somehow lost
      return;
    }

    setLoading(true);
    const riskScore = calculateRiskScore();
    const userName = user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress || "Usuário"; // Get name from Clerk

    try {
      const response = await fetch("/api/profile", { // Use a dedicated profile API route
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization header will be handled by Clerk middleware/backend automatically if needed
        },
        body: JSON.stringify({
          userId: user.id,
          name: userName,
          riskScore: riskScore,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao salvar perfil");
      }

      toast({
        title: "Perfil Salvo!",
        description: `Seu perfil de risco (${riskScore}) foi definido com sucesso.`,
      });

      // Redirect to dashboard or portfolio page
      router.push("/dashboard");

    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast({
        title: "Erro ao Salvar Perfil",
        description: error.message || "Não foi possível salvar seu perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    // Optional: Add a loading skeleton
    return (
      <div className="container flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user && isLoaded) {
    // Should be redirected by middleware, but handle just in case
    router.push("/sign-in");
    return null;
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Questionário de Perfil de Risco</CardTitle>
          <CardDescription>
            Responda às perguntas abaixo para determinarmos a melhor estratégia de
            investimento para você.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {questions.map((q) => (
            <div key={q.id} className="space-y-3">
              <Label className="text-base font-medium">{q.text}</Label>
              <RadioGroup
                value={answers[q.id]?.toString()}
                onValueChange={(value) => handleAnswerChange(q.id, value)}
                className="space-y-2"
              >
                {q.options.map((opt) => (
                  <div key={opt.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value.toString()} id={`${q.id}-${opt.value}`} />
                    <Label htmlFor={`${q.id}-${opt.value}`} className="font-normal">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {loading ? "Salvando..." : "Concluir e Ver Carteira"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

