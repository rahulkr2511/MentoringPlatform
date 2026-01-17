#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PostgreSQL Startup Helper${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Database configuration
DB_NAME="mentoringdb"
DB_USER="rahulkr"

# Check if PostgreSQL is already running
POSTGRES_RUNNING=false
if command -v pg_isready &> /dev/null; then
    if pg_isready -h localhost -p 5432 &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL is already running on localhost:5432${NC}"
        POSTGRES_RUNNING=true
    fi
fi

# Detect OS and start PostgreSQL accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo -e "${BLUE}Detected macOS${NC}"
    
    # Check for Homebrew PostgreSQL
    if command -v brew &> /dev/null; then
        if brew services list 2>/dev/null | grep -q postgresql; then
            echo -e "${YELLOW}Starting PostgreSQL via Homebrew...${NC}"
            brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null
            sleep 2
            if pg_isready -h localhost -p 5432 &> /dev/null; then
                echo -e "${GREEN}✓ PostgreSQL started successfully${NC}"
                POSTGRES_RUNNING=true
            fi
        fi
    fi
    
    # Check for Postgres.app
    if [ -d "/Applications/Postgres.app" ]; then
        echo -e "${YELLOW}Found Postgres.app. Please start it manually from Applications.${NC}"
        open -a Postgres.app 2>/dev/null
        sleep 3
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            echo -e "${GREEN}✓ PostgreSQL started successfully${NC}"
            POSTGRES_RUNNING=true
        fi
    fi
    
    # Try pg_ctl
    if command -v pg_ctl &> /dev/null; then
        PG_DATA_DIRS=(
            "/usr/local/var/postgres"
            "/opt/homebrew/var/postgresql@14"
            "/opt/homebrew/var/postgres"
            "$HOME/Library/Application Support/Postgres/var-14"
        )
        
        for DATA_DIR in "${PG_DATA_DIRS[@]}"; do
            if [ -d "$DATA_DIR" ]; then
                echo -e "${YELLOW}Starting PostgreSQL from $DATA_DIR...${NC}"
                pg_ctl -D "$DATA_DIR" start 2>/dev/null
                sleep 2
                if pg_isready -h localhost -p 5432 &> /dev/null; then
                    echo -e "${GREEN}✓ PostgreSQL started successfully${NC}"
                    POSTGRES_RUNNING=true
                fi
            fi
        done
    fi
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo -e "${BLUE}Detected Linux${NC}"
    
    if command -v systemctl &> /dev/null; then
        echo -e "${YELLOW}Starting PostgreSQL via systemd...${NC}"
        sudo systemctl start postgresql 2>/dev/null || sudo service postgresql start 2>/dev/null
        sleep 2
        if pg_isready -h localhost -p 5432 &> /dev/null; then
            echo -e "${GREEN}✓ PostgreSQL started successfully${NC}"
            POSTGRES_RUNNING=true
        fi
    fi
fi

# If PostgreSQL is running, check and create database
if [ "$POSTGRES_RUNNING" = true ]; then
    echo ""
    echo -e "${BLUE}Checking if database '${DB_NAME}' exists...${NC}"
    
    # Check if database exists
    if command -v psql &> /dev/null; then
        # Try to connect to the database
        if psql -h localhost -p 5432 -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
            echo -e "${GREEN}✓ Database '${DB_NAME}' already exists${NC}"
        else
            echo -e "${YELLOW}Database '${DB_NAME}' does not exist. Creating...${NC}"
            
            # Try to create database
            if createdb -h localhost -p 5432 -U "$DB_USER" "$DB_NAME" 2>/dev/null; then
                echo -e "${GREEN}✓ Database '${DB_NAME}' created successfully${NC}"
            elif psql -h localhost -p 5432 -U postgres -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null; then
                echo -e "${GREEN}✓ Database '${DB_NAME}' created successfully${NC}"
            else
                echo -e "${YELLOW}⚠ Could not create database automatically${NC}"
                echo -e "${YELLOW}  Please create it manually:${NC}"
                echo "    createdb -U $DB_USER $DB_NAME"
                echo "    or"
                echo "    psql -U postgres -c 'CREATE DATABASE ${DB_NAME};'"
            fi
        fi
        
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}  Database setup completed!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        echo -e "${BLUE}Note:${NC} Tables will be created automatically by JPA/Hibernate"
        echo -e "      when the Spring Boot application starts."
        echo ""
        exit 0
    else
        echo -e "${YELLOW}⚠ psql not found. Cannot check/create database.${NC}"
        echo -e "${YELLOW}  Please ensure database '${DB_NAME}' exists.${NC}"
        exit 0
    fi
fi

# If we get here, PostgreSQL couldn't be started automatically
echo -e "${RED}✗ Could not start PostgreSQL automatically${NC}"
echo ""
echo -e "${YELLOW}Please start PostgreSQL manually:${NC}"
echo ""
echo "macOS (Homebrew):"
echo "  brew services start postgresql@14"
echo ""
echo "macOS (Postgres.app):"
echo "  Open Postgres.app from Applications"
echo ""
echo "Linux:"
echo "  sudo systemctl start postgresql"
echo "  or"
echo "  sudo service postgresql start"
echo ""
echo "Docker:"
echo "  docker run --name mentoring-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=mentoringdb -p 5432:5432 -d postgres:14"
echo ""
echo "After starting PostgreSQL, ensure the database 'mentoringdb' exists:"
echo "  createdb mentoringdb"
echo "  or"
echo "  psql -c 'CREATE DATABASE mentoringdb;'"
echo ""

exit 1
