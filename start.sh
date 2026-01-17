#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SERVER_DIR="$SCRIPT_DIR/MentoringPlatform/Server"
CLIENT_DIR="$SCRIPT_DIR/MentoringPlatform/Client"

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

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo -e "${RED}Error: Java is not installed or not in PATH${NC}"
    echo "Please install Java JDK 17 or higher"
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo -e "${RED}Error: Maven is not installed or not in PATH${NC}"
    echo "Please install Maven 3.8.0 or higher"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed or not in PATH${NC}"
    echo "Please install Node.js"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed or not in PATH${NC}"
    echo "Please install npm"
    exit 1
fi

# Check if Ant is installed (for database setup)
if ! command -v ant &> /dev/null; then
    echo -e "${YELLOW}⚠ Ant is not installed. Database setup will be skipped.${NC}"
    echo -e "${YELLOW}  Install Ant for automatic database setup: brew install ant (macOS) or apt-get install ant (Linux)${NC}"
    USE_ANT=false
else
    USE_ANT=true
    echo -e "${GREEN}✓ Ant found${NC}"
fi

# Setup Database using Ant
if [ "$USE_ANT" = true ]; then
    echo ""
    echo -e "${BLUE}Setting up database...${NC}"
    cd "$SERVER_DIR"
    if ant setup-db 2>&1 | tee -a db-setup.log; then
        echo -e "${GREEN}✓ Database setup completed${NC}"
    else
        echo -e "${YELLOW}⚠ Database setup had issues. Continuing anyway...${NC}"
        echo -e "${YELLOW}  Check db-setup.log for details${NC}"
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
> server.log

mvn spring-boot:run > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start and check for errors
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 8

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    # Check logs for database connection errors
    if grep -q "Connection to localhost:5432 refused" "$SERVER_DIR/server.log" 2>/dev/null; then
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
        echo -e "${RED}Server logs: $SERVER_DIR/server.log${NC}"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    echo -e "${GREEN}✓ Server started (PID: $SERVER_PID)${NC}"
    echo -e "${GREEN}  Server logs: $SERVER_DIR/server.log${NC}"
    echo -e "${GREEN}  Server URL: http://localhost:8080${NC}"
else
    echo -e "${RED}✗ Server failed to start${NC}"
    echo ""
    # Show last few lines of error log
    if [ -f "$SERVER_DIR/server.log" ]; then
        echo -e "${YELLOW}Last error from server.log:${NC}"
        tail -20 "$SERVER_DIR/server.log" | grep -i "error\|exception\|failed" | tail -5
    fi
    echo ""
    echo -e "${RED}Full server logs: $SERVER_DIR/server.log${NC}"
    exit 1
fi

echo ""

# Start Client
echo -e "${BLUE}Starting React Client...${NC}"
cd "$CLIENT_DIR"

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing client dependencies...${NC}"
    npm install
fi

npm start > client.log 2>&1 &
CLIENT_PID=$!

# Wait a bit for client to start
sleep 3

# Check if client is running
if ps -p $CLIENT_PID > /dev/null; then
    echo -e "${GREEN}✓ Client started (PID: $CLIENT_PID)${NC}"
    echo -e "${GREEN}  Client logs: $CLIENT_DIR/client.log${NC}"
    echo -e "${GREEN}  Client URL: http://localhost:3000${NC}"
else
    echo -e "${RED}✗ Client failed to start. Check logs: $CLIENT_DIR/client.log${NC}"
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
