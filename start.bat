@echo off
REM Mentoring Platform Startup Script for Windows

setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
set SERVER_DIR=%SCRIPT_DIR%Server
set CLIENT_DIR=%SCRIPT_DIR%Client
set LOGS_DIR=%SERVER_DIR%\server-logs
set CLIENT_LOGS_DIR=%CLIENT_DIR%\client-logs

REM Create log directories if they don't exist
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"
if not exist "%CLIENT_LOGS_DIR%" mkdir "%CLIENT_LOGS_DIR%"

echo ========================================
echo   Mentoring Platform Startup Script
echo ========================================
echo.

REM Check system dependencies
echo Checking system dependencies...
echo.

REM Check Java
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Java is not installed
    echo Please install Java JDK 17 or higher from: https://adoptium.net/
    echo Or use: winget install EclipseAdoptium.Temurin.17.JDK
    exit /b 1
) else (
    echo [OK] Java found
)

REM Check Maven
where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Maven is not installed
    echo Please install Maven 3.8.0 or higher from: https://maven.apache.org/
    echo Or use: winget install Apache.Maven
    exit /b 1
) else (
    echo [OK] Maven found
)

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Node.js is not installed
    echo Please install Node.js from: https://nodejs.org/
    echo Or use: winget install OpenJS.NodeJS
    exit /b 1
) else (
    echo [OK] Node.js found
)

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] npm is not installed
    echo npm usually comes with Node.js. Please reinstall Node.js
    exit /b 1
) else (
    echo [OK] npm found
)
echo.

REM Install npm dependencies
echo Checking and installing npm dependencies...
echo.

REM Install root dependencies
if exist "%SCRIPT_DIR%\package.json" (
    if not exist "%SCRIPT_DIR%\node_modules" (
        echo Installing root dependencies (concurrently)...
        cd /d "%SCRIPT_DIR%"
        call npm install
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Failed to install root dependencies
            exit /b 1
        )
        echo [OK] Root dependencies installed
    ) else (
        echo [OK] Root dependencies already installed
    )
)

REM Install client dependencies
if exist "%CLIENT_DIR%\package.json" (
    if not exist "%CLIENT_DIR%\node_modules" (
        echo Installing client dependencies...
        cd /d "%CLIENT_DIR%"
        call npm install
        if %ERRORLEVEL% NEQ 0 (
            echo [ERROR] Failed to install client dependencies
            exit /b 1
        )
        echo [OK] Client dependencies installed
    ) else (
        echo [OK] Client dependencies already installed
    )
)

REM Check Maven dependencies
echo Checking Maven dependencies...
cd /d "%SERVER_DIR%"
if exist "pom.xml" (
    echo Verifying Maven dependencies (this may take a moment)...
    mvn dependency:resolve -q >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Maven dependencies ready
    ) else (
        echo [INFO] Maven will download dependencies on first run
    )
)
cd /d "%SCRIPT_DIR%"
echo.

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

REM Dependencies should already be installed, but double-check
if not exist "node_modules" (
    echo Client dependencies missing, installing...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install client dependencies
        exit /b 1
    )
)

start "Mentoring Platform Client" cmd /c "npm start > "%CLIENT_LOGS_DIR%\client.log" 2>&1"

REM Wait a bit for client to start
timeout /t 3 /nobreak >nul

echo   Client started
echo   Client logs: Client\client-logs\client.log
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
