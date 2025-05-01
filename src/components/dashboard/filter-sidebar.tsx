
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast"; // Import useToast for validation feedback
import { Loader2 } from "lucide-react"; // Import Loader icon

interface FilterSidebarProps {
  onApplyFilters: (filters: Record<string, any>) => void;
}

export function FilterSidebar({ onApplyFilters }: FilterSidebarProps) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [isApplying, setIsApplying] = useState(false); // State for applying feedback
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Allow empty string or convert to number if applicable
    const processedValue = value === "" ? "" : Number(value);
    setFilters((prev) => ({ ...prev, [name]: processedValue }));
  };

  const handleSelectChange = (name: string, value: string) => {
    // Handle 'all' or 'global' selections specifically if needed, otherwise just set
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const validateFilters = (): boolean => {
    const minPrice = filters.minPrice;
    const maxPrice = filters.maxPrice;
    const aumMin = filters.aumMin;
    const expenseRatioMax = filters.expenseRatioMax;

    if (minPrice !== "" && maxPrice !== "" && Number(minPrice) > Number(maxPrice)) {
      toast({
        title: "Erro de Validação",
        description: "O preço mínimo não pode ser maior que o preço máximo.",
        variant: "destructive",
      });
      return false;
    }
    if (aumMin !== "" && Number(aumMin) < 0) {
       toast({
        title: "Erro de Validação",
        description: "O AUM mínimo não pode ser negativo.",
        variant: "destructive",
      });
      return false;
    }
     if (expenseRatioMax !== "" && Number(expenseRatioMax) < 0) {
       toast({
        title: "Erro de Validação",
        description: "A taxa de despesa máxima não pode ser negativa.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const applyFilters = () => {
    if (!validateFilters()) {
      return; // Stop if validation fails
    }
    setIsApplying(true);
    // Simulate a short delay for visual feedback, then apply
    // In a real scenario, this might wait for an API response or table update
    setTimeout(() => {
      onApplyFilters(filters);
      setIsApplying(false);
      toast({ title: "Filtros Aplicados", description: "A tabela de ETFs foi atualizada." });
    }, 300); // Short delay for feedback
  };

  const clearFilters = () => {
    setFilters({});
    onApplyFilters({});
    toast({ title: "Filtros Limpos" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion type="multiple" defaultValue={["region", "category", "aum", "expense"]}>
          {/* Region Filter */}
          <AccordionItem value="region">
            <AccordionTrigger>Região</AccordionTrigger>
            <AccordionContent>
              <Select
                name="region"
                onValueChange={(value) => handleSelectChange("region", value)}
                value={filters.region || "global"}
                disabled={isApplying}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="US">EUA</SelectItem>
                  <SelectItem value="BR">Brasil</SelectItem> {/* Corrected value */}
                  <SelectItem value="EU">Europa</SelectItem> {/* Corrected value */}
                  <SelectItem value="Asia">Ásia</SelectItem>
                  {/* <SelectItem value="LatAm">América Latina</SelectItem> */}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          {/* Category Filter */}
          <AccordionItem value="category">
            <AccordionTrigger>Categoria</AccordionTrigger>
            <AccordionContent>
              <Select
                name="category"
                onValueChange={(value) => handleSelectChange("category", value)}
                value={filters.category || "all"}
                disabled={isApplying}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Equity">Renda Variável (Geral)</SelectItem>
                  <SelectItem value="Fixed Income">Renda Fixa</SelectItem>
                  <SelectItem value="Sector">Setorial</SelectItem>
                  <SelectItem value="Commodity">Commodities</SelectItem>
                  <SelectItem value="Dividend">Dividendos</SelectItem>
                  <SelectItem value="Growth">Crescimento</SelectItem>
                  <SelectItem value="Value">Valor</SelectItem>
                  <SelectItem value="Volatility">Baixa Volatilidade</SelectItem>
                  {/* Add more relevant categories based on API */}
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          {/* Price Filter */}
          <AccordionItem value="price">
            <AccordionTrigger>Preço</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minPrice">Mínimo ($)</Label>
                  <Input
                    id="minPrice"
                    name="minPrice"
                    type="number"
                    placeholder="0"
                    value={filters.minPrice ?? ""} // Use ?? for empty string default
                    onChange={handleInputChange}
                    min="0"
                    disabled={isApplying}
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">Máximo ($)</Label>
                  <Input
                    id="maxPrice"
                    name="maxPrice"
                    type="number"
                    placeholder="1000"
                    value={filters.maxPrice ?? ""}
                    onChange={handleInputChange}
                    min="0"
                    disabled={isApplying}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* AUM Filter */}
          <AccordionItem value="aum">
            <AccordionTrigger>Patrimônio (AUM)</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <Label htmlFor="aumMin">Mínimo (Milhões $)</Label>
                <Input
                  id="aumMin"
                  name="aumMin"
                  type="number"
                  placeholder="100" // Example: 100 Million
                  value={filters.aumMin ?? ""}
                  onChange={handleInputChange}
                  min="0"
                  disabled={isApplying}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Expense Ratio Filter */}
          <AccordionItem value="expense">
            <AccordionTrigger>Taxa de Despesa</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div>
                <Label htmlFor="expenseRatioMax">Máxima (%)</Label>
                <Input
                  id="expenseRatioMax"
                  name="expenseRatioMax"
                  type="number"
                  placeholder="0.5" // Example: 0.5%
                  value={filters.expenseRatioMax ?? ""}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={isApplying}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" onClick={clearFilters} disabled={isApplying}>
            Limpar
          </Button>
          <Button onClick={applyFilters} disabled={isApplying}>
            {isApplying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

