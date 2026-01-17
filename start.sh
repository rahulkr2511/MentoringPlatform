#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$SCRIPT_DIR/Server"
CLIENT_DIR="$SCRIPT_DIR/Client"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Mentoring Platform Startup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    if [ ! -z "$SERVER_PID" ]; then
        echo -e "${YELLOW}Stopping server (PID: $SERVER_PID)...${NC}"
        kill $SERVER_PID 2>/dev/null
        wait $SERVER_PID 2>/dev/null
    fi
    if [ ! -z "$CLIENT_PID" ]; then
        echo -e "${YELLOW}Stopping client (PID: $CLIENT_PID)...${NC}"
        kill $CLIENT_PID 2>/dev/null
        wait $CLIENT_PID 2>/dev/null
    fi
    echo -e "${GREEN}Cleanup complete.${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Function to check and install system dependencies
check_and_install_dependencies() {
    local missing_deps=()
    
    # Check Java
    if ! command -v java &> /dev/null; then
        missing_deps+=("Java JDK 17+")
        echo -e "${YELLOW}⚠ Java is not installed${NC}"
        
        # Try to install Java on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                echo -e "${BLUE}Attempting to install Java via Homebrew...${NC}"
                if brew install openjdk@17 2>/dev/null || brew install openjdk 2>/dev/null; then
                    echo -e "${GREEN}✓ Java installed successfully${NC}"
                    export JAVA_HOME=$(/usr/libexec/java_home)
                else
                    echo -e "${RED}Failed to install Java automatically${NC}"
                    echo "Please install manually: brew install openjdk@17"
                    return 1
                fi
            else
                echo "Please install Java: brew install openjdk@17"
                return 1
            fi
        else
            echo "Please install Java JDK 17 or higher"
            return 1
        fi
    else
        JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2 | sed '/^1\./s///' | cut -d'.' -f1)
        if [ "$JAVA_VERSION" -lt 17 ] 2>/dev/null; then
            echo -e "${YELLOW}⚠ Java version is less than 17. Current: $JAVA_VERSION${NC}"
            echo "Please upgrade to Java 17 or higher"
            return 1
        fi
        echo -e "${GREEN}✓ Java found (version: $(java -version 2>&1 | head -n 1))${NC}"
    fi
    
    # Check Maven
    if ! command -v mvn &> /dev/null; then
        missing_deps+=("Maven 3.8.0+")
        echo -e "${YELLOW}⚠ Maven is not installed${NC}"
        
        # Try to install Maven on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                echo -e "${BLUE}Attempting to install Maven via Homebrew...${NC}"
                if brew install maven; then
                    echo -e "${GREEN}✓ Maven installed successfully${NC}"
                else
                    echo -e "${RED}Failed to install Maven automatically${NC}"
                    echo "Please install manually: brew install maven"
                    return 1
                fi
            else
                echo "Please install Maven: brew install maven"
                return 1
            fi
        else
            echo "Please install Maven 3.8.0 or higher"
            return 1
        fi
    else
        echo -e "${GREEN}✓ Maven found (version: $(mvn -version | head -n 1))${NC}"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
        echo -e "${YELLOW}⚠ Node.js is not installed${NC}"
        
        # Try to install Node.js on macOS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if command -v brew &> /dev/null; then
                echo -e "${BLUE}Attempting to install Node.js via Homebrew...${NC}"
                if brew install node; then
                    echo -e "${GREEN}✓ Node.js installed successfully${NC}"
                else
                    echo -e "${RED}Failed to install Node.js automatically${NC}"
                    echo "Please install manually: brew install node"
                    return 1
                fi
            else
                echo "Please install Node.js: brew install node"
                return 1
            fi
        else
            echo "Please install Node.js from https://nodejs.org/"
            return 1
        fi
    else
        echo -e "${GREEN}✓ Node.js found (version: $(node -v))${NC}"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_deps+=("npm")
        echo -e "${YELLOW}⚠ npm is not installed${NC}"
        echo "npm usually comes with Node.js. Please reinstall Node.js"
        return 1
    else
        echo -e "${GREEN}✓ npm found (version: $(npm -v))${NC}"
    fi
    
    return 0
}

