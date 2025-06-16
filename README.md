# Automated Request Monitoring and Offense Reporting (ARMOR)

An advanced security system that automates the reporting, analysis, and response to malicious web requests with integrated AI chatbot capabilities powered by Groq.

## System Architecture

### Backend (Express + MongoDB + TypeScript)
- RESTful API for malicious request reporting and management
- Authentication system with role-based access control
- AI integration with Groq for automated threat analysis
- Chatbot API for security assistance

### Frontend (React + TypeScript)
- Modern responsive UI built with Material UI
- User authentication and role management
- Malicious request reporting interface
- Interactive AI chatbot for security assistance
- Dashboard for security analytics

### AI Integration
- Uses Groq's LLaMA3-70B model for threat analysis and chatbot
- Automated classification of attack types and severity
- Security recommendations based on threat analysis

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB
- Groq API key

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Create a `.env` file based on `.env.example` and add your configuration:
   ```
   cp .env.example .env
   ```

4. Run `setup-tcpdump.sh` and run this:
   ```
   setcap cap_net_raw,cap_net_admin=eip /usr/bin/tcpdump
   ```

5. Start the development server:
   ```
   pnpm dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   pnpm install
   ```

3. Start the development server:
   ```
   pnpm dev
   ```

## Features

### Malicious Request Reporting
- Submit details of suspicious requests
- AI-powered automatic analysis
- Classification by attack type and severity
- Actionable security recommendations

### Security Assistant Chatbot
- Interactive AI chatbot for security questions
- Provides guidance on cybersecurity best practices
- Helps analyze and understand security threats
- Available 24/7 for immediate assistance

### Security Dashboard (for Analysts and Admins)
- Overview of reported incidents
- Filtering and search capabilities
- Status tracking of investigations
- Analytics and trends visualization

## API Endpoints

### Authentication
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login and get authentication token
- `GET /api/users/me` - Get current user profile

### Malicious Requests
- `POST /api/reports` - Report a new malicious request
- `GET /api/reports` - Get all malicious requests (paginated)
- `GET /api/reports/:id` - Get a specific report by ID
- `PATCH /api/reports/:id/status` - Update report status
- `GET /api/reports/stats` - Get statistical data about reports

### Chatbot
- `POST /api/chatbot/message` - Send a message to the chatbot