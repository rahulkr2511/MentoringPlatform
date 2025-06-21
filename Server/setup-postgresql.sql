-- PostgreSQL Setup Script for Mentoring Platform
-- Run this script as a PostgreSQL superuser (usually 'postgres')

-- Create the database
CREATE DATABASE mentoringdb;

-- Create a dedicated user for the application (optional but recommended)
CREATE USER mentoringuser WITH PASSWORD 'mentoringpassword';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE mentoringdb TO mentoringuser;

-- Connect to the mentoringdb database
\c mentoringdb;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO mentoringuser;

-- Optional: Create extensions that might be useful
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Display connection info
SELECT 'PostgreSQL database setup completed successfully!' as status; 