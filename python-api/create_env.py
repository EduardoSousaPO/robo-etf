# Criar arquivo .env com codificação UTF-8
with open('.env', 'w', encoding='utf-8') as f:
    f.write('FMP_API_KEY=sua-chave-api-fmp-aqui\n')

print("Arquivo .env criado com sucesso!") 