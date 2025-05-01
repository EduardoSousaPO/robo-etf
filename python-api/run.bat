@echo off
echo ===== Iniciando API Python =====

rem Verificar se o Python está instalado
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Python nao encontrado. Instale o Python 3.8+ e tente novamente.
    pause
    exit /b 1
)

rem Verificar se o arquivo .env existe
if not exist ".env" (
    echo Criando arquivo .env...
    echo FMP_API_KEY=sua-chave-api-fmp-aqui > .env
    echo IMPORTANTE: Edite o arquivo .env e adicione sua chave API da FMP
    echo.
)

rem Verificar se o ambiente virtual existe
if not exist "venv\" (
    echo Criando ambiente virtual...
    python -m venv venv
)

rem Ativar ambiente virtual e instalar dependências
echo Ativando ambiente virtual...
call venv\Scripts\activate

echo Instalando dependencias...
pip install -r requirements.txt

echo Iniciando servidor API na porta 5000...
echo ======================================
echo Log do Servidor:
echo ======================================
python app.py 