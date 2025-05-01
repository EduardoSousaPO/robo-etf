# Microserviço Python para yfinance

Este serviço fornece dados financeiros de ETFs através da biblioteca yfinance para o aplicativo principal Next.js.

## Requisitos

- Python 3.9+
- pip (gerenciador de pacotes Python)
- As dependências listadas em `requirements.txt`

## Instalação e execução

### Windows

1. Abra o PowerShell ou Prompt de Comando na pasta `python-api`
2. Execute o arquivo `run.bat`:

```
.\run.bat
```

Ou instale manualmente:

```powershell
pip install -r requirements.txt
python app.py
```

### Linux/macOS

```bash
pip install -r requirements.txt
python app.py
```

## Endpoints disponíveis

- `/api/health` - Verificar se a API está funcionando
- `/api/etf/list` - Listar ETFs disponíveis
- `/api/etf/quotes?symbols=SPY,VOO,QQQ` - Obter cotações de ETFs
- `/api/etf/holdings/SPY` - Obter holdings de um ETF específico
- `/api/etf/historical/SPY?period=1mo&interval=1d` - Obter preços históricos
- `/api/etf/region/us` - Obter ETFs por região (global, us, br, eu, asia)

## Limitações conhecidas da API yfinance

A biblioteca yfinance pode encontrar vários problemas ao tentar obter dados do Yahoo Finance:

1. **Limitações de taxa de requisições**: O Yahoo Finance limita o número de chamadas de API por IP em um determinado período de tempo.

2. **Bloqueios temporários**: Uso intensivo da API pode resultar em bloqueio temporário do seu IP.

3. **Dados ausentes ou incompletos**: 
   - Alguns ETFs podem não ter dados completos disponíveis
   - Alguns endpoints podem retornar dados vazios ou incorretos

4. **Timeouts**: Requisições múltiplas simultâneas podem resultar em timeouts.

5. **Alterações na estrutura da API**: O Yahoo Finance pode alterar a estrutura de seus dados sem aviso prévio.

## Estratégia de resiliência

Para lidar com essas limitações, este microserviço implementa:

1. **Dados estáticos de fallback**: Quando a API do Yahoo Finance falha, usamos dados estáticos pré-configurados.

2. **Cache local**: Armazenamos dados em cache por 15 minutos para reduzir o número de chamadas à API.

3. **Tratamento de exceções**: Capturamos e tratamos todos os erros para garantir que o serviço sempre retorne algum dado.

4. **Valores simulados**: Quando não conseguimos obter dados reais, fornecemos valores simulados realistas.

## Configuração no projeto Next.js

No arquivo `.env.local` do projeto principal, adicione:

```
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:5000
```

## Testes

Para testar se a API está funcionando corretamente, acesse:

```
http://localhost:5000/api/health
```

Você deve ver uma resposta como:

```json
{
  "status": "online",
  "timestamp": "2024-04-30T13:33:45.123456",
  "version": "1.0.0"
}
``` 