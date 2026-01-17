@echo off
REM Mentoring Platform Startup Script for Windows

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set SERVER_DIR=%SCRIPT_DIR%Server
set CLIENT_DIR=%SCRIPT_DIR%Client
set LOGS_DIR=%SERVER_DIR%\server-logs

REM Create server-logs directory if it doesn't exist
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

echo ========================================
echo   Mentoring Platform Startup Script
echo ========================================
echo.

REM Check if Java is installed
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Java is not installed or not in PATH
    echo Please install Java JDK 17 or higher
    exit /b 1
)

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Maven is not installed or not in PATH
    echo Please install Maven 3.8.0 or higher
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: npm is not installed or not in PATH
    echo Please install npm
    exit /b 1
)

REM Check if Ant is installed (for database setup)
where ant >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Ant is not installed. Database setup will be skipped.
    echo Install Ant for automatic database setup.
    set USE_ANT=false
) else (
    set USE_ANT=true
    echo Ant found
)

REM Setup Database using Ant
if "%USE_ANT%"=="true" (
    echo.
    echo Setting up database...
    cd /d "%SERVER_DIR%"
    ant setup-db > "%LOGS_DIR%\db-setup.log" 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo Database setup completed
    ) else (
        echo Warning: Database setup had issues. Continuing anyway...
        echo Check Server\server-logs\db-setup.log for details
    )
    cd /d "%SCRIPT_DIR%"
    echo.
) else (
    echo.
    echo Skipping automatic database setup.
    echo Please ensure PostgreSQL is running and database 'mentoringdb' exists.
    echo.
)

REM Check if directories exist
if not exist "%SERVER_DIR%" (
    echo Error: Server directory not found at %SERVER_DIR%
    exit /b 1
)

if not exist "%CLIENT_DIR%" (
    echo Error: Client directory not found at %CLIENT_DIR%
    exit /b 1
)

REM Start Server
echo Starting Spring Boot Server...
cd /d "%SERVER_DIR%"

REM Clear previous log
type nul > "%LOGS_DIR%\server.log"

start "Mentoring Platform Server" cmd /c "mvn spring-boot:run > "%LOGS_DIR%\server.log" 2>&1"

REM Wait for server to start
timeout /t 8 /nobreak >nul

REM Check if server started successfully by checking logs for errors
findstr /i "Connection to localhost:5432 refused" "%LOGS_DIR%\server.log" >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Error: Server failed to connect to PostgreSQL
    echo.
    echo Please ensure PostgreSQL is running:
    echo   - Check if PostgreSQL service is started
    echo   - Verify database 'mentoringdb' exists
    echo   - Check connection settings in application.properties
    echo.
    echo Server logs: Server\server-logs\server.log
    exit /b 1
)

echo   Server started
echo   Server logs: Server\server-logs\server.log
echo   Server URL: http://localhost:8080
echo.

REM Start Client
echo Starting React Client...
cd /d "%CLIENT_DIR%"

REM Check if node_modules exists, if not install dependencies
if not exist "node_modules" (
    echo Installing client dependencies...
    call npm install
)

start "Mentoring Platform Client" cmd /c "npm start > "%LOGS_DIR%\client.log" 2>&1"

REM Wait a bit for client to start
timeout /t 3 /nobreak >nul

echo   Client started
echo   Client logs: Server\server-logs\client.log
echo   Client URL: http://localhost:3000
echo.

echo ========================================
echo   Both services are running!
echo ========================================
echo.
echo Server: http://localhost:8080
echo Client: http://localhost:3000
echo.
echo Close the command windows to stop the services
echo.

pause
