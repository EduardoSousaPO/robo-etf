'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export default function NewPortfolioPage() {
  const [riskScore, setRiskScore] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      router.push(`/portfolio?risk_score=${riskScore}`);
    } catch (error) {
      console.error('Erro ao criar carteira:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Configure sua Carteira</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Perfil de Risco</CardTitle>
            <CardDescription>
              Escolha o perfil que melhor representa sua tolerância a risco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={riskScore.toString()}
              onValueChange={(value) => setRiskScore(parseInt(value))}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="risk-1" />
                <Label htmlFor="risk-1" className="flex flex-col">
                  <span className="font-medium">Muito Conservador</span>
                  <span className="text-sm text-muted-foreground">Prioriza preservação de capital e baixa volatilidade.</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="risk-2" />
                <Label htmlFor="risk-2" className="flex flex-col">
                  <span className="font-medium">Conservador</span>
                  <span className="text-sm text-muted-foreground">Aceita pouca flutuação em troca de retornos moderados.</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="risk-3" />
                <Label htmlFor="risk-3" className="flex flex-col">
                  <span className="font-medium">Moderado</span>
                  <span className="text-sm text-muted-foreground">Busca equilíbrio entre segurança e crescimento.</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="risk-4" />
                <Label htmlFor="risk-4" className="flex flex-col">
                  <span className="font-medium">Arrojado</span>
                  <span className="text-sm text-muted-foreground">Prioriza crescimento, aceita volatilidade moderada a alta.</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5" id="risk-5" />
                <Label htmlFor="risk-5" className="flex flex-col">
                  <span className="font-medium">Muito Arrojado</span>
                  <span className="text-sm text-muted-foreground">Busca retornos máximos, aceitando alta volatilidade.</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[150px]"
          >
            {isSubmitting ? 'Processando...' : 'Criar Carteira'}
          </Button>
        </div>
      </div>
    </div>
  );
} 