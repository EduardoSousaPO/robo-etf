@echo off
echo ===== Inicializando Projeto Robo ETF =====
echo.

rem Verificar se o Python está instalado
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Python nao encontrado. Instale o Python 3.8+ e tente novamente.
    pause
    exit /b 1
)

echo Verificando a versão do Python...
python --version

rem Verificar se a porta 5000 está em uso
echo Verificando se a porta 5000 está disponível...
netstat -ano | findstr :5000 >nul
if %ERRORLEVEL% EQU 0 (
    echo AVISO: A porta 5000 já está em uso. Pode haver problemas de conexão.
    echo Recomendação: Encerre o processo que está usando a porta 5000 ou altere a porta no código.
    echo.
    pause
)

rem Verificar se os arquivos necessários existem
if not exist "python-api\app.py" (
    echo ERRO: Arquivo python-api\app.py não encontrado.
    echo Certifique-se de estar no diretório correto do projeto.
    pause
    exit /b 1
)

rem Configurar .env.local para o frontend
if not exist ".env.local" (
    echo Criando arquivo .env.local para o frontend...
    echo NEXT_PUBLIC_PYTHON_API_URL=http://localhost:5000 > .env.local
    echo FMP_API_KEY=sua-chave-api-fmp-aqui >> .env.local
    echo IMPORTANTE: Edite o arquivo .env.local e adicione sua chave API da FMP
    echo.
)

rem Configurar .env para o backend Python
if not exist "python-api\.env" (
    echo Criando arquivo .env para o backend Python...
    echo FMP_API_KEY=sua-chave-api-fmp-aqui > python-api\.env
    echo IMPORTANTE: Edite o arquivo python-api\.env e adicione sua chave API da FMP
    echo.
)

rem Verificar se o pip está instalado
echo Verificando pip...
python -m pip --version
if %ERRORLEVEL% NEQ 0 (
    echo AVISO: pip não encontrado. Tentando instalar...
    python -m ensurepip
)

echo.
echo ===== Iniciando o Backend Python =====
start cmd /k "cd python-api && if not exist venv (python -m venv venv) && call venv\Scripts\activate && pip install -r requirements.txt && python app.py"

echo.
echo ===== Aguardando o backend iniciar (10 segundos) =====
timeout /t 10

echo.
echo Verificando se o backend Python está rodando...
powershell -Command "try { $result = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -TimeoutSec 5; if ($result.StatusCode -eq 200) { Write-Output 'OK: Backend API está rodando!' } else { Write-Output ('ERRO: Status code inesperado: ' + $result.StatusCode) } } catch { Write-Output 'ERRO: Backend Python não respondeu. Verifique se está rodando.'; Write-Output $_.Exception.Message }"

echo.
echo ===== Iniciando o Frontend =====
start cmd /k "npm run dev"

echo.
echo ===== Instruções =====
echo 1. O backend Python está rodando (ou tentando rodar) em http://localhost:5000
echo 2. O frontend está rodando em http://localhost:3000
echo 3. Certifique-se de que a chave API FMP está configurada nos arquivos:
echo    - .env.local (para o frontend)
echo    - python-api\.env (para o backend)
echo.
echo ===== Solução de Problemas =====
echo - Se encontrar erros de conexão recusada (ECONNREFUSED), execute o script diagnostico-api.bat
echo - Verifique se nenhum outro serviço está usando a porta 5000
echo - Certifique-se de que os firewalls não estão bloqueando conexões locais
echo - Se os problemas persistirem, reinicie o computador e tente novamente
echo.
echo ===== Logs =====
echo O backend e frontend estão rodando em janelas separadas.
echo Para parar a execução, feche as janelas ou pressione Ctrl+C em cada uma delas.
echo. 