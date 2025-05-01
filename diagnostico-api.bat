@echo off
echo ===== Diagnóstico da API Python =====

rem Verificar se o curl está disponível
where curl >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo AVISO: curl não encontrado, usando PowerShell para requisições.
    set USE_POWERSHELL=true
) else (
    set USE_POWERSHELL=false
)

echo.
echo Verificando conectividade da rede...
ping -n 2 127.0.0.1 >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Problema de conectividade de rede local.
) else (
    echo OK: Conectividade de rede local funcionando.
)

echo.
echo Verificando se o servidor API está rodando na porta 5000...
if "%USE_POWERSHELL%"=="true" (
    powershell -Command "try { $result = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -TimeoutSec 5; Write-Output $result.StatusCode } catch { Write-Output 'ERRO: ' + $_.Exception.Message }"
) else (
    curl -s -o NUL -w "%%{http_code}" http://localhost:5000/api/health
)
if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Não foi possível conectar ao servidor API na porta 5000.
    echo - Verifique se o servidor Python está rodando.
    echo - Verifique se não há outro serviço usando a porta 5000.
    echo - Verifique se o firewall não está bloqueando conexões locais.
) else (
    echo OK: Servidor API respondeu na porta 5000.
)

echo.
echo Verificando se a API está funcionando corretamente...
if "%USE_POWERSHELL%"=="true" (
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -TimeoutSec 5; $content = $response.Content | ConvertFrom-Json; Write-Output ('Status da API: ' + $content.status) } catch { Write-Output 'ERRO: ' + $_.Exception.Message }"
) else (
    curl -s http://localhost:5000/api/health
)

echo.
echo ===== Passos para solução de problemas =====
echo 1. Certifique-se de que o arquivo .env está configurado corretamente na pasta python-api
echo 2. Verifique se o servidor Python está rodando executando o script python-api/run.bat
echo 3. Certifique-se de que nenhum outro serviço esteja usando a porta 5000
echo 4. Desative temporariamente o firewall ou antivírus para testar
echo 5. Reinicie o servidor Python e o frontend
echo.

pause 