![Status](https://img.shields.io/badge/status-in--progress-yellow)

# MentoringPlatform

> Empowering Connections, Accelerating Growth Seamlessly  
---

## 📖 Overview
MentoringPlatform is a comprehensive developer tool designed to facilitate **secure, real-time video mentoring** within modern web applications.  
It combines **WebRTC**, **WebSocket signaling**, and **role-based user management** to deliver seamless remote mentorship experiences.

---

## 🚀 Why MentoringPlatform?
This project aims to streamline the creation of **interactive, scalable mentoring environments**.  
The core features include:

- 🎥 **Video Conferencing**: Enables real-time, peer-to-peer video sessions using WebRTC for high-quality, low-latency communication.  
- 🔑 **User & Role Management**: Supports secure authentication, profile handling, and role-based access for mentors and mentees.  
- 📅 **Session Scheduling**: Facilitates mentor discovery, session booking, and calendar management for smooth interactions.  
- 🌐 **Signaling & Communication**: Utilizes WebSocket signaling to coordinate real-time data exchange and session control.  
- 🧱 **Modular Architecture**: Built with **React frontend** and **Spring Boot backend**, ensuring scalability and ease of future enhancements.  

---

## 📚 Documentation

For detailed documentation, design documents, and implementation guides, see the [Documentation](./Documentation/) folder:

- **[High-Level Design (HLD)](./Documentation/HLD_MentoringPlatform.md)** - System architecture and design overview
- **[Low-Level Design (LLD)](./Documentation/LLD_MentoringPlatform.md)** - Detailed component design and implementation
- **[Development Roadmap](./Documentation/RoadMap.md)** - Project roadmap and future enhancements
- **[WebRTC Implementation Guide](./Documentation/WebRTC_Implementation_Guide.md)** - WebRTC integration details
- **[Design Summary](./Documentation/Design_Summary.md)** - Comprehensive design overview

---

## 🚀 Quick Start

### Prerequisites
- **Java JDK 17+** - For Spring Boot server
- **Maven 3.8.0+** - For building the server
- **Node.js** - For React client
- **npm** - Package manager for client dependencies
- **PostgreSQL** - Database (configured in `Server/src/main/resources/application.properties`)

### Database Setup

**Important**: PostgreSQL must be running before starting the server.

#### Quick Start PostgreSQL

**macOS/Linux:**
```bash
./start-postgres.sh
```

This script will attempt to start PostgreSQL automatically.

#### Manual PostgreSQL Setup

**macOS (Homebrew):**
```bash
brew services start postgresql@14
# Create database
createdb mentoringdb
```

**macOS (Postgres.app):**
- Download and install [Postgres.app](https://postgresapp.com/)
- Open Postgres.app
- Create database: `createdb mentoringdb`

**Linux:**
```bash
sudo systemctl start postgresql
# Create database
sudo -u postgres createdb mentoringdb
```

**Docker:**
```bash
docker run --name mentoring-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=mentoringdb \
  -p 5432:5432 \
  -d postgres:14
```

**Verify PostgreSQL is running:**
```bash
pg_isready -h localhost -p 5432
```

**Database Configuration:**
Update `Server/src/main/resources/application.properties` if needed:
- Database name: `mentoringdb`
- Username: `rahulkr` (or your PostgreSQL username)
- Password: (empty by default, update if needed)
- Port: `5432`

### Starting the Application

> **📖 For detailed script documentation, see [SCRIPTS_README.md](../SCRIPTS_README.md)**

#### Option 1: Using Startup Scripts (Recommended)

**For macOS/Linux:**
```bash
./start.sh
```

**For Windows:**
```cmd
start.bat
```

The scripts will:
- **Automatically set up the database** (using Ant build script or `start-postgres.sh`)
- Check if PostgreSQL is running (with helpful error messages if not)
- Create database `mentoringdb` if it doesn't exist
- Start the Spring Boot server on `http://localhost:8080`
- Start the React client on `http://localhost:3000`
- Install client dependencies if needed
- Display logs and status information

**Database Setup**: The scripts automatically handle database setup:
- If **Ant is installed**: Uses `ant setup-db` for comprehensive database setup
- If **Ant is not installed**: Falls back to `start-postgres.sh` script
- Creates database and verifies connection before starting the server

**Note**: If you see a PostgreSQL connection error, you can manually set up the database:
```bash
./start-postgres.sh
```

Press `Ctrl+C` to stop both services.

#### Option 2: Using npm (Requires concurrently package)

First, install the root dependencies:
```bash
npm install
```

Then start both services:
```bash
npm start
```

#### Option 3: Manual Start

**Start Server:**
```bash
cd Server
mvn spring-boot:run
```

**Start Client (in a new terminal):**
```bash
cd Client
npm install  # First time only
npm start
```

### Accessing the Application
- **Client UI**: http://localhost:3000
- **Server API**: http://localhost:8080
- **Server Logs**: `Server/server-logs/server.log`
- **Client Logs**: `Server/server-logs/client.log`
- **Database Setup Logs**: `Server/server-logs/db-setup.log`

---

## 🔧 Troubleshooting

### PostgreSQL Connection Errors

**Error**: `Connection to localhost:5432 refused`

**Solutions**:
1. Ensure PostgreSQL is running:
   ```bash
   ./start-postgres.sh
   # or manually
   brew services start postgresql@14  # macOS
   sudo systemctl start postgresql    # Linux
   ```

2. Verify the database exists:
   ```bash
   psql -l | grep mentoringdb
   # If not found, create it:
   createdb mentoringdb
   ```

3. Check PostgreSQL is accepting connections:
   ```bash
   pg_isready -h localhost -p 5432
   ```

4. Verify database credentials in `Server/src/main/resources/application.properties`

### Server Fails to Start

1. Check server logs: `Server/server-logs/server.log`
2. Verify Java version: `java -version` (should be 17+)
3. Verify Maven is installed: `mvn -version`
4. Clean and rebuild:
   ```bash
   cd Server
   mvn clean install
   ```

### Client Fails to Start

1. Check client logs: `Server/server-logs/client.log`
2. Verify Node.js version: `node -version`
3. Reinstall dependencies:
   ```bash
   cd Client
   rm -rf node_modules package-lock.json
   npm install
   ```

### Port Already in Use

If port 8080 or 3000 is already in use:

**Change server port** (in `Server/src/main/resources/application.properties`):
```properties
server.port=8081
```

**Change client port** (set environment variable):
```bash
PORT=3001 npm start
```

---

