@echo off
echo ===========================================
echo    CLAIMY - SETUP & INITIALIZATION
echo ===========================================
echo.
echo [1/3] Verificando estrutura de pastas...
if not exist "src" mkdir src
echo [OK] Pastas verificadas.

echo.
echo [2/3] Instalando dependencias do Node.js...
echo Isso pode levar alguns segundos...
call npm install
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao instalar dependencias. Verifique se o Node.js esta instalado.
    pause
    exit /b
)
echo [OK] Dependencias instaladas.

echo.
echo [3/3] Criando arquivo de configuracao .env...
if not exist ".env" (
    echo PORT=3000 > .env
    echo DATABASE_URL=postgres://postgres:senha@localhost:5432/claimy >> .env
    echo SECRET_KEY=claimy_secret_ia_key >> .env
    echo [OK] Arquivo .env criado.
) else (
    echo [AVISO] Arquivo .env ja existe. Pulando...
)

echo.
echo ===========================================
echo    SETUP CONCLUIDO COM SUCESSO!
echo    Para rodar o servidor, use: npm run dev
echo ===========================================
echo.
pause