# Check and install system dependencies
echo -e "${BLUE}Checking system dependencies...${NC}"
if ! check_and_install_dependencies; then
    echo -e "${RED}✗ Some dependencies are missing. Please install them and try again.${NC}"
    exit 1
fi
echo ""

# Check if Ant is installed (for database setup)
if ! command -v ant &> /dev/null; then
    echo -e "${YELLOW}⚠ Ant is not installed. Database setup will be skipped.${NC}"
    echo -e "${YELLOW}  Install Ant for automatic database setup: brew install ant (macOS) or apt-get install ant (Linux)${NC}"
    USE_ANT=false
else
    USE_ANT=true
    echo -e "${GREEN}✓ Ant found${NC}"
fi

# Create log directories if they don't exist
mkdir -p "$SERVER_DIR/server-logs"
mkdir -p "$CLIENT_DIR/client-logs"

# Install npm dependencies
echo -e "${BLUE}Checking and installing npm dependencies...${NC}"

# Install root dependencies (concurrently for npm scripts)
if [ -f "$SCRIPT_DIR/package.json" ]; then
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        echo -e "${YELLOW}Installing root dependencies (concurrently)...${NC}"
        cd "$SCRIPT_DIR"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Failed to install root dependencies${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ Root dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Root dependencies already installed${NC}"
    fi
fi

# Install client dependencies
if [ -f "$CLIENT_DIR/package.json" ]; then
    if [ ! -d "$CLIENT_DIR/node_modules" ]; then
        echo -e "${YELLOW}Installing client dependencies...${NC}"
        cd "$CLIENT_DIR"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}✗ Failed to install client dependencies${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ Client dependencies installed${NC}"
    else
        echo -e "${GREEN}✓ Client dependencies already installed${NC}"
    fi
fi

# Check Maven dependencies (Maven will download automatically, but we can verify)
echo -e "${BLUE}Checking Maven dependencies...${NC}"
cd "$SERVER_DIR"
if [ -f "pom.xml" ]; then
    echo -e "${YELLOW}Verifying Maven dependencies (this may take a moment)...${NC}"
    mvn dependency:resolve -q > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Maven dependencies ready${NC}"
    else
        echo -e "${YELLOW}⚠ Maven will download dependencies on first run${NC}"
    fi
fi
cd "$SCRIPT_DIR"
echo ""

# Setup Database using Ant
if [ "$USE_ANT" = true ]; then
    echo ""
    echo -e "${BLUE}Setting up database...${NC}"
    cd "$SERVER_DIR"
    if ant setup-db 2>&1 | tee -a "$SERVER_DIR/server-logs/db-setup.log"; then
        echo -e "${GREEN}✓ Database setup completed${NC}"
    else
        echo -e "${YELLOW}⚠ Database setup had issues. Continuing anyway...${NC}"
        echo -e "${YELLOW}  Check Server/server-logs/db-setup.log for details${NC}"
    fi
    cd "$SCRIPT_DIR"
    echo ""
else
    # Fallback: Use start-postgres.sh script
    echo -e "${BLUE}Setting up database using start-postgres.sh...${NC}"
    if [ -f "$SCRIPT_DIR/start-postgres.sh" ]; then
        if bash "$SCRIPT_DIR/start-postgres.sh"; then
            echo -e "${GREEN}✓ Database setup completed${NC}"
        else
            echo -e "${YELLOW}⚠ Database setup had issues. Continuing anyway...${NC}"
            echo -e "${YELLOW}  Make sure PostgreSQL is running and database 'mentoringdb' exists${NC}"
        fi
    else
        # Final fallback: Check if PostgreSQL is running manually
        echo -e "${BLUE}Checking PostgreSQL connection...${NC}"
        if command -v pg_isready &> /dev/null; then
            if pg_isready -h localhost -p 5432 &> /dev/null; then
                echo -e "${GREEN}✓ PostgreSQL is running${NC}"
            else
                echo -e "${RED}✗ PostgreSQL is not running on localhost:5432${NC}"
                echo ""
                echo -e "${YELLOW}To start PostgreSQL:${NC}"
                echo "  macOS (Homebrew): brew services start postgresql@14"
                echo "  macOS (Postgres.app): Open Postgres.app"
                echo "  Linux: sudo systemctl start postgresql"
                echo ""
                echo -e "${YELLOW}Or run: ./start-postgres.sh${NC}"
                echo ""
                read -p "Do you want to continue anyway? (y/N) " -n 1 -r
                echo
                if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                    exit 1
                fi
            fi
        else
            echo -e "${YELLOW}⚠ pg_isready not found. Skipping PostgreSQL check.${NC}"
            echo -e "${YELLOW}  Make sure PostgreSQL is running on localhost:5432${NC}"
        fi
    fi
    echo ""
fi

# Check if directories exist
if [ ! -d "$SERVER_DIR" ]; then
    echo -e "${RED}Error: Server directory not found at $SERVER_DIR${NC}"
    exit 1
fi

if [ ! -d "$CLIENT_DIR" ]; then
    echo -e "${RED}Error: Client directory not found at $CLIENT_DIR${NC}"
    exit 1
fi

# Start Server
echo -e "${BLUE}Starting Spring Boot Server...${NC}"
cd "$SERVER_DIR"

# Clean previous log
> "$SERVER_DIR/server-logs/server.log"

mvn spring-boot:run > "$SERVER_DIR/server-logs/server.log" 2>&1 &
SERVER_PID=$!

# Wait for server to start and check for errors
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 8

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    # Check logs for database connection errors
    if grep -q "Connection to localhost:5432 refused" "$SERVER_DIR/server-logs/server.log" 2>/dev/null; then
        echo -e "${RED}✗ Server failed to connect to PostgreSQL${NC}"
        echo -e "${RED}  Error: Connection to localhost:5432 refused${NC}"
        echo ""
        echo -e "${YELLOW}Please ensure PostgreSQL is running:${NC}"
        echo "  - Check if PostgreSQL service is started"
        echo "  - Verify database 'mentoringdb' exists"
        echo "  - Check connection settings in application.properties"
        echo ""
        echo -e "${YELLOW}To start PostgreSQL:${NC}"
        echo "  macOS: brew services start postgresql@14"
        echo "  Linux: sudo systemctl start postgresql"
        echo ""
        echo -e "${RED}Server logs: Server/server-logs/server.log${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}"
    echo -e "${GREEN}  Server logs: Server/server-logs/server.log${NC}"
    echo -e "${GREEN}  Server URL: http://localhost:8080${NC}"
else
    echo -e "${RED}✗ Server failed to start${NC}"
    echo ""
    # Show last few lines of error log
    if [ -f "$SERVER_DIR/server-logs/server.log" ]; then
        echo -e "${YELLOW}Last error from server.log:${NC}"
        tail -20 "$SERVER_DIR/server-logs/server.log" | grep -i "error\|exception\|failed" | tail -5
    fi
    echo ""
    echo -e "${RED}Full server logs: Server/server-logs/server.log${NC}"
    exit 1
fi

echo ""

# Start Client
echo -e "${BLUE}Starting React Client...${NC}"
cd "$CLIENT_DIR"

# Dependencies should already be installed, but double-check
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Client dependencies missing, installing...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}✗ Failed to install client dependencies${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
fi

npm start > "$CLIENT_DIR/client-logs/client.log" 2>&1 &
CLIENT_PID=$!

# Wait a bit for client to start
sleep 3

# Check if client is running
if ps -p $CLIENT_PID > /dev/null; then
    echo -e "${GREEN}✓ Client started (PID: $CLIENT_PID)${NC}"
    echo -e "${GREEN}  Client logs: Client/client-logs/client.log${NC}"
    echo -e "${GREEN}  Client URL: http://localhost:3000${NC}"
else
    echo -e "${RED}✗ Client failed to start. Check logs: Client/client-logs/client.log${NC}"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Both services are running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Server:${NC} http://localhost:8080"
echo -e "${BLUE}Client:${NC} http://localhost:3000"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop both services${NC}"
echo ""

# Wait for both processes
wait
