// src/components/portfolio/portfolio-display.tsx
"use client";

import { useState } from "react";
import { Portfolio } from "@prisma/client";
import { useAuth } from "@clerk/nextjs"; // Import Clerk auth hook
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast"; // Import useToast
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { JsonValue } from "@prisma/client/runtime/library";
import { Loader2, Download, FileText, MessageSquare } from "lucide-react"; // Import icons

// Cores para o gráfico de pizza
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FF6B6B",
  "#6A7FDB",
  "#9CCC65",
  "#FFD54F",
  "#4DB6AC",
  "#7986CB",
  "#A1887F",
  "#90A4AE",
  "#BA68C8",
];

interface PortfolioDisplayProps {
  portfolio: Portfolio;
  riskScore: number; // Receive riskScore as prop
}

// Helper to safely parse JSON potentially stored as string
function safeParseJson(jsonValue: JsonValue): Record<string, any> {
  if (typeof jsonValue === "string") {
    try {
      return JSON.parse(jsonValue);
    } catch (e) {
      console.error("Failed to parse JSON string:", e);
      return {};
    }
  } else if (typeof jsonValue === "object" && jsonValue !== null) {
    return jsonValue as Record<string, any>;
  }
  return {};
}

export default function PortfolioDisplay({ portfolio, riskScore }: PortfolioDisplayProps) {
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth(); // Get Clerk token function

  // Parse weights and metrics safely
  const weights = safeParseJson(portfolio.weights) as Record<string, number>;
  const metrics = safeParseJson(portfolio.metrics) as {
    expectedReturn: number;
    risk: number;
    sharpeRatio: number;
  };

  // Função para exportar CSV
  const handleExportCSV = () => {
    if (!weights) return;
    setLoadingCSV(true);
    try {
      const headers = ["ETF", "Peso"];
      const rows = Object.entries(weights).map(([symbol, weight]) => [
        symbol,
        (weight * 100).toFixed(2) + "%",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `roboetf_carteira_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Sucesso",
        description: "Arquivo CSV exportado.",
      });
    } catch (error) {
      console.error("Erro ao exportar CSV:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o arquivo CSV.",
        variant: "destructive",
      });
    } finally {
      setLoadingCSV(false);
    }
  };

  // Função para obter explicação da API
  const fetchExplanation = async (forceFetch = false) => {
    // Only fetch if forced or no explanation exists yet
    if (!weights || (!forceFetch && explanation)) return;

    setLoadingExplanation(true);
    try {
      const token = await getToken(); // Get Clerk token
      if (!token) {
        throw new Error("Autenticação necessária.");
      }

      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Send token
        },
        body: JSON.stringify({
          portfolio: {
            // Send structure expected by API
            weights: weights,
            metrics: metrics,
            rebalance_date: portfolio.rebalance_date?.toISOString(), // Ensure ISO string
          },
          riskScore: riskScore, // Use actual risk score
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao obter explicação da API");
      }

      const data = await response.json();
      if (data && data.explanation) {
        setExplanation(data.explanation);
        return data.explanation; // Return explanation for PDF generation
      } else {
        throw new Error("Dados de explicação inválidos recebidos");
      }
    } catch (err: any) {
      console.error("Erro ao obter explicação:", err);
      toast({
        title: "Erro na Explicação",
        description:
          err.message ||
          "Não foi possível obter a explicação da IA. Usando fallback.",
        variant: "destructive",
      });
      // Generate and set fallback explanation
      const fallback = generateFallbackExplanation(
        weights,
        metrics,
        portfolio.rebalance_date,
        riskScore // Use actual risk score
      );
      setExplanation(fallback);
      return fallback; // Return fallback for PDF generation
    } finally {
      setLoadingExplanation(false);
    }
  };

  // Abrir modal de explicação e buscar dados
  const handleExplanationClick = () => {
    setExplanationOpen(true);
    fetchExplanation(true); // Force fetch when explicitly clicked
  };

  // Função para gerar explicação local como fallback
  const generateFallbackExplanation = (
    portfolioWeights: Record<string, number>,
    portfolioMetrics: { expectedReturn: number; risk: number; sharpeRatio: number },
    rebalanceDate: Date | null,
    currentRiskScore: number // Use actual risk score
  ) => {
    const riskProfiles = [
      "muito conservador",
      "conservador",
      "moderado",
      "arrojado",
      "muito arrojado",
    ];
    const profileName = riskProfiles[currentRiskScore - 1] || "desconhecido";
    // ... (rest of the fallback logic remains the same, using currentRiskScore)
    const topETFs = Object.entries(portfolioWeights)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([symbol]) => symbol);

    const rebalanceDateString = rebalanceDate
      ? new Date(rebalanceDate).toLocaleDateString("pt-BR")
      : "data não definida";

    return `(Explicação Gerada Localmente - Fallback)

Sua carteira foi otimizada para um perfil ${profileName}, com foco em ${
      currentRiskScore <= 2
        ? "preservação de capital e menor volatilidade"
        : currentRiskScore === 3
        ? "equilíbrio entre risco e retorno"
        : "crescimento e maior potencial de retorno"
    }.

Os ETFs com maior peso na sua carteira são ${topETFs.join(
      ", "
    )}, selecionados por ${
      currentRiskScore <= 2
        ? "seu histórico de estabilidade e menor correlação com mercados voláteis"
        : currentRiskScore === 3
        ? "seu equilíbrio entre crescimento e estabilidade"
        : "seu potencial de crescimento e exposição a setores de alto desempenho"
    }.

${
      currentRiskScore <= 2
        ? "Para otimização tributária, priorizamos ETFs domiciliados na Irlanda (sufixo -IE) que oferecem vantagens fiscais para investidores brasileiros."
        : "A carteira prioriza ETFs com maior liquidez e histórico consistente de desempenho."
    }

O retorno anualizado esperado é de ${
      portfolioMetrics.expectedReturn
        ? (portfolioMetrics.expectedReturn * 100).toFixed(2)
        : "N/A"
    }%, com volatilidade de ${
      portfolioMetrics.risk ? (portfolioMetrics.risk * 100).toFixed(2) : "N/A"
    }% e índice Sharpe de ${
      portfolioMetrics.sharpeRatio
        ? portfolioMetrics.sharpeRatio.toFixed(2)
        : "N/A"
    }.

Recomendamos revisar e rebalancear sua carteira em ${rebalanceDateString}, ou antes caso ocorra uma queda superior a 15% no valor total.`;
  };

  // Função para gerar e baixar PDF
  const handleGeneratePDF = async () => {
    if (!weights) return;
    setLoadingPDF(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Autenticação necessária.");
      }

      // Fetch explanation if not already available
      let currentExplanation = explanation;
      if (!currentExplanation) {
        currentExplanation = await fetchExplanation() || ""; // Fetch or get fallback
      }

      if (!currentExplanation) {
        throw new Error("Não foi possível obter a explicação para o PDF.");
      }

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          portfolio: {
            weights: weights,
            metrics: metrics,
            rebalance_date: portfolio.rebalance_date?.toISOString(),
          },
          riskScore: riskScore,
          explanation: currentExplanation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao gerar PDF");
      }

      const data = await response.json();

      if (data.success && data.url) {
        // Trigger download using the public URL
        const link = document.createElement("a");
        link.href = data.url;
        link.target = "_blank"; // Open in new tab is safer for direct downloads
        link.download = data.url.substring(data.url.lastIndexOf("/") + 1); // Suggest filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
          title: "Sucesso",
          description: "Download do PDF iniciado.",
        });
      } else {
        throw new Error(data.message || "URL do PDF não recebida.");
      }
    } catch (error: any) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        title: "Erro ao Gerar PDF",
        description: error.message || "Não foi possível gerar o relatório PDF.",
        variant: "destructive",
      });
    } finally {
      setLoadingPDF(false);
    }
  };

  // Preparar dados para o gráfico de pizza
  const prepareChartData = () => {
    if (!weights) return [];
    const sortedEntries = Object.entries(weights).sort(([, a], [, b]) => b - a);
    if (sortedEntries.length > 10) {
      const topEntries = sortedEntries.slice(0, 9);
      const otherEntries = sortedEntries.slice(9);
      const otherWeight = otherEntries.reduce((sum, [, weight]) => sum + weight, 0);
      return [
        ...topEntries.map(([name, value]) => ({ name, value })),
        { name: "Outros", value: otherWeight },
      ];
    }
    return sortedEntries.map(([name, value]) => ({ name, value }));
  };

  const chartData = prepareChartData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="text-2xl font-bold">Sua Carteira Otimizada</h1>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={!weights || loadingCSV}
          >
            {loadingCSV ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            onClick={handleGeneratePDF}
            disabled={!weights || loadingPDF}
          >
            {loadingPDF ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Exportar PDF
          </Button>
          <Button
            variant="outline"
            onClick={handleExplanationClick}
            disabled={!weights || loadingExplanation}
          >
            {loadingExplanation ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-2 h-4 w-4" />
            )}
            Explicação da Carteira
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Retorno Esperado (anual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.expectedReturn
                ? `${(metrics.expectedReturn * 100).toFixed(2)}%`
                : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Volatilidade (anual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.risk ? `${(metrics.risk * 100).toFixed(2)}%` : "N/A"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Índice Sharpe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.sharpeRatio ? metrics.sharpeRatio.toFixed(2) : "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart and Table Tabs */}
      <Tabs defaultValue="chart" className="mt-6">
        <TabsList>
          <TabsTrigger value="chart">Gráfico</TabsTrigger>
          <TabsTrigger value="table">Tabela</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="aspect-[4/3] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius="70%"
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="table" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-left font-medium">ETF</th>
                      <th className="pb-2 text-right font-medium">Alocação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(weights)
                      .sort(([, a], [, b]) => b - a)
                      .map(([symbol, weight]) => (
                        <tr key={symbol} className="border-b">
                          <td className="py-3">{symbol}</td>
                          <td className="py-3 text-right">
                            {(weight * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Rebalance Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Próximo Rebalanceamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Recomendamos revisar e rebalancear sua carteira em{" "}
            <strong>
              {portfolio.rebalance_date
                ? new Date(portfolio.rebalance_date).toLocaleDateString("pt-BR")
                : "data não definida"}
            </strong>
            , ou antes caso ocorra uma queda superior a 15% no valor total.
          </p>
        </CardContent>
      </Card>

      {/* Explanation Dialog */}
      <Dialog open={explanationOpen} onOpenChange={setExplanationOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Explicação da Carteira</DialogTitle>
          </DialogHeader>
          {loadingExplanation ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : (
            <div className="mt-4 whitespace-pre-line">{explanation}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

