import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from dotenv import load_dotenv
import logging
import socket

app = Flask(__name__)
# Configurar CORS para permitir todas as origens (mais permissivo para desenvolvimento)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Configurar logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Carregar variáveis de ambiente
load_dotenv()
FMP_API_KEY = os.environ.get('FMP_API_KEY')
FMP_BASE_URL = "https://financialmodelingprep.com/api/v3"

# Verificar a configuração do servidor
def get_ip_address():
    try:
        # Obter o nome do host
        hostname = socket.gethostname()
        # Obter o endereço IP
        ip_address = socket.gethostbyname(hostname)
        return ip_address
    except Exception as e:
        logger.error(f"Erro ao obter endereço IP: {str(e)}")
        return "desconhecido"

# Verificar se a chave API está configurada
if not FMP_API_KEY or FMP_API_KEY == "sua-chave-api-fmp-aqui":
    logger.error("ERRO: Chave API FMP não configurada ou inválida. Configure a chave no arquivo .env")

@app.route('/', methods=['GET'])
def index():
    """Rota raiz para verificar se o servidor está funcionando"""
    logger.info("Requisição recebida na rota raiz")
    return jsonify({
        "status": "online",
        "message": "Servidor Python para API FMP está rodando",
        "endpoints": [
            "/api/health",
            "/api/etf/list",
            "/api/etf/quotes?symbols=SPY,VOO",
            "/api/etf/holdings/{symbol}",
            "/api/etf/historical/{symbol}?period=1mo",
            "/api/etf/region/{region}"
        ],
        "server_ip": get_ip_address(),
        "port": 5000
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    logger.info("Requisição recebida em /api/health")
    return jsonify({
        "status": "online",
        "server_ip": get_ip_address(),
        "api_key_configured": bool(FMP_API_KEY and FMP_API_KEY != "sua-chave-api-fmp-aqui")
    })

@app.route('/api/etf/list', methods=['GET'])
def get_etf_list():
    logger.info("Requisição recebida em /api/etf/list")
    if not FMP_API_KEY or FMP_API_KEY == "sua-chave-api-fmp-aqui":
        logger.error("API Key FMP não configurada para /api/etf/list")
        return jsonify({"error": "API Key FMP não configurada"}), 500
        
    try:
        url = f"{FMP_BASE_URL}/etf/list?apikey={FMP_API_KEY}"
        logger.info(f"Buscando lista de ETFs da FMP: {url}")
        response = requests.get(url)
        
        if response.status_code != 200:
            logger.error(f"Erro ao buscar ETFs: HTTP {response.status_code}")
            return jsonify({"error": f"Erro na API FMP: {response.status_code}"}), 500
            
        data = response.json()
        logger.info(f"Recebidos {len(data)} ETFs da API FMP")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Erro ao buscar ETFs: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/etf/quotes', methods=['GET'])
def get_etf_quotes():
    symbols = request.args.get('symbols', '')
    logger.info(f"Requisição recebida em /api/etf/quotes para símbolos: {symbols}")
    
    if not symbols:
        logger.error("Parâmetro 'symbols' é obrigatório")
        return jsonify({"error": "Parâmetro 'symbols' é obrigatório"}), 400
    
    if not FMP_API_KEY or FMP_API_KEY == "sua-chave-api-fmp-aqui":
        logger.error("API Key FMP não configurada para /api/etf/quotes")
        return jsonify({"error": "API Key FMP não configurada"}), 500
    
    try:
        url = f"{FMP_BASE_URL}/quote/{symbols}?apikey={FMP_API_KEY}"
        logger.info(f"Buscando cotações para: {symbols}")
        response = requests.get(url)
        
        if response.status_code != 200:
            logger.error(f"Erro ao buscar cotações: HTTP {response.status_code}")
            return jsonify({"error": f"Erro na API FMP: {response.status_code}"}), 500
            
        data = response.json()
        logger.info(f"Recebidas {len(data)} cotações da API FMP")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Erro ao buscar cotações: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/etf/holdings/<symbol>', methods=['GET'])
def get_etf_holdings(symbol):
    logger.info(f"Requisição recebida em /api/etf/holdings/{symbol}")
    
    if not FMP_API_KEY or FMP_API_KEY == "sua-chave-api-fmp-aqui":
        logger.error("API Key FMP não configurada para /api/etf/holdings")
        return jsonify({"error": "API Key FMP não configurada"}), 500
    
    try:
        url = f"{FMP_BASE_URL}/etf-holder/{symbol}?apikey={FMP_API_KEY}"
        logger.info(f"Buscando holdings para: {symbol}")
        response = requests.get(url)
        
        if response.status_code != 200:
            logger.error(f"Erro ao buscar holdings: HTTP {response.status_code}")
            return jsonify({"error": f"Erro na API FMP: {response.status_code}"}), 500
            
        data = response.json()
        logger.info(f"Recebidas {len(data)} holdings para {symbol}")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Erro ao buscar holdings: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/etf/historical/<symbol>', methods=['GET'])
def get_historical_prices(symbol):
    period = request.args.get('period', '1mo')
    logger.info(f"Requisição recebida em /api/etf/historical/{symbol} para período: {period}")
    
    days = 30  # Padrão
    if period == '5d': days = 5
    elif period == '1mo': days = 30
    elif period == '3mo': days = 90
    elif period == '6mo': days = 180
    elif period == '1y': days = 365
    elif period == '2y': days = 730
    elif period == '5y': days = 1825
    
    if not FMP_API_KEY or FMP_API_KEY == "sua-chave-api-fmp-aqui":
        logger.error("API Key FMP não configurada para /api/etf/historical")
        return jsonify({"error": "API Key FMP não configurada"}), 500
    
    try:
        url = f"{FMP_BASE_URL}/historical-price-full/{symbol}?timeseries={days}&apikey={FMP_API_KEY}"
        logger.info(f"Buscando dados históricos para: {symbol} (período: {period})")
        response = requests.get(url)
        
        if response.status_code != 200:
            logger.error(f"Erro ao buscar dados históricos: HTTP {response.status_code}")
            return jsonify({"error": f"Erro na API FMP: {response.status_code}"}), 500
            
        data = response.json()
        
        if 'historical' in data:
            logger.info(f"Recebidos {len(data['historical'])} pontos de dados históricos para {symbol}")
            return jsonify(data['historical'])
        else:
            logger.warning(f"Dados históricos para {symbol} não contêm 'historical'")
            return jsonify([])
    except Exception as e:
        logger.error(f"Erro ao buscar dados históricos: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/etf/region/<region>', methods=['GET'])
def get_etfs_by_region(region):
    logger.info(f"Requisição recebida em /api/etf/region/{region}")
    
    region_mapping = {
        "global": ["SPY", "VOO", "QQQ", "VTI", "VXUS", "VEA", "VWO", "BND"],
        "us": ["SPY", "VOO", "QQQ", "VTI", "VGT", "XLK", "ARKK", "IWM"],
        "br": ["BOVV11.SA", "IVVB11.SA", "BOVA11.SA", "SMAL11.SA"],
        "eu": ["VEUR.L", "CSPX.L", "MEUD.PA", "EXS1.DE"],
        "asia": ["2800.HK", "1306.T", "AAXJ", "MCHI"]
    }
    
    if region not in region_mapping:
        logger.error(f"Região não suportada: {region}")
        return jsonify({"error": "Região não suportada"}), 400
    
    if not FMP_API_KEY or FMP_API_KEY == "sua-chave-api-fmp-aqui":
        logger.error("API Key FMP não configurada para /api/etf/region")
        return jsonify({"error": "API Key FMP não configurada"}), 500
    
    try:
        symbols = region_mapping.get(region, region_mapping["global"])
        symbols_str = ','.join(symbols)
        
        url = f"{FMP_BASE_URL}/quote/{symbols_str}?apikey={FMP_API_KEY}"
        logger.info(f"Buscando ETFs para região: {region} ({len(symbols)} símbolos)")
        response = requests.get(url)
        
        if response.status_code != 200:
            logger.error(f"Erro ao buscar ETFs por região: HTTP {response.status_code}")
            return jsonify({"error": f"Erro na API FMP: {response.status_code}"}), 500
            
        data = response.json()
        logger.info(f"Recebidos {len(data)} ETFs para região {region}")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Erro ao buscar ETFs por região: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Iniciando servidor na porta {port}")
    logger.info(f"FMP API Key configurada: {bool(FMP_API_KEY and FMP_API_KEY != 'sua-chave-api-fmp-aqui')}")
    # Habilitar o acesso de qualquer origem por motivos de desenvolvimento
    app.run(host='0.0.0.0', port=port, debug=True) 