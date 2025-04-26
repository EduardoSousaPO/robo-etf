'use client';

import { useEffect } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  useEffect(() => {
    // Ajustar estilos para tema claro/escuro
    document.documentElement.classList.contains('dark')
      ? document.documentElement.setAttribute('data-theme', 'dark')
      : document.documentElement.setAttribute('data-theme', 'light');
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Documentação da API Robo-ETF</h1>
      <div className="rounded-lg border">
        <SwaggerUI url="/api/docs/swagger.yaml" />
      </div>
    </div>
  );
}
