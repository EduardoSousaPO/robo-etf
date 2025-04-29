
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface FilterSidebarProps {
  onApplyFilters: (filters: Record<string, any>) => void;
}

export function FilterSidebar({ onApplyFilters }: FilterSidebarProps) {
  const [filters, setFilters] = useState<Record<string, any>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    onApplyFilters(filters);
  };

  const clearFilters = () => {
    setFilters({});
    onApplyFilters({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Accordion type="multiple" defaultValue={['region', 'category']}>
          <AccordionItem value="region">
            <AccordionTrigger>Região</AccordionTrigger>
            <AccordionContent>
              <Select name="region" onValueChange={(value) => handleSelectChange('region', value)} value={filters.region || 'global'}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Região" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="US">EUA</SelectItem>
                  <SelectItem value="Brazil">Brasil</SelectItem>
                  <SelectItem value="Europe">Europa</SelectItem>
                  <SelectItem value="Asia">Ásia</SelectItem>
                  <SelectItem value="LatAm">América Latina</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="category">
            <AccordionTrigger>Categoria</AccordionTrigger>
            <AccordionContent>
              <Select name="category" onValueChange={(value) => handleSelectChange('category', value)} value={filters.category || 'all'}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="US Equity">Renda Variável EUA</SelectItem>
                  <SelectItem value="International Equity">Renda Variável Intl.</SelectItem>
                  <SelectItem value="Fixed Income">Renda Fixa</SelectItem>
                  <SelectItem value="Sector">Setorial</SelectItem>
                  <SelectItem value="Commodity">Commodities</SelectItem>
                  <SelectItem value="Dividend">Dividendos</SelectItem>
                  <SelectItem value="Growth">Crescimento</SelectItem>
                  <SelectItem value="Value">Valor</SelectItem>
                  <SelectItem value="Volatility">Baixa Volatilidade</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="price">
            <AccordionTrigger>Preço</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="minPrice">Mínimo</Label>
                  <Input 
                    id="minPrice" 
                    name="minPrice" 
                    type="number" 
                    placeholder="0" 
                    value={filters.minPrice || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
                <div>
                  <Label htmlFor="maxPrice">Máximo</Label>
                  <Input 
                    id="maxPrice" 
                    name="maxPrice" 
                    type="number" 
                    placeholder="1000" 
                    value={filters.maxPrice || ''} 
                    onChange={handleInputChange} 
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Adicionar mais filtros conforme necessário (Volume, AUM, Taxa, etc.) */}
          
        </Accordion>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={clearFilters}>Limpar</Button>
          <Button onClick={applyFilters}>Aplicar Filtros</Button>
        </div>
      </CardContent>
    </Card>
  );
}

