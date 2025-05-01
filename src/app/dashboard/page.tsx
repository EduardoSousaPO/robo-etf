"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import MarketOverview from "@/components/dashboard/market-overview";
import { ETFTable } from "@/components/dashboard/etf-table";
import { FilterSidebar } from "@/components/dashboard/filter-sidebar";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Button } from "@/components/ui/button";
import { MessageSquare, X } from "lucide-react";
import { UserButton } from "@clerk/nextjs"; // Import Clerk's UserButton

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showChat, setShowChat] = useState(false);
  const [filters, setFilters] = useState<Record<string, any>>({});
  // Removed legacy useAuth hook and user state

  const handleApplyFilters = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard de ETFs</h1>
        {/* Use Clerk's UserButton directly */}
        <UserButton afterSignOutUrl="/" />
      </div>

      <Tabs defaultValue="overview" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="explorer">Explorador</TabsTrigger>
          <TabsTrigger value="compare" disabled>Comparador</TabsTrigger>
          <TabsTrigger value="screener" disabled>Screener</TabsTrigger>
          <TabsTrigger value="watchlist" disabled>Watchlist</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Destaques Globais</CardTitle>
                <CardDescription>Melhor desempenho recente</CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO: Add loading/error states for MarketOverview */}
                <MarketOverview region="global" />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Mercado EUA</CardTitle>
                <CardDescription>Visão geral do mercado americano</CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO: Add loading/error states for MarketOverview */}
                <MarketOverview region="us" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>ETFs Populares (Global)</CardTitle>
              <CardDescription>ETFs mais negociados globalmente</CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Add loading/error states for ETFTable */}
              <ETFTable category="all" region="global" limit={10} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="explorer" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div className="md:col-span-1">
               <FilterSidebar onApplyFilters={handleApplyFilters} />
             </div>
             <div className="md:col-span-3">
               <Card>
                 <CardHeader>
                   <CardTitle>Explorar ETFs</CardTitle>
                   <CardDescription>Encontre ETFs com base nos seus critérios</CardDescription>
                 </CardHeader>
                 <CardContent>
                   {/* TODO: Add loading/error states for ETFTable */}
                   <ETFTable 
                     category={filters.category || 'all'} 
                     region={filters.region || 'global'} 
                     limit={50} 
                     filter={filters} 
                   />
                 </CardContent>
               </Card>
             </div>
           </div>
        </TabsContent>

        {/* Placeholder para outras abas */}
        <TabsContent value="compare"><p>Funcionalidade de Comparador em desenvolvimento.</p></TabsContent>
        <TabsContent value="screener"><p>Funcionalidade de Screener em desenvolvimento.</p></TabsContent>
        <TabsContent value="watchlist"><p>Funcionalidade de Watchlist em desenvolvimento.</p></TabsContent>

      </Tabs>

      {/* Botão de chat flutuante */}
      <Button 
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-all z-50 h-12 w-12"
        size="icon"
      >
        {showChat ? <X size={24} /> : <MessageSquare size={24} />}
        <span className="sr-only">{showChat ? 'Fechar Chat' : 'Abrir Chat'}</span>
      </Button>

      {/* Widget de chat */}
      {showChat && <ChatWidget onClose={() => setShowChat(false)} />} 
    </div>
  );
}

