# PostgreSQL Setup Guide

This guide will help you set up PostgreSQL for the Mentoring Platform application.

## Prerequisites

- Docker and Docker Compose (recommended for easy setup)
- OR PostgreSQL installed locally

## Option 1: Using Docker (Recommended)

1. **Start PostgreSQL using Docker Compose:**
   ```bash
   cd Server
   docker-compose up -d
   ```

2. **Verify the containers are running:**
   ```bash
   docker-compose ps
   ```

3. **Access pgAdmin (optional):**
   - Open http://localhost:5050 in your browser
   - Login with:
     - Email: admin@mentoringplatform.com
     - Password: admin
   - Add server connection:
     - Host: postgres
     - Port: 5432
     - Database: mentoringdb
     - Username: postgres
     - Password: password

## Option 2: Local PostgreSQL Installation

1. **Install PostgreSQL:**
   - **macOS:** `brew install postgresql`
   - **Ubuntu/Debian:** `sudo apt-get install postgresql postgresql-contrib`
   - **Windows:** Download from https://www.postgresql.org/download/windows/

2. **Start PostgreSQL service:**
   ```bash
   # macOS
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo systemctl start postgresql
   ```

3. **Create database and user:**
   ```bash
   # Connect as postgres user
   sudo -u postgres psql
   
   # Run the setup script
   \i setup-postgresql.sql
   ```

## Application Configuration

The application is already configured to use PostgreSQL with the following settings:

- **Host:** localhost
- **Port:** 5432
- **Database:** mentoringdb
- **Username:** postgres
- **Password:** password

If you need to change these settings, update the `application.properties` file:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/mentoringdb
spring.datasource.username=postgres
spring.datasource.password=password
```

## Running the Application

1. **Build the project:**
   ```bash
   mvn clean install
   ```

2. **Run the application:**
   ```bash
   mvn spring-boot:run
   ```

## Database Management

### Using psql (Command Line)
```bash
# Connect to database
psql -h localhost -U postgres -d mentoringdb

# List tables
\dt

# Exit
\q
```

### Using pgAdmin (Web Interface)
- Access http://localhost:5050
- Login with the credentials provided above
- Navigate to the mentoringdb database

## Troubleshooting

### Common Issues

1. **Connection refused:**
   - Ensure PostgreSQL is running
   - Check if port 5432 is available
   - Verify firewall settings

2. **Authentication failed:**
   - Check username and password in application.properties
   - Ensure the user has proper permissions

3. **Database does not exist:**
   - Run the setup script to create the database
   - Check if the database name matches in application.properties

### Useful Commands

```bash
# Check if PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart services
docker-compose restart

# Stop services
docker-compose down
```

## Migration from H2

The application has been migrated from H2 to PostgreSQL. Key changes:

1. **Dependencies:** H2 dependency replaced with PostgreSQL in `pom.xml`
2. **Configuration:** Database connection settings updated in `application.properties`
3. **Dialect:** Changed from H2Dialect to PostgreSQLDialect

The application will automatically create tables based on your JPA entities when it starts up (due to `spring.jpa.hibernate.ddl-auto=update`). 