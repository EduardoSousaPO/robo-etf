import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

// Configurações do slide deck
const width = 1920;
const height = 1080;
const slides = 10;
const outputDir = path.join(process.cwd(), 'pitch-deck');

// Cores e estilos
const colors = {
  background: '#ffffff',
  primary: '#3b82f6',
  secondary: '#f59e0b',
  text: '#1f2937',
  lightText: '#6b7280',
};

// Criar diretório de saída se não existir
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Função para criar um slide
function createSlide(slideNumber, title, content) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fundo
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width, height);

  // Barra superior
  ctx.fillStyle = colors.primary;
  ctx.fillRect(0, 0, width, 10);

  // Título
  ctx.font = 'bold 72px Arial';
  ctx.fillStyle = colors.text;
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, 200);

  // Conteúdo
  ctx.font = '36px Arial';
  ctx.fillStyle = colors.lightText;
  ctx.textAlign = 'left';
  
  const lines = content.split('\n');
  let y = 300;
  for (const line of lines) {
    ctx.fillText(line, 200, y);
    y += 60;
  }

  // Número do slide
  ctx.font = '24px Arial';
  ctx.fillStyle = colors.lightText;
  ctx.textAlign = 'right';
  ctx.fillText(`${slideNumber}/${slides}`, width - 100, height - 50);

  // Logo
  ctx.font = 'bold 36px Arial';
  ctx.fillStyle = colors.primary;
  ctx.textAlign = 'left';
  ctx.fillText('Robo-ETF', 100, height - 50);

  // Salvar slide como PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(outputDir, `slide-${slideNumber}.png`), buffer);
}

// Criar slides
createSlide(1, 'Robo-ETF', 'Carteira Inteligente de ETFs\n\nApresentação para Investidores Anjo');

createSlide(2, 'O Problema', 'Investidores brasileiros enfrentam desafios ao investir globalmente:\n\n• Complexidade na seleção de ETFs internacionais\n• Dificuldade em otimizar custos e tributação\n• Falta de orientação em português\n• Rebalanceamento manual e trabalhoso');

createSlide(3, 'Nossa Solução', 'Robo-ETF: Carteiras globais de ETFs em 5 minutos\n\n• Algoritmo Mean-Variance para otimização de carteiras\n• Perfil de risco personalizado via questionário\n• Otimização tributária automática\n• Explicações em português geradas por IA\n• Alertas de rebalanceamento');

createSlide(4, 'Mercado-Alvo', 'Pessoa física brasileira com patrimônio de R$ 100k - R$ 300k\n\n• 3,6 milhões de investidores na B3\n• 1,2 milhão investem em fundos internacionais\n• 78% querem aumentar exposição global\n• Crescimento de 32% ao ano em remessas para investimento');

createSlide(5, 'Tecnologia', 'Stack moderna e escalável:\n\n• Frontend: Next.js + TypeScript + Tailwind\n• Backend: Node/Fastify + Supabase\n• Algoritmo proprietário de otimização Mean-Variance\n• Integração com OpenAI para explicações personalizadas\n• Dados financeiros via Financial Modeling Prep');

createSlide(6, 'Modelo de Negócio', 'Freemium com conversão para assinatura:\n\n• Plano Gratuito: 1 carteira, exportação CSV\n• Plano Premium (R$49/mês):\n  - Carteiras ilimitadas\n  - Exportação PDF detalhada\n  - Rebalanceamento automático\n  - Alertas personalizados');

createSlide(7, 'Métricas de Tração', 'Projeção para os primeiros 12 meses:\n\n• 10.000 usuários gratuitos\n• Taxa de conversão de 5% para plano premium\n• 500 assinantes pagantes\n• Receita recorrente mensal: R$ 24.500\n• CAC estimado: R$ 120\n• LTV estimado: R$ 882 (18 meses de retenção média)');

createSlide(8, 'Roadmap', '2025 Q2: Lançamento MVP com funcionalidades core\n2025 Q3: Integração com corretoras internacionais\n2025 Q4: App mobile e notificações push\n2026 Q1: Carteiras temáticas (ESG, Tech, etc)\n2026 Q2: Expansão para México e Colômbia');

createSlide(9, 'Equipe', 'Fundadores com experiência complementar:\n\n• CEO: 8 anos em fintechs, ex-Nubank\n• CTO: Desenvolvedor full-stack, especialista em algoritmos\n• CFO: Certificação CFA, 10 anos em gestão de recursos\n• Head de Produto: UX/UI, ex-XP Investimentos');

createSlide(10, 'Captação', 'Buscamos R$ 1,5 milhão para:\n\n• Desenvolvimento de produto (40%)\n• Marketing e aquisição de usuários (30%)\n• Equipe (20%)\n• Operações e infraestrutura (10%)\n\nValuation: R$ 7,5 milhões (pre-money)\nParticipação oferecida: 20%');

console.log('Pitch deck gerado com sucesso em:', outputDir);
