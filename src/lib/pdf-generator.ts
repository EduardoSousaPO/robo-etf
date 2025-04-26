import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Tipo para a carteira otimizada
type Portfolio = {
  weights: Record<string, number>;
  metrics: {
    return: number;
    volatility: number;
    sharpe: number;
  };
  rebalance_date: string;
};

// Função para gerar PDF da carteira
export async function generatePortfolioPDF(
  portfolio: Portfolio,
  riskScore: number,
  explanation: string
): Promise<Uint8Array> {
  // Criar um novo documento PDF
  const pdfDoc = await PDFDocument.create();
  
  // Adicionar uma página
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  
  // Obter fontes padrão
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Definir margens
  const margin = 50;
  const width = page.getWidth() - 2 * margin;
  
  // Adicionar título
  page.drawText('Robo-ETF - Carteira Otimizada', {
    x: margin,
    y: page.getHeight() - margin,
    size: 18,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Adicionar data
  const currentDate = new Date().toLocaleDateString('pt-BR');
  page.drawText(`Gerado em: ${currentDate}`, {
    x: margin,
    y: page.getHeight() - margin - 25,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  // Adicionar perfil de risco
  const riskProfiles = [
    'Muito Conservador',
    'Conservador',
    'Moderado',
    'Arrojado',
    'Muito Arrojado',
  ];
  
  page.drawText(`Perfil de Risco: ${riskProfiles[riskScore - 1]}`, {
    x: margin,
    y: page.getHeight() - margin - 50,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Adicionar métricas
  page.drawText('Métricas da Carteira:', {
    x: margin,
    y: page.getHeight() - margin - 80,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Retorno Esperado (anual): ${(portfolio.metrics.return * 100).toFixed(2)}%`, {
    x: margin,
    y: page.getHeight() - margin - 105,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Volatilidade (anual): ${(portfolio.metrics.volatility * 100).toFixed(2)}%`, {
    x: margin,
    y: page.getHeight() - margin - 125,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Índice Sharpe: ${portfolio.metrics.sharpe.toFixed(2)}`, {
    x: margin,
    y: page.getHeight() - margin - 145,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  page.drawText(`Data de Rebalanceamento: ${new Date(portfolio.rebalance_date).toLocaleDateString('pt-BR')}`, {
    x: margin,
    y: page.getHeight() - margin - 165,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  // Adicionar alocação da carteira
  page.drawText('Alocação da Carteira:', {
    x: margin,
    y: page.getHeight() - margin - 195,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Cabeçalho da tabela
  page.drawText('ETF', {
    x: margin,
    y: page.getHeight() - margin - 220,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  page.drawText('Alocação', {
    x: margin + 200,
    y: page.getHeight() - margin - 220,
    size: 12,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Linha horizontal
  page.drawLine({
    start: { x: margin, y: page.getHeight() - margin - 225 },
    end: { x: margin + width, y: page.getHeight() - margin - 225 },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  
  // Dados da tabela
  let y = page.getHeight() - margin - 245;
  const sortedWeights = Object.entries(portfolio.weights).sort(([, a], [, b]) => b - a);
  
  for (const [symbol, weight] of sortedWeights) {
    page.drawText(symbol, {
      x: margin,
      y,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    page.drawText(`${(weight * 100).toFixed(2)}%`, {
      x: margin + 200,
      y,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    
    y -= 20;
    
    // Se atingir o final da página, adicionar nova página
    if (y < margin) {
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      y = newPage.getHeight() - margin;
    }
  }
  
  // Adicionar explicação da carteira
  const explanationPage = pdfDoc.addPage([595.28, 841.89]);
  
  explanationPage.drawText('Explicação da Carteira:', {
    x: margin,
    y: explanationPage.getHeight() - margin,
    size: 14,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  
  // Quebrar o texto em linhas
  const words = explanation.split(' ');
  let line = '';
  let yPos = explanationPage.getHeight() - margin - 30;
  
  for (const word of words) {
    const testLine = line + word + ' ';
    const textWidth = helveticaFont.widthOfTextAtSize(testLine, 10);
    
    if (textWidth > width) {
      explanationPage.drawText(line, {
        x: margin,
        y: yPos,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
      
      line = word + ' ';
      yPos -= 15;
      
      // Se atingir o final da página, adicionar nova página
      if (yPos < margin) {
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        yPos = newPage.getHeight() - margin;
      }
    } else {
      line = testLine;
    }
  }
  
  // Desenhar a última linha
  if (line.trim().length > 0) {
    explanationPage.drawText(line, {
      x: margin,
      y: yPos,
      size: 10,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
  }
  
  // Adicionar rodapé
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    page.drawText(`Robo-ETF - Página ${i + 1} de ${pages.length}`, {
      x: margin,
      y: margin / 2,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
  
  // Serializar o PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
