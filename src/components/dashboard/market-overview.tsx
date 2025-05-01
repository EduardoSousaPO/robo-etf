"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getETFsByRegion, getETFQuotes } from "@/lib/yfinance-adapter";
import { ETFQuote } from "@/lib/fmp";

interface MarketOverviewProps {
  region: "global" | "us" | "br" | "eu" | "asia";
}

export default function MarketOverview({ region }: MarketOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [data, setData] = useState<any>([]);
  const [activeTab, setActiveTab] = useState<string>("performance");
  const [isLiveData, setIsLiveData] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(false);
        setIsLiveData(true);

        // Buscar ETFs por região usando o yfinance via microserviço Python
        const etfs = await getETFsByRegion(region);
        
        // Usar dados de fallback silenciosamente se não obtivermos dados reais
        if (!etfs || etfs.length === 0) {
          console.log("Usando dados de fallback para a região:", region);
          setData(getFallbackData(region));
          setIsLiveData(false);
          return;
        }
        
        // Pegar os primeiros 8 ETFs para mostrar no gráfico
        const topEtfs = etfs.slice(0, 8);
        
        // Buscar cotações atualizadas
        const symbols = topEtfs.map(etf => etf.symbol);
        const quotes = await getETFQuotes(symbols);

        // Se não tivermos cotações, use o fallback
        if (!quotes || quotes.length === 0) {
          console.log("Usando dados de fallback para cotações");
          setData(getFallbackData(region));
          setIsLiveData(false);
          return;
        }
        
        // Mapear para o formato exigido pelo gráfico
        const chartData = quotes.map((quote: ETFQuote) => ({
          name: quote.symbol,
          value: quote.changesPercentage
        }));
        
        setData(chartData);
      } catch (error) {
        console.error("Erro ao carregar dados do mercado:", error);
        setIsLiveData(false);
        
        // Usar dados fallback em caso de erro
        setData(getFallbackData(region));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [region]);

  return (
    <Card className="col-span-3">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-md font-medium">
          Visão Geral do Mercado
          {!isLiveData && <span className="text-xs text-amber-500 ml-2">(Dados simulados)</span>}
        </CardTitle>
        <Tabs
          defaultValue="performance"
          className="w-[400px]"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="top-etfs">Top ETFs</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col space-y-3">
            <Skeleton className="h-[250px] w-full rounded-xl" />
          </div>
        ) : error ? (
          <div className="flex h-[250px] w-full items-center justify-center rounded-xl bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Dados temporariamente indisponíveis. Tente novamente mais tarde.
            </p>
          </div>
        ) : (
          <TabsContent value="performance" className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) => `${value.toFixed(1)}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(2)}%`, "Variação"]}
                  labelFormatter={(label) => `ETF: ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  name="Variação (%)"
                  fill="#8884d8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        )}
        
        <TabsContent value="top-etfs">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {loading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))
              ) : error ? (
                <div className="col-span-2 flex h-[200px] w-full items-center justify-center rounded-xl bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Dados temporariamente indisponíveis. Tente novamente mais tarde.
                  </p>
                </div>
              ) : (
                data.map((item: any) => (
                  <Card key={item.name} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p
                            className={`text-xs ${
                              item.value >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {item.value >= 0 ? "+" : ""}
                            {item.value.toFixed(2)}%
                          </p>
                        </div>
                        <div
                          className={`h-10 w-10 rounded-full ${
                            item.value >= 0
                              ? "bg-green-100"
                              : "bg-red-100"
                          } flex items-center justify-center`}
                        >
                          <span
                            className={`text-lg ${
                              item.value >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }`}
                          >
                            {item.value >= 0 ? "↑" : "↓"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </CardContent>
    </Card>
  );
}

// Dados de fallback caso as APIs falhem
function getFallbackData(region: string) {
  const fallbackData = {
    global: [
      { name: "SPY", value: 0.75 },
      { name: "VOO", value: 0.72 },
      { name: "QQQ", value: 1.25 },
      { name: "VTI", value: 0.65 },
      { name: "VEA", value: 0.12 },
      { name: "VWO", value: -0.35 },
      { name: "BND", value: 0.05 },
      { name: "GLD", value: 0.42 },
    ],
    us: [
      { name: "SPY", value: 0.75 },
      { name: "VOO", value: 0.72 },
      { name: "QQQ", value: 1.25 },
      { name: "VTI", value: 0.65 },
      { name: "XLK", value: 1.45 },
      { name: "XLF", value: 0.28 },
      { name: "XLE", value: -0.65 },
      { name: "XLV", value: 0.35 },
    ],
    br: [
      { name: "BOVA11", value: 0.35 },
      { name: "IVVB11", value: 0.42 },
      { name: "SMAL11", value: -0.25 },
      { name: "HASH11", value: 1.85 },
      { name: "GOLD11", value: 0.15 },
      { name: "BOVV11", value: 0.32 },
      { name: "SPXI11", value: 0.65 },
      { name: "ECOO11", value: -0.18 },
    ],
    eu: [
      { name: "VEUR.L", value: 0.25 },
      { name: "CSPX.L", value: 0.65 },
      { name: "MEUD.PA", value: 0.12 },
      { name: "EXS1.DE", value: 0.28 },
      { name: "XDAX.DE", value: 0.32 },
      { name: "EUNL.DE", value: 0.18 },
      { name: "XGLE.DE", value: -0.22 },
      { name: "UKDV.L", value: 0.15 },
    ],
    asia: [
      { name: "2800.HK", value: -0.45 },
      { name: "1306.T", value: 0.15 },
      { name: "AAXJ", value: -0.25 },
      { name: "MCHI", value: -0.85 },
      { name: "EWJ", value: 0.38 },
      { name: "3188.HK", value: -0.65 },
      { name: "1329.T", value: 0.22 },
      { name: "FLXG.L", value: -0.32 },
    ],
  };

  return fallbackData[region as keyof typeof fallbackData] || fallbackData.global;
}

